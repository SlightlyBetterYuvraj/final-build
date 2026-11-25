/**
 * Student group transfer and elective preservation service.
 * Source of truth: docs/02_DECISION_REGISTER.md (D27, D28) and docs/04_SCHEDULING_DOMAIN_RULES.md (Section 9)
 */

import { TimetableRepository } from '../data/repository.js';
import { StudentGroupMembership } from '../domain/types.js';
import { AuthSession } from './authService.js';

export class StudentTransferService {
  constructor(private repo: TimetableRepository) {}

  /**
   * Transfers a student to a new section or batch with an effective date.
   * D27: New membership applies to future classes from that date;
   * past records/memberships are preserved (never deleted or rewritten).
   * D28: Elective assignments are preserved. Incompatibilities are flagged
   * for admin resolution rather than silently deleted.
   */
  public async transferStudentGroup(
    session: AuthSession,
    params: {
      studentId: string;
      newGroupId: string;
      newGroupType: 'section' | 'batch';
      effectiveDate: string; // YYYY-MM-DD
    }
  ): Promise<{
    oldMembership?: StudentGroupMembership;
    newMembership: StudentGroupMembership;
    flaggedElectives: string[];
  }> {
    if (session.role !== 'admin') {
      throw new Error('ERR_FORBIDDEN: Only administrators can transfer students.');
    }

    return this.repo.runTransaction(async (tx) => {
      const student = tx.students.get(params.studentId);
      if (!student) {
        throw new Error(`ERR_STUDENT_NOT_FOUND: Student ${params.studentId} not found.`);
      }

      // Find and cap all current active memberships for this group type at effectiveDate
      let currentMembership: StudentGroupMembership | undefined;
      for (const m of tx.studentGroupMemberships.values()) {
        if (
          m.studentId === params.studentId &&
          m.groupType === params.newGroupType &&
          (!m.effectiveEndDate || m.effectiveEndDate > params.effectiveDate)
        ) {
          m.effectiveEndDate = params.effectiveDate;
          currentMembership = m;
        }
      }

      // Create new membership record
      const newMembershipId = `sgm-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newMembership: StudentGroupMembership = {
        id: newMembershipId,
        studentId: params.studentId,
        groupId: params.newGroupId,
        groupType: params.newGroupType,
        effectiveStartDate: params.effectiveDate,
        effectiveEndDate: null,
      };
      tx.studentGroupMemberships.set(newMembershipId, newMembership);

      // Check existing elective assignments for potential schedule incompatibility
      const flaggedElectives: string[] = [];
      for (const ea of tx.electiveAssignments.values()) {
        if (ea.studentId === params.studentId && ea.status === 'active') {
          // Preserve elective assignment, but check if admin review is required
          flaggedElectives.push(ea.electiveGroupId);
        }
      }

      this.repo.logAudit(session.userId, 'TRANSFER_STUDENT_GROUP', 'student_group_memberships', newMembershipId, 'success', {
        studentId: params.studentId,
        newGroupId: params.newGroupId,
        effectiveDate: params.effectiveDate,
        flaggedElectivesCount: flaggedElectives.length,
      });

      return {
        oldMembership: currentMembership,
        newMembership,
        flaggedElectives,
      };
    });
  }
}
