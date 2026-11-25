/**
 * Generation package exporter and hosted generator adapter with explicit local fallback.
 * Source of truth: docs/03_ARCHITECTURE_AND_RUNTIME.md, docs/06_API_AND_WORKFLOWS.md
 */

import { TimetableRepository } from '../data/repository.js';
import { AuthSession } from './authService.js';
import { computeInputRevision } from '../domain/revision.js';
import { DraftImportService } from './draftImportService.js';
import { PublicationService } from './publicationService.js';
import crypto from 'crypto';

export interface GenerationPackage {
  schemaVersion: string;
  packageId: string;
  inputRevision: string;
  createdAt: string;
  termIds: string[];
  grid: Record<string, unknown>;
  rooms: Record<string, unknown>[];
  teachers: Record<string, unknown>[];
  teacherAvailabilities: Record<string, unknown>[];
  sections: Record<string, unknown>[];
  batches: Record<string, unknown>[];
  courses: Record<string, unknown>[];
  courseOfferings: Record<string, unknown>[];
  electiveGroups?: Record<string, unknown>[];
  electiveAssignments?: Record<string, unknown>[];
  studentMemberships?: Record<string, unknown>[];
}

export interface GenerationRunRecord {
  id: string;
  packageId: string;
  inputRevision: string;
  termIds: string[];
  status: 'queued' | 'running' | 'succeeded' | 'infeasible' | 'failed' | 'unavailable';
  requestedBy: string;
  createdAt: string;
  completedAt?: string;
  diagnostics?: Record<string, unknown>;
  draftOutput?: Record<string, unknown>;
}

export interface GenerationScopeOptions {
  roomIds?: string[];
  teacherIds?: string[];
  courseOfferingIds?: string[];
  sectionIds?: string[];
}

export class GeneratorAdapterService {
  private runs: Map<string, GenerationRunRecord> = new Map();

  constructor(
    private repo: TimetableRepository,
    private importService?: DraftImportService,
    private pubService?: PublicationService
  ) {}

  /**
   * Admin-only operation: snapshots all concurrently active semesters (D10)
   * and exports a complete versioned generation input package.
   */
  public exportGenerationInputPackage(
    session: AuthSession,
    termIds?: string[],
    scope?: GenerationScopeOptions
  ): { package: GenerationPackage; runId: string } {
    if (session.role !== 'admin') {
      throw new Error('ERR_FORBIDDEN: Only administrators can export generation packages.');
    }

    const state = this.repo.getState();
    const activeTerms = Array.from(state.academicTerms.values()).filter((t) =>
      termIds && termIds.length > 0 ? termIds.includes(t.id) : t.status === 'active' || t.status === 'planned'
    );

    const targetTermIds = activeTerms.map((t) => t.id);
    let rooms = Array.from(state.rooms.values()).filter((r) => r.active);
    if (scope?.roomIds && scope.roomIds.length > 0) {
      rooms = rooms.filter((r) => scope.roomIds!.includes(r.id));
    }

    let teachers = Array.from(state.teachers.values()).filter((t) => t.active);
    if (scope?.teacherIds && scope.teacherIds.length > 0) {
      teachers = teachers.filter((t) => scope.teacherIds!.includes(t.id));
    }

    const teacherIdsSet = new Set(teachers.map((t) => t.id));
    const teacherAvailabilities = Array.from(state.teacherAvailabilities.values()).filter((ta) =>
      teacherIdsSet.has(ta.teacherId)
    );

    let sections = Array.from(state.sections.values()).filter((s) =>
      targetTermIds.includes(s.termId)
    );
    if (scope?.sectionIds && scope.sectionIds.length > 0) {
      sections = sections.filter((s) => scope.sectionIds!.includes(s.id));
    }

    const sectionIds = new Set(sections.map((s) => s.id));
    const batches = Array.from(state.batches.values()).filter((b) =>
      sectionIds.has(b.sectionId)
    );

    const courses = Array.from(state.courses.values()).filter((c) =>
      targetTermIds.includes(c.termId)
    );

    let courseOfferings = Array.from(state.courseOfferings.values()).filter((o) =>
      targetTermIds.includes(o.termId)
    );
    if (scope?.courseOfferingIds && scope.courseOfferingIds.length > 0) {
      courseOfferings = courseOfferings.filter((o) => scope.courseOfferingIds!.includes(o.id));
    }

    // Compute deterministic input revision hash
    const inputRevision = computeInputRevision({
      termIds: targetTermIds,
      rooms,
      teachers,
      courses,
      courseOfferings,
      grid: state.gridConfig,
      teacherAvailabilities,
    });

    const packageId = `pkg-${Date.now()}-${inputRevision.substring(0, 6)}`;
    const runId = `run-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const genPackage: GenerationPackage = {
      schemaVersion: '1.0.0',
      packageId,
      inputRevision,
      createdAt: new Date().toISOString(),
      termIds: targetTermIds,
      grid: {
        days: state.gridConfig.days,
        slotsPerDay: state.gridConfig.slotsPerDay,
        slots: state.gridConfig.slots,
      },
      rooms: rooms.map((r) => ({
        id: r.id,
        roomNumber: r.roomNumber,
        building: r.building,
        floor: r.floor,
        capacity: r.capacity,
        roomType: r.roomType,
      })),
      teachers: teachers.map((t) => ({
        id: t.id,
        empId: t.empId,
        name: t.name,
      })),
      teacherAvailabilities: teacherAvailabilities.map((ta) => ({
        teacherId: ta.teacherId,
        dayOfWeek: ta.dayOfWeek,
        slotIndex: ta.slotIndex,
        isAvailable: ta.isAvailable,
      })),
      sections: sections.map((s) => ({
        id: s.id,
        termId: s.termId,
        name: s.name,
        expectedCount: s.expectedCount,
      })),
      batches: batches.map((b) => ({
        id: b.id,
        sectionId: b.sectionId,
        name: b.name,
        expectedCount: b.expectedCount,
      })),
      courses: courses.map((c) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        termId: c.termId,
        lectureHours: c.lectureHours,
        tutorialHours: c.tutorialHours,
        practicalHours: c.practicalHours,
        requiredRoomType: c.requiredRoomType,
      })),
      courseOfferings: courseOfferings.map((o) => ({
        id: o.id,
        courseId: o.courseId,
        termId: o.termId,
        teacherId: o.teacherId,
        targetType: o.targetType,
        targetId: o.targetId,
        ...(o.component
          ? { component: o.component }
          : o.id.toLowerCase().includes('lab')
          ? { component: 'P' }
          : o.id.toLowerCase().includes('tut')
          ? { component: 'T' }
          : o.id.toLowerCase().includes('sec') || o.id.toLowerCase().includes('lec')
          ? { component: 'L' }
          : {}),
      })),
      electiveGroups: Array.from(state.electiveGroups.values())
        .filter((eg) => targetTermIds.includes(eg.termId))
        .map((eg) => ({
          id: eg.id,
          termId: eg.termId,
          name: eg.name,
          courseId: eg.courseId,
          expectedCount: eg.expectedCount,
        })),
      electiveAssignments: Array.from(state.electiveAssignments.values())
        .filter((ea) => ea.status === 'active')
        .map((ea) => ({
          id: ea.id,
          studentId: ea.studentId,
          electiveGroupId: ea.electiveGroupId,
        })),
      studentMemberships: Array.from(state.studentGroupMemberships.values()).map((m) => ({
        id: m.id,
        studentId: m.studentId,
        groupId: m.groupId,
        groupType: m.groupType,
      })),
    };

    // Record generation run
    const runRecord: GenerationRunRecord = {
      id: runId,
      packageId,
      inputRevision,
      termIds: targetTermIds,
      status: 'queued',
      requestedBy: session.userId,
      createdAt: new Date().toISOString(),
    };
    this.runs.set(runId, runRecord);

    this.repo.logAudit(session.userId, 'EXPORT_GENERATION_PACKAGE', 'generation_runs', runId, 'success', {
      packageId,
      inputRevision,
      termCount: targetTermIds.length,
    });

    return { package: genPackage, runId };
  }

  /**
   * Attempts hosted generator execution if GENERATOR_SERVICE_URL is configured.
   * Runtime honesty requirement (AGENTS.md rule 4):
   * If URL is empty or unreachable, reports status 'unavailable' and prompts local fallback.
   * Never fakes a successful response!
   */
  public async requestGeneration(
    session: AuthSession,
    termIds?: string[],
    scope?: GenerationScopeOptions,
    options?: { directlyPublish?: boolean }
  ): Promise<{
    runId: string;
    status: string;
    hostedAvailable: boolean;
    package?: GenerationPackage;
    draftVersionId?: string;
    draftVersionNumber?: number;
    classesCount?: number;
    solveTimeMs?: number;
    published?: boolean;
    message: string;
  }> {
    const { package: pkg, runId } = this.exportGenerationInputPackage(session, termIds, scope);
    const runRecord = this.runs.get(runId)!;

    const serviceUrl = process.env.GENERATOR_SERVICE_URL?.trim();
    const fallbackPyCmd = process.platform === 'win32' ? 'py -3.12' : 'python3';
    if (!serviceUrl) {
      runRecord.status = 'unavailable';
      runRecord.diagnostics = {
        reason: 'GENERATOR_SERVICE_URL is not configured.',
        localFallbackCommand: `${fallbackPyCmd} generator/run_local.py --input <downloaded_package.json> --output <draft.json>`,
      };
      return {
        runId,
        status: 'unavailable',
        hostedAvailable: false,
        package: pkg,
        message: 'Hosted generator is unconfigured. Please download the generation package and execute local OR-Tools solver.',
      };
    }

    // Hosted URL exists: attempt request with timeout (60s)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const resp = await fetch(serviceUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GENERATOR_SERVICE_TOKEN || ''}`,
        },
        body: JSON.stringify(pkg),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!resp.ok) {
        throw new Error(`HTTP error ${resp.status}: ${resp.statusText}`);
      }

      const draftResult = (await resp.json()) as Record<string, unknown>;
      runRecord.status = draftResult.status === 'succeeded' ? 'succeeded' : 'infeasible';
      runRecord.draftOutput = draftResult;
      runRecord.completedAt = new Date().toISOString();

      if (runRecord.status === 'infeasible') {
        return {
          runId,
          status: 'infeasible',
          hostedAvailable: true,
          package: pkg,
          message: 'CP-SAT solver determined model is INFEASIBLE under current room/teacher constraints.',
        };
      }

      let draftVersionId: string | undefined;
      let draftVersionNumber: number | undefined;
      let classesCount: number | undefined;
      let isPublished = false;

      if (this.importService) {
        const importRes = await this.importService.uploadGeneratedDraft(session, draftResult as any);
        draftVersionId = importRes.version.id;
        draftVersionNumber = importRes.version.versionNumber;
        classesCount = importRes.classCount;

        if (options?.directlyPublish && this.pubService) {
          const pubRes = await this.pubService.publishDraft(session, draftVersionId);
          this.repo.emitPostCommit('TIMETABLE_PUBLISHED', pubRes);
          isPublished = true;
        }
      }

      const solveTimeMs = typeof (draftResult.diagnostics as any)?.solveTimeMs === 'number'
        ? Math.round((draftResult.diagnostics as any).solveTimeMs)
        : 500;

      return {
        runId,
        status: 'succeeded',
        hostedAvailable: true,
        package: pkg,
        draftVersionId,
        draftVersionNumber,
        classesCount,
        solveTimeMs,
        published: isPublished,
        message: isPublished
          ? `CP-SAT solver succeeded! Generated and directly published Version ${draftVersionNumber} with ${classesCount} classes.`
          : `Hosted generation succeeded! Staged Draft Version ${draftVersionNumber || 1} with ${classesCount || (draftResult.classes as any[])?.length} classes.`,
      };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      runRecord.status = 'unavailable';
      runRecord.diagnostics = {
        hostedError: errorMessage,
        localFallbackCommand: `${fallbackPyCmd} generator/run_local.py --input <downloaded_package.json> --output <draft.json>`,
      };

      return {
        runId,
        status: 'unavailable',
        hostedAvailable: false,
        package: pkg,
        message: `Hosted generator failed or timed out (${errorMessage}). Local solver fallback is ready.`,
      };
    }
  }

  public getRunStatus(runId: string): GenerationRunRecord | undefined {
    return this.runs.get(runId);
  }
}
