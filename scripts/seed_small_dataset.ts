import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

export async function seedSmallDataset() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined in environment variables.');
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to PostgreSQL for Small Dataset Seeding...');

  try {
    await client.query('BEGIN;');

    // 0. Clean Purge of timetable entities (preserve profiles & auth.users)
    const tablesToPurge = [
      'class_occurrence_events',
      'class_occurrences',
      'scheduled_classes',
      'extra_classes',
      'notification_outbox',
      'audit_events',
      'timetable_versions',
      'elective_assignments',
      'elective_groups',
      'course_offerings',
      'courses',
      'teacher_unavailability_requests',
      'teacher_availability',
      'teachers',
      'rooms',
      'student_group_memberships',
      'batches',
      'students',
      'sections',
      'academic_terms'
    ];

    for (const table of tablesToPurge) {
      await client.query(`DELETE FROM ${table};`);
    }
    console.log('✓ Clean purge completed.');

    // 1. ACADEMIC TERM (1 active semester)
    const termId = 'term-sem3';
    await client.query(
      `INSERT INTO academic_terms (id, year_label, semester_number, start_date, end_date, cycle, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7);`,
      [termId, '2026-2027', 3, '2026-08-01', '2026-12-24', 'odd', 'active']
    );

    // 2. ROOMS (4 rooms: 2 lecture halls + 2 labs)
    const rooms = [
      { id: 'room-lt1', num: 'LT-1', bld: 'Aryabhata Block', fl: 1, cap: 60, type: 'LT' },
      { id: 'room-lt2', num: 'LT-2', bld: 'Aryabhata Block', fl: 1, cap: 60, type: 'LT' },
      { id: 'room-lab1', num: 'CS-Lab-1', bld: 'Computing Wing', fl: 1, cap: 35, type: 'P' },
      { id: 'room-lab2', num: 'CS-Lab-2', bld: 'Computing Wing', fl: 2, cap: 35, type: 'P' }
    ];
    for (const r of rooms) {
      await client.query(
        `INSERT INTO rooms (id, room_number, building, floor, capacity, room_type, active)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE);`,
        [r.id, r.num, r.bld, r.fl, r.cap, r.type]
      );
    }

    // 3. 2 SECTIONS
    const sections = [
      { id: 'sec-cse-a', name: 'CSE-3-A', count: 3 },
      { id: 'sec-cse-b', name: 'CSE-3-B', count: 3 }
    ];
    for (const s of sections) {
      await client.query(
        `INSERT INTO sections (id, term_id, name, expected_count, active)
         VALUES ($1, $2, $3, $4, TRUE);`,
        [s.id, termId, s.name, s.count]
      );
    }

    // 4. BATCHES (1 batch per section for lab division)
    for (const s of sections) {
      await client.query(
        `INSERT INTO batches (id, section_id, name, expected_count, active)
         VALUES ($1, $2, $3, $4, TRUE);`,
        [`batch-${s.id}-b1`, s.id, `${s.name}-B1`, s.count]
      );
    }

    // 5. 6 STUDENTS (3 per section)
    const students = [
      // Section A
      { id: 'stud-1', roll: '2025BTECH001', name: 'Charlie Brown', email: 'student@university.edu', secId: 'sec-cse-a', batchId: 'batch-sec-cse-a-b1' },
      { id: 'stud-2', roll: '2025BTECH002', name: 'Aarav Mehta', email: 'aarav.m@jklu.edu.in', secId: 'sec-cse-a', batchId: 'batch-sec-cse-a-b1' },
      { id: 'stud-3', roll: '2025BTECH003', name: 'Ananya Sharma', email: 'ananya.s@jklu.edu.in', secId: 'sec-cse-a', batchId: 'batch-sec-cse-a-b1' },
      // Section B
      { id: 'stud-4', roll: '2025BTECH004', name: 'Yuvraj Singh', email: 'yuvraj.s@jklu.edu.in', secId: 'sec-cse-b', batchId: 'batch-sec-cse-b-b1' },
      { id: 'stud-5', roll: '2025BTECH005', name: 'Bhavna Soni', email: 'bhavna.s@jklu.edu.in', secId: 'sec-cse-b', batchId: 'batch-sec-cse-b-b1' },
      { id: 'stud-6', roll: '2025BTECH006', name: 'Daksh Rawat', email: 'daksh.r@jklu.edu.in', secId: 'sec-cse-b', batchId: 'batch-sec-cse-b-b1' }
    ];
    for (const st of students) {
      await client.query(
        `INSERT INTO students (id, roll_number, name, email, active)
         VALUES ($1, $2, $3, $4, TRUE);`,
        [st.id, st.roll, st.name, st.email]
      );
      // Memberships: section + batch
      await client.query(
        `INSERT INTO student_group_memberships (id, student_id, group_id, group_type, effective_start_date)
         VALUES ($1, $2, $3, 'section', '2026-08-01'), ($4, $2, $5, 'batch', '2026-08-01');`,
        [`mem-sec-${st.id}`, st.id, st.secId, `mem-batch-${st.id}`, st.batchId]
      );
    }

    // 6. 6 FACULTY MEMBERS
    const teachers = [
      { id: 't-1', emp: 'EMP-001', name: 'Dr. Alice Smith', email: 'teacher@university.edu' },
      { id: 't-2', emp: 'EMP-002', name: 'Dr. Alok Kumar', email: 'alok.kumar@jklu.edu.in' },
      { id: 't-3', emp: 'EMP-003', name: 'Dr. Meenal Jain', email: 'meenal.jain@jklu.edu.in' },
      { id: 't-4', emp: 'EMP-004', name: 'Dr. Sonal Jain', email: 'sonal.jain@jklu.edu.in' },
      { id: 't-5', emp: 'EMP-005', name: 'Dr. Vikas Sharma', email: 'vikas.sharma@jklu.edu.in' },
      { id: 't-6', emp: 'EMP-006', name: 'Prof. Sanjay Goel', email: 'sanjay.goel@jklu.edu.in' }
    ];
    for (const t of teachers) {
      await client.query(
        `INSERT INTO teachers (id, emp_id, name, email, active)
         VALUES ($1, $2, $3, $4, TRUE);`,
        [t.id, t.emp, t.name, t.email]
      );
    }

    // 7. 5 SUBJECTS / COURSES with pastel colors
    const courses = [
      { id: 'c-cs201', code: 'CS201', name: 'Data Structures & Algorithms', l: 3, t: 1, p: 2, type: 'LT', bg: '#D8B4E2', font: '#1E1B4B', border: '#C084FC' },
      { id: 'c-cs202', code: 'CS202', name: 'Database Management Systems', l: 3, t: 1, p: 2, type: 'LT', bg: '#AED9E0', font: '#0C4A6E', border: '#7DD3FC' },
      { id: 'c-cs203', code: 'CS203', name: 'Object Oriented Programming', l: 3, t: 1, p: 2, type: 'LT', bg: '#B8E0D2', font: '#064E3B', border: '#6EE7B7' },
      { id: 'c-cs204', code: 'CS204', name: 'Computer Organization & Architecture', l: 3, t: 1, p: 0, type: 'LT', bg: '#FAD2E1', font: '#881337', border: '#F472B6' },
      { id: 'c-cs205', code: 'CS205', name: 'Discrete Mathematics', l: 3, t: 1, p: 0, type: 'LT', bg: '#FDE2E4', font: '#7C2D12', border: '#FDBA74' }
    ];
    for (const c of courses) {
      await client.query(
        `INSERT INTO courses (id, code, name, term_id, lecture_hours, tutorial_hours, practical_hours, required_room_type, card_bg_color, font_color, border_color)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);`,
        [c.id, c.code, c.name, termId, c.l, c.t, c.p, c.type, c.bg, c.font, c.border]
      );
    }

    // 8. TIMETABLE VERSION (Published)
    const versionId = 'ver-sem3-v1';
    await client.query(
      `INSERT INTO timetable_versions (id, term_id, version_number, status, input_revision, created_by, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW());`,
      [versionId, termId, 1, 'published', 'rev-small-clean', 'admin-001']
    );

    // 9. COURSE OFFERINGS
    // Section A teachers: c-cs201 -> t-1, c-cs202 -> t-2, c-cs203 -> t-3, c-cs204 -> t-4, c-cs205 -> t-5
    // Section B teachers: c-cs201 -> t-2, c-cs202 -> t-3, c-cs203 -> t-1, c-cs204 -> t-5, c-cs205 -> t-6
    const secATeachers: Record<string, string> = {
      'c-cs201': 't-1',
      'c-cs202': 't-2',
      'c-cs203': 't-3',
      'c-cs204': 't-4',
      'c-cs205': 't-5'
    };
    const secBTeachers: Record<string, string> = {
      'c-cs201': 't-2',
      'c-cs202': 't-3',
      'c-cs203': 't-1',
      'c-cs204': 't-5',
      'c-cs205': 't-6'
    };

    for (const c of courses) {
      // Sec A Lecture offering
      await client.query(
        `INSERT INTO course_offerings (id, course_id, term_id, teacher_id, target_type, target_id, component)
         VALUES ($1, $2, $3, $4, 'section', 'sec-cse-a', 'L');`,
        [`off-sec-a-${c.id}-L`, c.id, termId, secATeachers[c.id]]
      );
      // Sec B Lecture offering
      await client.query(
        `INSERT INTO course_offerings (id, course_id, term_id, teacher_id, target_type, target_id, component)
         VALUES ($1, $2, $3, $4, 'section', 'sec-cse-b', 'L');`,
        [`off-sec-b-${c.id}-L`, c.id, termId, secBTeachers[c.id]]
      );
    }
    // Lab offerings for practical courses
    for (const cId of ['c-cs201', 'c-cs202', 'c-cs203']) {
      await client.query(
        `INSERT INTO course_offerings (id, course_id, term_id, teacher_id, target_type, target_id, component)
         VALUES ($1, $2, $3, $4, 'batch', 'batch-sec-cse-a-b1', 'P'),
                ($5, $2, $3, $6, 'batch', 'batch-sec-cse-b-b1', 'P');`,
        [
          `off-sec-a-${cId}-P`, cId, termId, secATeachers[cId],
          `off-sec-b-${cId}-P`, secBTeachers[cId]
        ]
      );
    }

    // 10. FULL WEEK TIMETABLE (Monday to Saturday, Slots 1 to 6)
    // Section A home room: room-lt1, lab room: room-lab1
    // Section B home room: room-lt2, lab room: room-lab2
    // Days: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    // Dates for current week (Nov 23 - Nov 28, 2026)
    const dayDates: Record<number, string> = {
      1: '2026-11-23',
      2: '2026-11-24',
      3: '2026-11-25',
      4: '2026-11-26',
      5: '2026-11-27',
      6: '2026-11-28'
    };

    interface SlotPlan {
      day: number;
      slot: number;
      courseId: string;
      actType: 'L' | 'P';
      duration: number;
    }

    // Section A Schedule (Balanced across all 5 courses + lab)
    const secASchedule: SlotPlan[] = [
      // Mon: Slot 1: CS201, Slot 2: CS202, Slot 3: CS203, Slot 4: CS204, Slot 5-6: CS201 Lab
      { day: 1, slot: 1, courseId: 'c-cs201', actType: 'L', duration: 1 },
      { day: 1, slot: 2, courseId: 'c-cs202', actType: 'L', duration: 1 },
      { day: 1, slot: 3, courseId: 'c-cs203', actType: 'L', duration: 1 },
      { day: 1, slot: 4, courseId: 'c-cs204', actType: 'L', duration: 1 },
      { day: 1, slot: 5, courseId: 'c-cs201', actType: 'P', duration: 2 },

      // Tue: Slot 1: CS205, Slot 2: CS201, Slot 3: CS202, Slot 4: CS203, Slot 5-6: CS202 Lab
      { day: 2, slot: 1, courseId: 'c-cs205', actType: 'L', duration: 1 },
      { day: 2, slot: 2, courseId: 'c-cs201', actType: 'L', duration: 1 },
      { day: 2, slot: 3, courseId: 'c-cs202', actType: 'L', duration: 1 },
      { day: 2, slot: 4, courseId: 'c-cs203', actType: 'L', duration: 1 },
      { day: 2, slot: 5, courseId: 'c-cs202', actType: 'P', duration: 2 },

      // Wed: Slot 1: CS204, Slot 2: CS205, Slot 3: CS201, Slot 4: CS202 (Showcase: Cancelled & Swap)
      { day: 3, slot: 1, courseId: 'c-cs204', actType: 'L', duration: 1 }, // Will showcase Cancelled
      { day: 3, slot: 2, courseId: 'c-cs205', actType: 'L', duration: 1 },
      { day: 3, slot: 3, courseId: 'c-cs201', actType: 'L', duration: 1 }, // Will showcase Room Swap
      { day: 3, slot: 4, courseId: 'c-cs202', actType: 'L', duration: 1 },

      // Thu: Slot 1: CS203, Slot 2: CS204, Slot 3: CS205, Slot 4: CS201, Slot 5-6: CS203 Lab
      { day: 4, slot: 1, courseId: 'c-cs203', actType: 'L', duration: 1 },
      { day: 4, slot: 2, courseId: 'c-cs204', actType: 'L', duration: 1 },
      { day: 4, slot: 3, courseId: 'c-cs205', actType: 'L', duration: 1 },
      { day: 4, slot: 4, courseId: 'c-cs201', actType: 'L', duration: 1 },
      { day: 4, slot: 5, courseId: 'c-cs203', actType: 'P', duration: 2 },

      // Fri: Slot 1: CS202, Slot 2: CS203, Slot 3: CS204, Slot 4: CS205
      { day: 5, slot: 1, courseId: 'c-cs202', actType: 'L', duration: 1 },
      { day: 5, slot: 2, courseId: 'c-cs203', actType: 'L', duration: 1 },
      { day: 5, slot: 3, courseId: 'c-cs204', actType: 'L', duration: 1 },
      { day: 5, slot: 4, courseId: 'c-cs205', actType: 'L', duration: 1 },

      // Sat: Slot 1: CS201, Slot 2: CS205
      { day: 6, slot: 1, courseId: 'c-cs201', actType: 'L', duration: 1 },
      { day: 6, slot: 2, courseId: 'c-cs205', actType: 'L', duration: 1 }
    ];

    // Section B Schedule (Parallel non-conflicting teachers and rooms)
    const secBSchedule: SlotPlan[] = [
      // Mon: Slot 1: CS203, Slot 2: CS204, Slot 3: CS205, Slot 4: CS201, Slot 5-6: CS202 Lab
      { day: 1, slot: 1, courseId: 'c-cs203', actType: 'L', duration: 1 },
      { day: 1, slot: 2, courseId: 'c-cs204', actType: 'L', duration: 1 },
      { day: 1, slot: 3, courseId: 'c-cs205', actType: 'L', duration: 1 },
      { day: 1, slot: 4, courseId: 'c-cs201', actType: 'L', duration: 1 },
      { day: 1, slot: 5, courseId: 'c-cs202', actType: 'P', duration: 2 },

      // Tue: Slot 1: CS202, Slot 2: CS203, Slot 3: CS204, Slot 4: CS205, Slot 5-6: CS203 Lab
      { day: 2, slot: 1, courseId: 'c-cs202', actType: 'L', duration: 1 },
      { day: 2, slot: 2, courseId: 'c-cs203', actType: 'L', duration: 1 },
      { day: 2, slot: 3, courseId: 'c-cs204', actType: 'L', duration: 1 },
      { day: 2, slot: 4, courseId: 'c-cs205', actType: 'L', duration: 1 },
      { day: 2, slot: 5, courseId: 'c-cs203', actType: 'P', duration: 2 },

      // Wed: Slot 1: CS201, Slot 2: CS202, Slot 3: CS203, Slot 4: CS204
      { day: 3, slot: 1, courseId: 'c-cs201', actType: 'L', duration: 1 },
      { day: 3, slot: 2, courseId: 'c-cs202', actType: 'L', duration: 1 },
      { day: 3, slot: 3, courseId: 'c-cs203', actType: 'L', duration: 1 },
      { day: 3, slot: 4, courseId: 'c-cs204', actType: 'L', duration: 1 },

      // Thu: Slot 1: CS205, Slot 2: CS201, Slot 3: CS202, Slot 4: CS203, Slot 5-6: CS201 Lab
      { day: 4, slot: 1, courseId: 'c-cs205', actType: 'L', duration: 1 },
      { day: 4, slot: 2, courseId: 'c-cs201', actType: 'L', duration: 1 },
      { day: 4, slot: 3, courseId: 'c-cs202', actType: 'L', duration: 1 },
      { day: 4, slot: 4, courseId: 'c-cs203', actType: 'L', duration: 1 },
      { day: 4, slot: 5, courseId: 'c-cs201', actType: 'P', duration: 2 },

      // Fri: Slot 1: CS204, Slot 2: CS205, Slot 3: CS201, Slot 4: CS202
      { day: 5, slot: 1, courseId: 'c-cs204', actType: 'L', duration: 1 },
      { day: 5, slot: 2, courseId: 'c-cs205', actType: 'L', duration: 1 },
      { day: 5, slot: 3, courseId: 'c-cs201', actType: 'L', duration: 1 },
      { day: 5, slot: 4, courseId: 'c-cs202', actType: 'L', duration: 1 },

      // Sat: Slot 1: CS203, Slot 2: CS204
      { day: 6, slot: 1, courseId: 'c-cs203', actType: 'L', duration: 1 },
      { day: 6, slot: 2, courseId: 'c-cs204', actType: 'L', duration: 1 }
    ];

    let schedCount = 0;
    let occCount = 0;

    // Helper to insert schedule & occurrences
    async function insertSchedule(secId: string, homeRoom: string, labRoom: string, teacherMap: Record<string, string>, schedule: SlotPlan[]) {
      for (const item of schedule) {
        const offeringId = item.actType === 'P' ? `off-${secId === 'sec-cse-a' ? 'sec-a' : 'sec-b'}-${item.courseId}-P` : `off-${secId === 'sec-cse-a' ? 'sec-a' : 'sec-b'}-${item.courseId}-L`;
        const targetType = item.actType === 'P' ? 'batch' : 'section';
        const targetId = item.actType === 'P' ? `batch-${secId}-b1` : secId;
        const roomId = item.actType === 'P' ? labRoom : homeRoom;
        const teacherId = teacherMap[item.courseId];

        const scId = `sc-${secId}-d${item.day}-s${item.slot}`;
        await client.query(
          `INSERT INTO scheduled_classes (id, version_id, course_offering_id, term_id, day_of_week, start_slot, duration, activity_type, teacher_id, room_id, target_type, target_id, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'scheduled');`,
          [scId, versionId, offeringId, termId, item.day, item.slot, item.duration, item.actType, teacherId, roomId, targetType, targetId]
        );
        schedCount++;

        const occDate = dayDates[item.day];
        const occId = `occ-${scId}-${occDate}`;
        await client.query(
          `INSERT INTO class_occurrences (id, version_id, recurring_class_id, course_offering_id, term_id, date, day_of_week, start_slot, duration, activity_type, teacher_id, room_id, target_type, target_id, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'scheduled');`,
          [occId, versionId, scId, offeringId, termId, occDate, item.day, item.slot, item.duration, item.actType, teacherId, roomId, targetType, targetId]
        );
        occCount++;
      }
    }

    await insertSchedule('sec-cse-a', 'room-lt1', 'room-lab1', secATeachers, secASchedule);
    await insertSchedule('sec-cse-b', 'room-lt2', 'room-lab2', secBTeachers, secBSchedule);

    // 11. SHOWCASE OVERRIDES: 1 Cancellation & 1 Room Swap for testing
    // Cancelled: Sec A CS204 on Wed Nov 25 Slot 1
    const cancelOccId = 'occ-sc-sec-cse-a-d3-s1-2026-11-25';
    await client.query(
      `UPDATE class_occurrences SET status = 'cancelled', cancellation_reason = 'Faculty attending departmental curriculum review' WHERE id = $1;`,
      [cancelOccId]
    );
    await client.query(
      `INSERT INTO class_occurrence_events (id, occurrence_id, event_type, reason, actor_id)
       VALUES ('evt-cancel-1', $1, 'cancelled', 'Faculty attending departmental curriculum review', 'admin-001');`,
      [cancelOccId]
    );

    // Rescheduled Room Swap: Sec A CS201 on Wed Nov 25 Slot 3 (LT-1 -> LT-2)
    const swapOrigOccId = 'occ-sc-sec-cse-a-d3-s3-2026-11-25';
    const swapRepOccId = 'occ-rep-sec-cse-a-d3-s3-2026-11-25';
    await client.query(
      `INSERT INTO class_occurrences (id, version_id, recurring_class_id, course_offering_id, term_id, date, day_of_week, start_slot, duration, activity_type, teacher_id, room_id, target_type, target_id, status)
       VALUES ($1, $2, 'sc-sec-cse-a-d3-s3', 'off-sec-a-c-cs201-L', $3, '2026-11-25', 3, 3, 1, 'L', 't-1', 'room-lt2', 'section', 'sec-cse-a', 'scheduled');`,
      [swapRepOccId, versionId, termId]
    );
    await client.query(
      `UPDATE class_occurrences SET status = 'rescheduled', cancellation_reason = 'Smart Board Calibration in LT-1 - Swapped to LT-2', replacement_occurrence_id = $1 WHERE id = $2;`,
      [swapRepOccId, swapOrigOccId]
    );
    await client.query(
      `INSERT INTO class_occurrence_events (id, occurrence_id, event_type, reason, actor_id)
       VALUES ('evt-swap-1', $1, 'room_changed', 'Smart Board Calibration in LT-1 - Swapped to LT-2', 'admin-001');`,
      [swapOrigOccId]
    );

    // 12. REAL-TIME NOTIFICATIONS
    const notifications = [
      {
        id: 'notif-1',
        stId: 'stud-1',
        type: 'room_changed',
        title: 'Room Change: CS201 (Data Structures)',
        msg: 'Wednesday Period 3 relocated from LT-1 to LT-2 due to Smart Board calibration.'
      },
      {
        id: 'notif-2',
        stId: 'stud-1',
        type: 'class_cancelled',
        title: 'Class Cancelled: CS204 (COA)',
        msg: 'Wednesday Period 1 cancelled for faculty curriculum meeting.'
      },
      {
        id: 'notif-3',
        stId: 'stud-4',
        type: 'announcement',
        title: 'Published Semester 3 Timetable Active',
        msg: 'Odd Semester 2026-2027 timetable is live for all sections.'
      }
    ];

    for (const n of notifications) {
      await client.query(
        `INSERT INTO notification_outbox (id, recipient_student_id, event_type, title, message, status, created_at, delivered_at)
         VALUES ($1, $2, $3, $4, $5, 'delivered', NOW(), NOW());`,
        [n.id, n.stId, n.type, n.title, n.msg]
      );
    }

    await client.query('COMMIT;');
    console.log('\n======================================================');
    console.log('✓ SUCCESS: Small Clean Presentation Dataset Populated!');
    console.log(`- Academic Terms: 1 (Odd Sem 3)`);
    console.log(`- Sections: ${sections.length} (CSE-3-A, CSE-3-B)`);
    console.log(`- Batches: ${sections.length}`);
    console.log(`- Students: ${students.length} (6 students total, 3 in each section)`);
    console.log(`- Faculty: ${teachers.length} (6 teachers)`);
    console.log(`- Subjects: ${courses.length} (CS201, CS202, CS203, CS204, CS205)`);
    console.log(`- Scheduled Classes: ${schedCount} (Full week Mon-Sat)`);
    console.log(`- Class Occurrences: ${occCount + 1}`);
    console.log(`- Cancelled Class Showcase: 1`);
    console.log(`- Rescheduled Room-Swap Showcase: 1`);
    console.log(`- Notifications: ${notifications.length}`);
    console.log('======================================================\n');
  } catch (err) {
    await client.query('ROLLBACK;');
    console.error('ERROR seeding small dataset:', err);
    throw err;
  } finally {
    await client.end();
  }
}

if (process.argv[1]?.endsWith('seed_small_dataset.ts')) {
  seedSmallDataset().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
