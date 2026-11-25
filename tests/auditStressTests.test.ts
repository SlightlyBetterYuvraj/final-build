import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createApp } from '../src/api/server.js';
import { TimetableRepository } from '../src/data/repository.js';
import { RegularClassService } from '../src/services/regularClassService.js';
import { ExtraClassService } from '../src/services/extraClassService.js';
import { PublicationService } from '../src/services/publicationService.js';
import { StudentTransferService } from '../src/services/studentTransferService.js';
import { AuthSession } from '../src/services/authService.js';
import { validateCandidateSession, getRepresentedStudents } from '../src/domain/conflictValidator.js';
import { validateSlotAdjacency } from '../src/domain/sessionRules.js';
import type { Express } from 'express';

async function startTestServer(app: Express): Promise<{ url: string; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 3000;
      resolve({
        url: `http://localhost:${port}`,
        close: () => new Promise<void>((res) => server.close(() => res())),
      });
    });
  });
}

describe('Systematic Audit & Stress-Testing Probe Suite (Decisions D01–D50)', () => {
  let repo: TimetableRepository;
  let regularService: RegularClassService;
  let extraService: ExtraClassService;
  let pubService: PublicationService;
  let transferService: StudentTransferService;
  let app: Express;
  let testServer: { url: string; close: () => Promise<void> };

  const adminSession: AuthSession = {
    userId: 'admin-1',
    email: 'admin@uni.edu',
    role: 'admin',
  };

  const teacher1Session: AuthSession = {
    userId: 'user-t-audit-1',
    email: 't-audit-1@uni.edu',
    role: 'teacher',
    linkedId: 't-audit-1',
  };

  const teacher2Session: AuthSession = {
    userId: 'user-t-audit-2',
    email: 't-audit-2@uni.edu',
    role: 'teacher',
    linkedId: 't-audit-2',
  };

  const studentSession: AuthSession = {
    userId: 'user-stud-audit-1',
    email: 'stud-audit-1@uni.edu',
    role: 'student',
    linkedId: 'stud-audit-1',
  };

  beforeEach(async () => {
    repo = new TimetableRepository();
    regularService = new RegularClassService(repo);
    extraService = new ExtraClassService(repo);
    pubService = new PublicationService(repo);
    transferService = new StudentTransferService(repo);

    // Setup isolated academic test fixtures
    await repo.runTransaction(async (tx) => {
      tx.academicTerms.set('term-audit', {
        id: 'term-audit',
        yearLabel: '2026-2027',
        semesterNumber: 3,
        startDate: '2026-09-01',
        endDate: '2026-12-20',
        cycle: 'odd',
        status: 'active',
      });

      tx.rooms.set('r-audit-101', {
        id: 'r-audit-101',
        roomNumber: 'A-101',
        building: 'Audit Wing',
        floor: 1,
        capacity: 60,
        roomType: 'LT',
        active: true,
      });

      tx.rooms.set('r-audit-lab', {
        id: 'r-audit-lab',
        roomNumber: 'A-LAB',
        building: 'Audit Wing',
        floor: 2,
        capacity: 30,
        roomType: 'P',
        active: true,
      });

      tx.teachers.set('t-audit-1', {
        id: 't-audit-1',
        empId: 'AUD-EMP-1',
        name: 'Dr. Alice Auditor',
        email: 'alice@audit.edu',
        active: true,
      });

      tx.teachers.set('t-audit-2', {
        id: 't-audit-2',
        empId: 'AUD-EMP-2',
        name: 'Dr. Bob Auditor',
        email: 'bob@audit.edu',
        active: true,
      });

      tx.sections.set('sec-audit-A', {
        id: 'sec-audit-A',
        name: 'Section Audit A',
        termId: 'term-audit',
        expectedCount: 60,
        active: true,
      });

      tx.batches.set('batch-audit-A1', {
        id: 'batch-audit-A1',
        name: 'Batch Audit A1',
        sectionId: 'sec-audit-A',
        expectedCount: 30,
        active: true,
      });

      tx.batches.set('batch-audit-A2', {
        id: 'batch-audit-A2',
        name: 'Batch Audit A2',
        sectionId: 'sec-audit-A',
        expectedCount: 30,
        active: true,
      });

      tx.courses.set('c-audit-101', {
        id: 'c-audit-101',
        code: 'AUD101',
        name: 'Auditing Systems',
        lectureHours: 1,
        tutorialHours: 0,
        practicalHours: 0,
        requiredRoomType: 'LT',
        termId: 'term-audit',
      });

      tx.courseOfferings.set('off-audit-101', {
        id: 'off-audit-101',
        courseId: 'c-audit-101',
        termId: 'term-audit',
        teacherId: 't-audit-1',
        targetType: 'section',
        targetId: 'sec-audit-A',
      });

      tx.students.set('stud-audit-1', {
        id: 'stud-audit-1',
        name: 'Auditor Student Charlie',
        rollNumber: 'AUD2026-001',
        email: 'charlie@audit.edu',
        active: true,
      });

      // Membership: Batch A1 until 2026-09-07, Batch A2 from 2026-09-08
      tx.studentGroupMemberships.set('mem-audit-sec', {
        id: 'mem-audit-sec',
        studentId: 'stud-audit-1',
        groupType: 'section',
        groupId: 'sec-audit-A',
        effectiveStartDate: '2026-09-01',
      });

      tx.studentGroupMemberships.set('mem-audit-a1', {
        id: 'mem-audit-a1',
        studentId: 'stud-audit-1',
        groupType: 'batch',
        groupId: 'batch-audit-A1',
        effectiveStartDate: '2026-09-01',
        effectiveEndDate: '2026-09-07',
      });

      tx.studentGroupMemberships.set('mem-audit-a2', {
        id: 'mem-audit-a2',
        studentId: 'stud-audit-1',
        groupType: 'batch',
        groupId: 'batch-audit-A2',
        effectiveStartDate: '2026-09-08',
      });
    });

    app = createApp(repo);
    testServer = await startTestServer(app);
  });

  afterEach(async () => {
    if (testServer) {
      await testServer.close();
    }
  });

  // --------------------------------------------------------------------------
  // Scenario A: Absence vs Extra Class Collision
  // --------------------------------------------------------------------------
  it('Scenario A: Extra Class vs Confirmed Absence collision detection (D29, D30)', async () => {
    // 1. Teacher 1 books an extra class on 2026-09-02 (Wed), slot 2
    const extraClass = await extraService.bookExtraClass(teacher1Session, {
      termId: 'term-audit',
      courseOfferingId: 'off-audit-101',
      date: '2026-09-02',
      dayOfWeek: 3,
      startSlot: 2,
      activityType: 'L',
      roomId: 'r-audit-101',
      targetType: 'section',
      targetId: 'sec-audit-A',
    });
    expect(extraClass.id).toBeDefined();
    expect(extraClass.status).toBe('scheduled');

    // 2. Teacher 1 submits an unavailability request for 2026-09-02, slots 1-3
    const unavailReq = await extraService.submitUnavailabilityRequest(teacher1Session, {
      date: '2026-09-02',
      startSlot: 1,
      endSlot: 3,
      reason: 'Medical appointment',
    });
    expect(unavailReq.status).toBe('pending');

    // 3. Admin confirms the unavailability request
    const confirmResult = await extraService.confirmUnavailabilityRequest(adminSession, unavailReq.id);
    expect(confirmResult.request.status).toBe('confirmed');
    // The booked extra class MUST be enumerated among the affected occurrences!
    const affected = confirmResult.affectedOccurrences;
    expect(affected.some((occ) => occ.id === extraClass.id)).toBe(true);

    // 4. Try to book ANOTHER extra class during this newly confirmed absence interval
    // MUST be strictly rejected by candidate validation
    await expect(
      extraService.bookExtraClass(teacher1Session, {
        termId: 'term-audit',
        courseOfferingId: 'off-audit-101',
        date: '2026-09-02',
        dayOfWeek: 3,
        startSlot: 3,
        activityType: 'L',
        roomId: 'r-audit-101',
        targetType: 'section',
        targetId: 'sec-audit-A',
      })
    ).rejects.toThrow(/ERR_TEACHER_CONFIRMED_ABSENCE/);
  });

  // --------------------------------------------------------------------------
  // Scenario B: Double Reschedule / Swap Collision
  // --------------------------------------------------------------------------
  it('Scenario B: Swap collision rejection & clean multi-hop rescheduling (D04, D23)', async () => {
    let occAId = '';
    let occBId = '';

    await repo.runTransaction(async (tx) => {
      occAId = 'occ-audit-A';
      tx.classOccurrences.set(occAId, {
        id: occAId,
        versionId: 'v-audit-1',
        courseOfferingId: 'off-audit-101',
        termId: 'term-audit',
        date: '2026-09-01',
        dayOfWeek: 2,
        startSlot: 1,
        duration: 1,
        activityType: 'L',
        teacherId: 't-audit-1',
        roomId: 'r-audit-101',
        targetType: 'section',
        targetId: 'sec-audit-A',
        status: 'scheduled',
      });

      occBId = 'occ-audit-B';
      tx.classOccurrences.set(occBId, {
        id: occBId,
        versionId: 'v-audit-1',
        courseOfferingId: 'off-audit-101',
        termId: 'term-audit',
        date: '2026-09-01',
        dayOfWeek: 2,
        startSlot: 2,
        duration: 1,
        activityType: 'L',
        teacherId: 't-audit-2',
        roomId: 'r-audit-101',
        targetType: 'batch',
        targetId: 'batch-audit-A1',
        status: 'scheduled',
      });
    });

    // Attempting to move Occ A directly into Occ B's slot 2 must fail due to room and cohort conflict
    await expect(
      regularService.rescheduleOccurrence(adminSession, occAId, {
        date: '2026-09-01',
        dayOfWeek: 2,
        startSlot: 2,
        roomId: 'r-audit-101',
      })
    ).rejects.toThrow();

    // Verify Occ A remained intact at slot 1
    const occABefore = repo.getState().classOccurrences.get(occAId);
    expect(occABefore?.startSlot).toBe(1);

    // Multi-hop atomic swap:
    // 1. Move Occ B to slot 5 (free in r-audit-101 for t-audit-2)
    await regularService.rescheduleOccurrence(adminSession, occBId, {
      date: '2026-09-01',
      dayOfWeek: 2,
      startSlot: 5,
      roomId: 'r-audit-101',
    });

    // 2. Move Occ A into slot 2 (now free)
    await regularService.rescheduleOccurrence(adminSession, occAId, {
      date: '2026-09-01',
      dayOfWeek: 2,
      startSlot: 2,
      roomId: 'r-audit-101',
    });

    // 3. Move Occ B into slot 1 (now free)
    await regularService.rescheduleOccurrence(adminSession, occBId, {
      date: '2026-09-01',
      dayOfWeek: 2,
      startSlot: 1,
      roomId: 'r-audit-101',
    });

    // Invariants verified
    const occAFinal = repo.getState().classOccurrences.get(occAId);
    const occBFinal = repo.getState().classOccurrences.get(occBId);
    expect(occAFinal?.startSlot).toBe(2);
    expect(occBFinal?.startSlot).toBe(1);
  });

  // --------------------------------------------------------------------------
  // Scenario C: Odd Labs & Lunch Boundary
  // --------------------------------------------------------------------------
  it('Scenario C: Rejects 2-slot practical session overlapping Lunch Break (Slot 4) or out of bounds (D04, D44)', () => {
    const grid = repo.getState().gridConfig;

    // Period 3 start with duration 2 occupies Slot 3 and Slot 4 (Lunch)
    const lunchSpill = validateSlotAdjacency('P', 1, 3, 2, grid);
    expect(lunchSpill.valid).toBe(false);
    expect(lunchSpill.errors.some((e) => e.code === 'ERR_SLOT_IS_BREAK')).toBe(true);

    // Period 8 start with duration 2 exceeds total operating periods (8)
    const outOfBounds = validateSlotAdjacency('P', 1, 8, 2, grid);
    expect(outOfBounds.valid).toBe(false);
    expect(outOfBounds.errors.some((e) => e.code === 'ERR_SLOT_OUT_OF_BOUNDS')).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Scenario D: Draft Republication over Existing Reschedules & Superseded Occurrences
  // --------------------------------------------------------------------------
  it('Scenario D: Republication marks prior version occurrences superseded without ghost slot collisions (D12, D13, D40)', async () => {
    // 1. Create and publish Version 1
    let v1Id = '';
    await repo.runTransaction(async (tx) => {
      v1Id = 'v-audit-pub-1';
      tx.timetableVersions.set(v1Id, {
        id: v1Id,
        termId: 'term-audit',
        versionNumber: 1,
        status: 'draft',
        inputRevision: 'rev-1',
        createdBy: 'admin-1',
        createdAt: '2026-08-30T10:00:00Z',
      });

      tx.scheduledClasses.set('sc-v1-audit-1', {
        id: 'sc-v1-audit-1',
        versionId: v1Id,
        courseOfferingId: 'off-audit-101',
        termId: 'term-audit',
        dayOfWeek: 1, // Mon
        startSlot: 1,
        duration: 1,
        activityType: 'L',
        teacherId: 't-audit-1',
        roomId: 'r-audit-101',
        targetType: 'section',
        targetId: 'sec-audit-A',
        status: 'scheduled',
      });
    });

    const pubResult1 = await pubService.publishDraft(adminSession, v1Id);
    expect(pubResult1.publishedVersion.status).toBe('published');

    // Check that v1 instantiated occurrences
    const occurrencesAfterV1 = Array.from(repo.getState().classOccurrences.values()).filter(
      (o) => o.versionId === v1Id
    );
    expect(occurrencesAfterV1.length).toBeGreaterThan(0);

    // 2. Create and publish Version 2 with a new scheduled class
    let v2Id = '';
    await repo.runTransaction(async (tx) => {
      v2Id = 'v-audit-pub-2';
      tx.timetableVersions.set(v2Id, {
        id: v2Id,
        termId: 'term-audit',
        versionNumber: 2,
        status: 'draft',
        inputRevision: 'rev-2',
        createdBy: 'admin-1',
        createdAt: '2026-09-02T10:00:00Z',
      });

      tx.scheduledClasses.set('sc-v2-audit-1', {
        id: 'sc-v2-audit-1',
        versionId: v2Id,
        courseOfferingId: 'off-audit-101',
        termId: 'term-audit',
        dayOfWeek: 1, // Mon
        startSlot: 2, // shifted to slot 2
        duration: 1,
        activityType: 'L',
        teacherId: 't-audit-1',
        roomId: 'r-audit-101',
        targetType: 'section',
        targetId: 'sec-audit-A',
        status: 'scheduled',
      });
    });

    const pubResult2 = await pubService.publishDraft(adminSession, v2Id);
    expect(pubResult2.publishedVersion.status).toBe('published');

    // Timetable version 1 must now be superseded
    const v1Updated = repo.getState().timetableVersions.get(v1Id);
    expect(v1Updated?.status).toBe('superseded');

    // Occurrences from Version 1 must NOT remain in 'scheduled' status competing with Version 2!
    const v1Occurrences = Array.from(repo.getState().classOccurrences.values()).filter(
      (o) => o.versionId === v1Id
    );
    for (const occ of v1Occurrences) {
      expect(occ.status).toBe('superseded');
    }

    // 3. Restore Version 1 and verify occurrences swap status cleanly (D40)
    const restoredV1 = await pubService.restoreVersion(adminSession, v1Id);
    expect(restoredV1.status).toBe('published');
    const v2Updated = repo.getState().timetableVersions.get(v2Id);
    expect(v2Updated?.status).toBe('superseded');

    const v1OccurrencesAfterRestore = Array.from(repo.getState().classOccurrences.values()).filter(
      (o) => o.versionId === v1Id
    );
    for (const occ of v1OccurrencesAfterRestore) {
      expect(occ.status).toBe('scheduled');
    }

    const v2OccurrencesAfterRestore = Array.from(repo.getState().classOccurrences.values()).filter(
      (o) => o.versionId === v2Id
    );
    for (const occ of v2OccurrencesAfterRestore) {
      expect(occ.status).toBe('superseded');
    }
  });

  // --------------------------------------------------------------------------
  // Scenario E: Student Solo Interface Isolation & RBAC Rejection
  // --------------------------------------------------------------------------
  it('Scenario E: Student role is strictly forbidden from admin/teacher endpoints (403)', async () => {
    // 1. Attempt to book extra class as student
    const extraRes = await fetch(`${testServer.url}/api/classes/extra/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'student',
        'x-user-id': 'stud-audit-1',
      },
      body: JSON.stringify({
        termId: 'term-audit',
        courseOfferingId: 'off-audit-101',
        date: '2026-09-01',
        dayOfWeek: 2,
        startSlot: 1,
        activityType: 'L',
        roomId: 'r-audit-101',
        targetType: 'section',
        targetId: 'sec-audit-A',
      }),
    });
    expect(extraRes.status).toBe(403);
    const extraData = await extraRes.json();
    expect(extraData.error).toBe('FORBIDDEN');

    // 2. Attempt to create section as student
    const secRes = await fetch(`${testServer.url}/api/academic/sections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'student',
        'x-user-id': 'stud-audit-1',
      },
      body: JSON.stringify({
        name: 'Hacked Section',
        termId: 'term-audit',
        expectedCount: 50,
      }),
    });
    expect(secRes.status).toBe(403);

    // 3. Attempt to trigger timetable generation as student
    const genRes = await fetch(`${testServer.url}/api/generation/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'student',
        'x-user-id': 'stud-audit-1',
      },
      body: JSON.stringify({ termIds: ['term-audit'] }),
    });
    expect(genRes.status).toBe(403);
  });

  // --------------------------------------------------------------------------
  // Scenario F: Mid-Semester Student Transfer Date Boundary
  // --------------------------------------------------------------------------
  it('Scenario F: Student group transfer maintains historical integrity across date boundary (D27, D28)', async () => {
    const memberships = [
      {
        id: 'mem-audit-sec',
        studentId: 'stud-audit-1',
        groupType: 'section' as const,
        groupId: 'sec-audit-A',
        effectiveStartDate: '2026-09-01',
      },
      {
        id: 'mem-audit-a1',
        studentId: 'stud-audit-1',
        groupType: 'batch' as const,
        groupId: 'batch-audit-A1',
        effectiveStartDate: '2026-09-01',
        effectiveEndDate: '2026-09-07',
      },
      {
        id: 'mem-audit-a2',
        studentId: 'stud-audit-1',
        groupType: 'batch' as const,
        groupId: 'batch-audit-A2',
        effectiveStartDate: '2026-09-08',
      },
    ];

    const ctx = {
      batches: repo.getState().batches,
      studentMemberships: memberships,
      electiveAssignments: [],
    };

    // On 2026-09-05 (before transfer date 2026-09-08), student stud-audit-1 is in Batch A1
    const studentsA1Pre = getRepresentedStudents('batch', 'batch-audit-A1', ctx, '2026-09-05');
    const studentsA2Pre = getRepresentedStudents('batch', 'batch-audit-A2', ctx, '2026-09-05');
    expect(studentsA1Pre.has('stud-audit-1')).toBe(true);
    expect(studentsA2Pre.has('stud-audit-1')).toBe(false);

    // On 2026-09-10 (after transfer date 2026-09-08), student stud-audit-1 is in Batch A2
    const studentsA1Post = getRepresentedStudents('batch', 'batch-audit-A1', ctx, '2026-09-10');
    const studentsA2Post = getRepresentedStudents('batch', 'batch-audit-A2', ctx, '2026-09-10');
    expect(studentsA1Post.has('stud-audit-1')).toBe(false);
    expect(studentsA2Post.has('stud-audit-1')).toBe(true);
  });
});
