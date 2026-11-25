/**
 * Draft timetable import, stale package detection, and atomic draft persistence.
 * Source of truth: docs/02_DECISION_REGISTER.md (D12, D48, D49, D50), docs/06_API_AND_WORKFLOWS.md
 */

import { TimetableRepository, RepositoryDataState } from '../data/repository.js';
import {
  ScheduledClass,
  TimetableVersion,
  ValidationResult,
} from '../domain/types.js';
import { validateDraftTimetable } from '../domain/completenessValidator.js';
import { ValidationContext } from '../domain/conflictValidator.js';
import { computeInputRevision } from '../domain/revision.js';
import { isDbConfigured, persistDraftImportToDb } from '../data/dbSync.js';
import { AuthSession } from './authService.js';
import crypto from 'crypto';

export interface DraftImportPayload {
  schemaVersion: string;
  packageId: string;
  inputRevision: string;
  generatorVersion?: string;
  status: string;
  termIds: string[];
  classes: {
    id?: string;
    courseOfferingId: string;
    termId: string;
    dayOfWeek: number;
    startSlot: number;
    duration: number;
    activityType: 'L' | 'T' | 'P';
    teacherId: string;
    roomId: string;
    targetType: 'section' | 'batch' | 'elective_group';
    targetId: string;
    status?: 'scheduled' | 'cancelled';
  }[];
}

export class DraftImportService {
  constructor(private repo: TimetableRepository) {}

  private computeCurrentInputRevision(state: RepositoryDataState, termIds: string[]): string {
    return computeInputRevision({
      termIds,
      rooms: Array.from(state.rooms.values()),
      teachers: Array.from(state.teachers.values()),
      courses: Array.from(state.courses.values()),
      courseOfferings: Array.from(state.courseOfferings.values()),
      grid: state.gridConfig,
      teacherAvailabilities: Array.from(state.teacherAvailabilities.values()),
    });
  }

  private buildValidationContext(state: RepositoryDataState): ValidationContext {
    return {
      grid: state.gridConfig,
      rooms: state.rooms,
      batches: state.batches,
      studentMemberships: Array.from(state.studentGroupMemberships.values()),
      electiveAssignments: Array.from(state.electiveAssignments.values()),
      teacherAvailabilities: Array.from(state.teacherAvailabilities.values()),
      teacherAbsences: Array.from(state.teacherUnavailabilityRequests.values()),
    };
  }

  /**
   * Imports an uploaded draft timetable JSON from local or remote generation.
   * Enforces:
   * - Schema / version checks (1.0.0)
   * - Max row count / size limits
   * - Stale-package detection (D50)
   * - Full mandatory-constraint and completeness validation
   * - All-or-nothing transactional draft save
   * - NO automatic publication (D48)
   */
  public async uploadGeneratedDraft(
    session: AuthSession,
    draftPayload: DraftImportPayload,
    options?: { allowStaleOverride?: boolean; staleOverrideReason?: string }
  ): Promise<{ version: TimetableVersion; classCount: number; warnings: string[] }> {
    if (session.role !== 'admin') {
      throw new Error('ERR_FORBIDDEN: Only administrators can upload and import timetable drafts.');
    }

    // 1. Schema version check
    if (draftPayload.schemaVersion !== '1.0.0') {
      throw new Error(`ERR_UNSUPPORTED_VERSION: Draft schema version '${draftPayload.schemaVersion}' is unsupported. Expected 1.0.0.`);
    }

    // 2. Bound checks
    if (!draftPayload.classes || !Array.isArray(draftPayload.classes)) {
      throw new Error('ERR_INVALID_PAYLOAD: Draft must contain an array of classes.');
    }
    if (draftPayload.classes.length > 10000) {
      throw new Error('ERR_PAYLOAD_TOO_LARGE: Exceeded maximum allowed classes (10,000).');
    }

    const warnings: string[] = [];

    return this.repo.runTransaction(async (tx) => {
      // 3. Stale package check
      const currentRevision = this.computeCurrentInputRevision(tx, draftPayload.termIds);
      const isStale = draftPayload.inputRevision !== currentRevision;

      if (isStale) {
        if (!options?.allowStaleOverride) {
          throw new Error(
            `ERR_STALE_PACKAGE: The draft was generated from revision '${draftPayload.inputRevision}', but current data revision is '${currentRevision}'. Re-generation recommended or provide authorized admin override.`
          );
        }

        // Audited stale override
        warnings.push('Stale package warning overridden by administrator.');
        this.repo.logAudit(
          session.userId,
          'STALE_PACKAGE_OVERRIDE',
          'timetable_draft',
          draftPayload.packageId,
          'success',
          {
            draftRevision: draftPayload.inputRevision,
            currentRevision,
            reason: options.staleOverrideReason || 'Administrative override',
          },
          tx
        );
      }

      // 4. Transform payload to domain ScheduledClass objects
      const draftVersionId = `v-draft-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const scheduledClasses: ScheduledClass[] = draftPayload.classes.map((c, idx) => ({
        id: c.id || `sc-${draftVersionId}-${idx + 1}`,
        versionId: draftVersionId,
        courseOfferingId: c.courseOfferingId,
        termId: c.termId,
        dayOfWeek: c.dayOfWeek,
        startSlot: c.startSlot,
        duration: c.duration,
        activityType: c.activityType,
        teacherId: c.teacherId,
        roomId: c.roomId,
        targetType: c.targetType,
        targetId: c.targetId,
        status: 'scheduled',
      }));

      // 5. Full mandatory constraint and completeness pass
      // Invariant D50: An override NEVER bypasses mandatory constraint or completeness checks!
      const ctx = this.buildValidationContext(tx);
      const valResult: ValidationResult = validateDraftTimetable(
        {
          termIds: draftPayload.termIds,
          classes: scheduledClasses,
          expectedOfferingIds: (draftPayload as any).expectedOfferingIds || (draftPayload as any).courseOfferingIds,
        },
        tx.courses,
        tx.courseOfferings,
        ctx
      );

      if (!valResult.valid) {
        const err = valResult.errors[0];
        throw new Error(`ERR_DRAFT_VALIDATION_FAILED: ${err.code} — ${err.message}`);
      }

      // 6. Determine next version number
      let maxVersionNum = 0;
      for (const v of tx.timetableVersions.values()) {
        if (draftPayload.termIds.includes(v.termId) && v.versionNumber > maxVersionNum) {
          maxVersionNum = v.versionNumber;
        }
      }

      const versionRecord: TimetableVersion = {
        id: draftVersionId,
        termId: draftPayload.termIds[0] || 'default-term',
        versionNumber: maxVersionNum + 1,
        status: 'draft', // D48: strictly saved as draft, never automatically published
        inputRevision: draftPayload.inputRevision,
        createdBy: session.userId,
        createdAt: new Date().toISOString(),
      };
      if ((draftPayload as any).expectedOfferingIds || (draftPayload as any).courseOfferingIds) {
        (versionRecord as any).expectedOfferingIds = (draftPayload as any).expectedOfferingIds || (draftPayload as any).courseOfferingIds;
      }

      // Transactionally save version and classes
      tx.timetableVersions.set(draftVersionId, versionRecord);
      for (const sc of scheduledClasses) {
        tx.scheduledClasses.set(sc.id, sc);
      }

      // Persist durably to PostgreSQL if configured (BE-02, BE-10)
      if (isDbConfigured()) {
        await persistDraftImportToDb(versionRecord, scheduledClasses);
      }

      this.repo.logAudit(
        session.userId,
        'IMPORT_DRAFT',
        'timetable_versions',
        draftVersionId,
        'success',
        {
          packageId: draftPayload.packageId,
          classCount: scheduledClasses.length,
          versionNumber: versionRecord.versionNumber,
        },
        tx
      );

      return {
        version: versionRecord,
        classCount: scheduledClasses.length,
        warnings,
      };
    });
  }
}
