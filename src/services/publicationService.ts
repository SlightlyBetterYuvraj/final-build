/**
 * Timetable publication, atomic version switching, version recovery,
 * and dated occurrence instantiation.
 * Source of truth: docs/01_MASTER_PRD.md, docs/02_DECISION_REGISTER.md (D13, D40), docs/06_API_AND_WORKFLOWS.md
 */

import { TimetableRepository, RepositoryDataState } from '../data/repository.js';
import {
  ClassOccurrence,
  ScheduledClass,
  TimetableVersion,
  ValidationResult,
} from '../domain/types.js';
import { validateDraftTimetable } from '../domain/completenessValidator.js';
import { ValidationContext, getRepresentedStudents } from '../domain/conflictValidator.js';
import { isDbConfigured, persistPublicationToDb, persistVersionRestoreToDb } from '../data/dbSync.js';
import { AuthSession } from './authService.js';

export class PublicationService {
  constructor(private repo: TimetableRepository) {}

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
   * Publishes a draft timetable.
   * D13: Admin-only. Full re-validation against current data at publication time.
   * Atomically sets the new published version and marks prior published version as superseded.
   * Instantiates initial dated class occurrences.
   * Dispatches notifications to affected students only after successful commit.
   */
  public async publishDraft(
    session: AuthSession,
    versionId: string
  ): Promise<{ publishedVersion: TimetableVersion; instantiatedOccurrences: number }> {
    if (session.role !== 'admin') {
      throw new Error('ERR_FORBIDDEN: Only administrators can publish timetable versions.');
    }

    return this.repo.runTransaction(async (tx) => {
      const draftVersion = tx.timetableVersions.get(versionId);
      if (!draftVersion) {
        throw new Error(`ERR_VERSION_NOT_FOUND: Timetable version ${versionId} not found.`);
      }
      if (draftVersion.status !== 'draft') {
        throw new Error(`ERR_INVALID_STATUS: Only versions with status 'draft' can be published. Current status: ${draftVersion.status}.`);
      }

      // Collect scheduled classes in this draft
      const draftClasses = Array.from(tx.scheduledClasses.values()).filter(
        (c) => c.versionId === versionId
      );

      // Re-read and re-validate against current data (D13)
      const ctx = this.buildValidationContext(tx);
      const valResult: ValidationResult = validateDraftTimetable(
        {
          termIds: [draftVersion.termId],
          classes: draftClasses,
          expectedOfferingIds: (draftVersion as any).expectedOfferingIds,
        },
        tx.courses,
        tx.courseOfferings,
        ctx
      );

      if (!valResult.valid) {
        const err = valResult.errors[0];
        throw new Error(`ERR_PUBLICATION_VALIDATION_FAILED: ${err.code} — ${err.message}`);
      }

      // Find current published version for this term and mark it superseded
      let priorVersionId: string | undefined;
      for (const v of tx.timetableVersions.values()) {
        if (v.termId === draftVersion.termId && v.status === 'published') {
          v.status = 'superseded';
          priorVersionId = v.id;
        }
      }

      // Mark occurrences of superseded version as superseded (preserve one-off extra classes)
      if (priorVersionId) {
        for (const occ of tx.classOccurrences.values()) {
          if (occ.versionId === priorVersionId && !occ.isExtraClass && occ.status !== 'superseded') {
            occ.status = 'superseded';
          }
        }
      }

      // Atomically update draft to published
      draftVersion.status = 'published';
      draftVersion.publishedAt = new Date().toISOString();
      draftVersion.priorVersionId = priorVersionId;

      // Instantiate dated occurrences for the term calendar (e.g. next 14 days)
      const term = tx.academicTerms.get(draftVersion.termId);
      const startDate = term ? new Date(term.startDate) : new Date('2026-09-01');
      let occurrencesCount = 0;

      // Generate dated occurrences for 2 weeks
      const newOccurrences: ClassOccurrence[] = [];
      for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
        const currentDate = new Date(startDate.getTime() + dayOffset * 86400000);
        const dayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay(); // 1=Mon...7=Sun
        const dateStr = currentDate.toISOString().split('T')[0];

        const dayClasses = draftClasses.filter((c) => c.dayOfWeek === dayOfWeek);
        for (const cls of dayClasses) {
          const occId = `occ-${dateStr}-${cls.id}`;
          const occurrence: ClassOccurrence = {
            id: occId,
            versionId: draftVersion.id,
            recurringClassId: cls.id,
            courseOfferingId: cls.courseOfferingId,
            termId: cls.termId,
            date: dateStr,
            dayOfWeek,
            startSlot: cls.startSlot,
            duration: cls.duration,
            activityType: cls.activityType,
            teacherId: cls.teacherId,
            roomId: cls.roomId,
            targetType: cls.targetType,
            targetId: cls.targetId,
            status: 'scheduled',
          };
          tx.classOccurrences.set(occId, occurrence);
          newOccurrences.push(occurrence);
          occurrencesCount++;
        }
      }

      // Persist publication durably to PostgreSQL if configured (BE-02, BE-10)
      if (isDbConfigured()) {
        await persistPublicationToDb(draftVersion, priorVersionId, newOccurrences);
      }

      this.repo.logAudit(
        session.userId,
        'PUBLISH_TIMETABLE_VERSION',
        'timetable_versions',
        versionId,
        'success',
        {
          versionNumber: draftVersion.versionNumber,
          priorVersionId,
          instantiatedOccurrences: occurrencesCount,
        }
      );

      // Post-commit notifications to affected students
      const notifiedStudents = new Set<string>();
      for (const cls of draftClasses) {
        const students = getRepresentedStudents(cls.targetType, cls.targetId, ctx);
        for (const s of students) {
          notifiedStudents.add(s);
        }
      }

      for (const studentId of notifiedStudents) {
        const outboxId = `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        tx.notificationOutbox.push({
          id: outboxId,
          recipientStudentId: studentId,
          eventType: 'TIMETABLE_PUBLISHED',
          title: 'Timetable Published',
          message: `The official timetable (Version ${draftVersion.versionNumber}) has been published.`,
          entityType: 'timetable_versions',
          entityId: versionId,
          status: 'pending',
          retryCount: 0,
          createdAt: new Date().toISOString(),
        });
      }

      return {
        publishedVersion: draftVersion,
        instantiatedOccurrences: occurrencesCount,
      };
    });
  }

  /**
   * Restores a previously published or archived timetable version.
   * D40: Admin-only. Preserves complete audit history without destructive deletions.
   */
  public async restoreVersion(
    session: AuthSession,
    versionId: string
  ): Promise<TimetableVersion> {
    if (session.role !== 'admin') {
      throw new Error('ERR_FORBIDDEN: Only administrators can restore prior timetable versions.');
    }

    return this.repo.runTransaction(async (tx) => {
      const targetVersion = tx.timetableVersions.get(versionId);
      if (!targetVersion) {
        throw new Error(`ERR_VERSION_NOT_FOUND: Timetable version ${versionId} not found.`);
      }

      // Mark current active published version and its occurrences as superseded
      let priorActiveVersionId: string | undefined;
      for (const v of tx.timetableVersions.values()) {
        if (v.termId === targetVersion.termId && v.status === 'published') {
          v.status = 'superseded';
          priorActiveVersionId = v.id;
          for (const occ of tx.classOccurrences.values()) {
            if (occ.versionId === v.id && !occ.isExtraClass) {
              occ.status = 'superseded';
            }
          }
        }
      }

      // Set target version as published and reactivate its superseded occurrences
      targetVersion.status = 'published';
      targetVersion.publishedAt = new Date().toISOString();
      for (const occ of tx.classOccurrences.values()) {
        if (occ.versionId === targetVersion.id && !occ.isExtraClass && occ.status === 'superseded') {
          occ.status = 'scheduled';
        }
      }

      // Persist version restoration durably to PostgreSQL if configured (BE-02, BE-10)
      if (isDbConfigured()) {
        await persistVersionRestoreToDb(targetVersion.id, priorActiveVersionId);
      }

      this.repo.logAudit(
        session.userId,
        'RESTORE_TIMETABLE_VERSION',
        'timetable_versions',
        versionId,
        'success',
        { restoredVersionNumber: targetVersion.versionNumber }
      );

      return targetVersion;
    });
  }
}
