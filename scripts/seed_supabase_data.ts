import pg from 'pg';
import dotenv from 'dotenv';
import { TimetableRepository, populateRealisticUniversityData } from '../src/data/repository.js';
dotenv.config();

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('Generating realistic university data fixtures...');
  const repo = new TimetableRepository();
  await repo.runTransaction(async (tx) => {
    populateRealisticUniversityData(tx);
  });
  const state = repo.getState();

  await client.connect();
  console.log('Connected to Supabase PostgreSQL database.');

  try {
    await client.query('BEGIN;');

    // 1. Academic Terms
    console.log('Inserting academic terms...');
    for (const term of state.academicTerms.values()) {
      await client.query(
        `INSERT INTO academic_terms (id, year_label, semester_number, start_date, end_date, cycle, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET 
           year_label = EXCLUDED.year_label,
           semester_number = EXCLUDED.semester_number,
           start_date = EXCLUDED.start_date,
           end_date = EXCLUDED.end_date,
           cycle = EXCLUDED.cycle,
           status = EXCLUDED.status;`,
        [term.id, term.yearLabel, term.semesterNumber, term.startDate, term.endDate, term.cycle, term.status]
      );
    }

    // 2. Sections
    console.log('Inserting sections...');
    for (const sec of state.sections.values()) {
      await client.query(
        `INSERT INTO sections (id, term_id, name, expected_count, active)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET 
           term_id = EXCLUDED.term_id,
           name = EXCLUDED.name,
           expected_count = EXCLUDED.expected_count,
           active = EXCLUDED.active;`,
        [sec.id, sec.termId, sec.name, sec.expectedCount, sec.active]
      );
    }

    // 3. Batches
    console.log('Inserting batches...');
    for (const batch of state.batches.values()) {
      await client.query(
        `INSERT INTO batches (id, section_id, name, expected_count, active)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET 
           section_id = EXCLUDED.section_id,
           name = EXCLUDED.name,
           expected_count = EXCLUDED.expected_count,
           active = EXCLUDED.active;`,
        [batch.id, batch.sectionId, batch.name, batch.expectedCount, batch.active]
      );
    }

    // 4. Students
    console.log('Inserting students...');
    for (const student of state.students.values()) {
      await client.query(
        `INSERT INTO students (id, roll_number, name, email, active)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET 
           roll_number = EXCLUDED.roll_number,
           name = EXCLUDED.name,
           email = EXCLUDED.email,
           active = EXCLUDED.active;`,
        [student.id, student.rollNumber, student.name, student.email, student.active]
      );
    }

    // 5. Student Group Memberships
    console.log('Inserting student memberships...');
    for (const mem of state.studentGroupMemberships.values()) {
      await client.query(
        `INSERT INTO student_group_memberships (id, student_id, group_id, group_type, effective_start_date, effective_end_date)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET 
           student_id = EXCLUDED.student_id,
           group_id = EXCLUDED.group_id,
           group_type = EXCLUDED.group_type,
           effective_start_date = EXCLUDED.effective_start_date,
           effective_end_date = EXCLUDED.effective_end_date;`,
        [mem.id, mem.studentId, mem.groupId, mem.groupType, mem.effectiveStartDate, mem.effectiveEndDate || null]
      );
    }

    // 6. Rooms
    console.log('Inserting rooms...');
    for (const room of state.rooms.values()) {
      await client.query(
        `INSERT INTO rooms (id, room_number, building, floor, capacity, room_type, active)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET 
           room_number = EXCLUDED.room_number,
           building = EXCLUDED.building,
           floor = EXCLUDED.floor,
           capacity = EXCLUDED.capacity,
           room_type = EXCLUDED.room_type,
           active = EXCLUDED.active;`,
        [room.id, room.roomNumber, room.building, room.floor, room.capacity, room.roomType, room.active]
      );
    }

    // 7. Teachers
    console.log('Inserting teachers...');
    for (const teacher of state.teachers.values()) {
      await client.query(
        `INSERT INTO teachers (id, emp_id, name, email, active)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET 
           emp_id = EXCLUDED.emp_id,
           name = EXCLUDED.name,
           email = EXCLUDED.email,
           active = EXCLUDED.active;`,
        [teacher.id, teacher.empId, teacher.name, teacher.email, teacher.active]
      );
    }

    // 8. Teacher Availabilities
    console.log('Inserting teacher availabilities...');
    for (const avail of state.teacherAvailabilities.values()) {
      await client.query(
        `INSERT INTO teacher_availability (id, teacher_id, day_of_week, slot_index, is_available)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET 
           teacher_id = EXCLUDED.teacher_id,
           day_of_week = EXCLUDED.day_of_week,
           slot_index = EXCLUDED.slot_index,
           is_available = EXCLUDED.is_available;`,
        [avail.id, avail.teacherId, avail.dayOfWeek, avail.slotIndex, avail.isAvailable]
      );
    }

    // 9. Courses
    console.log('Inserting courses...');
    for (const course of state.courses.values()) {
      await client.query(
        `INSERT INTO courses (id, code, name, term_id, lecture_hours, tutorial_hours, practical_hours, required_room_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET 
           code = EXCLUDED.code,
           name = EXCLUDED.name,
           term_id = EXCLUDED.term_id,
           lecture_hours = EXCLUDED.lecture_hours,
           tutorial_hours = EXCLUDED.tutorial_hours,
           practical_hours = EXCLUDED.practical_hours,
           required_room_type = EXCLUDED.required_room_type;`,
        [course.id, course.code, course.name, course.termId, course.lectureHours, course.tutorialHours, course.practicalHours, course.requiredRoomType]
      );
    }

    // 10. Course Offerings
    console.log('Inserting course offerings...');
    for (const off of state.courseOfferings.values()) {
      await client.query(
        `INSERT INTO course_offerings (id, course_id, term_id, teacher_id, target_type, target_id)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET 
           course_id = EXCLUDED.course_id,
           term_id = EXCLUDED.term_id,
           teacher_id = EXCLUDED.teacher_id,
           target_type = EXCLUDED.target_type,
           target_id = EXCLUDED.target_id;`,
        [off.id, off.courseId, off.termId, off.teacherId, off.targetType, off.targetId]
      );
    }

    // 11. Elective Groups & Assignments
    console.log('Inserting elective groups & assignments...');
    for (const eg of state.electiveGroups.values()) {
      await client.query(
        `INSERT INTO elective_groups (id, term_id, course_id, name, expected_count)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET 
           term_id = EXCLUDED.term_id,
           course_id = EXCLUDED.course_id,
           name = EXCLUDED.name,
           expected_count = EXCLUDED.expected_count;`,
        [eg.id, eg.termId, eg.courseId, eg.name, eg.expectedCount]
      );
    }
    for (const ea of state.electiveAssignments.values()) {
      await client.query(
        `INSERT INTO elective_assignments (id, student_id, elective_group_id, status, assigned_by)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET 
           student_id = EXCLUDED.student_id,
           elective_group_id = EXCLUDED.elective_group_id,
           status = EXCLUDED.status,
           assigned_by = EXCLUDED.assigned_by;`,
        [ea.id, ea.studentId, ea.electiveGroupId, ea.status, ea.assignedBy]
      );
    }

    // 12. Timetable Versions
    console.log('Inserting timetable versions...');
    for (const v of state.timetableVersions.values()) {
      await client.query(
        `INSERT INTO timetable_versions (id, term_id, version_number, status, input_revision, created_by, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET 
           term_id = EXCLUDED.term_id,
           version_number = EXCLUDED.version_number,
           status = EXCLUDED.status,
           input_revision = EXCLUDED.input_revision,
           created_by = EXCLUDED.created_by,
           published_at = EXCLUDED.published_at;`,
        [v.id, v.termId, v.versionNumber, v.status, v.inputRevision, v.createdBy, v.publishedAt || null]
      );
    }

    // 13. Scheduled Classes
    console.log('Inserting scheduled classes...');
    for (const sc of state.scheduledClasses.values()) {
      await client.query(
        `INSERT INTO scheduled_classes (id, version_id, course_offering_id, term_id, day_of_week, start_slot, duration, activity_type, teacher_id, room_id, target_type, target_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO UPDATE SET 
           version_id = EXCLUDED.version_id,
           course_offering_id = EXCLUDED.course_offering_id,
           term_id = EXCLUDED.term_id,
           day_of_week = EXCLUDED.day_of_week,
           start_slot = EXCLUDED.start_slot,
           duration = EXCLUDED.duration,
           activity_type = EXCLUDED.activity_type,
           teacher_id = EXCLUDED.teacher_id,
           room_id = EXCLUDED.room_id,
           target_type = EXCLUDED.target_type,
           target_id = EXCLUDED.target_id,
           status = EXCLUDED.status;`,
        [sc.id, sc.versionId, sc.courseOfferingId, sc.termId, sc.dayOfWeek, sc.startSlot, sc.duration, sc.activityType, sc.teacherId, sc.roomId, sc.targetType, sc.targetId, sc.status]
      );
    }

    // 14. Class Occurrences
    console.log('Inserting class occurrences...');
    for (const co of state.classOccurrences.values()) {
      await client.query(
        `INSERT INTO class_occurrences (id, version_id, recurring_class_id, course_offering_id, term_id, date, day_of_week, start_slot, duration, activity_type, teacher_id, room_id, target_type, target_id, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
         ON CONFLICT (id) DO UPDATE SET 
           version_id = EXCLUDED.version_id,
           recurring_class_id = EXCLUDED.recurring_class_id,
           course_offering_id = EXCLUDED.course_offering_id,
           term_id = EXCLUDED.term_id,
           date = EXCLUDED.date,
           day_of_week = EXCLUDED.day_of_week,
           start_slot = EXCLUDED.start_slot,
           duration = EXCLUDED.duration,
           activity_type = EXCLUDED.activity_type,
           teacher_id = EXCLUDED.teacher_id,
           room_id = EXCLUDED.room_id,
           target_type = EXCLUDED.target_type,
           target_id = EXCLUDED.target_id,
           status = EXCLUDED.status;`,
        [co.id, co.versionId, co.recurringClassId || null, co.courseOfferingId, co.termId, co.date, co.dayOfWeek, co.startSlot, co.duration, co.activityType, co.teacherId, co.roomId, co.targetType, co.targetId, co.status]
      );
    }

    // 15. Audit Events
    console.log('Inserting audit records...');
    for (const audit of state.auditEvents) {
      await client.query(
        `INSERT INTO audit_events (id, actor_id, action, entity_type, entity_id, outcome, details)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING;`,
        [audit.id, audit.actorId, audit.action, audit.entityType, audit.entityId, audit.outcome, JSON.stringify(audit.details || {})]
      );
    }

    await client.query('COMMIT;');
    console.log('All modular entities and published timetables successfully ingested into Supabase!');
  } catch (err) {
    await client.query('ROLLBACK;');
    console.error('Failed to ingest modular data:', err);
    throw err;
  } finally {
    await client.end();
  }
}

main().catch(console.error);
