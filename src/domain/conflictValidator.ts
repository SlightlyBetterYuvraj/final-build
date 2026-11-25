/**
 * Routine conflict validation and cohort intersection logic.
 * Source of truth: docs/04_SCHEDULING_DOMAIN_RULES.md (Section 3) and docs/07_ACCEPTANCE_AND_REGRESSION_TESTS.md (Section 3)
 */

import {
  ActivityType,
  Batch,
  ClassOccurrence,
  ElectiveAssignment,
  Room,
  ScheduledClass,
  StudentGroupMembership,
  TargetGroupType,
  TeacherAvailability,
  TeacherUnavailabilityRequest,
  TimetableGridConfig,
  ValidationErrorDetail,
  ValidationResult,
} from './types.js';
import { validateRoomCompatibility, validateSlotAdjacency } from './sessionRules.js';

export interface SchedulableItem {
  id?: string;
  termId: string;
  dayOfWeek: number;
  date?: string; // YYYY-MM-DD for dated occurrences
  startSlot: number;
  duration: number;
  activityType: ActivityType;
  teacherId: string;
  roomId: string;
  targetType: TargetGroupType;
  targetId: string;
  expectedGroupSize?: number;
}

export interface ValidationContext {
  grid: TimetableGridConfig;
  rooms: Map<string, Room>;
  batches: Map<string, Batch>; // batchId -> Batch (contains sectionId)
  studentMemberships: StudentGroupMembership[];
  electiveAssignments: ElectiveAssignment[];
  teacherAvailabilities: TeacherAvailability[];
  teacherAbsences: TeacherUnavailabilityRequest[]; // confirmed or pending
}

/**
 * Checks if two time intervals on the same day/date overlap.
 */
export function timeIntervalsOverlap(
  start1: number,
  duration1: number,
  start2: number,
  duration2: number
): boolean {
  const end1 = start1 + duration1;
  const end2 = start2 + duration2;
  return Math.max(start1, start2) < Math.min(end1, end2);
}

/**
 * Determines whether two target cohorts intersect based on hierarchical section/batch
 * membership or shared represented students.
 */
export function cohortsOverlap(
  targetType1: TargetGroupType,
  targetId1: string,
  targetType2: TargetGroupType,
  targetId2: string,
  ctx: Pick<ValidationContext, 'batches' | 'studentMemberships' | 'electiveAssignments'>,
  date?: string
): { overlaps: boolean; reason?: string } {
  // Case 1: Identical group target
  if (targetType1 === targetType2 && targetId1 === targetId2) {
    return {
      overlaps: true,
      reason: `Both sessions target the same ${targetType1} (${targetId1}).`,
    };
  }

  // Case 2: Whole section vs constituent batch
  // A session for Section A conflicts with a simultaneous session for Batch A1
  if (targetType1 === 'section' && targetType2 === 'batch') {
    const batch = ctx.batches.get(targetId2);
    if (batch && batch.sectionId === targetId1) {
      return {
        overlaps: true,
        reason: `Section ${targetId1} contains constituent batch ${batch.name} (${targetId2}).`,
      };
    }
  }
  if (targetType1 === 'batch' && targetType2 === 'section') {
    const batch = ctx.batches.get(targetId1);
    if (batch && batch.sectionId === targetId2) {
      return {
        overlaps: true,
        reason: `Constituent batch ${batch.name} (${targetId1}) is included in section ${targetId2}.`,
      };
    }
  }

  // Case 3: Distinct sub-batches of the same or different sections (e.g. A1 vs A2)
  // By rule: distinct sub-batches may run concurrently ONLY if no actual student conflict exists.
  // We check actual represented students below.

  // Case 4: Resolve actual represented students for both targets
  const students1 = getRepresentedStudents(targetType1, targetId1, ctx, date);
  const students2 = getRepresentedStudents(targetType2, targetId2, ctx, date);

  if (students1.size > 0 && students2.size > 0) {
    for (const studentId of students1) {
      if (students2.has(studentId)) {
        return {
          overlaps: true,
          reason: `Student ${studentId} is enrolled/represented in both cohorts (${targetType1} ${targetId1} and ${targetType2} ${targetId2}).`,
        };
      }
    }
  }

  return { overlaps: false };
}

/**
 * Resolves the set of student IDs represented by a target group at a given date.
 */
export function getRepresentedStudents(
  targetType: TargetGroupType,
  targetId: string,
  ctx: Pick<ValidationContext, 'batches' | 'studentMemberships' | 'electiveAssignments'>,
  date?: string
): Set<string> {
  const result = new Set<string>();

  if (targetType === 'elective_group') {
    // Check elective assignments
    for (const ea of ctx.electiveAssignments) {
      if (ea.electiveGroupId === targetId && ea.status === 'active') {
        result.add(ea.studentId);
      }
    }
    return result;
  }

  // For section or batch, check student group memberships with effective dates
  for (const m of ctx.studentMemberships) {
    if (m.groupId === targetId) {
      if (date) {
        if (m.effectiveStartDate <= date && (!m.effectiveEndDate || date < m.effectiveEndDate)) {
          result.add(m.studentId);
        }
      } else {
        // Without specific date, ongoing membership
        if (!m.effectiveEndDate) {
          result.add(m.studentId);
        }
      }
    }
  }

  // If target is section, also include students directly in any of its constituent batches
  if (targetType === 'section') {
    for (const [batchId, batch] of ctx.batches.entries()) {
      if (batch.sectionId === targetId) {
        const batchStudents = getRepresentedStudents('batch', batchId, ctx, date);
        for (const s of batchStudents) {
          result.add(s);
        }
      }
    }
  }

  return result;
}

/**
 * Validates a proposed class (recurring or dated occurrence) against all scheduling rules
 * and against existing active classes.
 */
export function validateCandidateSession(
  candidate: SchedulableItem,
  existingClasses: (ScheduledClass | ClassOccurrence)[],
  ctx: ValidationContext
): ValidationResult {
  const errors: ValidationErrorDetail[] = [];

  // 1. Grid adjacency and bounds
  const slotAdjacencyRes = validateSlotAdjacency(
    candidate.activityType,
    candidate.dayOfWeek,
    candidate.startSlot,
    candidate.duration,
    ctx.grid
  );
  if (!slotAdjacencyRes.valid) {
    errors.push(...slotAdjacencyRes.errors);
  }

  // 2. Room compatibility & capacity
  const room = ctx.rooms.get(candidate.roomId);
  if (!room) {
    errors.push({
      code: 'ERR_ROOM_NOT_FOUND',
      message: `Room ID ${candidate.roomId} was not found.`,
      entityId: candidate.roomId,
    });
  } else {
    const represented = getRepresentedStudents(
      candidate.targetType,
      candidate.targetId,
      ctx,
      candidate.date
    );
    const groupSize = candidate.expectedGroupSize ?? (represented.size > 0 ? represented.size : 30);
    const roomCompatRes = validateRoomCompatibility(
      candidate.activityType,
      groupSize,
      room
    );
    if (!roomCompatRes.valid) {
      errors.push(...roomCompatRes.errors);
    }
  }

  // 3. Teacher weekly regular availability
  for (let offset = 0; offset < candidate.duration; offset++) {
    const slotIdx = candidate.startSlot + offset;
    const availRecord = ctx.teacherAvailabilities.find(
      (a) =>
        a.teacherId === candidate.teacherId &&
        a.dayOfWeek === candidate.dayOfWeek &&
        a.slotIndex === slotIdx
    );
    if (availRecord && !availRecord.isAvailable) {
      errors.push({
        code: 'ERR_TEACHER_UNAVAILABLE',
        message: `Teacher ${candidate.teacherId} is marked unavailable on day ${candidate.dayOfWeek} at slot ${slotIdx}.`,
        entityId: candidate.teacherId,
        slot: slotIdx,
        dayOfWeek: candidate.dayOfWeek,
      });
    }
  }

  // 4. Confirmed teacher absence requests (dated exceptions)
  if (candidate.date) {
    const confirmedAbsences = ctx.teacherAbsences.filter(
      (req) =>
        req.teacherId === candidate.teacherId &&
        req.date === candidate.date &&
        req.status === 'confirmed' // D30: unconfirmed request is NOT active absence
    );

    for (const absence of confirmedAbsences) {
      if (
        timeIntervalsOverlap(
          candidate.startSlot,
          candidate.duration,
          absence.startSlot,
          absence.endSlot - absence.startSlot + 1
        )
      ) {
        errors.push({
          code: 'ERR_TEACHER_CONFIRMED_ABSENCE',
          message: `Teacher ${candidate.teacherId} has confirmed absence on ${candidate.date} during slots ${absence.startSlot}–${absence.endSlot}.`,
          entityId: candidate.teacherId,
          date: candidate.date,
        });
      }
    }
  }

  // 5. Conflicts with existing active classes
  for (const existing of existingClasses) {
    // Skip if comparing candidate to itself (e.g. during reschedule)
    if (candidate.id && existing.id === candidate.id) {
      continue;
    }

    // Skip cancelled or superseded classes (cancelled/superseded occurrences do not occupy time/resources)
    if ('status' in existing && (existing.status === 'cancelled' || existing.status === 'superseded')) {
      continue;
    }

    // Must match day or exact date
    const sameTiming = candidate.date
      ? 'date' in existing && existing.date === candidate.date
      : existing.dayOfWeek === candidate.dayOfWeek;

    if (!sameTiming) {
      continue;
    }

    // Check time interval overlap
    if (
      !timeIntervalsOverlap(
        candidate.startSlot,
        candidate.duration,
        existing.startSlot,
        existing.duration
      )
    ) {
      continue;
    }

    // A. Teacher conflict (across all semesters)
    if (candidate.teacherId === existing.teacherId) {
      errors.push({
        code: 'ERR_TEACHER_CONFLICT',
        message: `Teacher ${candidate.teacherId} is already scheduled in class ${existing.id} at slot ${existing.startSlot}.`,
        entityId: candidate.teacherId,
        conflictingEntityId: existing.id,
        slot: candidate.startSlot,
        dayOfWeek: candidate.dayOfWeek,
        date: candidate.date,
      });
    }

    // B. Room conflict (across all semesters)
    if (candidate.roomId === existing.roomId) {
      errors.push({
        code: 'ERR_ROOM_CONFLICT',
        message: `Room ${candidate.roomId} is already booked for class ${existing.id} at slot ${existing.startSlot}.`,
        entityId: candidate.roomId,
        conflictingEntityId: existing.id,
        slot: candidate.startSlot,
        dayOfWeek: candidate.dayOfWeek,
        date: candidate.date,
      });
    }

    // C. Student / Cohort conflict (section vs batch vs elective)
    const cohortCheck = cohortsOverlap(
      candidate.targetType,
      candidate.targetId,
      existing.targetType,
      existing.targetId,
      ctx,
      candidate.date
    );
    if (cohortCheck.overlaps) {
      errors.push({
        code: 'ERR_STUDENT_COHORT_CONFLICT',
        message: `Student cohort overlap: ${cohortCheck.reason} Conflicting with class ${existing.id}.`,
        conflictingEntityId: existing.id,
        slot: candidate.startSlot,
        dayOfWeek: candidate.dayOfWeek,
        date: candidate.date,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
