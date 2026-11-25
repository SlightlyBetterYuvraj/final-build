import { describe, it, expect, beforeEach } from 'vitest';
import { TimetableRepository } from '../src/data/repository.js';
import { ExtraClassService } from '../src/services/extraClassService.js';
import { AuthSession } from '../src/services/authService.js';

describe('Phase 4 & 5 — Concurrency Race Tests & Double-Booking Prevention', () => {
  let repo: TimetableRepository;
  let service: ExtraClassService;

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
    service = new ExtraClassService(repo);

    await repo.runTransaction(async (tx) => {
      // 1 Room available
      tx.rooms.set('r-only-one', {
        id: 'r-only-one',
        roomNumber: '101',
        building: 'Main',
        floor: 1,
        capacity: 50,
        roomType: 'LT',
        active: true,
      });

      // 2 Teachers
      tx.teachers.set('t-alice', {
        id: 't-alice',
        empId: 'EMP-A',
        name: 'Alice',
        email: 'alice@uni.edu',
        active: true,
      });
      tx.teachers.set('t-bob', {
        id: 't-bob',
        empId: 'EMP-B',
        name: 'Bob',
        email: 'bob@uni.edu',
        active: true,
      });

      // 2 Sections
      tx.sections.set('sec-A', {
        id: 'sec-A',
        termId: 'term-3',
        name: 'A',
        expectedCount: 30,
        active: true,
      });
      tx.sections.set('sec-B', {
        id: 'sec-B',
        termId: 'term-3',
        name: 'B',
        expectedCount: 30,
        active: true,
      });
    });
  });

  it('two simultaneous incompatible room bookings: exactly one succeeds, one fails (Section 5)', async () => {
    // Both Alice and Bob race to book the exact same room at the exact same time
    const bookingPromiseAlice = service.bookExtraClass(teacherAliceSession, {
      date: '2026-09-10',
      dayOfWeek: 4,
      startSlot: 2,
      activityType: 'L',
      courseOfferingId: 'co-alice',
      termId: 'term-3',
      roomId: 'r-only-one',
      targetType: 'section',
      targetId: 'sec-A',
    });

    const bookingPromiseBob = service.bookExtraClass(teacherBobSession, {
      date: '2026-09-10',
      dayOfWeek: 4,
      startSlot: 2,
      activityType: 'L',
      courseOfferingId: 'co-bob',
      termId: 'term-3',
      roomId: 'r-only-one',
      targetType: 'section',
      targetId: 'sec-B',
    });

    const results = await Promise.allSettled([bookingPromiseAlice, bookingPromiseBob]);

    const successes = results.filter((r) => r.status === 'fulfilled');
    const failures = results.filter((r) => r.status === 'rejected');

    // Concurrency guarantee: exactly one succeeds, exactly one fails!
    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);

    // Total extra class occurrences committed to repo must be exactly 1
    const occurrences = Array.from(repo.getState().classOccurrences.values());
    expect(occurrences.length).toBe(1);
  });

  it('two simultaneous extra-class bookings for overlapping student cohort: exactly one succeeds', async () => {
    // Add a second room so room is not the bottleneck
    await repo.runTransaction(async (tx) => {
      tx.rooms.set('r-second', {
        id: 'r-second',
        roomNumber: '102',
        building: 'Main',
        floor: 1,
        capacity: 50,
        roomType: 'LT',
        active: true,
      });
    });

    // Both Alice and Bob attempt to book different rooms at the same time for the SAME student cohort (Section A)
    const p1 = service.bookExtraClass(teacherAliceSession, {
      date: '2026-09-10',
      dayOfWeek: 4,
      startSlot: 3,
      activityType: 'L',
      courseOfferingId: 'co-1',
      termId: 'term-3',
      roomId: 'r-only-one',
      targetType: 'section',
      targetId: 'sec-A', // Section A
    });

    const p2 = service.bookExtraClass(teacherBobSession, {
      date: '2026-09-10',
      dayOfWeek: 4,
      startSlot: 3,
      activityType: 'L',
      courseOfferingId: 'co-2',
      termId: 'term-3',
      roomId: 'r-second',
      targetType: 'section',
      targetId: 'sec-A', // Same Section A!
    });

    const results = await Promise.allSettled([p1, p2]);
    const successes = results.filter((r) => r.status === 'fulfilled');
    const failures = results.filter((r) => r.status === 'rejected');

    // Exactly one student cohort booking succeeds
    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);
  });
});
