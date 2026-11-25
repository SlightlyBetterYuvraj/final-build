/**
 * Data repository with atomic transactions, rollback guarantees,
 * concurrency locking, audit logging, and transactional outbox.
 * Conforms to docs/05_DATA_MODEL.md and docs/06_API_AND_WORKFLOWS.md
 */

import {
  AcademicTerm,
  Batch,
  ClassOccurrence,
  Course,
  CourseOffering,
  ElectiveAssignment,
  ElectiveGroup,
  Room,
  ScheduledClass,
  Section,
  Student,
  StudentGroupMembership,
  Teacher,
  TeacherAvailability,
  TeacherUnavailabilityRequest,
  TimetableGridConfig,
  TimetableVersion,
  UserRole,
} from '../domain/types.js';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  linkedId?: string; // studentId or teacherId
  passwordHash: string;
  emailVerified: boolean;
  createdAt: string;
}

export interface AuditEventRecord {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  outcome: 'success' | 'failure';
  details?: Record<string, unknown>;
  timestamp: string;
}

export interface NotificationOutboxRecord {
  id: string;
  recipientStudentId: string;
  eventType: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  payload?: Record<string, unknown>;
  status: 'pending' | 'delivered' | 'failed';
  retryCount: number;
  createdAt: string;
  deliveredAt?: string;
}

export interface ClassOccurrenceEvent {
  id: string;
  occurrenceId: string;
  eventType: 'cancelled' | 'rescheduled' | 'room_changed' | 'teacher_changed' | 'replacement';
  priorPayload?: Record<string, unknown>;
  newPayload?: Record<string, unknown>;
  reason?: string;
  actorId: string;
  createdAt: string;
}

export interface RepositoryDataState {
  academicTerms: Map<string, AcademicTerm>;
  sections: Map<string, Section>;
  batches: Map<string, Batch>;
  students: Map<string, Student>;
  studentGroupMemberships: Map<string, StudentGroupMembership>;
  electiveGroups: Map<string, ElectiveGroup>;
  electiveAssignments: Map<string, ElectiveAssignment>;
  teachers: Map<string, Teacher>;
  teacherAvailabilities: Map<string, TeacherAvailability>;
  teacherUnavailabilityRequests: Map<string, TeacherUnavailabilityRequest>;
  rooms: Map<string, Room>;
  courses: Map<string, Course>;
  courseOfferings: Map<string, CourseOffering>;
  timetableVersions: Map<string, TimetableVersion>;
  scheduledClasses: Map<string, ScheduledClass>;
  classOccurrences: Map<string, ClassOccurrence>;
  classOccurrenceEvents: Map<string, ClassOccurrenceEvent>;
  userProfiles: Map<string, UserProfile>;
  auditEvents: AuditEventRecord[];
  notificationOutbox: NotificationOutboxRecord[];
  gridConfig: TimetableGridConfig;
}

function cloneEntityMap<K, V>(map: Map<K, V>): Map<K, V> {
  const cloned = new Map<K, V>();
  for (const [k, v] of map.entries()) {
    cloned.set(k, typeof v === 'object' && v !== null ? { ...v } : v);
  }
  return cloned;
}

function cloneDataState(src: RepositoryDataState): RepositoryDataState {
  return {
    academicTerms: cloneEntityMap(src.academicTerms),
    sections: cloneEntityMap(src.sections),
    batches: cloneEntityMap(src.batches),
    students: cloneEntityMap(src.students),
    studentGroupMemberships: cloneEntityMap(src.studentGroupMemberships),
    electiveGroups: cloneEntityMap(src.electiveGroups),
    electiveAssignments: cloneEntityMap(src.electiveAssignments),
    teachers: cloneEntityMap(src.teachers),
    teacherAvailabilities: cloneEntityMap(src.teacherAvailabilities),
    teacherUnavailabilityRequests: cloneEntityMap(src.teacherUnavailabilityRequests),
    rooms: cloneEntityMap(src.rooms),
    courses: cloneEntityMap(src.courses),
    courseOfferings: cloneEntityMap(src.courseOfferings),
    timetableVersions: cloneEntityMap(src.timetableVersions),
    scheduledClasses: cloneEntityMap(src.scheduledClasses),
    classOccurrences: cloneEntityMap(src.classOccurrences),
    classOccurrenceEvents: cloneEntityMap(src.classOccurrenceEvents),
    userProfiles: cloneEntityMap(src.userProfiles),
    auditEvents: src.auditEvents.map((a) => ({ ...a })),
    notificationOutbox: src.notificationOutbox.map((n) => ({ ...n })),
    gridConfig: {
      ...src.gridConfig,
      days: [...src.gridConfig.days],
      slots: src.gridConfig.slots.map((s) => ({ ...s })),
    },
  };
}

export class TimetableRepository {
  private state: RepositoryDataState;
  private transactionLock: Promise<void> = Promise.resolve();

  constructor(initialGrid?: TimetableGridConfig) {
    const defaultGrid: TimetableGridConfig = initialGrid || {
      days: [1, 2, 3, 4, 5],
      slotsPerDay: 8,
      slots: [
        { dayOfWeek: 1, slotIndex: 1, startTime: '09:00', endTime: '10:00' },
        { dayOfWeek: 1, slotIndex: 2, startTime: '10:00', endTime: '11:00' },
        { dayOfWeek: 1, slotIndex: 3, startTime: '11:00', endTime: '12:00' },
        { dayOfWeek: 1, slotIndex: 4, startTime: '12:00', endTime: '13:00', isBreak: true },
        { dayOfWeek: 1, slotIndex: 5, startTime: '13:00', endTime: '14:00' },
        { dayOfWeek: 1, slotIndex: 6, startTime: '14:00', endTime: '15:00' },
        { dayOfWeek: 1, slotIndex: 7, startTime: '15:00', endTime: '16:00' },
        { dayOfWeek: 1, slotIndex: 8, startTime: '16:00', endTime: '17:00' },
        { dayOfWeek: 2, slotIndex: 1, startTime: '09:00', endTime: '10:00' },
        { dayOfWeek: 2, slotIndex: 2, startTime: '10:00', endTime: '11:00' },
        { dayOfWeek: 2, slotIndex: 3, startTime: '11:00', endTime: '12:00' },
        { dayOfWeek: 2, slotIndex: 4, startTime: '12:00', endTime: '13:00', isBreak: true },
        { dayOfWeek: 2, slotIndex: 5, startTime: '13:00', endTime: '14:00' },
        { dayOfWeek: 2, slotIndex: 6, startTime: '14:00', endTime: '15:00' },
        { dayOfWeek: 2, slotIndex: 7, startTime: '15:00', endTime: '16:00' },
        { dayOfWeek: 2, slotIndex: 8, startTime: '16:00', endTime: '17:00' },
        { dayOfWeek: 3, slotIndex: 1, startTime: '09:00', endTime: '10:00' },
        { dayOfWeek: 3, slotIndex: 2, startTime: '10:00', endTime: '11:00' },
        { dayOfWeek: 3, slotIndex: 3, startTime: '11:00', endTime: '12:00' },
        { dayOfWeek: 3, slotIndex: 4, startTime: '12:00', endTime: '13:00', isBreak: true },
        { dayOfWeek: 3, slotIndex: 5, startTime: '13:00', endTime: '14:00' },
        { dayOfWeek: 3, slotIndex: 6, startTime: '14:00', endTime: '15:00' },
        { dayOfWeek: 3, slotIndex: 7, startTime: '15:00', endTime: '16:00' },
        { dayOfWeek: 3, slotIndex: 8, startTime: '16:00', endTime: '17:00' },
        { dayOfWeek: 4, slotIndex: 1, startTime: '09:00', endTime: '10:00' },
        { dayOfWeek: 4, slotIndex: 2, startTime: '10:00', endTime: '11:00' },
        { dayOfWeek: 4, slotIndex: 3, startTime: '11:00', endTime: '12:00' },
        { dayOfWeek: 4, slotIndex: 4, startTime: '12:00', endTime: '13:00', isBreak: true },
        { dayOfWeek: 4, slotIndex: 5, startTime: '13:00', endTime: '14:00' },
        { dayOfWeek: 4, slotIndex: 6, startTime: '14:00', endTime: '15:00' },
        { dayOfWeek: 4, slotIndex: 7, startTime: '15:00', endTime: '16:00' },
        { dayOfWeek: 4, slotIndex: 8, startTime: '16:00', endTime: '17:00' },
        { dayOfWeek: 5, slotIndex: 1, startTime: '09:00', endTime: '10:00' },
        { dayOfWeek: 5, slotIndex: 2, startTime: '10:00', endTime: '11:00' },
        { dayOfWeek: 5, slotIndex: 3, startTime: '11:00', endTime: '12:00' },
        { dayOfWeek: 5, slotIndex: 4, startTime: '12:00', endTime: '13:00', isBreak: true },
        { dayOfWeek: 5, slotIndex: 5, startTime: '13:00', endTime: '14:00' },
        { dayOfWeek: 5, slotIndex: 6, startTime: '14:00', endTime: '15:00' },
        { dayOfWeek: 5, slotIndex: 7, startTime: '15:00', endTime: '16:00' },
        { dayOfWeek: 5, slotIndex: 8, startTime: '16:00', endTime: '17:00' },
      ],
    };

    this.state = {
      academicTerms: new Map(),
      sections: new Map(),
      batches: new Map(),
      students: new Map(),
      studentGroupMemberships: new Map(),
      electiveGroups: new Map(),
      electiveAssignments: new Map(),
      teachers: new Map(),
      teacherAvailabilities: new Map(),
      teacherUnavailabilityRequests: new Map(),
      rooms: new Map(),
      courses: new Map(),
      courseOfferings: new Map(),
      timetableVersions: new Map(),
      scheduledClasses: new Map(),
      classOccurrences: new Map(),
      classOccurrenceEvents: new Map(),
      userProfiles: new Map(),
      auditEvents: [],
      notificationOutbox: [],
      gridConfig: defaultGrid,
    };
  }

  /**
   * Synchronously mutates repository state (for initial fixtures and tests).
   */
  public seedSync(fn: (state: RepositoryDataState) => void): void {
    fn(this.state);
  }

  /**
   * Returns a read-only snapshot of current data state.
   */
  public getState(): Readonly<RepositoryDataState> {
    return this.state;
  }

  /**
   * Executes a mutating operation inside an atomic transaction.
   * If an exception occurs, all changes made inside callback are rolled back immediately.
   * Concurrent transactions are strictly serialized to prevent race conditions.
   */
  public async runTransaction<T>(
    callback: (txState: RepositoryDataState) => Promise<T>
  ): Promise<T> {
    // Chain transaction locks to enforce strict serializability for race safety
    const previousLock = this.transactionLock;
    let releaseLock: () => void;
    this.transactionLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    await previousLock;

    try {
      // Snapshot state prior to transaction
      const snapshot = cloneDataState(this.state);
      try {
        const priorNoticeCount = this.state.notificationOutbox.length;
        const result = await callback(snapshot);
        // Transaction succeeded: atomically commit snapshot
        this.state = snapshot;
        // Post-commit invariant: fire real-time updates strictly after transaction commitment
        if (snapshot.notificationOutbox.length > priorNoticeCount) {
          const newNotices = snapshot.notificationOutbox.slice(priorNoticeCount);
          this.emitPostCommit('NOTIFICATIONS_DISPATCHED', newNotices);
        }
        return result;
      } catch (err) {
        // Transaction failed: discard snapshot, state remains intact. Never emit live updates.
        throw err;
      }
    } finally {
      releaseLock!();
    }
  }

  private postCommitListeners: ((event: { type: string; payload: any; timestamp: string }) => void)[] = [];

  /**
   * Subscribe to authoritative post-commit events.
   * Listeners fire strictly after transaction commit.
   */
  public onPostCommit(listener: (event: { type: string; payload: any; timestamp: string }) => void): () => void {
    this.postCommitListeners.push(listener);
    return () => {
      this.postCommitListeners = this.postCommitListeners.filter((l) => l !== listener);
    };
  }

  /**
   * Emits an authoritative event to registered listeners strictly post-commit.
   */
  public emitPostCommit(type: string, payload: any): void {
    const event = {
      type,
      payload,
      timestamp: new Date().toISOString(),
    };
    for (const listener of this.postCommitListeners) {
      try {
        listener(event);
      } catch (err) {
        console.warn('[PostCommit] Listener error:', err);
      }
    }
  }


  /**
   * Helper to append an audit event.
   */
  public logAudit(
    actorId: string,
    action: string,
    entityType: string,
    entityId: string,
    outcome: 'success' | 'failure',
    details?: Record<string, unknown>,
    txState?: RepositoryDataState
  ): void {
    const target = txState ? txState.auditEvents : this.state.auditEvents;
    target.push({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      actorId,
      action,
      entityType,
      entityId,
      outcome,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Flushes and returns pending notifications from the outbox.
   */
  public deliverPendingNotifications(): NotificationOutboxRecord[] {
    const pending = this.state.notificationOutbox.filter((n) => n.status === 'pending');
    const now = new Date().toISOString();
    for (const notice of pending) {
      notice.status = 'delivered';
      notice.deliveredAt = now;
    }
    return pending;
  }

  /**
   * Seeds realistic university mock data across concurrently active odd semesters (Sem 1, 3, 5).
   * Fully populates operating grid, venues, faculty, cohorts, course offerings,
   * and a conflict-free published Version 1 schedule with dated occurrences.
   */
  public async seedRealisticUniversityData(): Promise<void> {
    await this.runTransaction(async (tx) => {
      populateRealisticUniversityData(tx);
    });
  }

  /**
   * Resets repository to a simple, minimal single-cohort setup for end-to-end Solver testing.
   * Clears existing schedules and publishes 0 drafts so that the user can run the solver cleanly.
   */
  public async resetToSimpleMockData(): Promise<void> {
    await this.runTransaction(async (tx) => {
      populateSimpleMockData(tx);
    });
  }
}

/**
 * Standalone helper to populate realistic university engineering curriculum fixtures.
 * Supports Semester 1, Semester 3, and Semester 5 running concurrently.
 */
export function populateRealisticUniversityData(tx: RepositoryDataState): void {
  // Prevent duplicate population
  if (tx.academicTerms.has('term-1') && tx.academicTerms.has('term-3') && tx.academicTerms.has('term-5')) {
    return;
  }

  // 1. Operating Grid & Academic Terms
  tx.academicTerms.set('term-1', {
    id: 'term-1',
    yearLabel: '2026-2027',
    semesterNumber: 1,
    startDate: '2026-09-01',
    endDate: '2026-12-20',
    cycle: 'odd',
    status: 'active',
  });

  tx.academicTerms.set('term-3', {
    id: 'term-3',
    yearLabel: '2026-2027',
    semesterNumber: 3,
    startDate: '2026-09-01',
    endDate: '2026-12-20',
    cycle: 'odd',
    status: 'active',
  });

  tx.academicTerms.set('term-5', {
    id: 'term-5',
    yearLabel: '2026-2027',
    semesterNumber: 5,
    startDate: '2026-09-01',
    endDate: '2026-12-20',
    cycle: 'odd',
    status: 'active',
  });

  // 2. Physical Infrastructure & Rooms (D16, D34)
  tx.rooms.set('room-lt1', {
    id: 'room-lt1',
    roomNumber: '101',
    building: 'Aryabhata Block',
    floor: 1,
    capacity: 75,
    roomType: 'LT',
    active: true,
  });
  tx.rooms.set('room-lt2', {
    id: 'room-lt2',
    roomNumber: '102',
    building: 'Aryabhata Block',
    floor: 1,
    capacity: 75,
    roomType: 'LT',
    active: true,
  });
  tx.rooms.set('room-lt3', {
    id: 'room-lt3',
    roomNumber: '103',
    building: 'Aryabhata Block',
    floor: 1,
    capacity: 75,
    roomType: 'LT',
    active: true,
  });
  tx.rooms.set('room-cr1', {
    id: 'room-cr1',
    roomNumber: '201',
    building: 'Ramanujan Block',
    floor: 2,
    capacity: 60,
    roomType: 'LT',
    active: true,
  });
  tx.rooms.set('room-cr2', {
    id: 'room-cr2',
    roomNumber: '202',
    building: 'Ramanujan Block',
    floor: 2,
    capacity: 60,
    roomType: 'LT',
    active: true,
  });
  tx.rooms.set('room-cr3', {
    id: 'room-cr3',
    roomNumber: '203',
    building: 'Ramanujan Block',
    floor: 2,
    capacity: 60,
    roomType: 'LT',
    active: true,
  });

  tx.rooms.set('room-lab1', {
    id: 'room-lab1',
    roomNumber: 'Computing Lab 1 (DSA/C)',
    building: 'Turing Wing',
    floor: 1,
    capacity: 35,
    roomType: 'P',
    active: true,
  });
  tx.rooms.set('room-lab2', {
    id: 'room-lab2',
    roomNumber: 'Computing Lab 2 (DBMS/OS)',
    building: 'Turing Wing',
    floor: 1,
    capacity: 35,
    roomType: 'P',
    active: true,
  });
  tx.rooms.set('room-lab3', {
    id: 'room-lab3',
    roomNumber: 'Systems & Hardware Lab (COA/Networks)',
    building: 'Turing Wing',
    floor: 2,
    capacity: 35,
    roomType: 'P',
    active: true,
  });

  // Retain legacy rooms for test compatibility
  tx.rooms.set('r-101', {
    id: 'r-101',
    roomNumber: '101',
    building: 'Engineering Block',
    floor: 1,
    capacity: 60,
    roomType: 'LT',
    active: true,
  });
  tx.rooms.set('r-102', {
    id: 'r-102',
    roomNumber: '102',
    building: 'Engineering Block',
    floor: 1,
    capacity: 60,
    roomType: 'LT',
    active: true,
  });
  tx.rooms.set('r-lab1', {
    id: 'r-lab1',
    roomNumber: 'Lab-A',
    building: 'CS Block',
    floor: 2,
    capacity: 35,
    roomType: 'P',
    active: true,
  });

  // 3. Faculty Members (D33)
  tx.teachers.set('t-1', {
    id: 't-1',
    empId: 'EMP-101',
    name: 'Prof. Rajesh Sharma',
    email: 'rajesh.sharma@uni.edu',
    department: 'Mathematics & Theory',
    active: true,
  });
  tx.teachers.set('t-2', {
    id: 't-2',
    empId: 'EMP-102',
    name: 'Dr. Sunita Verma',
    email: 'sunita.verma@uni.edu',
    department: 'Computer Science',
    active: true,
  });
  tx.teachers.set('t-3', {
    id: 't-3',
    empId: 'EMP-103',
    name: 'Rohit Singh',
    email: 'rohit.singh@uni.edu',
    department: 'Computer Science & Architecture',
    active: true,
  });
  tx.teachers.set('t-4', {
    id: 't-4',
    empId: 'EMP-104',
    name: 'Prof. S. Taruna',
    email: 's.taruna@uni.edu',
    department: 'Computer Science & Databases',
    active: true,
  });
  tx.teachers.set('t-5', {
    id: 't-5',
    empId: 'EMP-105',
    name: 'Dr. Ashish Jain',
    email: 'ashish.jain@uni.edu',
    department: 'Computer Science & Algorithms',
    active: true,
  });
  tx.teachers.set('t-6', {
    id: 't-6',
    empId: 'EMP-106',
    name: 'Prof. Ananya Sengupta',
    email: 'ananya.sengupta@uni.edu',
    department: 'Machine Learning & Data Science',
    active: true,
  });
  tx.teachers.set('t-7', {
    id: 't-7',
    empId: 'EMP-107',
    name: 'Dr. Sandeep Meena',
    email: 'sandeep.meena@uni.edu',
    department: 'Electronics & Hardware',
    active: true,
  });
  tx.teachers.set('t-8', {
    id: 't-8',
    empId: 'EMP-108',
    name: 'Manushi Gupta',
    email: 'manushi.gupta@uni.edu',
    department: 'Discrete Mathematics',
    active: true,
  });
  tx.teachers.set('t-9', {
    id: 't-9',
    empId: 'EMP-109',
    name: 'Dr. Amit Patel',
    email: 'amit.patel@uni.edu',
    department: 'Computer Systems',
    active: true,
  });
  tx.teachers.set('t-10', {
    id: 't-10',
    empId: 'EMP-110',
    name: 'Dr. Neha Kulkarni',
    email: 'neha.kulkarni@uni.edu',
    department: 'Networks & Communications',
    active: true,
  });
  tx.teachers.set('t-11', {
    id: 't-11',
    empId: 'EMP-111',
    name: 'Dr. Vikram Rao',
    email: 'vikram.rao@uni.edu',
    department: 'Theoretical Computer Science',
    active: true,
  });

  // 4. Cohort Hierarchy (Section -> Batches) & Elective Groups
  // Semester 1 (Three Sections: 1A, 1B, 1C)
  tx.sections.set('sec-1A', {
    id: 'sec-1A',
    termId: 'term-1',
    name: 'Section 1A',
    expectedCount: 60,
    active: true,
  });
  tx.batches.set('batch-1A1', {
    id: 'batch-1A1',
    sectionId: 'sec-1A',
    name: 'Batch 1A1',
    expectedCount: 30,
    active: true,
  });
  tx.batches.set('batch-1A2', {
    id: 'batch-1A2',
    sectionId: 'sec-1A',
    name: 'Batch 1A2',
    expectedCount: 30,
    active: true,
  });

  tx.sections.set('sec-1B', {
    id: 'sec-1B',
    termId: 'term-1',
    name: 'Section 1B',
    expectedCount: 60,
    active: true,
  });
  tx.batches.set('batch-1B1', {
    id: 'batch-1B1',
    sectionId: 'sec-1B',
    name: 'Batch 1B1',
    expectedCount: 30,
    active: true,
  });
  tx.batches.set('batch-1B2', {
    id: 'batch-1B2',
    sectionId: 'sec-1B',
    name: 'Batch 1B2',
    expectedCount: 30,
    active: true,
  });

  tx.sections.set('sec-1C', {
    id: 'sec-1C',
    termId: 'term-1',
    name: 'Section 1C',
    expectedCount: 60,
    active: true,
  });
  tx.batches.set('batch-1C1', {
    id: 'batch-1C1',
    sectionId: 'sec-1C',
    name: 'Batch 1C1',
    expectedCount: 30,
    active: true,
  });
  tx.batches.set('batch-1C2', {
    id: 'batch-1C2',
    sectionId: 'sec-1C',
    name: 'Batch 1C2',
    expectedCount: 30,
    active: true,
  });

  // Semester 3 (Three Sections: 3A, 3B, 3C)
  tx.sections.set('sec-3A', {
    id: 'sec-3A',
    termId: 'term-3',
    name: 'Section 3A',
    expectedCount: 60,
    active: true,
  });
  tx.batches.set('batch-3A1', {
    id: 'batch-3A1',
    sectionId: 'sec-3A',
    name: 'Batch 3A1',
    expectedCount: 30,
    active: true,
  });
  tx.batches.set('batch-3A2', {
    id: 'batch-3A2',
    sectionId: 'sec-3A',
    name: 'Batch 3A2',
    expectedCount: 30,
    active: true,
  });

  tx.sections.set('sec-3B', {
    id: 'sec-3B',
    termId: 'term-3',
    name: 'Section 3B',
    expectedCount: 60,
    active: true,
  });
  tx.batches.set('batch-3B1', {
    id: 'batch-3B1',
    sectionId: 'sec-3B',
    name: 'Batch 3B1',
    expectedCount: 30,
    active: true,
  });
  tx.batches.set('batch-3B2', {
    id: 'batch-3B2',
    sectionId: 'sec-3B',
    name: 'Batch 3B2',
    expectedCount: 30,
    active: true,
  });

  tx.sections.set('sec-3C', {
    id: 'sec-3C',
    termId: 'term-3',
    name: 'Section 3C',
    expectedCount: 60,
    active: true,
  });
  tx.batches.set('batch-3C1', {
    id: 'batch-3C1',
    sectionId: 'sec-3C',
    name: 'Batch 3C1',
    expectedCount: 30,
    active: true,
  });
  tx.batches.set('batch-3C2', {
    id: 'batch-3C2',
    sectionId: 'sec-3C',
    name: 'Batch 3C2',
    expectedCount: 30,
    active: true,
  });

  // Legacy cohorts for backward compatibility with existing tests
  tx.sections.set('sec-A', {
    id: 'sec-A',
    termId: 'term-3',
    name: 'Section A',
    expectedCount: 50,
    active: true,
  });
  tx.batches.set('batch-A1', {
    id: 'batch-A1',
    sectionId: 'sec-A',
    name: 'Batch A1',
    expectedCount: 25,
    active: true,
  });

  // Semester 5 (Three Sections: 5A, 5B, 5C)
  tx.sections.set('sec-5A', {
    id: 'sec-5A',
    termId: 'term-5',
    name: 'Section 5A',
    expectedCount: 55,
    active: true,
  });
  tx.batches.set('batch-5A1', {
    id: 'batch-5A1',
    sectionId: 'sec-5A',
    name: 'Batch 5A1',
    expectedCount: 28,
    active: true,
  });
  tx.batches.set('batch-5A2', {
    id: 'batch-5A2',
    sectionId: 'sec-5A',
    name: 'Batch 5A2',
    expectedCount: 27,
    active: true,
  });

  tx.sections.set('sec-5B', {
    id: 'sec-5B',
    termId: 'term-5',
    name: 'Section 5B',
    expectedCount: 55,
    active: true,
  });
  tx.batches.set('batch-5B1', {
    id: 'batch-5B1',
    sectionId: 'sec-5B',
    name: 'Batch 5B1',
    expectedCount: 28,
    active: true,
  });
  tx.batches.set('batch-5B2', {
    id: 'batch-5B2',
    sectionId: 'sec-5B',
    name: 'Batch 5B2',
    expectedCount: 27,
    active: true,
  });

  tx.sections.set('sec-5C', {
    id: 'sec-5C',
    termId: 'term-5',
    name: 'Section 5C',
    expectedCount: 55,
    active: true,
  });
  tx.batches.set('batch-5C1', {
    id: 'batch-5C1',
    sectionId: 'sec-5C',
    name: 'Batch 5C1',
    expectedCount: 28,
    active: true,
  });
  tx.batches.set('batch-5C2', {
    id: 'batch-5C2',
    sectionId: 'sec-5C',
    name: 'Batch 5C2',
    expectedCount: 27,
    active: true,
  });

  // Elective Group for Semester 5 (D08, D26)
  tx.electiveGroups.set('elec-ml', {
    id: 'elec-ml',
    termId: 'term-5',
    courseId: 'c-cs303',
    name: 'Elective: Applied Machine Learning',
    expectedCount: 30,
  });
  tx.electiveGroups.set('elg-ai', {
    id: 'elg-ai',
    termId: 'term-3',
    courseId: 'c-ds',
    name: 'Advanced Algorithms (Elective)',
  });

  // Students & Memberships (Realistic University Cohort with 2025BTECH Roll Numbers)
  tx.students.set('stud-1', {
    id: 'stud-1',
    rollNumber: '2025BTECH001',
    name: 'Charlie Brown',
    email: 'charlie@uni.edu',
    active: true,
  });
  tx.studentGroupMemberships.set('sgm-1', {
    id: 'sgm-1',
    studentId: 'stud-1',
    groupId: 'sec-3A',
    groupType: 'section',
    effectiveStartDate: '2026-08-01',
  });
  tx.studentGroupMemberships.set('sgm-2', {
    id: 'sgm-2',
    studentId: 'stud-1',
    groupId: 'batch-3A1',
    groupType: 'batch',
    effectiveStartDate: '2026-08-01',
  });
  tx.studentGroupMemberships.set('sgm-legacy-sec', {
    id: 'sgm-legacy-sec',
    studentId: 'stud-1',
    groupId: 'sec-A',
    groupType: 'section',
    effectiveStartDate: '2026-08-01',
  });
  tx.studentGroupMemberships.set('sgm-legacy-batch', {
    id: 'sgm-legacy-batch',
    studentId: 'stud-1',
    groupId: 'batch-A1',
    groupType: 'batch',
    effectiveStartDate: '2026-08-01',
  });
  tx.electiveAssignments.set('ea-1', {
    id: 'ea-1',
    studentId: 'stud-1',
    electiveGroupId: 'elg-ai',
    assignedBy: 'admin-1',
    assignedAt: '2026-08-15T00:00:00.000Z',
    status: 'active',
  });

  tx.students.set('stud-2', {
    id: 'stud-2',
    rollNumber: '2025BTECH002',
    name: 'Aarav Sharma',
    email: 'aarav.sharma@uni.edu',
    active: true,
  });
  tx.studentGroupMemberships.set('sgm-3', {
    id: 'sgm-3',
    studentId: 'stud-2',
    groupId: 'sec-1A',
    groupType: 'section',
    effectiveStartDate: '2026-08-01',
  });
  tx.studentGroupMemberships.set('sgm-4', {
    id: 'sgm-4',
    studentId: 'stud-2',
    groupId: 'batch-1A1',
    groupType: 'batch',
    effectiveStartDate: '2026-08-01',
  });

  tx.students.set('stud-3', {
    id: 'stud-3',
    rollNumber: '2025BTECH003',
    name: 'Diya Patel',
    email: 'diya.patel@uni.edu',
    active: true,
  });
  tx.studentGroupMemberships.set('sgm-5', {
    id: 'sgm-5',
    studentId: 'stud-3',
    groupId: 'sec-5A',
    groupType: 'section',
    effectiveStartDate: '2026-08-01',
  });
  tx.studentGroupMemberships.set('sgm-6', {
    id: 'sgm-6',
    studentId: 'stud-3',
    groupId: 'batch-5A1',
    groupType: 'batch',
    effectiveStartDate: '2026-08-01',
  });
  tx.electiveAssignments.set('ea-2', {
    id: 'ea-2',
    studentId: 'stud-3',
    electiveGroupId: 'elec-ml',
    assignedBy: 'admin-1',
    assignedAt: '2026-08-15T00:00:00.000Z',
    status: 'active',
  });

  // Additional Realistic Mock Students Cohort (2025BTECH series)
  const mockRoster = [
    { id: 'stud-4', roll: '2025BTECH004', name: 'Rohan Verma', email: 'rohan.verma@uni.edu', sec: 'sec-3A', batch: 'batch-3A1', elec: 'elg-ai' },
    { id: 'stud-5', roll: '2025BTECH005', name: 'Ananya Iyer', email: 'ananya.iyer@uni.edu', sec: 'sec-3A', batch: 'batch-3A2', elec: 'elg-ai' },
    { id: 'stud-6', roll: '2025BTECH006', name: 'Kavya Nair', email: 'kavya.nair@uni.edu', sec: 'sec-3A', batch: 'batch-3A2', elec: null },
    { id: 'stud-7', roll: '2025BTECH007', name: 'Aditya Kulkarni', email: 'aditya.k@uni.edu', sec: 'sec-1A', batch: 'batch-1A1', elec: null },
    { id: 'stud-8', roll: '2025BTECH008', name: 'Pooja Reddy', email: 'pooja.reddy@uni.edu', sec: 'sec-1A', batch: 'batch-1A2', elec: null },
    { id: 'stud-9', roll: '2025BTECH009', name: 'Siddharth Rao', email: 'siddharth.rao@uni.edu', sec: 'sec-1A', batch: 'batch-1A2', elec: null },
    { id: 'stud-10', roll: '2025BTECH010', name: 'Meera Deshmukh', email: 'meera.d@uni.edu', sec: 'sec-5A', batch: 'batch-5A1', elec: 'elec-ml' },
    { id: 'stud-11', roll: '2025BTECH011', name: 'Vikram Singhania', email: 'vikram.s@uni.edu', sec: 'sec-5A', batch: 'batch-5A2', elec: 'elec-ml' },
    { id: 'stud-12', roll: '2025BTECH012', name: 'Sneha Mukherjee', email: 'sneha.m@uni.edu', sec: 'sec-5A', batch: 'batch-5A2', elec: null },
    { id: 'stud-13', roll: '2025BTECH013', name: 'Aryan Joshi', email: 'aryan.joshi@uni.edu', sec: 'sec-3A', batch: 'batch-3A1', elec: 'elg-ai' },
    { id: 'stud-14', roll: '2025BTECH014', name: 'Tanvi Gokhale', email: 'tanvi.g@uni.edu', sec: 'sec-3A', batch: 'batch-3A2', elec: 'elg-ai' },
    { id: 'stud-15', roll: '2025BTECH015', name: 'Nikhil Saxena', email: 'nikhil.saxena@uni.edu', sec: 'sec-1A', batch: 'batch-1A1', elec: null },
  ];

  for (const s of mockRoster) {
    tx.students.set(s.id, {
      id: s.id,
      rollNumber: s.roll,
      name: s.name,
      email: s.email,
      active: true,
    });
    tx.studentGroupMemberships.set(`sgm-${s.id}-sec`, {
      id: `sgm-${s.id}-sec`,
      studentId: s.id,
      groupId: s.sec,
      groupType: 'section',
      effectiveStartDate: '2026-08-01',
    });
    tx.studentGroupMemberships.set(`sgm-${s.id}-batch`, {
      id: `sgm-${s.id}-batch`,
      studentId: s.id,
      groupId: s.batch,
      groupType: 'batch',
      effectiveStartDate: '2026-08-01',
    });
    if (s.elec) {
      tx.electiveAssignments.set(`ea-${s.id}`, {
        id: `ea-${s.id}`,
        studentId: s.id,
        electiveGroupId: s.elec,
        assignedBy: 'admin-1',
        assignedAt: '2026-08-15T00:00:00.000Z',
        status: 'active',
      });
    }
  }

  // 5. Curriculum, Contact Hours & Offerings (D06, D44)
  // Semester 1
  tx.courses.set('c-cs101', {
    id: 'c-cs101',
    code: 'CS101',
    name: 'Introduction to Programming & C',
    termId: 'term-1',
    department: 'Computer Science',
    lectureHours: 3,
    tutorialHours: 0,
    practicalHours: 2,
    requiredRoomType: 'LT',
  });
  tx.courseOfferings.set('off-cs101', {
    id: 'off-cs101',
    courseId: 'c-cs101',
    termId: 'term-1',
    teacherId: 't-2',
    targetType: 'section',
    targetId: 'sec-1A',
  });

  tx.courses.set('c-ma101', {
    id: 'c-ma101',
    code: 'MA101',
    name: 'Calculus & Linear Algebra',
    termId: 'term-1',
    department: 'Mathematics & Theory',
    lectureHours: 3,
    tutorialHours: 1,
    practicalHours: 0,
    requiredRoomType: 'LT',
  });
  tx.courseOfferings.set('off-ma101', {
    id: 'off-ma101',
    courseId: 'c-ma101',
    termId: 'term-1',
    teacherId: 't-1',
    targetType: 'section',
    targetId: 'sec-1A',
  });

  tx.courses.set('c-ec101', {
    id: 'c-ec101',
    code: 'EC101',
    name: 'Digital Electronics',
    termId: 'term-1',
    department: 'Electronics & Hardware',
    lectureHours: 3,
    tutorialHours: 0,
    practicalHours: 2,
    requiredRoomType: 'LT',
  });
  tx.courseOfferings.set('off-ec101', {
    id: 'off-ec101',
    courseId: 'c-ec101',
    termId: 'term-1',
    teacherId: 't-7',
    targetType: 'section',
    targetId: 'sec-1A',
  });

  // Semester 3
  tx.courses.set('c-cs201', {
    id: 'c-cs201',
    code: 'CS201',
    name: 'Data Structures & Algorithms',
    termId: 'term-3',
    department: 'Computer Science',
    lectureHours: 3,
    tutorialHours: 1,
    practicalHours: 2,
    requiredRoomType: 'LT',
  });
  tx.courseOfferings.set('off-cs201', {
    id: 'off-cs201',
    courseId: 'c-cs201',
    termId: 'term-3',
    teacherId: 't-5',
    targetType: 'section',
    targetId: 'sec-3A',
  });

  tx.courses.set('c-cs202', {
    id: 'c-cs202',
    code: 'CS202',
    name: 'Computer Organization & Architecture',
    termId: 'term-3',
    department: 'Computer Science',
    lectureHours: 3,
    tutorialHours: 0,
    practicalHours: 0,
    requiredRoomType: 'LT',
  });
  tx.courseOfferings.set('off-cs202', {
    id: 'off-cs202',
    courseId: 'c-cs202',
    termId: 'term-3',
    teacherId: 't-3',
    targetType: 'section',
    targetId: 'sec-3A',
  });

  tx.courses.set('c-cs203', {
    id: 'c-cs203',
    code: 'CS203',
    name: 'Database Management Systems',
    termId: 'term-3',
    department: 'Computer Science',
    lectureHours: 3,
    tutorialHours: 0,
    practicalHours: 2,
    requiredRoomType: 'LT',
  });
  tx.courseOfferings.set('off-cs203', {
    id: 'off-cs203',
    courseId: 'c-cs203',
    termId: 'term-3',
    teacherId: 't-4',
    targetType: 'section',
    targetId: 'sec-3A',
  });

  // Legacy course & offering for test backward compatibility
  tx.courses.set('c-ds', {
    id: 'c-ds',
    code: 'CS200',
    name: 'Data Structures',
    termId: 'term-3',
    department: 'Computer Science',
    lectureHours: 2,
    tutorialHours: 0,
    practicalHours: 2,
    requiredRoomType: 'LT',
  });
  tx.courseOfferings.set('off-ds-lec', {
    id: 'off-ds-lec',
    courseId: 'c-ds',
    termId: 'term-3',
    teacherId: 't-1',
    targetType: 'section',
    targetId: 'sec-A',
  });

  // Semester 5
  tx.courses.set('c-cs301', {
    id: 'c-cs301',
    code: 'CS301',
    name: 'Operating Systems & Systems Programming',
    termId: 'term-5',
    department: 'Computer Science',
    lectureHours: 3,
    tutorialHours: 0,
    practicalHours: 2,
    requiredRoomType: 'LT',
  });
  tx.courseOfferings.set('off-cs301', {
    id: 'off-cs301',
    courseId: 'c-cs301',
    termId: 'term-5',
    teacherId: 't-3',
    targetType: 'section',
    targetId: 'sec-5A',
  });

  tx.courses.set('c-cs302', {
    id: 'c-cs302',
    code: 'CS302',
    name: 'Theory of Computation',
    termId: 'term-5',
    department: 'Computer Science',
    lectureHours: 3,
    tutorialHours: 1,
    practicalHours: 0,
    requiredRoomType: 'LT',
  });
  tx.courseOfferings.set('off-cs302', {
    id: 'off-cs302',
    courseId: 'c-cs302',
    termId: 'term-5',
    teacherId: 't-1',
    targetType: 'section',
    targetId: 'sec-5A',
  });

  tx.courses.set('c-cs303', {
    id: 'c-cs303',
    code: 'CS303-EL',
    name: 'Elective: Applied Machine Learning',
    termId: 'term-5',
    department: 'Machine Learning & Data Science',
    lectureHours: 3,
    tutorialHours: 0,
    practicalHours: 2,
    requiredRoomType: 'LT',
  });
  tx.courseOfferings.set('off-cs303', {
    id: 'off-cs303',
    courseId: 'c-cs303',
    termId: 'term-5',
    teacherId: 't-6',
    targetType: 'elective_group',
    targetId: 'elec-ml',
  });

  // 6. Seed Timetable Version 1 (Pre-Populated Published Schedule)
  const v1Id = 'v-published-1';
  tx.timetableVersions.set(v1Id, {
    id: v1Id,
    termId: 'term-3',
    versionNumber: 1,
    status: 'published',
    inputRevision: 'rev-seed-v1',
    createdBy: 'admin-1',
    createdAt: '2026-08-25T00:00:00.000Z',
    publishedAt: '2026-08-25T00:00:00.000Z',
  });

  // Conflict-free master schedule definitions across Mon-Fri
  const seedClasses: ScheduledClass[] = [
    // --- SEMESTER 1 ---
    // CS101: Dr. Sunita Verma (t-2), room-lt1 (Lectures), room-lab1 (Labs)
    { id: 'sc-v1-cs101-l1', versionId: v1Id, courseOfferingId: 'off-cs101', termId: 'term-1', dayOfWeek: 1, startSlot: 1, duration: 1, activityType: 'L', teacherId: 't-2', roomId: 'room-lt1', targetType: 'section', targetId: 'sec-1A', status: 'scheduled' },
    { id: 'sc-v1-cs101-l2', versionId: v1Id, courseOfferingId: 'off-cs101', termId: 'term-1', dayOfWeek: 2, startSlot: 3, duration: 1, activityType: 'L', teacherId: 't-2', roomId: 'room-lt1', targetType: 'section', targetId: 'sec-1A', status: 'scheduled' },
    { id: 'sc-v1-cs101-l3', versionId: v1Id, courseOfferingId: 'off-cs101', termId: 'term-1', dayOfWeek: 3, startSlot: 1, duration: 1, activityType: 'L', teacherId: 't-2', roomId: 'room-lt1', targetType: 'section', targetId: 'sec-1A', status: 'scheduled' },
    { id: 'sc-v1-cs101-p1', versionId: v1Id, courseOfferingId: 'off-cs101', termId: 'term-1', dayOfWeek: 1, startSlot: 5, duration: 2, activityType: 'P', teacherId: 't-2', roomId: 'room-lab1', targetType: 'batch', targetId: 'batch-1A1', status: 'scheduled' },
    { id: 'sc-v1-cs101-p2', versionId: v1Id, courseOfferingId: 'off-cs101', termId: 'term-1', dayOfWeek: 2, startSlot: 5, duration: 2, activityType: 'P', teacherId: 't-2', roomId: 'room-lab1', targetType: 'batch', targetId: 'batch-1A2', status: 'scheduled' },

    // MA101: Prof. Rajesh Sharma (t-1), room-lt1
    { id: 'sc-v1-ma101-l1', versionId: v1Id, courseOfferingId: 'off-ma101', termId: 'term-1', dayOfWeek: 1, startSlot: 2, duration: 1, activityType: 'L', teacherId: 't-1', roomId: 'room-lt1', targetType: 'section', targetId: 'sec-1A', status: 'scheduled' },
    { id: 'sc-v1-ma101-l2', versionId: v1Id, courseOfferingId: 'off-ma101', termId: 'term-1', dayOfWeek: 2, startSlot: 1, duration: 1, activityType: 'L', teacherId: 't-1', roomId: 'room-lt1', targetType: 'section', targetId: 'sec-1A', status: 'scheduled' },
    { id: 'sc-v1-ma101-l3', versionId: v1Id, courseOfferingId: 'off-ma101', termId: 'term-1', dayOfWeek: 3, startSlot: 3, duration: 1, activityType: 'L', teacherId: 't-1', roomId: 'room-lt1', targetType: 'section', targetId: 'sec-1A', status: 'scheduled' },
    { id: 'sc-v1-ma101-t1', versionId: v1Id, courseOfferingId: 'off-ma101', termId: 'term-1', dayOfWeek: 4, startSlot: 1, duration: 1, activityType: 'T', teacherId: 't-1', roomId: 'room-lt1', targetType: 'section', targetId: 'sec-1A', status: 'scheduled' },

    // EC101: Dr. Sandeep Meena (t-7), room-cr1 (Lectures), room-lab3 (Labs)
    { id: 'sc-v1-ec101-l1', versionId: v1Id, courseOfferingId: 'off-ec101', termId: 'term-1', dayOfWeek: 1, startSlot: 3, duration: 1, activityType: 'L', teacherId: 't-7', roomId: 'room-cr1', targetType: 'section', targetId: 'sec-1A', status: 'scheduled' },
    { id: 'sc-v1-ec101-l2', versionId: v1Id, courseOfferingId: 'off-ec101', termId: 'term-1', dayOfWeek: 2, startSlot: 2, duration: 1, activityType: 'L', teacherId: 't-7', roomId: 'room-cr1', targetType: 'section', targetId: 'sec-1A', status: 'scheduled' },
    { id: 'sc-v1-ec101-l3', versionId: v1Id, courseOfferingId: 'off-ec101', termId: 'term-1', dayOfWeek: 3, startSlot: 2, duration: 1, activityType: 'L', teacherId: 't-7', roomId: 'room-cr1', targetType: 'section', targetId: 'sec-1A', status: 'scheduled' },
    { id: 'sc-v1-ec101-p1', versionId: v1Id, courseOfferingId: 'off-ec101', termId: 'term-1', dayOfWeek: 1, startSlot: 5, duration: 2, activityType: 'P', teacherId: 't-7', roomId: 'room-lab3', targetType: 'batch', targetId: 'batch-1A2', status: 'scheduled' },
    { id: 'sc-v1-ec101-p2', versionId: v1Id, courseOfferingId: 'off-ec101', termId: 'term-1', dayOfWeek: 2, startSlot: 5, duration: 2, activityType: 'P', teacherId: 't-7', roomId: 'room-lab3', targetType: 'batch', targetId: 'batch-1A1', status: 'scheduled' },

    // --- SEMESTER 3 ---
    // CS201: Dr. Vikram Rao (t-5), room-lt2 (Lectures/Tutorial), room-lab1 (Labs)
    { id: 'sc-v1-cs201-l1', versionId: v1Id, courseOfferingId: 'off-cs201', termId: 'term-3', dayOfWeek: 1, startSlot: 1, duration: 1, activityType: 'L', teacherId: 't-5', roomId: 'room-lt2', targetType: 'section', targetId: 'sec-3A', status: 'scheduled' },
    { id: 'sc-v1-cs201-l2', versionId: v1Id, courseOfferingId: 'off-cs201', termId: 'term-3', dayOfWeek: 2, startSlot: 2, duration: 1, activityType: 'L', teacherId: 't-5', roomId: 'room-lt2', targetType: 'section', targetId: 'sec-3A', status: 'scheduled' },
    { id: 'sc-v1-cs201-l3', versionId: v1Id, courseOfferingId: 'off-cs201', termId: 'term-3', dayOfWeek: 3, startSlot: 1, duration: 1, activityType: 'L', teacherId: 't-5', roomId: 'room-lt2', targetType: 'section', targetId: 'sec-3A', status: 'scheduled' },
    { id: 'sc-v1-cs201-t1', versionId: v1Id, courseOfferingId: 'off-cs201', termId: 'term-3', dayOfWeek: 4, startSlot: 2, duration: 1, activityType: 'T', teacherId: 't-5', roomId: 'room-lt2', targetType: 'section', targetId: 'sec-3A', status: 'scheduled' },
    { id: 'sc-v1-cs201-p1', versionId: v1Id, courseOfferingId: 'off-cs201', termId: 'term-3', dayOfWeek: 1, startSlot: 7, duration: 2, activityType: 'P', teacherId: 't-5', roomId: 'room-lab1', targetType: 'batch', targetId: 'batch-3A1', status: 'scheduled' },
    { id: 'sc-v1-cs201-p2', versionId: v1Id, courseOfferingId: 'off-cs201', termId: 'term-3', dayOfWeek: 3, startSlot: 5, duration: 2, activityType: 'P', teacherId: 't-5', roomId: 'room-lab1', targetType: 'batch', targetId: 'batch-3A2', status: 'scheduled' },

    // CS202: Dr. Amit Patel (t-3), room-cr2
    { id: 'sc-v1-cs202-l1', versionId: v1Id, courseOfferingId: 'off-cs202', termId: 'term-3', dayOfWeek: 1, startSlot: 2, duration: 1, activityType: 'L', teacherId: 't-3', roomId: 'room-cr2', targetType: 'section', targetId: 'sec-3A', status: 'scheduled' },
    { id: 'sc-v1-cs202-l2', versionId: v1Id, courseOfferingId: 'off-cs202', termId: 'term-3', dayOfWeek: 2, startSlot: 3, duration: 1, activityType: 'L', teacherId: 't-3', roomId: 'room-cr2', targetType: 'section', targetId: 'sec-3A', status: 'scheduled' },
    { id: 'sc-v1-cs202-l3', versionId: v1Id, courseOfferingId: 'off-cs202', termId: 'term-3', dayOfWeek: 3, startSlot: 2, duration: 1, activityType: 'L', teacherId: 't-3', roomId: 'room-cr2', targetType: 'section', targetId: 'sec-3A', status: 'scheduled' },

    // CS203: Dr. Neha Kulkarni (t-4), room-lt2 (Lectures), room-lab2 (Labs)
    { id: 'sc-v1-cs203-l1', versionId: v1Id, courseOfferingId: 'off-cs203', termId: 'term-3', dayOfWeek: 1, startSlot: 3, duration: 1, activityType: 'L', teacherId: 't-4', roomId: 'room-lt2', targetType: 'section', targetId: 'sec-3A', status: 'scheduled' },
    { id: 'sc-v1-cs203-l2', versionId: v1Id, courseOfferingId: 'off-cs203', termId: 'term-3', dayOfWeek: 2, startSlot: 1, duration: 1, activityType: 'L', teacherId: 't-4', roomId: 'room-lt2', targetType: 'section', targetId: 'sec-3A', status: 'scheduled' },
    { id: 'sc-v1-cs203-l3', versionId: v1Id, courseOfferingId: 'off-cs203', termId: 'term-3', dayOfWeek: 3, startSlot: 3, duration: 1, activityType: 'L', teacherId: 't-4', roomId: 'room-lt2', targetType: 'section', targetId: 'sec-3A', status: 'scheduled' },
    { id: 'sc-v1-cs203-p1', versionId: v1Id, courseOfferingId: 'off-cs203', termId: 'term-3', dayOfWeek: 1, startSlot: 7, duration: 2, activityType: 'P', teacherId: 't-4', roomId: 'room-lab2', targetType: 'batch', targetId: 'batch-3A2', status: 'scheduled' },
    { id: 'sc-v1-cs203-p2', versionId: v1Id, courseOfferingId: 'off-cs203', termId: 'term-3', dayOfWeek: 3, startSlot: 5, duration: 2, activityType: 'P', teacherId: 't-4', roomId: 'room-lab2', targetType: 'batch', targetId: 'batch-3A1', status: 'scheduled' },

    // --- SEMESTER 5 ---
    // CS301: Dr. Amit Patel (t-3), room-cr1 (Lectures), room-lab2 (Labs)
    { id: 'sc-v1-cs301-l1', versionId: v1Id, courseOfferingId: 'off-cs301', termId: 'term-5', dayOfWeek: 1, startSlot: 1, duration: 1, activityType: 'L', teacherId: 't-3', roomId: 'room-cr1', targetType: 'section', targetId: 'sec-5A', status: 'scheduled' },
    { id: 'sc-v1-cs301-l2', versionId: v1Id, courseOfferingId: 'off-cs301', termId: 'term-5', dayOfWeek: 2, startSlot: 1, duration: 1, activityType: 'L', teacherId: 't-3', roomId: 'room-cr1', targetType: 'section', targetId: 'sec-5A', status: 'scheduled' },
    { id: 'sc-v1-cs301-l3', versionId: v1Id, courseOfferingId: 'off-cs301', termId: 'term-5', dayOfWeek: 3, startSlot: 3, duration: 1, activityType: 'L', teacherId: 't-3', roomId: 'room-cr1', targetType: 'section', targetId: 'sec-5A', status: 'scheduled' },
    { id: 'sc-v1-cs301-p1', versionId: v1Id, courseOfferingId: 'off-cs301', termId: 'term-5', dayOfWeek: 2, startSlot: 7, duration: 2, activityType: 'P', teacherId: 't-3', roomId: 'room-lab2', targetType: 'batch', targetId: 'batch-5A1', status: 'scheduled' },
    { id: 'sc-v1-cs301-p2', versionId: v1Id, courseOfferingId: 'off-cs301', termId: 'term-5', dayOfWeek: 3, startSlot: 7, duration: 2, activityType: 'P', teacherId: 't-3', roomId: 'room-lab2', targetType: 'batch', targetId: 'batch-5A2', status: 'scheduled' },

    // CS302: Prof. Rajesh Sharma (t-1), room-cr2
    { id: 'sc-v1-cs302-l1', versionId: v1Id, courseOfferingId: 'off-cs302', termId: 'term-5', dayOfWeek: 1, startSlot: 3, duration: 1, activityType: 'L', teacherId: 't-1', roomId: 'room-cr2', targetType: 'section', targetId: 'sec-5A', status: 'scheduled' },
    { id: 'sc-v1-cs302-l2', versionId: v1Id, courseOfferingId: 'off-cs302', termId: 'term-5', dayOfWeek: 2, startSlot: 2, duration: 1, activityType: 'L', teacherId: 't-1', roomId: 'room-cr2', targetType: 'section', targetId: 'sec-5A', status: 'scheduled' },
    { id: 'sc-v1-cs302-l3', versionId: v1Id, courseOfferingId: 'off-cs302', termId: 'term-5', dayOfWeek: 3, startSlot: 1, duration: 1, activityType: 'L', teacherId: 't-1', roomId: 'room-cr2', targetType: 'section', targetId: 'sec-5A', status: 'scheduled' },
    { id: 'sc-v1-cs302-t1', versionId: v1Id, courseOfferingId: 'off-cs302', termId: 'term-5', dayOfWeek: 4, startSlot: 3, duration: 1, activityType: 'T', teacherId: 't-1', roomId: 'room-cr2', targetType: 'section', targetId: 'sec-5A', status: 'scheduled' },

    // CS303-EL: Prof. Ananya Sengupta (t-6), room-lt2 (Lectures), room-lab1 (Labs)
    { id: 'sc-v1-cs303-l1', versionId: v1Id, courseOfferingId: 'off-cs303', termId: 'term-5', dayOfWeek: 1, startSlot: 2, duration: 1, activityType: 'L', teacherId: 't-6', roomId: 'room-lt2', targetType: 'elective_group', targetId: 'elec-ml', status: 'scheduled' },
    { id: 'sc-v1-cs303-l2', versionId: v1Id, courseOfferingId: 'off-cs303', termId: 'term-5', dayOfWeek: 2, startSlot: 3, duration: 1, activityType: 'L', teacherId: 't-6', roomId: 'room-lt2', targetType: 'elective_group', targetId: 'elec-ml', status: 'scheduled' },
    { id: 'sc-v1-cs303-l3', versionId: v1Id, courseOfferingId: 'off-cs303', termId: 'term-5', dayOfWeek: 3, startSlot: 2, duration: 1, activityType: 'L', teacherId: 't-6', roomId: 'room-lt2', targetType: 'elective_group', targetId: 'elec-ml', status: 'scheduled' },
    { id: 'sc-v1-cs303-p1', versionId: v1Id, courseOfferingId: 'off-cs303', termId: 'term-5', dayOfWeek: 4, startSlot: 5, duration: 2, activityType: 'P', teacherId: 't-6', roomId: 'room-lab1', targetType: 'elective_group', targetId: 'elec-ml', status: 'scheduled' },

    // --- LEGACY FIXTURES ON FRIDAY (Day 5) for test compatibility ---
    { id: 'sc-legacy-ds-1', versionId: v1Id, courseOfferingId: 'off-ds-lec', termId: 'term-3', dayOfWeek: 5, startSlot: 1, duration: 1, activityType: 'L', teacherId: 't-1', roomId: 'r-101', targetType: 'section', targetId: 'sec-A', status: 'scheduled' },
    { id: 'sc-legacy-ds-2', versionId: v1Id, courseOfferingId: 'off-ds-lec', termId: 'term-3', dayOfWeek: 5, startSlot: 3, duration: 1, activityType: 'L', teacherId: 't-1', roomId: 'r-101', targetType: 'section', targetId: 'sec-A', status: 'scheduled' },
    { id: 'sc-legacy-ds-p', versionId: v1Id, courseOfferingId: 'off-ds-lec', termId: 'term-3', dayOfWeek: 5, startSlot: 5, duration: 2, activityType: 'P', teacherId: 't-1', roomId: 'r-lab1', targetType: 'section', targetId: 'sec-A', status: 'scheduled' },
  ];

  for (const sc of seedClasses) {
    tx.scheduledClasses.set(sc.id, sc);
  }

  // Generate dated occurrences for 14 days starting from term start date (2026-09-01)
  const startDate = new Date('2026-09-01T00:00:00.000Z');
  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const currentDate = new Date(startDate.getTime() + dayOffset * 86400000);
    const dayOfWeek = currentDate.getUTCDay() === 0 ? 7 : currentDate.getUTCDay();
    const dateStr = currentDate.toISOString().split('T')[0];

    if (dayOfWeek < 1 || dayOfWeek > 5) continue;

    for (const cls of tx.scheduledClasses.values()) {
      if (cls.dayOfWeek === dayOfWeek) {
        const occId = `occ-${dateStr}-${cls.id}`;
        tx.classOccurrences.set(occId, {
          id: occId,
          versionId: cls.versionId,
          recurringClassId: cls.id,
          courseOfferingId: cls.courseOfferingId,
          termId: cls.termId,
          date: dateStr,
          dayOfWeek,
          startSlot: cls.startSlot,
          duration: cls.duration,
          activityType: cls.activityType,
          teacherId: cls.teacherId,
          roomId: cls.roomId,
          targetType: cls.targetType,
          targetId: cls.targetId,
          status: 'scheduled',
        });
      }
    }
  }
}

/**
 * Populates a clean, simple, single-cohort mock setup for verifying that the solver
 * executes and mounts to the DOM with deterministic pre-calculated expectations.
 *
 * Scope:
 * - 1 Academic Term: 'term-simple' (Semester 1)
 * - 2 Rooms:
 *   - 'room-101' (LT, capacity 60)
 *   - 'room-lab1' (P, capacity 35)
 * - 2 Teachers:
 *   - 't-1': Prof. Rajesh Sharma (Mathematics & Theory)
 *   - 't-2': Dr. Sunita Verma (Computer Science)
 * - 1 Section: 'sec-simple' (Section 1A, 50 students)
 * - 2 Batches:
 *   - 'batch-1A1' (Batch 1A1, 25 students)
 *   - 'batch-1A2' (Batch 1A2, 25 students)
 * - 2 Courses:
 *   - 'c-math': MA101 Mathematics (2 Lectures, 1 Tutorial, 0 Labs -> Total 3 slots)
 *   - 'c-cs': CS101 Intro to Computing (2 Lectures, 0 Tutorials, 2 Labs -> Total 4 slots)
 * - 3 Offerings:
 *   - 'off-math-lec': MA101 | Prof. Rajesh Sharma (t-1) | Section 1A | Component: L+T
 *   - 'off-cs-lec': CS101 | Dr. Sunita Verma (t-2) | Section 1A | Component: L
 *   - 'off-cs-lab': CS101 | Dr. Sunita Verma (t-2) | Batch 1A1 | Component: P
 *
 * Pre-calculated Solver Expectation:
 * - Exactly 6 scheduled classes:
 *   - MA101: 2 Lectures (duration 1) + 1 Tutorial (duration 1) in room-101
 *   - CS101: 2 Lectures (duration 1) in room-101
 *   - CS101: 1 Practical Lab (duration 2 consecutive slots) in room-lab1
 * - Zero teacher clashes, zero room clashes, zero period 4 (lunch) violations.
 */
export function populateSimpleMockData(tx: RepositoryDataState): void {
  // Clear existing schedules and occurrences
  tx.timetableVersions.clear();
  tx.scheduledClasses.clear();
  tx.classOccurrences.clear();
  tx.classOccurrenceEvents.clear();
  tx.courses.clear();
  tx.courseOfferings.clear();
  tx.sections.clear();
  tx.batches.clear();
  tx.electiveGroups.clear();
  tx.electiveAssignments.clear();
  tx.academicTerms.clear();
  tx.rooms.clear();
  tx.teachers.clear();

  // 1. Single Term
  tx.academicTerms.set('term-simple', {
    id: 'term-simple',
    yearLabel: '2026-2027',
    semesterNumber: 1,
    startDate: '2026-09-01',
    endDate: '2026-12-20',
    cycle: 'odd',
    status: 'active',
  });
  // Keep term-3 alias for any test expecting term-3
  tx.academicTerms.set('term-3', {
    id: 'term-3',
    yearLabel: '2026-2027',
    semesterNumber: 3,
    startDate: '2026-09-01',
    endDate: '2026-12-20',
    cycle: 'odd',
    status: 'active',
  });

  // 2. Simple Rooms
  tx.rooms.set('room-101', {
    id: 'room-101',
    roomNumber: '101',
    building: 'Science Block',
    floor: 1,
    capacity: 60,
    roomType: 'LT',
    active: true,
  });
  tx.rooms.set('room-lab1', {
    id: 'room-lab1',
    roomNumber: 'Computing Lab 1',
    building: 'Turing Wing',
    floor: 1,
    capacity: 35,
    roomType: 'P',
    active: true,
  });
  // Keep legacy room aliases for test compatibility
  tx.rooms.set('r-101', {
    id: 'r-101',
    roomNumber: '101',
    building: 'Science Block',
    floor: 1,
    capacity: 60,
    roomType: 'LT',
    active: true,
  });
  tx.rooms.set('r-lab1', {
    id: 'r-lab1',
    roomNumber: 'Lab-A',
    building: 'Turing Wing',
    floor: 1,
    capacity: 35,
    roomType: 'P',
    active: true,
  });

  // 3. Simple Teachers
  tx.teachers.set('t-1', {
    id: 't-1',
    empId: 'EMP-101',
    name: 'Prof. Rajesh Sharma',
    email: 'rajesh.sharma@uni.edu',
    department: 'Mathematics & Theory',
    active: true,
  });
  tx.teachers.set('t-2', {
    id: 't-2',
    empId: 'EMP-102',
    name: 'Dr. Sunita Verma',
    email: 'sunita.verma@uni.edu',
    department: 'Computer Science',
    active: true,
  });

  // 4. Cohorts (1 Section, 2 Batches)
  tx.sections.set('sec-1A', {
    id: 'sec-1A',
    termId: 'term-simple',
    name: 'Section 1A',
    expectedCount: 50,
    active: true,
  });
  tx.sections.set('sec-A', {
    id: 'sec-A',
    termId: 'term-3',
    name: 'Section A',
    expectedCount: 50,
    active: true,
  });

  tx.batches.set('batch-1A1', {
    id: 'batch-1A1',
    sectionId: 'sec-1A',
    name: 'Batch 1A1',
    expectedCount: 25,
    active: true,
  });
  tx.batches.set('batch-1A2', {
    id: 'batch-1A2',
    sectionId: 'sec-1A',
    name: 'Batch 1A2',
    expectedCount: 25,
    active: true,
  });
  tx.batches.set('batch-A1', {
    id: 'batch-A1',
    sectionId: 'sec-A',
    name: 'Batch A1',
    expectedCount: 25,
    active: true,
  });

  // 5. Courses
  tx.courses.set('c-math', {
    id: 'c-math',
    code: 'MA101',
    name: 'Calculus & Linear Algebra',
    termId: 'term-simple',
    department: 'Mathematics & Theory',
    lectureHours: 2,
    tutorialHours: 1,
    practicalHours: 0,
    requiredRoomType: 'LT',
  });
  tx.courses.set('c-cs', {
    id: 'c-cs',
    code: 'CS101',
    name: 'Introduction to Programming',
    termId: 'term-simple',
    department: 'Computer Science',
    lectureHours: 2,
    tutorialHours: 0,
    practicalHours: 2,
    requiredRoomType: 'LT',
  });
  // Legacy course for test compatibility
  tx.courses.set('c-ds', {
    id: 'c-ds',
    code: 'CS200',
    name: 'Data Structures',
    termId: 'term-3',
    department: 'Computer Science',
    lectureHours: 2,
    tutorialHours: 0,
    practicalHours: 2,
    requiredRoomType: 'LT',
  });

  // 6. Course Offerings
  tx.courseOfferings.set('off-math-lec', {
    id: 'off-math-lec',
    courseId: 'c-math',
    termId: 'term-simple',
    teacherId: 't-1',
    targetType: 'section',
    targetId: 'sec-1A',
  });
  tx.courseOfferings.set('off-cs-lec', {
    id: 'off-cs-lec',
    courseId: 'c-cs',
    termId: 'term-simple',
    teacherId: 't-2',
    targetType: 'section',
    targetId: 'sec-1A',
    component: 'L',
  });
  tx.courseOfferings.set('off-cs-lab', {
    id: 'off-cs-lab',
    courseId: 'c-cs',
    termId: 'term-simple',
    teacherId: 't-2',
    targetType: 'batch',
    targetId: 'batch-1A1',
    component: 'P',
  });
  tx.courseOfferings.set('off-ds-lec', {
    id: 'off-ds-lec',
    courseId: 'c-ds',
    termId: 'term-3',
    teacherId: 't-1',
    targetType: 'section',
    targetId: 'sec-A',
  });

  // 7. Student Charlie Brown
  tx.students.set('stud-1', {
    id: 'stud-1',
    rollNumber: '2025BTECH001',
    name: 'Charlie Brown',
    email: 'charlie@uni.edu',
    active: true,
  });
  tx.studentGroupMemberships.set('sgm-1', {
    id: 'sgm-1',
    studentId: 'stud-1',
    groupId: 'sec-1A',
    groupType: 'section',
    effectiveStartDate: '2026-08-01',
  });
  tx.studentGroupMemberships.set('sgm-2', {
    id: 'sgm-2',
    studentId: 'stud-1',
    groupId: 'batch-1A1',
    groupType: 'batch',
    effectiveStartDate: '2026-08-01',
  });
  tx.studentGroupMemberships.set('sgm-legacy-sec', {
    id: 'sgm-legacy-sec',
    studentId: 'stud-1',
    groupId: 'sec-A',
    groupType: 'section',
    effectiveStartDate: '2026-08-01',
  });
  tx.studentGroupMemberships.set('sgm-legacy-batch', {
    id: 'sgm-legacy-batch',
    studentId: 'stud-1',
    groupId: 'batch-A1',
    groupType: 'batch',
    effectiveStartDate: '2026-08-01',
  });
}

