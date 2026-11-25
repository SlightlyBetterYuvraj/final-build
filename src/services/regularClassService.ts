/**
 * Regular class dated-occurrence operations: cancellation, atomic reschedule,
 * room/teacher changes, and student notifications.
 * Source of truth: docs/01_MASTER_PRD.md, docs/04_SCHEDULING_DOMAIN_RULES.md, docs/06_API_AND_WORKFLOWS.md
 */

import { TimetableRepository, RepositoryDataState } from '../data/repository.js';
import {
  ClassOccurrence,
  ValidationResult,
} from '../domain/types.js';
import {
  validateCandidateSession,
  getRepresentedStudents,
  ValidationContext,
} from '../domain/conflictValidator.js';
import { AuthSession, AuthService } from './authService.js';

export class RegularClassService {
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
   * Cancels a single dated class occurrence.
   * Crucial invariant: D01 - Cancellation applies ONLY to this dated occurrence,
   * never modifying the recurring weekly timetable pattern.
   */
  public async cancelOccurrence(
    session: AuthSession,
    occurrenceId: string,
    optionalReason?: string
  ): Promise<ClassOccurrence> {
    return this.repo.runTransaction(async (tx) => {
      const occurrence = tx.classOccurrences.get(occurrenceId);
      if (!occurrence) {
        throw new Error(`ERR_OCCURRENCE_NOT_FOUND: Occurrence ${occurrenceId} not found.`);
      }

      // Authorization: Admin or assigned teacher only (D23)
      if (session.role === 'teacher') {
        const isAssigned = !session.linkedId || occurrence.teacherId === session.linkedId;
        if (!isAssigned) {
          throw new Error('ERR_FORBIDDEN: Teachers can only cancel occurrences assigned to them.');
        }
      } else if (session.role !== 'admin') {
        throw new Error('ERR_FORBIDDEN: Only teachers or admins can cancel classes.');
      }

      if (occurrence.status === 'cancelled') {
        throw new Error('ERR_ALREADY_CANCELLED: This class occurrence is already cancelled.');
      }

      // Record prior state for event audit
      const priorPayload = { ...occurrence };

      occurrence.status = 'cancelled';
      occurrence.cancellationReason = optionalReason || undefined;

      // Event audit history
      const eventId = `event-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      tx.classOccurrenceEvents.set(eventId, {
        id: eventId,
        occurrenceId: occurrence.id,
        eventType: 'cancelled',
        priorPayload,
        newPayload: { status: 'cancelled', cancellationReason: optionalReason },
        reason: optionalReason,
        actorId: session.userId,
        createdAt: new Date().toISOString(),
      });

      this.repo.logAudit(session.userId, 'CANCEL_OCCURRENCE', 'class_occurrences', occurrence.id, 'success', {
        date: occurrence.date,
        reason: optionalReason,
      });

      // Post-commit notification to affected students
      const ctx = this.buildValidationContext(tx);
      const affectedStudents = getRepresentedStudents(
        occurrence.targetType,
        occurrence.targetId,
        ctx,
        occurrence.date
      );

      for (const studentId of affectedStudents) {
        const outboxId = `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        tx.notificationOutbox.push({
          id: outboxId,
          recipientStudentId: studentId,
          eventType: 'CLASS_CANCELLED',
          title: 'Class Cancelled',
          message: `Your class on ${occurrence.date} at slot ${occurrence.startSlot} has been cancelled.${optionalReason ? ` Reason: ${optionalReason}` : ''}`,
          entityType: 'class_occurrences',
          entityId: occurrence.id,
          status: 'pending',
          retryCount: 0,
          createdAt: new Date().toISOString(),
        });
      }

      return occurrence;
    });
  }

  /**
   * Reschedules an existing dated occurrence atomically.
   * Invariant D04: All-or-nothing. Candidate validated first; commit updates placement
   * and releases old slot atomically. On failure, original booking remains intact!
   */
  public async rescheduleOccurrence(
    session: AuthSession,
    occurrenceId: string,
    newParams: {
      date: string;
      dayOfWeek: number;
      startSlot: number;
      roomId?: string;
    }
  ): Promise<ClassOccurrence> {
    return this.repo.runTransaction(async (tx) => {
      const occurrence = tx.classOccurrences.get(occurrenceId);
      if (!occurrence) {
        throw new Error(`ERR_OCCURRENCE_NOT_FOUND: Occurrence ${occurrenceId} not found.`);
      }

      // Authorization: Admin or assigned teacher only (D23)
      if (session.role === 'teacher') {
        const isAssigned = !session.linkedId || occurrence.teacherId === session.linkedId;
        if (!isAssigned) {
          throw new Error('ERR_FORBIDDEN: Teachers can only reschedule occurrences assigned to them.');
        }
      } else if (session.role !== 'admin') {
        throw new Error('ERR_FORBIDDEN: Only teachers or admins can reschedule classes.');
      }

      const targetRoomId = newParams.roomId || occurrence.roomId;
      const ctx = this.buildValidationContext(tx);
      const represented = getRepresentedStudents(
        occurrence.targetType,
        occurrence.targetId,
        ctx,
        newParams.date || occurrence.date
      );
      const expectedGroupSize = represented.size > 0 ? represented.size : undefined;

      // Candidate session for validation
      const candidate = {
        id: occurrence.id,
        termId: occurrence.termId,
        dayOfWeek: newParams.dayOfWeek,
        date: newParams.date,
        startSlot: newParams.startSlot,
        duration: occurrence.duration,
        activityType: occurrence.activityType,
        teacherId: occurrence.teacherId,
        roomId: targetRoomId,
        targetType: occurrence.targetType,
        targetId: occurrence.targetId,
        expectedGroupSize,
      };

      const activeOccurrences = Array.from(tx.classOccurrences.values()).filter(
        (o) => o.status !== 'cancelled' && o.status !== 'superseded'
      );

      const validationRes: ValidationResult = validateCandidateSession(
        candidate,
        activeOccurrences,
        ctx
      );

      if (!validationRes.valid) {
        const firstError = validationRes.errors[0];
        throw new Error(`${firstError.code}: ${firstError.message}`);
      }

      // Record prior values
      const priorPayload = {
        date: occurrence.date,
        dayOfWeek: occurrence.dayOfWeek,
        startSlot: occurrence.startSlot,
        roomId: occurrence.roomId,
      };

      // Atomic update
      occurrence.date = newParams.date;
      occurrence.dayOfWeek = newParams.dayOfWeek;
      occurrence.startSlot = newParams.startSlot;
      occurrence.roomId = targetRoomId;
      occurrence.status = 'scheduled'; // reset if previously flagged

      const eventId = `event-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      tx.classOccurrenceEvents.set(eventId, {
        id: eventId,
        occurrenceId: occurrence.id,
        eventType: 'rescheduled',
        priorPayload,
        newPayload: {
          date: newParams.date,
          dayOfWeek: newParams.dayOfWeek,
          startSlot: newParams.startSlot,
          roomId: targetRoomId,
        },
        actorId: session.userId,
        createdAt: new Date().toISOString(),
      });

      this.repo.logAudit(session.userId, 'RESCHEDULE_OCCURRENCE', 'class_occurrences', occurrence.id, 'success', {
        newDate: newParams.date,
        newSlot: newParams.startSlot,
        newRoomId: targetRoomId,
      });

      // Post-commit notifications to affected students
      const affectedStudents = getRepresentedStudents(
        occurrence.targetType,
        occurrence.targetId,
        ctx,
        newParams.date
      );

      for (const studentId of affectedStudents) {
        const outboxId = `outbox-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        tx.notificationOutbox.push({
          id: outboxId,
          recipientStudentId: studentId,
          eventType: 'CLASS_RESCHEDULED',
          title: 'Class Rescheduled',
          message: `Your class has been moved to ${newParams.date} at slot ${newParams.startSlot}.`,
          entityType: 'class_occurrences',
          entityId: occurrence.id,
          status: 'pending',
          retryCount: 0,
          createdAt: new Date().toISOString(),
        });
      }

      return occurrence;
    });
  }
}
