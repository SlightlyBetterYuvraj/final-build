import { describe, it, expect } from 'vitest';
import {
  Course,
  Room,
  Section,
  Batch,
  StudentGroupMembership,
  ElectiveAssignment,
  TimetableGridConfig,
  TeacherAvailability,
  TeacherUnavailabilityRequest,
  ScheduledClass,
  CourseOffering,
  validateCourseContactHours,
  expandRequiredSessions,
  validateRoomCompatibility,
  validateSlotAdjacency,
  validateCandidateSession,
  validateDraftTimetable,
  ValidationContext,
} from '../src/domain/index.js';

describe('Phase 1 — Academic Session Rules & Invariants', () => {
  const sampleGrid: TimetableGridConfig = {
    days: [1, 2, 3, 4, 5],
    slotsPerDay: 8,
    slots: [
      { dayOfWeek: 1, slotIndex: 1, startTime: '09:00', endTime: '10:00' },
      { dayOfWeek: 1, slotIndex: 2, startTime: '10:00', endTime: '11:00' },
      { dayOfWeek: 1, slotIndex: 3, startTime: '11:00', endTime: '12:00' },
      { dayOfWeek: 1, slotIndex: 4, startTime: '12:00', endTime: '13:00', isBreak: true }, // Lunch break
      { dayOfWeek: 1, slotIndex: 5, startTime: '13:00', endTime: '14:00' },
      { dayOfWeek: 1, slotIndex: 6, startTime: '14:00', endTime: '15:00' },
      { dayOfWeek: 1, slotIndex: 7, startTime: '15:00', endTime: '16:00' },
      { dayOfWeek: 1, slotIndex: 8, startTime: '16:00', endTime: '17:00' },
    ],
  };

  it('rejects odd practical contact-hour totals without silent rounding (D07/D44)', () => {
    const courseWithOddP: Course = {
      id: 'c-odd',
      code: 'CS301',
      name: 'Advanced Algorithms',
      termId: 'term-5',
      lectureHours: 3,
      tutorialHours: 1,
      practicalHours: 3, // Odd practical hours!
      requiredRoomType: 'LT',
    };

    const result = validateCourseContactHours(courseWithOddP);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'ERR_ODD_P_HOURS')).toBe(true);

    const { sessions, errors } = expandRequiredSessions(courseWithOddP);
    expect(sessions.length).toBe(0);
    expect(errors.some((e) => e.code === 'ERR_ODD_P_HOURS')).toBe(true);
  });

  it('expands even contact hours into L=1h, T=1h, P=2h consecutive blocks', () => {
    const validCourse: Course = {
      id: 'c-valid',
      code: 'CS201',
      name: 'Data Structures',
      termId: 'term-3',
      lectureHours: 3,
      tutorialHours: 1,
      practicalHours: 2,
      requiredRoomType: 'LT',
    };

    const { sessions, errors } = expandRequiredSessions(validCourse);
    expect(errors.length).toBe(0);
    // 3 Lectures (1 slot each), 1 Tutorial (1 slot each), 1 Lab (2 slots)
    expect(sessions.length).toBe(5);
    const labs = sessions.filter((s) => s.activityType === 'P');
    expect(labs.length).toBe(1);
    expect(labs[0].durationSlots).toBe(2);
  });

  it('validates room capability: L/T cannot be in P venue, P cannot be in LT venue', () => {
    const ltRoom: Room = {
      id: 'r-101',
      roomNumber: '101',
      building: 'Engineering Block',
      floor: 1,
      capacity: 60,
      roomType: 'LT',
      active: true,
    };

    const labRoom: Room = {
      id: 'r-lab1',
      roomNumber: 'Lab-A',
      building: 'CS Block',
      floor: 2,
      capacity: 35,
      roomType: 'P',
      active: true,
    };

    // Lecture in lab room should fail
    const lecInLab = validateRoomCompatibility('L', 30, labRoom);
    expect(lecInLab.valid).toBe(false);
    expect(lecInLab.errors[0].code).toBe('ERR_ROOM_TYPE_MISMATCH');

    // Lab in LT room should fail
    const labInLT = validateRoomCompatibility('P', 30, ltRoom);
    expect(labInLT.valid).toBe(false);
    expect(labInLT.errors[0].code).toBe('ERR_ROOM_TYPE_MISMATCH');

    // Matching room type succeeds
    expect(validateRoomCompatibility('L', 30, ltRoom).valid).toBe(true);
    expect(validateRoomCompatibility('P', 30, labRoom).valid).toBe(true);
  });

  it('validates room capacity against expected group size', () => {
    const smallRoom: Room = {
      id: 'r-small',
      roomNumber: '102',
      building: 'Main',
      floor: 1,
      capacity: 25,
      roomType: 'LT',
      active: true,
    };

    const result = validateRoomCompatibility('L', 40, smallRoom);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === 'ERR_ROOM_CAPACITY_INSUFFICIENT')).toBe(true);
  });

  it('rejects multi-slot lab crossing break period or operating grid bounds', () => {
    // Lab starting at slot 3 with duration 2 covers slots 3 and 4. Slot 4 is lunch break!
    const resCrossingBreak = validateSlotAdjacency('P', 1, 3, 2, sampleGrid);
    expect(resCrossingBreak.valid).toBe(false);
    expect(resCrossingBreak.errors.some((e) => e.code === 'ERR_SLOT_IS_BREAK')).toBe(true);

    // Lab starting at slot 8 with duration 2 extends beyond slot 8 (slot 9 does not exist)
    const resOutOfBounds = validateSlotAdjacency('P', 1, 8, 2, sampleGrid);
    expect(resOutOfBounds.valid).toBe(false);
    expect(resOutOfBounds.errors.some((e) => e.code === 'ERR_SLOT_OUT_OF_BOUNDS')).toBe(true);
  });
});

describe('Phase 1 — Conflict Detection & Cohort Overlap', () => {
  const grid: TimetableGridConfig = {
    days: [1, 2, 3, 4, 5],
    slotsPerDay: 8,
    slots: [
      { dayOfWeek: 1, slotIndex: 1, startTime: '09:00', endTime: '10:00' },
      { dayOfWeek: 1, slotIndex: 2, startTime: '10:00', endTime: '11:00' },
      { dayOfWeek: 1, slotIndex: 3, startTime: '11:00', endTime: '12:00' },
      { dayOfWeek: 1, slotIndex: 4, startTime: '12:00', endTime: '13:00' },
      { dayOfWeek: 1, slotIndex: 5, startTime: '13:00', endTime: '14:00' },
    ],
  };

  const room101: Room = {
    id: 'r-101',
    roomNumber: '101',
    building: 'Block A',
    floor: 1,
    capacity: 60,
    roomType: 'LT',
    active: true,
  };

  const room102: Room = {
    id: 'r-102',
    roomNumber: '102',
    building: 'Block A',
    floor: 1,
    capacity: 60,
    roomType: 'LT',
    active: true,
  };

  const batchA1: Batch = {
    id: 'batch-A1',
    sectionId: 'sec-A',
    name: 'A1',
    expectedCount: 30,
    active: true,
  };

  const batchA2: Batch = {
    id: 'batch-A2',
    sectionId: 'sec-A',
    name: 'A2',
    expectedCount: 30,
    active: true,
  };

  const baseContext: ValidationContext = {
    grid,
    rooms: new Map([
      ['r-101', room101],
      ['r-102', room102],
    ]),
    batches: new Map([
      ['batch-A1', batchA1],
      ['batch-A2', batchA2],
    ]),
    studentMemberships: [
      {
        id: 'm1',
        studentId: 'stud-1',
        groupId: 'batch-A1',
        groupType: 'batch',
        effectiveStartDate: '2026-08-01',
      },
      {
        id: 'm2',
        studentId: 'stud-2',
        groupId: 'batch-A2',
        groupType: 'batch',
        effectiveStartDate: '2026-08-01',
      },
    ],
    electiveAssignments: [],
    teacherAvailabilities: [],
    teacherAbsences: [],
  };

  it('rejects same teacher assigned to overlapping occurrences', () => {
    const existingClass: ScheduledClass = {
      id: 'sc-1',
      versionId: 'v1',
      courseOfferingId: 'co-1',
      termId: 'term-3',
      dayOfWeek: 1,
      startSlot: 1,
      duration: 1,
      activityType: 'L',
      teacherId: 'teach-Alice',
      roomId: 'r-101',
      targetType: 'section',
      targetId: 'sec-A',
      status: 'scheduled',
    };

    const candidate: ScheduledClass = {
      id: 'sc-2',
      versionId: 'v1',
      courseOfferingId: 'co-2',
      termId: 'term-5', // Different semester!
      dayOfWeek: 1,
      startSlot: 1,
      duration: 1,
      activityType: 'L',
      teacherId: 'teach-Alice', // Same teacher!
      roomId: 'r-102',
      targetType: 'section',
      targetId: 'sec-B',
      status: 'scheduled',
    };

    const res = validateCandidateSession(candidate, [existingClass], baseContext);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.code === 'ERR_TEACHER_CONFLICT')).toBe(true);
  });

  it('rejects same room assigned to overlapping occurrences across different semesters', () => {
    const existingClass: ScheduledClass = {
      id: 'sc-1',
      versionId: 'v1',
      courseOfferingId: 'co-1',
      termId: 'term-3',
      dayOfWeek: 1,
      startSlot: 2,
      duration: 1,
      activityType: 'L',
      teacherId: 'teach-Bob',
      roomId: 'r-101',
      targetType: 'section',
      targetId: 'sec-A',
      status: 'scheduled',
    };

    const candidate: ScheduledClass = {
      id: 'sc-2',
      versionId: 'v1',
      courseOfferingId: 'co-2',
      termId: 'term-7', // Cross semester
      dayOfWeek: 1,
      startSlot: 2,
      duration: 1,
      activityType: 'L',
      teacherId: 'teach-Charlie',
      roomId: 'r-101', // Same room!
      targetType: 'section',
      targetId: 'sec-C',
      status: 'scheduled',
    };

    const res = validateCandidateSession(candidate, [existingClass], baseContext);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.code === 'ERR_ROOM_CONFLICT')).toBe(true);
  });

  it('rejects simultaneous classes for whole section and one of its constituent sub-batches', () => {
    const sectionClass: ScheduledClass = {
      id: 'sc-sec',
      versionId: 'v1',
      courseOfferingId: 'co-1',
      termId: 'term-3',
      dayOfWeek: 1,
      startSlot: 3,
      duration: 1,
      activityType: 'L',
      teacherId: 'teach-Bob',
      roomId: 'r-101',
      targetType: 'section',
      targetId: 'sec-A',
      status: 'scheduled',
    };

    const batchClass: ScheduledClass = {
      id: 'sc-batch',
      versionId: 'v1',
      courseOfferingId: 'co-2',
      termId: 'term-3',
      dayOfWeek: 1,
      startSlot: 3,
      duration: 1,
      activityType: 'T',
      teacherId: 'teach-Charlie',
      roomId: 'r-102',
      targetType: 'batch',
      targetId: 'batch-A1', // Sub-batch of section A!
      status: 'scheduled',
    };

    const res = validateCandidateSession(batchClass, [sectionClass], baseContext);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.code === 'ERR_STUDENT_COHORT_CONFLICT')).toBe(true);
  });

  it('permits distinct sub-batches (A1 and A2) to run in parallel when resources and students are disjoint', () => {
    const a1Class: ScheduledClass = {
      id: 'sc-a1',
      versionId: 'v1',
      courseOfferingId: 'co-1',
      termId: 'term-3',
      dayOfWeek: 1,
      startSlot: 3,
      duration: 1,
      activityType: 'T',
      teacherId: 'teach-Bob',
      roomId: 'r-101',
      targetType: 'batch',
      targetId: 'batch-A1',
      status: 'scheduled',
    };

    const a2Class: ScheduledClass = {
      id: 'sc-a2',
      versionId: 'v1',
      courseOfferingId: 'co-2',
      termId: 'term-3',
      dayOfWeek: 1,
      startSlot: 3,
      duration: 1,
      activityType: 'T',
      teacherId: 'teach-Charlie',
      roomId: 'r-102',
      targetType: 'batch',
      targetId: 'batch-A2',
      status: 'scheduled',
    };

    const res = validateCandidateSession(a2Class, [a1Class], baseContext);
    expect(res.valid).toBe(true);
  });

  it('rejects elective classes if they share an actually assigned student', () => {
    const contextWithElectives: ValidationContext = {
      ...baseContext,
      electiveAssignments: [
        {
          id: 'ea1',
          studentId: 'stud-shared',
          electiveGroupId: 'elec-AI',
          assignedBy: 'admin',
          assignedAt: '2026-08-01',
          status: 'active',
        },
        {
          id: 'ea2',
          studentId: 'stud-shared', // Shared student!
          electiveGroupId: 'elec-Cyber',
          assignedBy: 'admin',
          assignedAt: '2026-08-01',
          status: 'active',
        },
      ],
    };

    const aiClass: ScheduledClass = {
      id: 'sc-ai',
      versionId: 'v1',
      courseOfferingId: 'co-ai',
      termId: 'term-5',
      dayOfWeek: 1,
      startSlot: 1,
      duration: 1,
      activityType: 'L',
      teacherId: 'teach-Bob',
      roomId: 'r-101',
      targetType: 'elective_group',
      targetId: 'elec-AI',
      status: 'scheduled',
    };

    const cyberClass: ScheduledClass = {
      id: 'sc-cyber',
      versionId: 'v1',
      courseOfferingId: 'co-cyber',
      termId: 'term-5',
      dayOfWeek: 1,
      startSlot: 1,
      duration: 1,
      activityType: 'L',
      teacherId: 'teach-Charlie',
      roomId: 'r-102',
      targetType: 'elective_group',
      targetId: 'elec-Cyber',
      status: 'scheduled',
    };

    const res = validateCandidateSession(cyberClass, [aiClass], contextWithElectives);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.code === 'ERR_STUDENT_COHORT_CONFLICT')).toBe(true);
  });

  it('confirmed teacher absence blocks scheduling, while unconfirmed/pending request does not', () => {
    const teacherUnavailPending: TeacherUnavailabilityRequest = {
      id: 'req-1',
      teacherId: 'teach-Alice',
      date: '2026-09-15',
      startSlot: 1,
      endSlot: 3,
      status: 'pending', // NOT confirmed!
      submittedAt: '2026-09-10',
    };

    const contextWithPending: ValidationContext = {
      ...baseContext,
      teacherAbsences: [teacherUnavailPending],
    };

    const candidate = {
      id: 'occ-1',
      termId: 'term-3',
      dayOfWeek: 1,
      date: '2026-09-15',
      startSlot: 1,
      duration: 1,
      activityType: 'L' as const,
      teacherId: 'teach-Alice',
      roomId: 'r-101',
      targetType: 'section' as const,
      targetId: 'sec-A',
    };

    // Pending request should NOT block scheduling (D30)
    const pendingRes = validateCandidateSession(candidate, [], contextWithPending);
    expect(pendingRes.valid).toBe(true);

    // Now confirm the request
    const contextWithConfirmed: ValidationContext = {
      ...baseContext,
      teacherAbsences: [{ ...teacherUnavailPending, status: 'confirmed' }],
    };

    const confirmedRes = validateCandidateSession(candidate, [], contextWithConfirmed);
    expect(confirmedRes.valid).toBe(false);
    expect(confirmedRes.errors.some((e) => e.code === 'ERR_TEACHER_CONFIRMED_ABSENCE')).toBe(true);
  });
});

describe('Phase 1 — Timetable Completeness & Draft Validation', () => {
  const grid: TimetableGridConfig = {
    days: [1, 2, 3, 4, 5],
    slotsPerDay: 8,
    slots: [
      { dayOfWeek: 1, slotIndex: 1, startTime: '09:00', endTime: '10:00' },
      { dayOfWeek: 1, slotIndex: 2, startTime: '10:00', endTime: '11:00' },
      { dayOfWeek: 1, slotIndex: 3, startTime: '11:00', endTime: '12:00' },
    ],
  };

  const roomLT: Room = {
    id: 'r-101',
    roomNumber: '101',
    building: 'A',
    floor: 1,
    capacity: 60,
    roomType: 'LT',
    active: true,
  };

  const course: Course = {
    id: 'c-1',
    code: 'MATH101',
    name: 'Calculus',
    termId: 'term-1',
    lectureHours: 2, // Requires 2 lectures
    tutorialHours: 0,
    practicalHours: 0,
    requiredRoomType: 'LT',
  };

  const offering: CourseOffering = {
    id: 'co-math',
    courseId: 'c-1',
    termId: 'term-1',
    teacherId: 't-1',
    targetType: 'section',
    targetId: 'sec-A',
  };

  const ctx: ValidationContext = {
    grid,
    rooms: new Map([['r-101', roomLT]]),
    batches: new Map(),
    studentMemberships: [],
    electiveAssignments: [],
    teacherAvailabilities: [],
    teacherAbsences: [],
  };

  it('rejects a draft with missing required sessions (completeness violation)', () => {
    // Only 1 lecture scheduled, but 2 required!
    const draft = {
      termIds: ['term-1'],
      classes: [
        {
          id: 'sc-1',
          versionId: 'draft-v1',
          courseOfferingId: 'co-math',
          termId: 'term-1',
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

    const res = validateDraftTimetable(
      draft,
      new Map([['c-1', course]]),
      new Map([['co-math', offering]]),
      ctx
    );

    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.code === 'ERR_INCOMPLETE_SESSIONS')).toBe(true);
  });

  it('rejects a draft with ERR_REQUIRED_SESSION_MISSING when a required offering has 0 scheduled classes', () => {
    const draft = {
      termIds: ['term-1'],
      classes: [
        {
          id: 'sc-other',
          versionId: 'draft-v1',
          courseOfferingId: 'co-other',
          termId: 'term-1',
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

    const courseOther: Course = {
      id: 'c-other',
      code: 'PHY101',
      name: 'Physics',
      termId: 'term-1',
      lectureHours: 1,
      tutorialHours: 0,
      practicalHours: 0,
      requiredRoomType: 'LT',
    };
    const offeringOther: CourseOffering = {
      id: 'co-other',
      courseId: 'c-other',
      termId: 'term-1',
      teacherId: 't-1',
      targetType: 'section',
      targetId: 'sec-A',
    };

    const res = validateDraftTimetable(
      draft,
      new Map([['c-1', course], ['c-other', courseOther]]),
      new Map([['co-math', offering], ['co-other', offeringOther]]),
      ctx
    );

    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.code === 'ERR_REQUIRED_SESSION_MISSING')).toBe(true);
  });

  it('accepts a draft when all required sessions are present and constraint-free', () => {
    // 2 lectures scheduled at different non-overlapping slots
    const draft = {
      termIds: ['term-1'],
      classes: [
        {
          id: 'sc-1',
          versionId: 'draft-v1',
          courseOfferingId: 'co-math',
          termId: 'term-1',
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
        {
          id: 'sc-2',
          versionId: 'draft-v1',
          courseOfferingId: 'co-math',
          termId: 'term-1',
          dayOfWeek: 1,
          startSlot: 2,
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

    const res = validateDraftTimetable(
      draft,
      new Map([['c-1', course]]),
      new Map([['co-math', offering]]),
      ctx
    );

    expect(res.valid).toBe(true);
    expect(res.errors.length).toBe(0);
  });
});
