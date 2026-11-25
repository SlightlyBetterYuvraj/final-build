/**
 * Timetable completeness and draft validation.
 * Verifies that all required sessions for every course offering are scheduled
 * and that all scheduled classes within the draft satisfy mandatory constraints.
 * Reference: docs/04_SCHEDULING_DOMAIN_RULES.md, docs/06_API_AND_WORKFLOWS.md
 */

import {
  Course,
  CourseOffering,
  ScheduledClass,
  ValidationErrorDetail,
  ValidationResult,
} from './types.js';
import { expandRequiredSessions } from './sessionRules.js';
import { validateCandidateSession, ValidationContext } from './conflictValidator.js';

export interface DraftTimetablePackage {
  termIds: string[];
  classes: ScheduledClass[];
  expectedOfferingIds?: string[];
}

/**
 * Validates the completeness and constraint satisfaction of an entire draft timetable.
 */
export function validateDraftTimetable(
  draft: DraftTimetablePackage,
  courses: Map<string, Course>,
  courseOfferings: Map<string, CourseOffering>,
  ctx: ValidationContext
): ValidationResult {
  const errors: ValidationErrorDetail[] = [];

  // 2. Count scheduled sessions by offering and target cohort in the draft
  const scheduledCountByOffering = new Map<string, Map<string, number>>();
  const scheduledCountByOfferingTarget = new Map<string, Map<string, Map<string, number>>>();
  for (const cls of draft.classes) {
    if (!scheduledCountByOffering.has(cls.courseOfferingId)) {
      scheduledCountByOffering.set(cls.courseOfferingId, new Map());
      scheduledCountByOfferingTarget.set(cls.courseOfferingId, new Map());
    }
    const typeMap = scheduledCountByOffering.get(cls.courseOfferingId)!;
    typeMap.set(cls.activityType, (typeMap.get(cls.activityType) || 0) + 1);

    const targetMap = scheduledCountByOfferingTarget.get(cls.courseOfferingId)!;
    if (!targetMap.has(cls.targetId)) {
      targetMap.set(cls.targetId, new Map());
    }
    const targetTypeMap = targetMap.get(cls.targetId)!;
    targetTypeMap.set(cls.activityType, (targetTypeMap.get(cls.activityType) || 0) + 1);
  }

  // 1. Validate contact hours for all courses and collect required sessions per offering
  const requiredSessionsByOffering = new Map<
    string,
    { activityType: string; count: number }[]
  >();

  const allowedOfferingIds = draft.expectedOfferingIds && draft.expectedOfferingIds.length > 0
    ? new Set(draft.expectedOfferingIds)
    : null;

  for (const offering of courseOfferings.values()) {
    if (!draft.termIds.includes(offering.termId)) {
      continue;
    }
    if (allowedOfferingIds && !allowedOfferingIds.has(offering.id)) {
      continue;
    }

    const course = courses.get(offering.courseId);
    if (!course) {
      errors.push({
        code: 'ERR_COURSE_NOT_FOUND',
        message: `Course ${offering.courseId} for offering ${offering.id} not found.`,
        entityId: offering.id,
      });
      continue;
    }

    const { sessions, errors: expandErrors } = expandRequiredSessions(course);
    if (expandErrors.length > 0) {
      errors.push(...expandErrors);
      continue;
    }

    // Aggregate required sessions by type (filtered by offering component if specified)
    const counts = new Map<string, number>();
    for (const s of sessions) {
      if (!offering.component || offering.component === s.activityType) {
        counts.set(s.activityType, (counts.get(s.activityType) || 0) + 1);
      }
    }

    const reqList: { activityType: string; count: number }[] = [];
    for (const [type, count] of counts.entries()) {
      reqList.push({ activityType: type, count });
    }
    requiredSessionsByOffering.set(offering.id, reqList);
  }

  // 3. Verify completeness: each offering must have exact scheduled count matching required count
  for (const [offeringId, requiredList] of requiredSessionsByOffering.entries()) {
    const scheduledMap = scheduledCountByOffering.get(offeringId) || new Map();
    const targetMap = scheduledCountByOfferingTarget.get(offeringId) || new Map();

    for (const req of requiredList) {
      const scheduledCount = scheduledMap.get(req.activityType) || 0;
      if (scheduledCount === 0) {
        errors.push({
          code: 'ERR_REQUIRED_SESSION_MISSING',
          message: `Offering ${offeringId} is missing required ${req.activityType} sessions. Scheduled: 0, Required: ${req.count}.`,
          entityId: offeringId,
        });
      } else if (scheduledCount < req.count) {
        errors.push({
          code: 'ERR_INCOMPLETE_SESSIONS',
          message: `Offering ${offeringId} is missing required ${req.activityType} sessions. Scheduled: ${scheduledCount}, Required: ${req.count}.`,
          entityId: offeringId,
        });
      } else if (scheduledCount > req.count) {
        // Check if this is a practical lab scheduled once for each distinct constituent batch
        let validBatchDistribution = false;
        if (req.activityType === 'P' && targetMap.size > 1) {
          let allBatchesMatch = true;
          for (const [tId, tTypeMap] of targetMap.entries()) {
            if ((tTypeMap.get('P') || 0) !== req.count) {
              allBatchesMatch = false;
              break;
            }
          }
          if (allBatchesMatch) {
            validBatchDistribution = true;
          }
        }

        if (!validBatchDistribution) {
          errors.push({
            code: 'ERR_EXCESS_SESSIONS',
            message: `Offering ${offeringId} has extra ${req.activityType} sessions. Scheduled: ${scheduledCount}, Required: ${req.count}.`,
            entityId: offeringId,
          });
        }
      }
    }
  }

  // 4. Validate pairwise constraints for all classes in draft
  // To avoid duplicate error reporting, each pair is checked once, or each candidate checked against preceding classes
  for (let i = 0; i < draft.classes.length; i++) {
    const candidate = draft.classes[i];
    const previousClasses = draft.classes.slice(0, i);

    const singleRes = validateCandidateSession(
      candidate,
      previousClasses,
      ctx
    );
    if (!singleRes.valid) {
      errors.push(...singleRes.errors);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
