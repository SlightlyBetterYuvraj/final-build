import { describe, it, expect, beforeEach } from 'vitest';
import { TimetableRepository } from '../src/data/repository.js';
import { StudentTransferService } from '../src/services/studentTransferService.js';
import { AuthSession } from '../src/services/authService.js';
import { getRepresentedStudents } from '../src/domain/conflictValidator.js';

describe('Phase 4 — Student Group Transfers & Elective Preservation', () => {
  let repo: TimetableRepository;
  let service: StudentTransferService;

  const adminSession: AuthSession = {
    userId: 'admin-1',
    email: 'admin@uni.edu',
    role: 'admin',
  };

  const studentSession: AuthSession = {
    userId: 'stud-1',
    email: 'charlie@uni.edu',
    role: 'student',
  };

  beforeEach(async () => {
    repo = new TimetableRepository();
    service = new StudentTransferService(repo);

    await repo.runTransaction(async (tx) => {
      tx.sections.set('sec-A', {
        id: 'sec-A',
        termId: 'term-5',
        name: 'A',
        expectedCount: 50,
        active: true,
      });
      tx.sections.set('sec-B', {
        id: 'sec-B',
        termId: 'term-5',
        name: 'B',
        expectedCount: 50,
        active: true,
      });

      tx.students.set('stud-charlie', {
        id: 'stud-charlie',
        rollNumber: 'R301',
        name: 'Charlie',
        email: 'charlie@uni.edu',
        active: true,
      });

      // Charlie's initial membership in Section A starting 2026-08-01
      tx.studentGroupMemberships.set('sgm-init', {
        id: 'sgm-init',
        studentId: 'stud-charlie',
        groupId: 'sec-A',
        groupType: 'section',
        effectiveStartDate: '2026-08-01',
        effectiveEndDate: null,
      });

      // Charlie's elective assignment in AI Elective
      tx.electiveAssignments.set('ea-ai', {
        id: 'ea-ai',
        studentId: 'stud-charlie',
        electiveGroupId: 'elec-ai',
        status: 'active',
        assignedBy: 'admin',
        assignedAt: '2026-08-01',
      });
    });
  });

  it('preserves historical membership and changes future classes effective from transfer date (D27)', async () => {
    // Non-admin cannot transfer students
    await expect(
      service.transferStudentGroup(studentSession, {
        studentId: 'stud-charlie',
        newGroupId: 'sec-B',
        newGroupType: 'section',
        effectiveDate: '2026-10-01',
      })
    ).rejects.toThrow('ERR_FORBIDDEN');

    // Admin transfers Charlie to Section B effective 2026-10-01
    const res = await service.transferStudentGroup(adminSession, {
      studentId: 'stud-charlie',
      newGroupId: 'sec-B',
      newGroupType: 'section',
      effectiveDate: '2026-10-01',
    });

    expect(res.newMembership.groupId).toBe('sec-B');
    expect(res.newMembership.effectiveStartDate).toBe('2026-10-01');

    // Historical membership is preserved with effective end date set to 2026-10-01
    expect(res.oldMembership?.effectiveEndDate).toBe('2026-10-01');

    const state = repo.getState();
    const ctx = {
      batches: state.batches,
      studentMemberships: Array.from(state.studentGroupMemberships.values()),
      electiveAssignments: Array.from(state.electiveAssignments.values()),
    };

    // Before transfer date (e.g. 2026-09-15): Charlie belongs to Section A
    const studentsInSecABefore = getRepresentedStudents('section', 'sec-A', ctx, '2026-09-15');
    expect(studentsInSecABefore.has('stud-charlie')).toBe(true);

    const studentsInSecBBefore = getRepresentedStudents('section', 'sec-B', ctx, '2026-09-15');
    expect(studentsInSecBBefore.has('stud-charlie')).toBe(false);

    // After transfer date (e.g. 2026-10-05): Charlie belongs to Section B
    const studentsInSecAAfter = getRepresentedStudents('section', 'sec-A', ctx, '2026-10-05');
    expect(studentsInSecAAfter.has('stud-charlie')).toBe(false);

    const studentsInSecBAfter = getRepresentedStudents('section', 'sec-B', ctx, '2026-10-05');
    expect(studentsInSecBAfter.has('stud-charlie')).toBe(true);
  });

  it('preserves existing elective assignments upon transfer and flags them for admin review (D28)', async () => {
    const res = await service.transferStudentGroup(adminSession, {
      studentId: 'stud-charlie',
      newGroupId: 'sec-B',
      newGroupType: 'section',
      effectiveDate: '2026-10-01',
    });

    // Invariant: Elective assignment is preserved (NOT deleted)
    const elective = repo.getState().electiveAssignments.get('ea-ai');
    expect(elective).toBeDefined();
    expect(elective?.status).toBe('active');
    expect(res.flaggedElectives).toContain('elec-ai');
  });
});
