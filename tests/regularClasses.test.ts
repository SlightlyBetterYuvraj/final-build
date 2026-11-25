import { describe, it, expect, beforeEach } from 'vitest';
import { TimetableRepository } from '../src/data/repository.js';
import { RegularClassService } from '../src/services/regularClassService.js';
import { AuthSession } from '../src/services/authService.js';
import { ClassOccurrence, ScheduledClass, Room, Teacher, Section } from '../src/domain/types.js';

describe('Phase 3 — Regular Class Operations (Cancellation & Atomic Reschedule)', () => {
  let repo: TimetableRepository;
  let service: RegularClassService;

  const adminSession: AuthSession = {
    userId: 'admin-1',
    email: 'admin@uni.edu',
    role: 'admin',
  };

  const teacherAliceSession: AuthSession = {
    userId: 'user-alice',
    email: 'alice@uni.edu',
    role: 'teacher',
    linkedId: 't-alice',
  };

  const teacherBobSession: AuthSession = {
    userId: 'user-bob',
    email: 'bob@uni.edu',
    role: 'teacher',
    linkedId: 't-bob',
  };

  beforeEach(async () => {
    repo = new TimetableRepository();
    service = new RegularClassService(repo);

    await repo.runTransaction(async (tx) => {
      // Setup rooms
      tx.rooms.set('r-101', {
        id: 'r-101',
        roomNumber: '101',
        building: 'Block A',
        floor: 1,
        capacity: 60,
        roomType: 'LT',
        active: true,
      });
      tx.rooms.set('r-102', {
        id: 'r-102',
        roomNumber: '102',
        building: 'Block A',
        floor: 1,
        capacity: 60,
        roomType: 'LT',
        active: true,
      });

      // Setup teachers
      tx.teachers.set('t-alice', {
        id: 't-alice',
        empId: 'EMP-ALICE',
        name: 'Dr. Alice',
        email: 'alice@uni.edu',
        active: true,
      });
      tx.teachers.set('t-bob', {
        id: 't-bob',
        empId: 'EMP-BOB',
        name: 'Dr. Bob',
        email: 'bob@uni.edu',
        active: true,
      });

      // Setup section and students
      tx.sections.set('sec-A', {
        id: 'sec-A',
        termId: 'term-3',
        name: 'A',
        expectedCount: 40,
        active: true,
      });
      tx.students.set('stud-1', {
        id: 'stud-1',
        rollNumber: 'R101',
        name: 'John Doe',
        email: 'john@uni.edu',
        active: true,
      });
      tx.studentGroupMemberships.set('sgm-1', {
        id: 'sgm-1',
        studentId: 'stud-1',
        groupId: 'sec-A',
        groupType: 'section',
        effectiveStartDate: '2026-08-01',
      });

      // Setup recurring class
      tx.scheduledClasses.set('sc-weekly-1', {
        id: 'sc-weekly-1',
        versionId: 'v-pub',
        courseOfferingId: 'co-1',
        termId: 'term-3',
        dayOfWeek: 1,
        startSlot: 1,
        duration: 1,
        activityType: 'L',
        teacherId: 't-alice',
        roomId: 'r-101',
        targetType: 'section',
        targetId: 'sec-A',
        status: 'scheduled',
      });

      // Setup dated occurrences for two consecutive Mondays
      tx.classOccurrences.set('occ-date-1', {
        id: 'occ-date-1',
        versionId: 'v-pub',
        recurringClassId: 'sc-weekly-1',
        courseOfferingId: 'co-1',
        termId: 'term-3',
        date: '2026-09-01',
        dayOfWeek: 1,
        startSlot: 1,
        duration: 1,
        activityType: 'L',
        teacherId: 't-alice',
        roomId: 'r-101',
        targetType: 'section',
        targetId: 'sec-A',
        status: 'scheduled',
      });

      tx.classOccurrences.set('occ-date-2', {
        id: 'occ-date-2',
        versionId: 'v-pub',
        recurringClassId: 'sc-weekly-1',
        courseOfferingId: 'co-1',
        termId: 'term-3',
        date: '2026-09-08',
        dayOfWeek: 1,
        startSlot: 1,
        duration: 1,
        activityType: 'L',
        teacherId: 't-alice',
        roomId: 'r-101',
        targetType: 'section',
        targetId: 'sec-A',
        status: 'scheduled',
      });
    });
  });

  it('allows assigned teacher to cancel their occurrence while preserving recurring template and other dates (D01, D23)', async () => {
    // Teacher Bob cannot cancel Alice's class (D23)
    await expect(
      service.cancelOccurrence(teacherBobSession, 'occ-date-1', 'Sick leave')
    ).rejects.toThrow('ERR_FORBIDDEN');

    // Alice cancels her occurrence on 2026-09-01
    const result = await service.cancelOccurrence(teacherAliceSession, 'occ-date-1', 'Doctor appointment');
    expect(result.status).toBe('cancelled');
    expect(result.cancellationReason).toBe('Doctor appointment');

    const state = repo.getState();
    // Recurring class is completely unchanged (D01)
    expect(state.scheduledClasses.get('sc-weekly-1')?.status).toBe('scheduled');
    // Occurrence on 2026-09-08 is still scheduled (D01)
    expect(state.classOccurrences.get('occ-date-2')?.status).toBe('scheduled');

    // Notification created for student
    const notices = state.notificationOutbox.filter((n) => n.recipientStudentId === 'stud-1');
    expect(notices.length).toBe(1);
    expect(notices[0].eventType).toBe('CLASS_CANCELLED');
    expect(notices[0].message).toContain('Doctor appointment');
  });

  it('reschedules occurrence atomically; move succeeds or old booking remains completely intact (D04)', async () => {
    // Populate an existing conflicting class in Room 101 at slot 3
    await repo.runTransaction(async (tx) => {
      tx.classOccurrences.set('occ-conflict', {
        id: 'occ-conflict',
        versionId: 'v-pub',
        courseOfferingId: 'co-other',
        termId: 'term-3',
        date: '2026-09-01',
        dayOfWeek: 1,
        startSlot: 3,
        duration: 1,
        activityType: 'L',
        teacherId: 't-bob',
        roomId: 'r-101', // Room 101 occupied at slot 3!
        targetType: 'section',
        targetId: 'sec-B',
        status: 'scheduled',
      });
    });

    // Attempt to reschedule Alice's class to the conflicting slot 3 in Room 101
    await expect(
      service.rescheduleOccurrence(teacherAliceSession, 'occ-date-1', {
        date: '2026-09-01',
        dayOfWeek: 1,
        startSlot: 3,
        roomId: 'r-101',
      })
    ).rejects.toThrow('ERR_ROOM_CONFLICT');

    // Invariant: Alice's class on 2026-09-01 remains at slot 1, completely unchanged!
    const occAfterFailedReschedule = repo.getState().classOccurrences.get('occ-date-1')!;
    expect(occAfterFailedReschedule.startSlot).toBe(1);
    expect(occAfterFailedReschedule.roomId).toBe('r-101');
    expect(occAfterFailedReschedule.status).toBe('scheduled');

    // Now reschedule to a free room (Room 102) at slot 3 -> should succeed!
    const successRes = await service.rescheduleOccurrence(teacherAliceSession, 'occ-date-1', {
      date: '2026-09-01',
      dayOfWeek: 1,
      startSlot: 3,
      roomId: 'r-102',
    });

    expect(successRes.startSlot).toBe(3);
    expect(successRes.roomId).toBe('r-102');

    // Verify notification was dispatched post-commit
    const notices = repo.getState().notificationOutbox.filter((n) => n.recipientStudentId === 'stud-1');
    expect(notices.some((n) => n.eventType === 'CLASS_RESCHEDULED')).toBe(true);
  });
});
