/**
 * Database Synchronization & Startup Hydration Module for PostgreSQL / Supabase.
 * Connects to authoritative PostgreSQL instance, hydrates repository state on server start,
 * and asynchronously mirrors authoritative mutations (occurrences, extra classes, audits).
 * Conforms to docs/03_ARCHITECTURE_AND_RUNTIME.md and docs/05_DATA_MODEL.md
 */

import pg from 'pg';
import dotenv from 'dotenv';
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
  TimetableVersion,
} from '../domain/types.js';
import { TimetableRepository, AuditEventRecord } from './repository.js';

dotenv.config();

const { Pool, types } = pg;

// Prevent pg from converting DATE strings to Date objects with local timezone shifts
types.setTypeParser(1082, (val: string) => val);

let pool: pg.Pool | null = null;

export function isDbConfigured(): boolean {
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    return false;
  }
  return Boolean(
    process.env.DATABASE_URL &&
    process.env.DATABASE_URL.includes('supabase') &&
    !process.env.DATABASE_URL.includes('REPLACE_ME')
  );
}

export function getDbPool(): pg.Pool {
  if (!pool) {
    if (!isDbConfigured()) {
      throw new Error('DATABASE_URL is not configured for PostgreSQL connection.');
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    pool.on('error', (err) => {
      console.warn('PostgreSQL pool background error:', err.message);
    });
  }
  return pool;
}

/**
 * Hydrates TimetableRepository state directly from Supabase PostgreSQL tables.
 * Returns true if hydration succeeded, false if DB is unconfigured or failed.
 */
export async function hydrateRepositoryFromDatabase(repo: TimetableRepository): Promise<boolean> {
  if (!isDbConfigured()) {
    return false;
  }

  const db = getDbPool();
  try {
    const client = await db.connect();
    try {
      const termsRes = await client.query('SELECT * FROM academic_terms ORDER BY semester_number ASC');
      const secRes = await client.query('SELECT * FROM sections ORDER BY name ASC');
      const batchRes = await client.query('SELECT * FROM batches ORDER BY name ASC');
      const studRes = await client.query('SELECT * FROM students ORDER BY roll_number ASC');
      const sgmRes = await client.query('SELECT * FROM student_group_memberships');
      const egRes = await client.query('SELECT * FROM elective_groups');
      const eaRes = await client.query('SELECT * FROM elective_assignments');
      const roomRes = await client.query('SELECT * FROM rooms ORDER BY room_number ASC');
      const teachRes = await client.query('SELECT * FROM teachers ORDER BY name ASC');
      const availRes = await client.query('SELECT * FROM teacher_availability');
      const courseRes = await client.query('SELECT * FROM courses ORDER BY code ASC');
      const offRes = await client.query('SELECT * FROM course_offerings');
      const verRes = await client.query('SELECT * FROM timetable_versions ORDER BY version_number ASC');
      const scRes = await client.query('SELECT * FROM scheduled_classes');
      const occRes = await client.query('SELECT * FROM class_occurrences ORDER BY date ASC, start_slot ASC');
      const auditRes = await client.query('SELECT * FROM audit_events ORDER BY created_at ASC LIMIT 1000');
      const notifRes = await client.query('SELECT * FROM notification_outbox ORDER BY created_at ASC LIMIT 1000');

      if (termsRes.rows.length === 0 && roomRes.rows.length === 0) {
        console.log('[Supabase DB] Remote database is empty. Skipping hydration to preserve seeds.');
        return false;
      }

      await repo.runTransaction(async (tx) => {
        // Clear in-memory Map stores so deleted DB entities never resurrect from initial demo seeds (BE-19)
        tx.academicTerms.clear();
        tx.sections.clear();
        tx.batches.clear();
        tx.students.clear();
        tx.studentGroupMemberships.clear();
        tx.electiveGroups.clear();
        tx.electiveAssignments.clear();
        tx.rooms.clear();
        tx.teachers.clear();
        tx.teacherAvailabilities.clear();
        tx.teacherUnavailabilityRequests.clear();
        tx.courses.clear();
        tx.courseOfferings.clear();
        tx.timetableVersions.clear();
        tx.scheduledClasses.clear();
        tx.classOccurrences.clear();
        tx.classOccurrenceEvents.clear();
        tx.notificationOutbox.length = 0;

        // Hydrate terms
        for (const row of termsRes.rows) {
          const term: AcademicTerm = {
            id: row.id,
            yearLabel: row.year_label,
            semesterNumber: row.semester_number,
            startDate: typeof row.start_date === 'string' ? row.start_date : row.start_date.toISOString().split('T')[0],
            endDate: typeof row.end_date === 'string' ? row.end_date : row.end_date.toISOString().split('T')[0],
            cycle: row.cycle,
            status: row.status,
          };
          tx.academicTerms.set(term.id, term);
        }

        // Hydrate sections
        for (const row of secRes.rows) {
          const sec: Section = {
            id: row.id,
            termId: row.term_id,
            name: row.name,
            expectedCount: row.expected_count,
            active: row.active,
          };
          tx.sections.set(sec.id, sec);
        }

        // Hydrate batches
        for (const row of batchRes.rows) {
          const b: Batch = {
            id: row.id,
            sectionId: row.section_id,
            name: row.name,
            expectedCount: row.expected_count,
            active: row.active,
          };
          tx.batches.set(b.id, b);
        }

        // Hydrate students
        for (const row of studRes.rows) {
          const s: Student = {
            id: row.id,
            rollNumber: row.roll_number,
            name: row.name,
            email: row.email,
            active: row.active,
          };
          tx.students.set(s.id, s);
        }

        // Hydrate memberships
        for (const row of sgmRes.rows) {
          const m: StudentGroupMembership = {
            id: row.id,
            studentId: row.student_id,
            groupId: row.group_id,
            groupType: row.group_type,
            effectiveStartDate: typeof row.effective_start_date === 'string' ? row.effective_start_date : row.effective_start_date.toISOString().split('T')[0],
            effectiveEndDate: row.effective_end_date ? (typeof row.effective_end_date === 'string' ? row.effective_end_date : row.effective_end_date.toISOString().split('T')[0]) : undefined,
          };
          tx.studentGroupMemberships.set(m.id, m);
        }

        // Hydrate elective groups
        for (const row of egRes.rows) {
          const eg: ElectiveGroup = {
            id: row.id,
            termId: row.term_id,
            courseId: row.course_id,
            name: row.name,
            expectedCount: row.expected_count,
          };
          tx.electiveGroups.set(eg.id, eg);
        }

        // Hydrate elective assignments
        for (const row of eaRes.rows) {
          const ea: ElectiveAssignment = {
            id: row.id,
            studentId: row.student_id,
            electiveGroupId: row.elective_group_id,
            status: row.status,
            assignedBy: row.assigned_by,
            assignedAt: row.assigned_at ? new Date(row.assigned_at).toISOString() : new Date().toISOString(),
          };
          tx.electiveAssignments.set(ea.id, ea);
        }

        // Hydrate rooms
        for (const row of roomRes.rows) {
          const r: Room = {
            id: row.id,
            roomNumber: row.room_number,
            building: row.building,
            floor: row.floor,
            capacity: row.capacity,
            roomType: row.room_type,
            active: row.active,
          };
          tx.rooms.set(r.id, r);
        }

        // Hydrate teachers
        for (const row of teachRes.rows) {
          const t: Teacher = {
            id: row.id,
            empId: row.emp_id,
            name: row.name,
            email: row.email,
            active: row.active,
          };
          tx.teachers.set(t.id, t);
        }

        // Hydrate teacher availabilities
        for (const row of availRes.rows) {
          const a: TeacherAvailability = {
            id: row.id,
            teacherId: row.teacher_id,
            dayOfWeek: row.day_of_week,
            slotIndex: row.slot_index,
            isAvailable: row.is_available,
          };
          tx.teacherAvailabilities.set(a.id, a);
        }

        // Hydrate courses
        for (const row of courseRes.rows) {
          const c: Course = {
            id: row.id,
            code: row.code,
            name: row.name,
            termId: row.term_id,
            lectureHours: row.lecture_hours,
            tutorialHours: row.tutorial_hours,
            practicalHours: row.practical_hours,
            requiredRoomType: row.required_room_type,
            cardBgColor: row.card_bg_color || undefined,
            fontColor: row.font_color || undefined,
            borderColor: row.border_color || undefined,
          };
          tx.courses.set(c.id, c);
        }

        // Hydrate course offerings
        for (const row of offRes.rows) {
          const o: CourseOffering = {
            id: row.id,
            courseId: row.course_id,
            termId: row.term_id,
            teacherId: row.teacher_id,
            targetType: row.target_type,
            targetId: row.target_id,
            component: row.component || undefined,
          };
          tx.courseOfferings.set(o.id, o);
        }

        // Hydrate timetable versions
        for (const row of verRes.rows) {
          const v: TimetableVersion = {
            id: row.id,
            termId: row.term_id,
            versionNumber: row.version_number,
            status: row.status,
            inputRevision: row.input_revision,
            createdBy: row.created_by,
            createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
            publishedAt: row.published_at ? new Date(row.published_at).toISOString() : undefined,
          };
          tx.timetableVersions.set(v.id, v);
        }

        // Hydrate scheduled classes
        for (const row of scRes.rows) {
          const sc: ScheduledClass = {
            id: row.id,
            versionId: row.version_id,
            courseOfferingId: row.course_offering_id,
            termId: row.term_id,
            dayOfWeek: row.day_of_week,
            startSlot: row.start_slot,
            duration: row.duration,
            activityType: row.activity_type,
            teacherId: row.teacher_id,
            roomId: row.room_id,
            targetType: row.target_type,
            targetId: row.target_id,
            status: row.status,
          };
          tx.scheduledClasses.set(sc.id, sc);
        }

        // Hydrate class occurrences
        for (const row of occRes.rows) {
          const occ: ClassOccurrence = {
            id: row.id,
            versionId: row.version_id,
            recurringClassId: row.recurring_class_id || undefined,
            courseOfferingId: row.course_offering_id,
            termId: row.term_id,
            date: typeof row.date === 'string' ? row.date : row.date.toISOString().split('T')[0],
            dayOfWeek: row.day_of_week,
            startSlot: row.start_slot,
            duration: row.duration,
            activityType: row.activity_type,
            teacherId: row.teacher_id,
            roomId: row.room_id,
            targetType: row.target_type,
            targetId: row.target_id,
            status: row.status,
            cancellationReason: row.cancellation_reason || undefined,
            replacementOccurrenceId: row.replacement_occurrence_id || undefined,
          };
          tx.classOccurrences.set(occ.id, occ);
        }

        // Hydrate audit events
        for (const row of auditRes.rows) {
          tx.auditEvents.push({
            id: row.id,
            actorId: row.actor_id,
            action: row.action,
            entityType: row.entity_type,
            entityId: row.entity_id,
            outcome: row.outcome,
            details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details,
            timestamp: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
          });
        }

        // Hydrate notifications outbox
        for (const row of notifRes.rows) {
          tx.notificationOutbox.push({
            id: row.id,
            recipientStudentId: row.recipient_student_id,
            eventType: row.event_type,
            title: row.title,
            message: row.message,
            entityType: row.entity_type || undefined,
            entityId: row.entity_id || undefined,
            payload: typeof row.payload === 'string' ? JSON.parse(row.payload) : (row.payload || {}),
            status: row.status,
            retryCount: row.retry_count || 0,
            createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
          });
        }
      });

      console.log(`[Supabase DB] Successfully hydrated state from remote PostgreSQL database:
  - Terms: ${termsRes.rows.length}
  - Sections: ${secRes.rows.length}
  - Batches: ${batchRes.rows.length}
  - Rooms: ${roomRes.rows.length}
  - Teachers: ${teachRes.rows.length}
  - Courses: ${courseRes.rows.length}
  - Offerings: ${offRes.rows.length}
  - Timetable Versions: ${verRes.rows.length}
  - Scheduled Classes: ${scRes.rows.length}
  - Class Occurrences: ${occRes.rows.length}
  - Notifications: ${notifRes.rows.length}`);

      return true;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.warn('[Supabase DB] Failed to hydrate repository from database:', err.message);
    return false;
  }
}

/**
 * Persists an occurrence modification or creation directly into Supabase PostgreSQL.
 * Uses row-level locking (FOR UPDATE) to prevent concurrency races across multi-worker deployments (BE-14).
 */
export async function persistOccurrenceToDb(occ: ClassOccurrence): Promise<void> {
  if (!isDbConfigured()) return;
  const db = getDbPool();
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `SELECT id FROM class_occurrences WHERE room_id = $1 AND date = $2 AND status = 'scheduled' FOR UPDATE`,
      [occ.roomId, occ.date]
    );
    await client.query(
      `SELECT id FROM class_occurrences WHERE teacher_id = $1 AND date = $2 AND status = 'scheduled' FOR UPDATE`,
      [occ.teacherId, occ.date]
    );
    await client.query(
      `INSERT INTO class_occurrences (
        id, version_id, recurring_class_id, course_offering_id, term_id, 
        date, day_of_week, start_slot, duration, activity_type, 
        teacher_id, room_id, target_type, target_id, status, cancellation_reason, replacement_occurrence_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      ON CONFLICT (id) DO UPDATE SET 
        status = EXCLUDED.status,
        date = EXCLUDED.date,
        day_of_week = EXCLUDED.day_of_week,
        start_slot = EXCLUDED.start_slot,
        duration = EXCLUDED.duration,
        teacher_id = EXCLUDED.teacher_id,
        room_id = EXCLUDED.room_id,
        cancellation_reason = EXCLUDED.cancellation_reason,
        replacement_occurrence_id = EXCLUDED.replacement_occurrence_id;`,
      [
        occ.id,
        occ.versionId,
        occ.recurringClassId || null,
        occ.courseOfferingId,
        occ.termId,
        occ.date,
        occ.dayOfWeek,
        occ.startSlot,
        occ.duration,
        occ.activityType,
        occ.teacherId,
        occ.roomId,
        occ.targetType,
        occ.targetId,
        occ.status,
        occ.cancellationReason || null,
        occ.replacementOccurrenceId || null,
      ]
    );
    await client.query('COMMIT');
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Persists an extra class booking directly into Supabase PostgreSQL.
 * Uses row-level locking (FOR UPDATE) to prevent concurrency races across multi-worker deployments (BE-14).
 */
export async function persistExtraClassToDb(ec: {
  id: string;
  date: string;
  courseOfferingId: string;
  activityType: string;
  teacherId: string;
  roomId: string;
  startSlot: number;
  duration: number;
  targetType: string;
  targetId: string;
  status: string;
  bookingTeacherId?: string;
}): Promise<void> {
  if (!isDbConfigured()) return;
  const db = getDbPool();
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `SELECT id FROM extra_classes WHERE room_id = $1 AND date = $2 AND status = 'scheduled' FOR UPDATE`,
      [ec.roomId, ec.date]
    );
    await client.query(
      `SELECT id FROM extra_classes WHERE teacher_id = $1 AND date = $2 AND status = 'scheduled' FOR UPDATE`,
      [ec.teacherId, ec.date]
    );
    await client.query(
      `INSERT INTO extra_classes (
        id, date, course_offering_id, activity_type, teacher_id, room_id,
        start_slot, duration, target_type, target_id, status, booking_teacher_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        room_id = EXCLUDED.room_id,
        start_slot = EXCLUDED.start_slot;`,
      [
        ec.id,
        ec.date,
        ec.courseOfferingId,
        ec.activityType,
        ec.teacherId,
        ec.roomId,
        ec.startSlot,
        ec.duration,
        ec.targetType,
        ec.targetId,
        ec.status,
        ec.bookingTeacherId || null,
      ]
    );
    await client.query('COMMIT');
  } catch (err: any) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Persists extra class cancellation in Supabase PostgreSQL (BE-05, BE-16).
 */
export async function persistExtraClassCancellationToDb(id: string): Promise<void> {
  if (!isDbConfigured()) return;
  const db = getDbPool();
  await db.query(`UPDATE extra_classes SET status = 'cancelled' WHERE id = $1`, [id]);
}

/**
 * Persists an imported draft version and scheduled classes into Supabase PostgreSQL (BE-02, BE-10).
 */
export async function persistDraftImportToDb(version: TimetableVersion, classes: ScheduledClass[]): Promise<void> {
  if (!isDbConfigured()) return;
  const db = getDbPool();
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO timetable_versions (id, term_id, version_number, status, input_revision, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, input_revision = EXCLUDED.input_revision;`,
      [version.id, version.termId, version.versionNumber, version.status, version.inputRevision, version.createdBy, version.createdAt]
    );
    for (const cls of classes) {
      await client.query(
        `INSERT INTO scheduled_classes (
          id, version_id, course_offering_id, term_id, day_of_week, start_slot, duration, activity_type, teacher_id, room_id, target_type, target_id, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO NOTHING;`,
        [cls.id, cls.versionId, cls.courseOfferingId, cls.termId, cls.dayOfWeek, cls.startSlot, cls.duration, cls.activityType, cls.teacherId, cls.roomId, cls.targetType, cls.targetId, cls.status]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Persists timetable publication and newly instantiated occurrences into Supabase PostgreSQL (BE-02, BE-10).
 */
export async function persistPublicationToDb(
  publishedVersion: TimetableVersion,
  priorVersionId: string | undefined,
  occurrences: ClassOccurrence[]
): Promise<void> {
  if (!isDbConfigured()) return;
  const db = getDbPool();
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    if (priorVersionId) {
      await client.query(`UPDATE timetable_versions SET status = 'superseded' WHERE id = $1`, [priorVersionId]);
      await client.query(
        `UPDATE class_occurrences SET status = 'superseded' WHERE version_id = $1 AND NOT is_extra_class AND status != 'superseded'`,
        [priorVersionId]
      );
    }
    await client.query(
      `INSERT INTO timetable_versions (id, term_id, version_number, status, input_revision, created_by, created_at, published_at, prior_version_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET status = 'published', published_at = EXCLUDED.published_at, prior_version_id = EXCLUDED.prior_version_id;`,
      [publishedVersion.id, publishedVersion.termId, publishedVersion.versionNumber, 'published', publishedVersion.inputRevision, publishedVersion.createdBy, publishedVersion.createdAt, publishedVersion.publishedAt, priorVersionId || null]
    );
    for (const occ of occurrences) {
      await client.query(
        `INSERT INTO class_occurrences (
          id, version_id, recurring_class_id, course_offering_id, term_id, date, day_of_week, start_slot, duration, activity_type, teacher_id, room_id, target_type, target_id, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;`,
        [occ.id, occ.versionId, occ.recurringClassId || null, occ.courseOfferingId, occ.termId, occ.date, occ.dayOfWeek, occ.startSlot, occ.duration, occ.activityType, occ.teacherId, occ.roomId, occ.targetType, occ.targetId, occ.status]
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Persists timetable version restoration into Supabase PostgreSQL (BE-02, BE-10).
 */
export async function persistVersionRestoreToDb(restoredVersionId: string, supersededVersionId?: string): Promise<void> {
  if (!isDbConfigured()) return;
  const db = getDbPool();
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    if (supersededVersionId) {
      await client.query(`UPDATE timetable_versions SET status = 'superseded' WHERE id = $1`, [supersededVersionId]);
      await client.query(`UPDATE class_occurrences SET status = 'superseded' WHERE version_id = $1 AND NOT is_extra_class`, [supersededVersionId]);
    }
    await client.query(`UPDATE timetable_versions SET status = 'published', published_at = NOW() WHERE id = $1`, [restoredVersionId]);
    await client.query(`UPDATE class_occurrences SET status = 'scheduled' WHERE version_id = $1 AND NOT is_extra_class AND status = 'superseded'`, [restoredVersionId]);
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Persists teacher weekly regular availability into Supabase PostgreSQL (BE-20).
 */
export async function persistTeacherAvailabilityToDb(ta: TeacherAvailability): Promise<void> {
  if (!isDbConfigured()) return;
  const db = getDbPool();
  await db.query(
    `INSERT INTO teacher_availability (id, teacher_id, day_of_week, slot_index, is_available)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (teacher_id, day_of_week, slot_index) DO UPDATE SET is_available = EXCLUDED.is_available;`,
    [ta.id, ta.teacherId, ta.dayOfWeek, ta.slotIndex, ta.isAvailable]
  );
}

/**
 * Deletes teacher weekly regular availability from Supabase PostgreSQL (BE-20).
 */
export async function deleteTeacherAvailabilityFromDb(teacherId: string, dayOfWeek: number, slotIndex: number): Promise<void> {
  if (!isDbConfigured()) return;
  const db = getDbPool();
  await db.query(`DELETE FROM teacher_availability WHERE teacher_id = $1 AND day_of_week = $2 AND slot_index = $3`, [teacherId, dayOfWeek, slotIndex]);
}

/**
 * Persists a teacher unavailability request into Supabase PostgreSQL (BE-20).
 */
export async function persistTeacherUnavailabilityRequestToDb(req: TeacherUnavailabilityRequest): Promise<void> {
  if (!isDbConfigured()) return;
  const db = getDbPool();
  await db.query(
    `INSERT INTO teacher_unavailability_requests (id, teacher_id, date, start_slot, end_slot, reason, status, submitted_at, reviewed_by, reviewed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, reviewed_by = EXCLUDED.reviewed_by, reviewed_at = EXCLUDED.reviewed_at;`,
    [req.id, req.teacherId, req.date, req.startSlot, req.endSlot, req.reason || null, req.status, req.submittedAt, req.reviewedBy || null, req.reviewedAt || null]
  );
}

/**
 * Persists academic term into Supabase PostgreSQL (BE-02).
 */
export async function persistAcademicTermToDb(term: AcademicTerm): Promise<void> {
  if (!isDbConfigured()) return;
  const db = getDbPool();
  await db.query(
    `INSERT INTO academic_terms (id, year_label, semester_number, start_date, end_date, cycle, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;`,
    [term.id, term.yearLabel, term.semesterNumber, term.startDate, term.endDate, term.cycle, term.status]
  );
}

/**
 * Persists section into Supabase PostgreSQL (BE-02).
 */
export async function persistSectionToDb(sec: Section): Promise<void> {
  if (!isDbConfigured()) return;
  const db = getDbPool();
  await db.query(
    `INSERT INTO sections (id, term_id, name, expected_count)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET expected_count = EXCLUDED.expected_count;`,
    [sec.id, sec.termId, sec.name, sec.expectedCount]
  );
}

/**
 * Persists batch into Supabase PostgreSQL (BE-02).
 */
export async function persistBatchToDb(b: Batch): Promise<void> {
  if (!isDbConfigured()) return;
  const db = getDbPool();
  await db.query(
    `INSERT INTO batches (id, section_id, name, expected_count)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET expected_count = EXCLUDED.expected_count;`,
    [b.id, b.sectionId, b.name, b.expectedCount]
  );
}

/**
 * Persists room into Supabase PostgreSQL (BE-02).
 */
export async function persistRoomToDb(room: Room): Promise<void> {
  if (!isDbConfigured()) return;
  const db = getDbPool();
  await db.query(
    `INSERT INTO rooms (id, room_number, building, floor, capacity, room_type, active)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET capacity = EXCLUDED.capacity, active = EXCLUDED.active;`,
    [room.id, room.roomNumber, room.building, room.floor, room.capacity, room.roomType, room.active]
  );
}

/**
 * Persists teacher into Supabase PostgreSQL (BE-02).
 */
export async function persistTeacherToDb(teacher: Teacher): Promise<void> {
  if (!isDbConfigured()) return;
  const db = getDbPool();
  await db.query(
    `INSERT INTO teachers (id, emp_id, name, email, active)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE SET active = EXCLUDED.active, name = EXCLUDED.name;`,
    [teacher.id, teacher.empId, teacher.name, teacher.email, teacher.active]
  );
}

/**
 * Persists course into Supabase PostgreSQL (BE-02).
 */
export async function persistCourseToDb(c: Course): Promise<void> {
  if (!isDbConfigured()) return;
  const db = getDbPool();
  await db.query(
    `INSERT INTO courses (id, code, name, term_id, lecture_hours, tutorial_hours, practical_hours, required_room_type, card_bg_color, font_color, border_color)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (id) DO UPDATE SET
       code = EXCLUDED.code,
       name = EXCLUDED.name,
       lecture_hours = EXCLUDED.lecture_hours,
       tutorial_hours = EXCLUDED.tutorial_hours,
       practical_hours = EXCLUDED.practical_hours,
       required_room_type = EXCLUDED.required_room_type,
       card_bg_color = EXCLUDED.card_bg_color,
       font_color = EXCLUDED.font_color,
       border_color = EXCLUDED.border_color;`,
    [c.id, c.code, c.name, c.termId, c.lectureHours, c.tutorialHours, c.practicalHours, c.requiredRoomType, c.cardBgColor || null, c.fontColor || null, c.borderColor || null]
  );
}

/**
 * Persists course offering into Supabase PostgreSQL (BE-02).
 */
export async function persistOfferingToDb(o: CourseOffering): Promise<void> {
  if (!isDbConfigured()) return;
  const db = getDbPool();
  await db.query(
    `INSERT INTO course_offerings (id, course_id, term_id, teacher_id, target_type, target_id, component)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO NOTHING;`,
    [o.id, o.courseId, o.termId, o.teacherId, o.targetType, o.targetId, o.component || null]
  );
}

/**
 * Persists an audit event directly into Supabase PostgreSQL.
 */
export async function persistAuditEventToDb(audit: AuditEventRecord): Promise<void> {
  if (!isDbConfigured()) return;
  try {
    const db = getDbPool();
    await db.query(
      `INSERT INTO audit_events (id, actor_id, action, entity_type, entity_id, outcome, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING;`,
      [
        audit.id,
        audit.actorId,
        audit.action,
        audit.entityType,
        audit.entityId,
        audit.outcome,
        JSON.stringify(audit.details || {}),
      ]
    );
  } catch (err: any) {
    console.warn(`[Supabase DB] Failed to persist audit event ${audit.id} to database:`, err.message);
  }
}

/**
 * Persists a notification record into Supabase PostgreSQL notification_outbox.
 */
export async function persistNotificationToDb(notice: {
  id: string;
  recipientStudentId: string;
  eventType: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  payload?: Record<string, unknown>;
  status?: string;
  retryCount?: number;
}): Promise<void> {
  if (!isDbConfigured()) return;
  try {
    const db = getDbPool();
    // Guard against FK constraint violations for synthetic or non-persisted test recipients
    const check = await db.query('SELECT 1 FROM students WHERE id = $1', [notice.recipientStudentId]);
    if (check.rowCount === 0) {
      return;
    }
    await db.query(
      `INSERT INTO notification_outbox (
        id, recipient_student_id, event_type, title, message, entity_type, entity_id, payload, status, retry_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;`,
      [
        notice.id,
        notice.recipientStudentId,
        notice.eventType,
        notice.title,
        notice.message,
        notice.entityType || null,
        notice.entityId || null,
        JSON.stringify(notice.payload || {}),
        notice.status || 'pending',
        notice.retryCount || 0,
      ]
    );
  } catch (err: any) {
    console.warn(`[Supabase DB] Failed to persist notification ${notice.id} to database:`, err.message);
  }
}

/**
 * Truncates all authoritative academic, timetable, and venue tables in Supabase PostgreSQL.
 * Preserves user accounts and profiles.
 */
export async function wipeAuthoritativeDatabase(): Promise<void> {
  if (!isDbConfigured()) return;
  const pool = getDbPool();
  const client = await pool.connect();
  try {
    await client.query(`
      TRUNCATE TABLE 
        public.class_occurrence_events,
        public.class_occurrences,
        public.extra_classes,
        public.notification_outbox,
        public.audit_events,
        public.teacher_unavailability_requests,
        public.teacher_availability,
        public.scheduled_classes,
        public.timetable_versions,
        public.student_group_memberships,
        public.elective_assignments,
        public.elective_groups,
        public.course_offerings,
        public.courses,
        public.students,
        public.teachers,
        public.rooms,
        public.batches,
        public.sections,
        public.academic_terms
      CASCADE;
    `);
  } finally {
    client.release();
  }
}


