import { describe, it, expect, beforeEach } from 'vitest';
import { TimetableRepository } from '../src/data/repository.js';
import { ExtraClassService } from '../src/services/extraClassService.js';
import { RegularClassService } from '../src/services/regularClassService.js';
import { AuthSession } from '../src/services/authService.js';

describe('Phase 4 — Extra Classes, Slot Discovery & Teacher Unavailability', () => {
  let repo: TimetableRepository;
  let extraService: ExtraClassService;
  let regularService: RegularClassService;

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
    extraService = new ExtraClassService(repo);
    regularService = new RegularClassService(repo);

    await repo.runTransaction(async (tx) => {
      // Setup rooms
      tx.rooms.set('r-lt', {
        id: 'r-lt',
        roomNumber: '101',
        building: 'Main',
        floor: 1,
        capacity: 50,
        roomType: 'LT',
        active: true,
      });
      tx.rooms.set('r-p', {
        id: 'r-p',
        roomNumber: 'Lab-1',
        building: 'Main',
        floor: 2,
        capacity: 35,
        roomType: 'P',
        active: true,
      });

      // Setup teachers
      tx.teachers.set('t-alice', {
        id: 't-alice',
        empId: 'EMP-A',
        name: 'Dr. Alice',
        email: 'alice@uni.edu',
        active: true,
      });
      tx.teachers.set('t-bob', {
        id: 't-bob',
        empId: 'EMP-B',
        name: 'Dr. Bob',
        email: 'bob@uni.edu',
        active: true,
      });

      // Setup students
      tx.sections.set('sec-A', {
        id: 'sec-A',
        termId: 'term-3',
        name: 'A',
        expectedCount: 30,
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
    });
  });

  it('ranks cancellation-freed slots first in slot query without hiding other free slots (D03)', async () => {
    // Add a scheduled class on 2026-09-01 at slot 2, then cancel it
    await repo.runTransaction(async (tx) => {
      tx.classOccurrences.set('occ-cancelled-2', {
        id: 'occ-cancelled-2',
        versionId: 'v1',
        courseOfferingId: 'co-math',
        termId: 'term-3',
        date: '2026-09-01',
        dayOfWeek: 1,
        startSlot: 2,
        duration: 1,
        activityType: 'L',
        teacherId: 't-alice',
        roomId: 'r-lt',
        targetType: 'section',
        targetId: 'sec-A',
        status: 'cancelled', // Cancelled!
        cancellationReason: 'Sick leave',
      });
    });

    const slots = extraService.queryAvailableSlots({
      date: '2026-09-01',
      dayOfWeek: 1,
      activityType: 'L',
      teacherId: 't-alice',
      targetType: 'section',
      targetId: 'sec-A',
      expectedGroupSize: 30,
    });

    expect(slots.length).toBeGreaterThan(1);
    // Top ranked slot must be slot 2 (the cancellation-freed slot) (D03)
    expect(slots[0].slotIndex).toBe(2);
    expect(slots[0].isCancellationFreed).toBe(true);

    // Other non-cancelled valid free slots must also be present (not hidden)
    const otherFree = slots.find((s) => !s.isCancellationFreed);
    expect(otherFree).toBeDefined();
  });

  it('enforces room capability and ownership on extra class booking and cancellation (D20, D24, D25)', async () => {
    // Attempt to book a Lecture in a P lab venue -> must fail (D20)
    await expect(
      extraService.bookExtraClass(teacherAliceSession, {
        date: '2026-09-01',
        dayOfWeek: 1,
        startSlot: 1,
        activityType: 'L',
        courseOfferingId: 'co-extra',
        termId: 'term-3',
        roomId: 'r-p', // P venue for Lecture!
        targetType: 'section',
        targetId: 'sec-A',
      })
    ).rejects.toThrow('ERR_ROOM_TYPE_MISMATCH');

    // Book lecture in eligible LT room -> succeeds
    const bookedExtra = await extraService.bookExtraClass(teacherAliceSession, {
      date: '2026-09-01',
      dayOfWeek: 1,
      startSlot: 1,
      activityType: 'L',
      courseOfferingId: 'co-extra',
      termId: 'term-3',
      roomId: 'r-lt',
      targetType: 'section',
      targetId: 'sec-A',
    });

    expect(bookedExtra.isExtraClass).toBe(true);
    expect(bookedExtra.bookedByTeacherId).toBe('t-alice');

    // Recurring weekly timetable pattern must have NO new rows (D24)
    expect(repo.getState().scheduledClasses.size).toBe(0);

    // Bob attempts to cancel Alice's extra class -> must fail with ERR_FORBIDDEN (D25)
    await expect(
      extraService.cancelExtraClass(teacherBobSession, bookedExtra.id, 'Taking over')
    ).rejects.toThrow('ERR_FORBIDDEN');

    // Alice cancels her own extra class -> succeeds
    const cancelled = await extraService.cancelExtraClass(teacherAliceSession, bookedExtra.id, 'Rescheduled by Alice');
    expect(cancelled.status).toBe('cancelled');
  });

  it('handles teacher unavailability request workflow and affected occurrences (D29, D30)', async () => {
    // Populate an occurrence for Alice on 2026-09-15 at slot 2
    await repo.runTransaction(async (tx) => {
      tx.classOccurrences.set('occ-alice-sep15', {
        id: 'occ-alice-sep15',
        versionId: 'v1',
        courseOfferingId: 'co-math',
        termId: 'term-3',
        date: '2026-09-15',
        dayOfWeek: 2,
        startSlot: 2,
        duration: 1,
        activityType: 'L',
        teacherId: 't-alice',
        roomId: 'r-lt',
        targetType: 'section',
        targetId: 'sec-A',
        status: 'scheduled',
      });
    });

    // Alice submits unavailability request for 2026-09-15 slots 1–3
    const req = await extraService.submitUnavailabilityRequest(teacherAliceSession, {
      date: '2026-09-15',
      startSlot: 1,
      endSlot: 3,
      reason: 'Academic conference',
    });

    expect(req.status).toBe('pending');

    // Pending request is NOT confirmed absence yet; admin must confirm it (D30)
    const { request: confirmedReq, affectedOccurrences } =
      await extraService.confirmUnavailabilityRequest(adminSession, req.id);

    expect(confirmedReq.status).toBe('confirmed');
    // Enumerates affected class occurrence on that date/time (D29)
    expect(affectedOccurrences.length).toBe(1);
    expect(affectedOccurrences[0].id).toBe('occ-alice-sep15');
  });

  it('safely resolves dayOfWeek from date when dayOfWeek is undefined or NaN, preventing ERR_SLOT_OUT_OF_BOUNDS', async () => {
    // 2026-09-01 is Tuesday (dayOfWeek: 2)
    // 1. Query slots without providing dayOfWeek (or NaN)
    const slots = extraService.queryAvailableSlots({
      date: '2026-09-01',
      dayOfWeek: NaN as any,
      activityType: 'L',
      teacherId: 't-alice',
      targetType: 'section',
      targetId: 'sec-A',
    });
    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0].dayOfWeek).toBe(2);

    // 2. Book extra class with dayOfWeek omitted / NaN -> should resolve dayOfWeek = 2 and succeed
    const booked = await extraService.bookExtraClass(teacherAliceSession, {
      date: '2026-09-01',
      dayOfWeek: NaN as any,
      startSlot: 1,
      activityType: 'L',
      courseOfferingId: 'co-extra',
      termId: 'term-3',
      roomId: 'r-lt',
      targetType: 'section',
      targetId: 'sec-A',
    });
    expect(booked.dayOfWeek).toBe(2);
    expect(booked.date).toBe('2026-09-01');
    expect(booked.isExtraClass).toBe(true);
  });
});
