/**
 * Extra class booking, available slot discovery with cancellation ranking,
 * and teacher unavailability management.
 * Source of truth: docs/01_MASTER_PRD.md, docs/02_DECISION_REGISTER.md (D02, D03, D19, D20, D24, D25, D29, D30)
 */

import { TimetableRepository, RepositoryDataState } from '../data/repository.js';
import {
  ActivityType,
  ClassOccurrence,
  TargetGroupType,
  TeacherUnavailabilityRequest,
  ValidationResult,
} from '../domain/types.js';
import {
  validateCandidateSession,
  getRepresentedStudents,
  ValidationContext,
} from '../domain/conflictValidator.js';
import {
  isDbConfigured,
  persistOccurrenceToDb,
  persistExtraClassToDb,
  persistExtraClassCancellationToDb,
  persistTeacherUnavailabilityRequestToDb,
} from '../data/dbSync.js';
import { AuthSession } from './authService.js';

/**
 * Resolves a valid dayOfWeek (1..7, Monday=1..Sunday=7).
 * Fallback to parsing date string (YYYY-MM-DD) if dayOfWeek is missing or NaN.
 */
export function resolveDayOfWeek(dayOfWeekVal: unknown, dateVal?: string): number {
  const num = typeof dayOfWeekVal === 'number' ? dayOfWeekVal : (dayOfWeekVal !== undefined && dayOfWeekVal !== null && dayOfWeekVal !== '' ? Number(dayOfWeekVal) : NaN);
  if (!Number.isNaN(num) && num >= 1 && num <= 7) {
    return Math.floor(num);
  }
  if (dateVal && typeof dateVal === 'string') {
    const parts = dateVal.split('T')[0].split('-').map(Number);
    if (parts.length === 3 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1]) && !Number.isNaN(parts[2])) {
      const dt = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
      const utcDay = dt.getUTCDay(); // 0 is Sunday, 1 is Monday, ..., 6 is Saturday
      return utcDay === 0 ? 7 : utcDay; // Map Sunday -> 7
    }
  }
  return 1; // Default fallback to Monday
}

export interface AvailableSlotResult {
  slotIndex: number;
  dayOfWeek: number;
  isCancellationFreed: boolean;
  eligibleRooms: { id: string; roomNumber: string; capacity: number }[];
}

export class ExtraClassService {
  constructor(private repo: TimetableRepository) {}

  private buildValidationContext(state: RepositoryDataState): ValidationContext {
    return {
      grid: state.gridConfig,
      rooms: state.rooms,
      batches: state.batches,
      studentMemberships: Array.from(state.studentGroupMemberships.values()),
      electiveAssignments: Array.from(state.electiveAssignments.values()),
      teacherAvailabilities: Array.from(state.teacherAvailabilities.values()),
      teacherAbsences: Array.from(state.teacherUnavailabilityRequests.values()),
    };
  }

  /**
   * Queries available time slots and eligible rooms for an extra class on a given date.
   * D03: Ranks cancellation-freed slots first, without hiding other valid free slots.
   */
  public queryAvailableSlots(params: {
    date: string;
    dayOfWeek?: number;
    activityType?: ActivityType;
    teacherId?: string;
    targetType?: TargetGroupType;
    targetId?: string;
    expectedGroupSize?: number;
  }): AvailableSlotResult[] {
    const state = this.repo.getState();
    const ctx = this.buildValidationContext(state);
    const dayOfWeek = resolveDayOfWeek(params.dayOfWeek, params.date);
    const activityType = params.activityType || 'L';
    const duration = activityType === 'P' ? 2 : 1;
    const requiredType = activityType === 'P' ? 'P' : 'LT';
    const groupSize = params.expectedGroupSize ?? 30;
    const targetType = params.targetType || 'section';
    const targetId = params.targetId || (state.sections.size > 0 ? Array.from(state.sections.keys())[0] : 'sec-1');
    const teacherId = params.teacherId || (state.teachers.size > 0 ? Array.from(state.teachers.keys())[0] : 't-1');

    const results: AvailableSlotResult[] = [];
    const occurrencesOnDate = Array.from(state.classOccurrences.values()).filter(
      (o) => o.date === params.date
    );

    // Identify slots where a cancellation occurred for this student cohort
    const cancelledSlots = new Set<number>();
    for (const occ of occurrencesOnDate) {
      if (occ.status === 'cancelled' && occ.targetType === targetType && occ.targetId === targetId) {
        for (let off = 0; off < occ.duration; off++) {
          cancelledSlots.add(occ.startSlot + off);
        }
      }
    }

    // Iterate through daily slots on grid
    const dailySlots = ctx.grid.slots.filter((s) => s.dayOfWeek === dayOfWeek && !s.isBreak);

    for (const slot of dailySlots) {
      const candidateSlot = slot.slotIndex;
      // Filter rooms matching required type and capacity
      const eligibleRooms: { id: string; roomNumber: string; capacity: number }[] = [];

      for (const room of ctx.rooms.values()) {
        if (!room.active || room.roomType !== requiredType || room.capacity < groupSize) {
          continue;
        }

        const candidate = {
          termId: 'any',
          dayOfWeek,
          date: params.date,
          startSlot: candidateSlot,
          duration,
          activityType,
          teacherId,
          roomId: room.id,
          targetType,
          targetId,
          expectedGroupSize: groupSize,
        };

        const valRes = validateCandidateSession(candidate, occurrencesOnDate, ctx);
        if (valRes.valid) {
          eligibleRooms.push({
            id: room.id,
            roomNumber: room.roomNumber,
            capacity: room.capacity,
          });
        }
      }

      if (eligibleRooms.length > 0) {
        results.push({
          slotIndex: candidateSlot,
          dayOfWeek,
          isCancellationFreed: cancelledSlots.has(candidateSlot),
          eligibleRooms,
        });
      }
    }

    // Rank cancellation-freed slots first (D03)
    results.sort((a, b) => {
      if (a.isCancellationFreed && !b.isCancellationFreed) return -1;
      if (!a.isCancellationFreed && b.isCancellationFreed) return 1;
      return a.slotIndex - b.slotIndex;
    });

    return results;
  }

  /**
   * Books a one-off extra class in a valid free slot with an eligible room.
   * D02, D19, D20, D24: Backend re-validates all conflicts against current state.
   * Extra class never mutates recurring weekly timetable pattern.
   */
  public async bookExtraClass(
    session: AuthSession,
    params: {
      date: string;
      dayOfWeek?: number;
      startSlot: number;
      activityType?: ActivityType;
      courseOfferingId?: string;
      termId?: string;
      roomId?: string;
      targetType?: TargetGroupType;
      targetId?: string;
      teacherId?: string;
      expectedGroupSize?: number;
    }
  ): Promise<ClassOccurrence> {
    if (session.role !== 'teacher' && session.role !== 'admin') {
      throw new Error('ERR_FORBIDDEN: Only teachers or admins can book extra classes.');
    }
    if (session.role === 'teacher' && !session.linkedId) {
      throw new Error('ERR_FORBIDDEN: Teacher account lacks a linked entity.');
    }

    const dayOfWeek = resolveDayOfWeek(params.dayOfWeek, params.date);
    const activityType = params.activityType || 'L';
    const duration = activityType === 'P' ? 2 : 1;

    return this.repo.runTransaction(async (tx) => {
      // Resolve courseOfferingId
      let courseOfferingId = params.courseOfferingId;
      if (!courseOfferingId || !tx.courseOfferings.has(courseOfferingId)) {
        if (session.role === 'teacher' && session.linkedId) {
          const teacherOffering = Array.from(tx.courseOfferings.values()).find(
            (o) => o.teacherId === session.linkedId
          );
          if (teacherOffering) courseOfferingId = teacherOffering.id;
        }
        if (!courseOfferingId && tx.courseOfferings.size > 0) {
          courseOfferingId = Array.from(tx.courseOfferings.keys())[0];
        }
        if (!courseOfferingId) {
          courseOfferingId = 'off-1';
        }
      }
      const offering = tx.courseOfferings.get(courseOfferingId);

      // Resolve teacherId (BE-11):
      // When session.role === 'admin', resolve teacherId from params.teacherId or target courseOffering's assigned instructor - NEVER session.userId
      let teacherId = params.teacherId;
      if (session.role === 'teacher') {
        teacherId = session.linkedId!;
      } else if (!teacherId) {
        teacherId = offering?.teacherId || session.linkedId || 't-1';
      }

      // Resolve termId
      const termId = params.termId || offering?.termId || Array.from(tx.academicTerms.keys())[0] || 'term-1';

      // Resolve targetType & targetId
      const targetType = params.targetType || 'section';
      const targetId = params.targetId || offering?.targetId || Array.from(tx.sections.keys())[0] || 'sec-1';

      // Resolve roomId if omitted or invalid
      let roomId = params.roomId;
      if (!roomId || !tx.rooms.has(roomId)) {
        const requiredType = activityType === 'P' ? 'P' : 'LT';
        const eligibleRoom = Array.from(tx.rooms.values()).find(
          (r) => r.active && r.roomType === requiredType
        ) || Array.from(tx.rooms.values()).find((r) => r.active);
        roomId = eligibleRoom ? eligibleRoom.id : (params.roomId || 'r-101');
      }

      const ctx = this.buildValidationContext(tx);
      const activeOccurrences = Array.from(tx.classOccurrences.values()).filter(
        (o) => o.status !== 'cancelled' && o.status !== 'superseded'
      );

      // Compute expectedGroupSize from represented students if not specified (BE-06)
      let expectedGroupSize = params.expectedGroupSize;
      if (expectedGroupSize === undefined) {
        const represented = getRepresentedStudents(targetType, targetId, ctx, params.date);
        expectedGroupSize = represented.size > 0 ? represented.size : undefined;
      }

      const candidate = {
        termId,
        dayOfWeek,
        date: params.date,
        startSlot: params.startSlot,
        duration,
        activityType,
        teacherId,
        roomId,
        targetType,
        targetId,
        expectedGroupSize,
      };

      const valRes: ValidationResult = validateCandidateSession(
        candidate,
        activeOccurrences,
        ctx
      );

      if (!valRes.valid) {
        const firstError = valRes.errors[0];
        throw new Error(`${firstError.code}: ${firstError.message}`);
      }

      // Resolve real active published timetable_versions.id (BE-05)
      const publishedVersion =
        Array.from(tx.timetableVersions.values()).find(
          (v) =>
            v.status === 'published' &&
            (!termId || v.termId === termId)
        ) || Array.from(tx.timetableVersions.values()).find((v) => v.status === 'published');
      const resolvedVersionId = publishedVersion ? publishedVersion.id : 'v-published-1';

      const occurrenceId = `extra-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const extraClassOccurrence: ClassOccurrence = {
        id: occurrenceId,
        versionId: resolvedVersionId,
        courseOfferingId,
        termId,
        date: params.date,
        dayOfWeek,
        startSlot: params.startSlot,
        duration,
        activityType,
        teacherId,
        roomId,
        targetType,
        targetId,
        status: 'scheduled',
        isExtraClass: true,
        bookedByTeacherId: session.role === 'teacher' ? session.linkedId! : (teacherId || undefined),
      };

      tx.classOccurrences.set(occurrenceId, extraClassOccurrence);

      this.repo.logAudit(session.userId, 'BOOK_EXTRA_CLASS', 'class_occurrences', occurrenceId, 'success', {
        date: params.date,
        slot: params.startSlot,
        roomId: params.roomId,
        teacherId,
      });

      // Persist durably to PostgreSQL if configured (BE-02, BE-10)
      if (isDbConfigured()) {
        await persistOccurrenceToDb(extraClassOccurrence);
        await persistExtraClassToDb({
          id: extraClassOccurrence.id,
          date: extraClassOccurrence.date,
          courseOfferingId: extraClassOccurrence.courseOfferingId,
          activityType: extraClassOccurrence.activityType,
          teacherId: extraClassOccurrence.teacherId,
          roomId: extraClassOccurrence.roomId,
          startSlot: extraClassOccurrence.startSlot,
          duration: extraClassOccurrence.duration,
          targetType: extraClassOccurrence.targetType,
          targetId: extraClassOccurrence.targetId,
          status: extraClassOccurrence.status,
          bookingTeacherId: session.role === 'teacher' ? session.userId : undefined,
        });
      }

      // Post-commit notification to affected students only
      const affectedStudents = getRepresentedStudents(
        targetType,
        targetId,
        ctx,
        params.date
      );

      for (const studentId of affectedStudents) {
        const outboxId = `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        tx.notificationOutbox.push({
          id: outboxId,
          recipientStudentId: studentId,
          eventType: 'EXTRA_CLASS_BOOKED',
          title: 'Extra Class Booked',
          message: `An extra class has been scheduled on ${params.date} at slot ${params.startSlot}.`,
          entityType: 'class_occurrences',
          entityId: occurrenceId,
          status: 'pending',
          retryCount: 0,
          createdAt: new Date().toISOString(),
        });
      }

      return extraClassOccurrence;
    });
  }

  /**
   * Cancels an extra class.
   * D25: Only the booking teacher or an authorized admin can cancel an extra class.
   */
  public async cancelExtraClass(
    session: AuthSession,
    occurrenceId: string,
    reason?: string
  ): Promise<ClassOccurrence> {
    return this.repo.runTransaction(async (tx) => {
      const occ = tx.classOccurrences.get(occurrenceId);
      if (!occ || !occ.isExtraClass) {
        throw new Error(`ERR_NOT_FOUND: Extra class occurrence ${occurrenceId} not found.`);
      }

      // Authorization check (D25)
      if (session.role === 'teacher') {
        if (occ.bookedByTeacherId !== session.linkedId) {
          throw new Error('ERR_FORBIDDEN: Teachers can only cancel extra classes booked by themselves.');
        }
      } else if (session.role !== 'admin') {
        throw new Error('ERR_FORBIDDEN: Insufficient permissions.');
      }

      occ.status = 'cancelled';
      occ.cancellationReason = reason;

      this.repo.logAudit(session.userId, 'CANCEL_EXTRA_CLASS', 'class_occurrences', occurrenceId, 'success', {
        reason,
      });

      // Notify affected students
      const ctx = this.buildValidationContext(tx);
      const affectedStudents = getRepresentedStudents(occ.targetType, occ.targetId, ctx, occ.date);
      for (const studentId of affectedStudents) {
        const outboxId = `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        tx.notificationOutbox.push({
          id: outboxId,
          recipientStudentId: studentId,
          eventType: 'EXTRA_CLASS_CANCELLED',
          title: 'Extra Class Cancelled',
          message: `The extra class on ${occ.date} at slot ${occ.startSlot} has been cancelled.${reason ? ` Reason: ${reason}` : ''}`,
          entityType: 'class_occurrences',
          entityId: occurrenceId,
          status: 'pending',
          retryCount: 0,
          createdAt: new Date().toISOString(),
        });
      }

      // Persist cancellation durably to PostgreSQL if configured (BE-05, BE-16)
      if (isDbConfigured()) {
        await persistOccurrenceToDb(occ);
        await persistExtraClassCancellationToDb(occurrenceId);
      }

      return occ;
    });
  }

  /**
   * Submits a teacher unavailability request (D30).
   * Request status is 'pending' until explicitly confirmed by an admin.
   */
  public async submitUnavailabilityRequest(
    session: AuthSession,
    params: {
      date: string;
      startSlot: number;
      endSlot: number;
      teacherId?: string;
      reason?: string;
    }
  ): Promise<TeacherUnavailabilityRequest> {
    if (session.role !== 'teacher' && session.role !== 'admin') {
      throw new Error('ERR_FORBIDDEN: Only teachers or admins can submit unavailability requests.');
    }
    const teacherId = session.role === 'teacher' ? session.linkedId : (params.teacherId || session.linkedId || 't-1');
    if (!teacherId) {
      throw new Error('ERR_FORBIDDEN: Teacher account lacks a linked entity.');
    }

    return this.repo.runTransaction(async (tx) => {
      const id = `unavail-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const request: TeacherUnavailabilityRequest = {
        id,
        teacherId,
        date: params.date,
        startSlot: params.startSlot,
        endSlot: params.endSlot,
        reason: params.reason,
        status: 'pending', // Pending confirmation
        submittedAt: new Date().toISOString(),
      };

      tx.teacherUnavailabilityRequests.set(id, request);
      this.repo.logAudit(session.userId, 'SUBMIT_UNAVAILABILITY', 'teacher_unavailability_requests', id, 'success', {
        date: params.date,
        slots: `${params.startSlot}-${params.endSlot}`,
      });

      if (isDbConfigured()) {
        await persistTeacherUnavailabilityRequestToDb(request);
      }

      return request;
    });
  }

  /**
   * Confirms a teacher unavailability request and lists affected class occurrences.
   * D29, D30: Admin confirms request. Once confirmed, affected classes must be enumerated
   * for explicit admin resolution (substitute, reschedule, or cancel).
   */
  public async confirmUnavailabilityRequest(
    session: AuthSession,
    requestId: string
  ): Promise<{ request: TeacherUnavailabilityRequest; affectedOccurrences: ClassOccurrence[] }> {
    if (session.role !== 'admin') {
      throw new Error('ERR_FORBIDDEN: Only administrators can confirm unavailability requests.');
    }

    return this.repo.runTransaction(async (tx) => {
      const req = tx.teacherUnavailabilityRequests.get(requestId);
      if (!req) {
        throw new Error(`ERR_NOT_FOUND: Request ${requestId} not found.`);
      }

      req.status = 'confirmed';
      req.reviewedBy = session.userId;
      req.reviewedAt = new Date().toISOString();

      // Find affected class occurrences, cancel them, and notify affected students
      const affectedOccurrences: ClassOccurrence[] = [];
      const ctx = this.buildValidationContext(tx);

      for (const occ of tx.classOccurrences.values()) {
        if (
          occ.teacherId === req.teacherId &&
          occ.date === req.date &&
          occ.status === 'scheduled'
        ) {
          // Check slot overlap
          const occEnd = occ.startSlot + occ.duration - 1;
          if (Math.max(occ.startSlot, req.startSlot) <= Math.min(occEnd, req.endSlot)) {
            // Cancel affected occurrence atomically
            occ.status = 'cancelled';
            occ.cancellationReason = `Faculty leave confirmed: ${req.reason || 'Leave Approved'}`;
            affectedOccurrences.push(occ);

            const eventId = `event-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
            tx.classOccurrenceEvents.set(eventId, {
              id: eventId,
              occurrenceId: occ.id,
              eventType: 'cancelled',
              priorPayload: { ...occ, status: 'scheduled' },
              newPayload: { status: 'cancelled', cancellationReason: occ.cancellationReason },
              reason: occ.cancellationReason,
              actorId: session.userId,
              createdAt: new Date().toISOString(),
            });

            // Dispatch post-commit notifications to affected students
            const affectedStudents = getRepresentedStudents(
              occ.targetType,
              occ.targetId,
              ctx,
              occ.date
            );

            for (const studentId of affectedStudents) {
              const outboxId = `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
              tx.notificationOutbox.push({
                id: outboxId,
                recipientStudentId: studentId,
                eventType: 'CLASS_CANCELLED',
                title: 'Class Cancelled (Faculty Leave)',
                message: `Your class on ${occ.date} at slot ${occ.startSlot} has been cancelled due to confirmed faculty leave.${req.reason ? ` Reason: ${req.reason}` : ''}`,
                entityType: 'class_occurrences',
                entityId: occ.id,
                status: 'pending',
                retryCount: 0,
                createdAt: new Date().toISOString(),
              });
            }

            if (isDbConfigured()) {
              persistOccurrenceToDb(occ).catch((e) =>
                console.warn('[Supabase DB] Failed to persist leave-cancelled occurrence:', e.message)
              );
            }
          }
        }
      }

      this.repo.logAudit(session.userId, 'CONFIRM_UNAVAILABILITY', 'teacher_unavailability_requests', requestId, 'success', {
        affectedCount: affectedOccurrences.length,
      });

      if (isDbConfigured()) {
        await persistTeacherUnavailabilityRequestToDb(req);
      }

      return { request: req, affectedOccurrences };
    });
  }

  /**
   * Rejects a teacher unavailability request (D29, D30).
   */
  public async rejectUnavailabilityRequest(
    session: AuthSession,
    requestId: string,
    reason?: string
  ): Promise<TeacherUnavailabilityRequest> {
    if (session.role !== 'admin') {
      throw new Error('ERR_FORBIDDEN: Only administrators can reject unavailability requests.');
    }

    return this.repo.runTransaction(async (tx) => {
      const req = tx.teacherUnavailabilityRequests.get(requestId);
      if (!req) {
        throw new Error(`ERR_NOT_FOUND: Request ${requestId} not found.`);
      }

      req.status = 'rejected';
      req.reviewedBy = session.userId;
      req.reviewedAt = new Date().toISOString();

      this.repo.logAudit(session.userId, 'REJECT_UNAVAILABILITY', 'teacher_unavailability_requests', requestId, 'success', {
        reason,
      });

      if (isDbConfigured()) {
        await persistTeacherUnavailabilityRequestToDb(req);
      }

      return req;
    });
  }
}
