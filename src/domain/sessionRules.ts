/**
 * Session duration, room compatibility, and grid adjacency rules.
 * Reference: docs/04_SCHEDULING_DOMAIN_RULES.md (Sections 2 and 5)
 */

import {
  ActivityType,
  Course,
  Room,
  TimeSlot,
  TimetableGridConfig,
  ValidationResult,
  ValidationErrorDetail,
} from './types.js';

export interface RequiredSession {
  courseId: string;
  activityType: ActivityType;
  durationSlots: number;
  sessionIndex: number; // 1-based index among sessions of this type
}

/**
 * Validates course contact hours according to academic scheduling rules.
 * Odd practical contact-hour totals are explicitly prohibited from being silently rounded.
 */
export function validateCourseContactHours(course: Course): ValidationResult {
  const errors: ValidationErrorDetail[] = [];

  if (course.lectureHours < 0 || course.tutorialHours < 0 || course.practicalHours < 0) {
    errors.push({
      code: 'ERR_NEGATIVE_HOURS',
      message: `Course ${course.code} has negative contact hours`,
      entityId: course.id,
    });
  }

  // Non-negotiable product rule D07/D44: odd practical-hour totals are unresolved.
  // Do not round or convert; flag as invalid/unconfigured.
  if (course.practicalHours % 2 !== 0) {
    errors.push({
      code: 'ERR_ODD_P_HOURS',
      message: `Course ${course.code} has odd practical contact hours (${course.practicalHours}). Lab sessions require 2-hour blocks and cannot be scheduled without explicit university policy.`,
      entityId: course.id,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Decomposes a course's weekly L/T/P contact hours into discrete required sessions.
 */
export function expandRequiredSessions(course: Course): {
  sessions: RequiredSession[];
  errors: ValidationErrorDetail[];
} {
  const validation = validateCourseContactHours(course);
  if (!validation.valid) {
    return { sessions: [], errors: validation.errors };
  }

  const sessions: RequiredSession[] = [];

  // L: each 1-hour contact hour becomes 1 session of duration 1
  for (let i = 1; i <= course.lectureHours; i++) {
    sessions.push({
      courseId: course.id,
      activityType: 'L',
      durationSlots: 1,
      sessionIndex: i,
    });
  }

  // T: each 1-hour contact hour becomes 1 session of duration 1
  for (let i = 1; i <= course.tutorialHours; i++) {
    sessions.push({
      courseId: course.id,
      activityType: 'T',
      durationSlots: 1,
      sessionIndex: i,
    });
  }

  // P: each 2 contact hours become 1 session of duration 2
  const labSessionCount = course.practicalHours / 2;
  for (let i = 1; i <= labSessionCount; i++) {
    sessions.push({
      courseId: course.id,
      activityType: 'P',
      durationSlots: 2,
      sessionIndex: i,
    });
  }

  return { sessions, errors: [] };
}

/**
 * Validates room capability and capacity for a scheduled class or extra class.
 */
export function validateRoomCompatibility(
  activityType: ActivityType,
  expectedGroupSize: number,
  room: Room
): ValidationResult {
  const errors: ValidationErrorDetail[] = [];

  if (!room.active) {
    errors.push({
      code: 'ERR_ROOM_INACTIVE',
      message: `Room ${room.roomNumber} is inactive.`,
      entityId: room.id,
    });
  }

  // Room type validation: L/T requires LT, P requires P
  if (activityType === 'P' && room.roomType !== 'P') {
    errors.push({
      code: 'ERR_ROOM_TYPE_MISMATCH',
      message: `Practical session (lab) cannot be scheduled in non-P venue ${room.roomNumber} (${room.roomType}).`,
      entityId: room.id,
    });
  } else if ((activityType === 'L' || activityType === 'T') && room.roomType !== 'LT') {
    errors.push({
      code: 'ERR_ROOM_TYPE_MISMATCH',
      message: `${activityType === 'L' ? 'Lecture' : 'Tutorial'} cannot be scheduled in lab venue ${room.roomNumber} (${room.roomType}).`,
      entityId: room.id,
    });
  }

  // Room capacity validation
  if (room.capacity < expectedGroupSize) {
    errors.push({
      code: 'ERR_ROOM_CAPACITY_INSUFFICIENT',
      message: `Room ${room.roomNumber} capacity (${room.capacity}) is smaller than expected group size (${expectedGroupSize}).`,
      entityId: room.id,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates that a session's slot range adheres to grid boundaries,
 * does not cross breaks, and that lab sessions occupy 2 strictly adjacent slots.
 */
export function validateSlotAdjacency(
  activityType: ActivityType,
  dayOfWeek: number,
  startSlot: number,
  duration: number,
  grid: TimetableGridConfig
): ValidationResult {
  const errors: ValidationErrorDetail[] = [];

  // Duration must match activity type
  const expectedDuration = activityType === 'P' ? 2 : 1;
  if (duration !== expectedDuration) {
    errors.push({
      code: 'ERR_INVALID_DURATION',
      message: `Activity ${activityType} expected duration of ${expectedDuration} slot(s), got ${duration}.`,
      slot: startSlot,
      dayOfWeek,
    });
  }

  // Check each occupied slot
  for (let offset = 0; offset < duration; offset++) {
    const slotIdx = startSlot + offset;
    const slotDef = grid.slots.find(
      (s) => s.dayOfWeek === dayOfWeek && s.slotIndex === slotIdx
    );

    if (!slotDef) {
      errors.push({
        code: 'ERR_SLOT_OUT_OF_BOUNDS',
        message: `Slot ${slotIdx} on day ${dayOfWeek} is outside configured operating periods.`,
        slot: slotIdx,
        dayOfWeek,
      });
      continue;
    }

    if (slotDef.isBreak) {
      errors.push({
        code: 'ERR_SLOT_IS_BREAK',
        message: `Slot ${slotIdx} on day ${dayOfWeek} is marked as a break/non-teaching period.`,
        slot: slotIdx,
        dayOfWeek,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
