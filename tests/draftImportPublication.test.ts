import { describe, it, expect, beforeEach } from 'vitest';
import { TimetableRepository } from '../src/data/repository.js';
import { DraftImportService } from '../src/services/draftImportService.js';
import { PublicationService } from '../src/services/publicationService.js';
import { GeneratorAdapterService } from '../src/services/generatorAdapter.js';
import { AuthSession } from '../src/services/authService.js';

describe('Phase 6 — Draft Import, Stale Detection, Publication & Recovery', () => {
  let repo: TimetableRepository;
  let importService: DraftImportService;
  let pubService: PublicationService;
  let genAdapter: GeneratorAdapterService;

  const adminSession: AuthSession = {
    userId: 'admin-1',
    email: 'admin@uni.edu',
    role: 'admin',
  };

  const studentSession: AuthSession = {
    userId: 'student-1',
    email: 'student@uni.edu',
    role: 'student',
  };

  beforeEach(async () => {
    repo = new TimetableRepository();
    importService = new DraftImportService(repo);
    pubService = new PublicationService(repo);
    genAdapter = new GeneratorAdapterService(repo);

    await repo.runTransaction(async (tx) => {
      tx.academicTerms.set('term-3', {
        id: 'term-3',
        yearLabel: '2026-2027',
        semesterNumber: 3,
        startDate: '2026-09-01',
        endDate: '2026-12-20',
        cycle: 'odd',
        status: 'active',
      });

      tx.rooms.set('r-101', {
        id: 'r-101',
        roomNumber: '101',
        building: 'Main',
        floor: 1,
        capacity: 60,
        roomType: 'LT',
        active: true,
      });

      tx.teachers.set('t-1', {
        id: 't-1',
        empId: 'EMP-1',
        name: 'Prof. Smith',
        email: 'smith@uni.edu',
        active: true,
      });

      tx.sections.set('sec-A', {
        id: 'sec-A',
        termId: 'term-3',
        name: 'A',
        expectedCount: 50,
        active: true,
      });

      tx.students.set('stud-1', {
        id: 'stud-1',
        rollNumber: 'R101',
        name: 'Alice',
        email: 'alice@uni.edu',
        active: true,
      });
      tx.studentGroupMemberships.set('sgm-1', {
        id: 'sgm-1',
        studentId: 'stud-1',
        groupId: 'sec-A',
        groupType: 'section',
        effectiveStartDate: '2026-08-01',
      });

      tx.courses.set('c-math', {
        id: 'c-math',
        code: 'MATH201',
        name: 'Linear Algebra',
        termId: 'term-3',
        lectureHours: 1, // 1 lecture required
        tutorialHours: 0,
        practicalHours: 0,
        requiredRoomType: 'LT',
      });

      tx.courseOfferings.set('off-math', {
        id: 'off-math',
        courseId: 'c-math',
        termId: 'term-3',
        teacherId: 't-1',
        targetType: 'section',
        targetId: 'sec-A',
      });
    });
  });

  it('rejects unsupported schema versions on draft upload', async () => {
    const invalidSchemaDraft = {
      schemaVersion: '0.9.0', // Unsupported version!
      packageId: 'pkg-1',
      inputRevision: 'rev-1',
      status: 'succeeded',
      termIds: ['term-3'],
      classes: [],
    };

    await expect(
      importService.uploadGeneratedDraft(adminSession, invalidSchemaDraft)
    ).rejects.toThrow('ERR_UNSUPPORTED_VERSION');
  });

  it('imports valid draft as status "draft" without auto-publication (D48)', async () => {
    // Export package to get matching inputRevision
    const { package: pkg } = genAdapter.exportGenerationInputPackage(adminSession, ['term-3']);

    const validDraftPayload = {
      schemaVersion: '1.0.0',
      packageId: pkg.packageId,
      inputRevision: pkg.inputRevision,
      status: 'succeeded',
      termIds: ['term-3'],
      classes: [
        {
          id: 'sc-math-1',
          courseOfferingId: 'off-math',
          termId: 'term-3',
          dayOfWeek: 1,
          startSlot: 1,
          duration: 1,
          activityType: 'L' as const,
          teacherId: 't-1',
          roomId: 'r-101',
          targetType: 'section' as const,
          targetId: 'sec-A',
          status: 'scheduled' as const,
        },
      ],
    };

    const importRes = await importService.uploadGeneratedDraft(adminSession, validDraftPayload);
    expect(importRes.version.status).toBe('draft'); // Invariant: Draft only!
    expect(importRes.classCount).toBe(1);

    // Verify stored in repository
    const storedVersion = repo.getState().timetableVersions.get(importRes.version.id);
    expect(storedVersion?.status).toBe('draft');
  });

  it('detects stale package revision, warns, and allows authorized audited override without bypassing constraints (D50)', async () => {
    // Export package with initial revision
    const { package: pkg } = genAdapter.exportGenerationInputPackage(adminSession, ['term-3']);

    // Now modify reference data: change room capacity or add a room
    await repo.runTransaction(async (tx) => {
      tx.rooms.set('r-new', {
        id: 'r-new',
        roomNumber: '999',
        building: 'Annex',
        floor: 1,
        capacity: 100,
        roomType: 'LT',
        active: true,
      });
    });

    const draftWithOldRevision = {
      schemaVersion: '1.0.0',
      packageId: pkg.packageId,
      inputRevision: pkg.inputRevision, // Now stale!
      status: 'succeeded',
      termIds: ['term-3'],
      classes: [
        {
          id: 'sc-math-1',
          courseOfferingId: 'off-math',
          termId: 'term-3',
          dayOfWeek: 1,
          startSlot: 1,
          duration: 1,
          activityType: 'L' as const,
          teacherId: 't-1',
          roomId: 'r-101',
          targetType: 'section' as const,
          targetId: 'sec-A',
          status: 'scheduled' as const,
        },
      ],
    };

    // Stale upload without override flag must be rejected (D50)
    await expect(
      importService.uploadGeneratedDraft(adminSession, draftWithOldRevision)
    ).rejects.toThrow('ERR_STALE_PACKAGE');

    // Upload with authorized admin override -> succeeds with warning and audit record
    const overrideRes = await importService.uploadGeneratedDraft(adminSession, draftWithOldRevision, {
      allowStaleOverride: true,
      staleOverrideReason: 'Room addition does not affect math schedule',
    });

    expect(overrideRes.warnings.length).toBeGreaterThan(0);
    expect(overrideRes.version.status).toBe('draft');

    // Check audit log for stale override
    const auditLogs = repo.getState().auditEvents.filter((a) => a.action === 'STALE_PACKAGE_OVERRIDE');
    expect(auditLogs.length).toBe(1);
  });

  it('publishes draft atomically, supersedes previous version, instantiates dated occurrences, and notifies students (D13)', async () => {
    // Import a valid draft first
    const { package: pkg } = genAdapter.exportGenerationInputPackage(adminSession, ['term-3']);
    const draftPayload = {
      schemaVersion: '1.0.0',
      packageId: pkg.packageId,
      inputRevision: pkg.inputRevision,
      status: 'succeeded',
      termIds: ['term-3'],
      classes: [
        {
          id: 'sc-math-1',
          courseOfferingId: 'off-math',
          termId: 'term-3',
          dayOfWeek: 1,
          startSlot: 1,
          duration: 1,
          activityType: 'L' as const,
          teacherId: 't-1',
          roomId: 'r-101',
          targetType: 'section' as const,
          targetId: 'sec-A',
          status: 'scheduled' as const,
        },
      ],
    };

    const { version: draftV1 } = await importService.uploadGeneratedDraft(adminSession, draftPayload);

    // Non-admin cannot publish (D13)
    await expect(
      pubService.publishDraft(studentSession, draftV1.id)
    ).rejects.toThrow('ERR_FORBIDDEN');

    // Admin publishes draft
    const pubRes = await pubService.publishDraft(adminSession, draftV1.id);
    expect(pubRes.publishedVersion.status).toBe('published');
    expect(pubRes.instantiatedOccurrences).toBeGreaterThan(0);

    // Verify dated occurrences exist in repository
    const occurrences = Array.from(repo.getState().classOccurrences.values());
    expect(occurrences.length).toBe(pubRes.instantiatedOccurrences);

    // Verify post-commit notification sent to student
    const studentNotices = repo.getState().notificationOutbox.filter((n) => n.recipientStudentId === 'stud-1');
    expect(studentNotices.some((n) => n.eventType === 'TIMETABLE_PUBLISHED')).toBe(true);

    // Publish a revised draft V2 -> V1 becomes 'superseded'
    const draftV2Payload = { ...draftPayload, packageId: 'pkg-revised-2' };
    const { version: draftV2 } = await importService.uploadGeneratedDraft(adminSession, draftV2Payload);
    await pubService.publishDraft(adminSession, draftV2.id);

    expect(repo.getState().timetableVersions.get(draftV1.id)?.status).toBe('superseded');
    expect(repo.getState().timetableVersions.get(draftV2.id)?.status).toBe('published');

    // Restore V1 (D40) -> V1 becomes published, audit history retained
    const restoredV1 = await pubService.restoreVersion(adminSession, draftV1.id);
    expect(restoredV1.status).toBe('published');
    expect(repo.getState().timetableVersions.get(draftV2.id)?.status).toBe('superseded');
  });
});
