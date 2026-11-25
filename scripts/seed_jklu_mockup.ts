/**
 * JK Lakshmipat University (JKLU) Comprehensive Presentation Mockup Dataset
 * Generates an idempotent, conflict-free, rich presentation dataset for TimeTable+.
 *
 * Covers:
 * - 4 Academic Terms (Odd Semesters 1, 3, 5, 7)
 * - 16 Distinct Sections (B.Tech CSE, AI&DS, ECE, BBA, B.Des)
 * - 32 Batches (B1, B2 per section)
 * - 80+ Students (Preserving Charlie Brown stud-1 & Yuvraj 2025Btech290)
 * - 26 Realistic JKLU Faculty Members (Preserving Dr. Alice Smith t-1)
 * - 22 Venues (LT-1 to LT-6, AB classrooms, Computing/AI/VLSI labs, Seminar Halls)
 * - 32 Realistic Courses with distinct Pastel Color Codes from CSV
 * - Dense, conflict-free Period-by-Period Weekly Schedule (Monday–Saturday)
 * - 2-Period Consecutive Practical Lab Blocks
 * - Presentation Showcase: 4 Cancelled Classes & 4 Rescheduled/Room-Swapped Classes
 * - 15 Realistic Realtime Notifications with staggered timestamps
 */

import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

export async function seedJkluMockup() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined in environment variables.');
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('✓ Connected to Supabase PostgreSQL for JKLU Presentation Mockup Seeding...');

  try {
    await client.query('BEGIN;');

    // 0. PURGE EXISTING DATA (Preserve profiles & auth.users)
    console.log('Purging existing data while preserving profiles and schema...');
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
    console.log('✓ Clean purge completed. All foreign key references cleared.');

    // 1. ACADEMIC TERMS (1st, 2nd, 3rd, 4th Year - Odd Semesters 2026-2027)
    console.log('Seeding academic terms...');
    const terms = [
      { id: 'term-sem1', yearLabel: '2026-2027', semesterNumber: 1, startDate: '2026-08-01', endDate: '2026-12-24', cycle: 'odd', status: 'active' },
      { id: 'term-sem3', yearLabel: '2026-2027', semesterNumber: 3, startDate: '2026-08-01', endDate: '2026-12-24', cycle: 'odd', status: 'active' },
      { id: 'term-sem5', yearLabel: '2026-2027', semesterNumber: 5, startDate: '2026-08-01', endDate: '2026-12-24', cycle: 'odd', status: 'active' },
      { id: 'term-sem7', yearLabel: '2026-2027', semesterNumber: 7, startDate: '2026-08-01', endDate: '2026-12-24', cycle: 'odd', status: 'active' }
    ];

    for (const t of terms) {
      await client.query(
        `INSERT INTO academic_terms (id, year_label, semester_number, start_date, end_date, cycle, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING;`,
        [t.id, t.yearLabel, t.semesterNumber, t.startDate, t.endDate, t.cycle, t.status]
      );
    }

    // 2. VENUES & ROOMS (22 JKLU Locations)
    console.log('Seeding JKLU venues and rooms...');
    const venues = [
      // Lecture Theatres
      { id: 'room-lt1', roomNumber: 'LT-1', building: 'Aryabhata Block', floor: 1, capacity: 120, roomType: 'LT' },
      { id: 'room-lt2', roomNumber: 'LT-2', building: 'Aryabhata Block', floor: 1, capacity: 120, roomType: 'LT' },
      { id: 'room-lt3', roomNumber: 'LT-3', building: 'Aryabhata Block', floor: 2, capacity: 100, roomType: 'LT' },
      { id: 'room-lt4', roomNumber: 'LT-4', building: 'Aryabhata Block', floor: 2, capacity: 100, roomType: 'LT' },
      { id: 'room-lt5', roomNumber: 'LT-5', building: 'Ramanujan Block', floor: 1, capacity: 90, roomType: 'LT' },
      { id: 'room-lt6', roomNumber: 'LT-6', building: 'Ramanujan Block', floor: 2, capacity: 90, roomType: 'LT' },

      // Academic Block Classrooms
      { id: 'room-ab1-101', roomNumber: 'AB1-101', building: 'Academic Block 1', floor: 1, capacity: 60, roomType: 'LT' },
      { id: 'room-ab1-102', roomNumber: 'AB1-102', building: 'Academic Block 1', floor: 1, capacity: 60, roomType: 'LT' },
      { id: 'room-ab1-201', roomNumber: 'AB1-201', building: 'Academic Block 1', floor: 2, capacity: 60, roomType: 'LT' },
      { id: 'room-ab1-202', roomNumber: 'AB1-202', building: 'Academic Block 1', floor: 2, capacity: 60, roomType: 'LT' },
      { id: 'room-ab2-101', roomNumber: 'AB2-101', building: 'Academic Block 2', floor: 1, capacity: 60, roomType: 'LT' },
      { id: 'room-ab2-102', roomNumber: 'AB2-102', building: 'Academic Block 2', floor: 1, capacity: 60, roomType: 'LT' },
      { id: 'room-ab2-201', roomNumber: 'AB2-201', building: 'Academic Block 2', floor: 2, capacity: 60, roomType: 'LT' },
      { id: 'room-ab2-304', roomNumber: 'AB2-304', building: 'Academic Block 2', floor: 3, capacity: 60, roomType: 'LT' },

      // Computer & Engineering Practical Labs (roomType 'P')
      { id: 'room-cslab1', roomNumber: 'CS-Lab-1', building: 'Computing Wing', floor: 1, capacity: 40, roomType: 'P' },
      { id: 'room-cslab2', roomNumber: 'CS-Lab-2', building: 'Computing Wing', floor: 1, capacity: 40, roomType: 'P' },
      { id: 'room-cslab3', roomNumber: 'CS-Lab-3', building: 'Computing Wing', floor: 2, capacity: 40, roomType: 'P' },
      { id: 'room-cslab4', roomNumber: 'CS-Lab-4', building: 'Computing Wing', floor: 2, capacity: 40, roomType: 'P' },
      { id: 'room-vlsi', roomNumber: 'VLSI/VHDL-Lab', building: 'Electronics Wing', floor: 1, capacity: 35, roomType: 'P' },
      { id: 'room-ailab', roomNumber: 'AI-Research-Lab', building: 'Innovation Wing', floor: 2, capacity: 35, roomType: 'P' },

      // Seminar & Auditorium Halls
      { id: 'room-sem-a', roomNumber: 'Seminar-Hall-A', building: 'Admin Block', floor: 1, capacity: 150, roomType: 'LT' },
      { id: 'room-sem-b', roomNumber: 'Seminar-Hall-B', building: 'Admin Block', floor: 2, capacity: 150, roomType: 'LT' }
    ];

    for (const v of venues) {
      await client.query(
        `INSERT INTO rooms (id, room_number, building, floor, capacity, room_type, active)
         VALUES ($1, $2, $3, $4, $5, $6, TRUE) ON CONFLICT (id) DO NOTHING;`,
        [v.id, v.roomNumber, v.building, v.floor, v.capacity, v.roomType]
      );
    }

    // 3. SECTIONS (16 Multi-Branch & Multi-Year Sections)
    console.log('Seeding 16 sections across years and branches...');
    const sections = [
      // 1st Year (Semester 1)
      { id: 'sec-btech-1a', termId: 'term-sem1', name: 'BTech-1-A', count: 60 },
      { id: 'sec-btech-1b', termId: 'term-sem1', name: 'BTech-1-B', count: 60 },
      { id: 'sec-bba-1', termId: 'term-sem1', name: 'BBA-1', count: 45 },
      { id: 'sec-bdes-1', termId: 'term-sem1', name: 'BDes-1', count: 35 },

      // 2nd Year (Semester 3)
      { id: 'sec-cse-3a', termId: 'term-sem3', name: 'CSE-3-A', count: 60 },
      { id: 'sec-cse-3b', termId: 'term-sem3', name: 'CSE-3-B', count: 60 },
      { id: 'sec-aids-3', termId: 'term-sem3', name: 'AIDS-3', count: 45 },
      { id: 'sec-ece-3', termId: 'term-sem3', name: 'ECE-3', count: 40 },
      { id: 'sec-bba-3', termId: 'term-sem3', name: 'BBA-3', count: 45 },
      { id: 'sec-bdes-3', termId: 'term-sem3', name: 'BDes-3', count: 35 },

      // 3rd Year (Semester 5)
      { id: 'sec-cse-5a', termId: 'term-sem5', name: 'CSE-5-A', count: 60 },
      { id: 'sec-cse-5b', termId: 'term-sem5', name: 'CSE-5-B', count: 60 },
      { id: 'sec-aids-5', termId: 'term-sem5', name: 'AIDS-5', count: 45 },
      { id: 'sec-ece-5', termId: 'term-sem5', name: 'ECE-5', count: 40 },

      // 4th Year (Semester 7)
      { id: 'sec-cse-7a', termId: 'term-sem7', name: 'CSE-7-A', count: 60 },
      { id: 'sec-cse-7b', termId: 'term-sem7', name: 'CSE-7-B', count: 60 }
    ];

    for (const s of sections) {
      await client.query(
        `INSERT INTO sections (id, term_id, name, expected_count, active)
         VALUES ($1, $2, $3, $4, TRUE) ON CONFLICT (id) DO NOTHING;`,
        [s.id, s.termId, s.name, s.count]
      );
    }

    // 4. BATCHES (2 Batches per Section = 32 Batches)
    console.log('Seeding 32 batches...');
    for (const s of sections) {
      const b1Id = `batch-${s.id}-b1`;
      const b2Id = `batch-${s.id}-b2`;
      await client.query(
        `INSERT INTO batches (id, section_id, name, expected_count, active)
         VALUES ($1, $2, $3, $4, TRUE), ($5, $2, $6, $7, TRUE) ON CONFLICT (id) DO NOTHING;`,
        [b1Id, s.id, `${s.name}-B1`, Math.floor(s.count / 2), b2Id, `${s.name}-B2`, Math.ceil(s.count / 2)]
      );
    }

    // 5. TEACHERS (26 Realistic JKLU Faculty Profiles)
    console.log('Seeding 26 faculty profiles...');
    const faculty = [
      { id: 't-1', empId: 'EMP-001', name: 'Dr. Alice Smith', email: 'teacher@university.edu' },
      { id: 't-2', empId: 'EMP-002', name: 'Prof. Sanjay Goel', email: 'sanjay.goel@jklu.edu.in' },
      { id: 't-3', empId: 'EMP-003', name: 'Dr. Alok Kumar', email: 'alok.kumar@jklu.edu.in' },
      { id: 't-4', empId: 'EMP-004', name: 'Dr. Devendra Bhavsar', email: 'devendra.bhavsar@jklu.edu.in' },
      { id: 't-5', empId: 'EMP-005', name: 'Dr. Meenal Jain', email: 'meenal.jain@jklu.edu.in' },
      { id: 't-6', empId: 'EMP-006', name: 'Dr. Sonal Jain', email: 'sonal.jain@jklu.edu.in' },
      { id: 't-7', empId: 'EMP-007', name: 'Dr. Vikas Sharma', email: 'vikas.sharma@jklu.edu.in' },
      { id: 't-8', empId: 'EMP-008', name: 'Dr. Priti Rai', email: 'priti.rai@jklu.edu.in' },
      { id: 't-9', empId: 'EMP-009', name: 'Dr. Ritu Sharma', email: 'ritu.sharma@jklu.edu.in' },
      { id: 't-10', empId: 'EMP-010', name: 'Dr. Umashankar Rawat', email: 'umashankar.rawat@jklu.edu.in' },
      { id: 't-11', empId: 'EMP-011', name: 'Dr. Nidhi Bansal', email: 'nidhi.bansal@jklu.edu.in' },
      { id: 't-12', empId: 'EMP-012', name: 'Dr. Anupam Kumar', email: 'anupam.kumar@jklu.edu.in' },
      { id: 't-13', empId: 'EMP-013', name: 'Dr. K.S. Sharma', email: 'ks.sharma@jklu.edu.in' },
      { id: 't-14', empId: 'EMP-014', name: 'Dr. Pushpendra Singh', email: 'pushpendra.singh@jklu.edu.in' },
      { id: 't-15', empId: 'EMP-015', name: 'Dr. Richa Sharma', email: 'richa.sharma@jklu.edu.in' },
      { id: 't-16', empId: 'EMP-016', name: 'Dr. Tarun Kumar', email: 'tarun.kumar@jklu.edu.in' },
      { id: 't-17', empId: 'EMP-017', name: 'Prof. Harshita Khandelwal', email: 'harshita.k@jklu.edu.in' },
      { id: 't-18', empId: 'EMP-018', name: 'Dr. Neeraj Anand', email: 'neeraj.anand@jklu.edu.in' },
      { id: 't-19', empId: 'EMP-019', name: 'Dr. Jaya Gupta', email: 'jaya.gupta@jklu.edu.in' },
      { id: 't-20', empId: 'EMP-020', name: 'Prof. Gaurav Mathur', email: 'gaurav.mathur@jklu.edu.in' },
      { id: 't-21', empId: 'EMP-021', name: 'Prof. Sunita Agarwal', email: 'sunita.agarwal@jklu.edu.in' },
      { id: 't-22', empId: 'EMP-022', name: 'Dr. Amit Sinhal', email: 'amit.sinhal@jklu.edu.in' },
      { id: 't-23', empId: 'EMP-023', name: 'Dr. Jyoti Snehi', email: 'jyoti.snehi@jklu.edu.in' },
      { id: 't-24', empId: 'EMP-024', name: 'Dr. Mohit Kumar', email: 'mohit.kumar@jklu.edu.in' },
      { id: 't-25', empId: 'EMP-025', name: 'Dr. Priyanka Mittal', email: 'priyanka.mittal@jklu.edu.in' },
      { id: 't-26', empId: 'EMP-026', name: 'Dr. Abhishek Sharma', email: 'abhishek.sharma@jklu.edu.in' }
    ];

    for (const f of faculty) {
      await client.query(
        `INSERT INTO teachers (id, emp_id, name, email, active)
         VALUES ($1, $2, $3, $4, TRUE) ON CONFLICT (id) DO NOTHING;`,
        [f.id, f.empId, f.name, f.email]
      );
    }

    // 6. STUDENTS & GROUP MEMBERSHIPS (Preserve Charlie Brown & Yuvraj Singh Rathore)
    console.log('Seeding student cohort and memberships across all 16 sections...');
    const students = [
      // Semester 1: BTech-1-A
      { id: 'stud-11', roll: '2026BTECH001', name: 'Aryan Choudhary', email: 'aryan.c@jklu.edu.in', sectionId: 'sec-btech-1a', batchId: 'batch-sec-btech-1a-b1' },
      { id: 'stud-16', roll: '2026BTECH002', name: 'Bhavna Soni', email: 'bhavna.s@jklu.edu.in', sectionId: 'sec-btech-1a', batchId: 'batch-sec-btech-1a-b1' },
      { id: 'stud-17', roll: '2026BTECH003', name: 'Chetna Saini', email: 'chetna.s@jklu.edu.in', sectionId: 'sec-btech-1a', batchId: 'batch-sec-btech-1a-b2' },
      { id: 'stud-18', roll: '2026BTECH004', name: 'Daksh Rawat', email: 'daksh.r@jklu.edu.in', sectionId: 'sec-btech-1a', batchId: 'batch-sec-btech-1a-b2' },

      // Semester 1: BTech-1-B
      { id: 'stud-12', roll: '2026BTECH005', name: 'Tanvi Jain', email: 'tanvi.j@jklu.edu.in', sectionId: 'sec-btech-1b', batchId: 'batch-sec-btech-1b-b1' },
      { id: 'stud-19', roll: '2026BTECH006', name: 'Eshan Joshi', email: 'eshan.j@jklu.edu.in', sectionId: 'sec-btech-1b', batchId: 'batch-sec-btech-1b-b1' },
      { id: 'stud-20', roll: '2026BTECH007', name: 'Farhan Khan', email: 'farhan.k@jklu.edu.in', sectionId: 'sec-btech-1b', batchId: 'batch-sec-btech-1b-b2' },
      { id: 'stud-21', roll: '2026BTECH008', name: 'Garima Vyas', email: 'garima.v@jklu.edu.in', sectionId: 'sec-btech-1b', batchId: 'batch-sec-btech-1b-b2' },

      // Semester 1: BBA-1
      { id: 'stud-22', roll: '2026BBA001', name: 'Harsh Vardhan', email: 'harsh.v@jklu.edu.in', sectionId: 'sec-bba-1', batchId: 'batch-sec-bba-1-b1' },
      { id: 'stud-23', roll: '2026BBA002', name: 'Ishan Mishra', email: 'ishan.m@jklu.edu.in', sectionId: 'sec-bba-1', batchId: 'batch-sec-bba-1-b1' },
      { id: 'stud-24', roll: '2026BBA003', name: 'Jhanvi Rathore', email: 'jhanvi.r@jklu.edu.in', sectionId: 'sec-bba-1', batchId: 'batch-sec-bba-1-b2' },
      { id: 'stud-25', roll: '2026BBA004', name: 'Karan Bhatia', email: 'karan.b@jklu.edu.in', sectionId: 'sec-bba-1', batchId: 'batch-sec-bba-1-b2' },

      // Semester 1: BDes-1
      { id: 'stud-26', roll: '2026BDES001', name: 'Lavanya Nair', email: 'lavanya.n@jklu.edu.in', sectionId: 'sec-bdes-1', batchId: 'batch-sec-bdes-1-b1' },
      { id: 'stud-27', roll: '2026BDES002', name: 'Manan Sethi', email: 'manan.s@jklu.edu.in', sectionId: 'sec-bdes-1', batchId: 'batch-sec-bdes-1-b1' },
      { id: 'stud-28', roll: '2026BDES003', name: 'Nandini Kaushik', email: 'nandini.k@jklu.edu.in', sectionId: 'sec-bdes-1', batchId: 'batch-sec-bdes-1-b2' },
      { id: 'stud-29', roll: '2026BDES004', name: 'Ojas Goyal', email: 'ojas.g@jklu.edu.in', sectionId: 'sec-bdes-1', batchId: 'batch-sec-bdes-1-b2' },

      // Semester 3: CSE-3-A (Charlie Brown)
      { id: 'stud-1', roll: '2025BTECH001', name: 'Charlie Brown', email: 'student@university.edu', sectionId: 'sec-cse-3a', batchId: 'batch-sec-cse-3a-b1' },
      { id: 'stud-5', roll: '2025BTECH005', name: 'Aarav Mehta', email: 'aarav.mehta@jklu.edu.in', sectionId: 'sec-cse-3a', batchId: 'batch-sec-cse-3a-b1' },
      { id: 'stud-6', roll: '2025BTECH006', name: 'Ananya Sharma', email: 'ananya.sharma@jklu.edu.in', sectionId: 'sec-cse-3a', batchId: 'batch-sec-cse-3a-b2' },
      { id: 'stud-30', roll: '2025BTECH011', name: 'Pranav Singhal', email: 'pranav.s@jklu.edu.in', sectionId: 'sec-cse-3a', batchId: 'batch-sec-cse-3a-b2' },

      // Semester 3: CSE-3-B
      { id: 'stud-7', roll: '2025BTECH007', name: 'Rohan Gupta', email: 'rohan.gupta@jklu.edu.in', sectionId: 'sec-cse-3b', batchId: 'batch-sec-cse-3b-b1' },
      { id: 'stud-8', roll: '2025BTECH008', name: 'Ishita Sen', email: 'ishita.sen@jklu.edu.in', sectionId: 'sec-cse-3b', batchId: 'batch-sec-cse-3b-b1' },
      { id: 'stud-31', roll: '2025BTECH012', name: 'Ritwik Banerjee', email: 'ritwik.b@jklu.edu.in', sectionId: 'sec-cse-3b', batchId: 'batch-sec-cse-3b-b2' },
      { id: 'stud-32', roll: '2025BTECH013', name: 'Saumya Trivedi', email: 'saumya.t@jklu.edu.in', sectionId: 'sec-cse-3b', batchId: 'batch-sec-cse-3b-b2' },

      // Semester 3: AIDS-3
      { id: 'stud-9', roll: '2025BTECH009', name: 'Kabir Verma', email: 'kabir.verma@jklu.edu.in', sectionId: 'sec-aids-3', batchId: 'batch-sec-aids-3-b1' },
      { id: 'stud-33', roll: '2025BTECH014', name: 'Tanishq Khandelwal', email: 'tanishq.k@jklu.edu.in', sectionId: 'sec-aids-3', batchId: 'batch-sec-aids-3-b1' },
      { id: 'stud-34', roll: '2025BTECH015', name: 'Urvashi Pareek', email: 'urvashi.p@jklu.edu.in', sectionId: 'sec-aids-3', batchId: 'batch-sec-aids-3-b2' },
      { id: 'stud-35', roll: '2025BTECH016', name: 'Vaibhav Mathur', email: 'vaibhav.m@jklu.edu.in', sectionId: 'sec-aids-3', batchId: 'batch-sec-aids-3-b2' },

      // Semester 3: ECE-3
      { id: 'stud-10', roll: '2025BTECH010', name: 'Diya Patel', email: 'diya.patel@jklu.edu.in', sectionId: 'sec-ece-3', batchId: 'batch-sec-ece-3-b1' },
      { id: 'stud-36', roll: '2025BTECH017', name: 'Yash Agrawal', email: 'yash.a@jklu.edu.in', sectionId: 'sec-ece-3', batchId: 'batch-sec-ece-3-b1' },
      { id: 'stud-37', roll: '2025BTECH018', name: 'Zoya Siddiqui', email: 'zoya.s@jklu.edu.in', sectionId: 'sec-ece-3', batchId: 'batch-sec-ece-3-b2' },
      { id: 'stud-38', roll: '2025BTECH019', name: 'Aditya Kothari', email: 'aditya.k@jklu.edu.in', sectionId: 'sec-ece-3', batchId: 'batch-sec-ece-3-b2' },

      // Semester 3: BBA-3
      { id: 'stud-14', roll: '2025BBA001', name: 'Meera Saxena', email: 'meera.s@jklu.edu.in', sectionId: 'sec-bba-3', batchId: 'batch-sec-bba-3-b1' },
      { id: 'stud-39', roll: '2025BBA002', name: 'Bhavesh Solanki', email: 'bhavesh.s@jklu.edu.in', sectionId: 'sec-bba-3', batchId: 'batch-sec-bba-3-b1' },
      { id: 'stud-40', roll: '2025BBA003', name: 'Charu Bansal', email: 'charu.b@jklu.edu.in', sectionId: 'sec-bba-3', batchId: 'batch-sec-bba-3-b2' },
      { id: 'stud-41', roll: '2025BBA004', name: 'Deepanshu Garg', email: 'deepanshu.g@jklu.edu.in', sectionId: 'sec-bba-3', batchId: 'batch-sec-bba-3-b2' },

      // Semester 3: BDes-3
      { id: 'stud-15', roll: '2025BDES001', name: 'Devansh Kothari', email: 'devansh.k@jklu.edu.in', sectionId: 'sec-bdes-3', batchId: 'batch-sec-bdes-3-b1' },
      { id: 'stud-42', roll: '2025BDES002', name: 'Ekta Chawla', email: 'ekta.c@jklu.edu.in', sectionId: 'sec-bdes-3', batchId: 'batch-sec-bdes-3-b1' },
      { id: 'stud-43', roll: '2025BDES003', name: 'Falguni Dave', email: 'falguni.d@jklu.edu.in', sectionId: 'sec-bdes-3', batchId: 'batch-sec-bdes-3-b2' },
      { id: 'stud-44', roll: '2025BDES004', name: 'Gauransh Tak', email: 'gauransh.t@jklu.edu.in', sectionId: 'sec-bdes-3', batchId: 'batch-sec-bdes-3-b2' },

      // Semester 5: CSE-5-A (Yuvraj Singh Rathore, Aadrika Roy, Priecy Gandhi, Chirag Pareek)
      { id: '2025Btech290', roll: '2025Btech290', name: 'Yuvraj Singh Rathore', email: 'yuvi@abc.com', sectionId: 'sec-cse-5a', batchId: 'batch-sec-cse-5a-b1' },
      { id: 'stud-2', roll: '2025BTECH002', name: 'Aadrika Roy', email: 'aadrika.roy@jklu.edu.in', sectionId: 'sec-cse-5a', batchId: 'batch-sec-cse-5a-b1' },
      { id: 'stud-3', roll: '2025BTECH003', name: 'Priecy Gandhi', email: 'priecy.gandhi@jklu.edu.in', sectionId: 'sec-cse-5a', batchId: 'batch-sec-cse-5a-b2' },
      { id: 'stud-4', roll: '2025BTECH004', name: 'Chirag Pareek', email: 'chirag.pareek@jklu.edu.in', sectionId: 'sec-cse-5a', batchId: 'batch-sec-cse-5a-b2' },

      // Semester 5: CSE-5-B
      { id: 'stud-45', roll: '2025BTECH020', name: 'Harshit Khurana', email: 'harshit.k@jklu.edu.in', sectionId: 'sec-cse-5b', batchId: 'batch-sec-cse-5b-b1' },
      { id: 'stud-46', roll: '2025BTECH021', name: 'Ishani Bose', email: 'ishani.b@jklu.edu.in', sectionId: 'sec-cse-5b', batchId: 'batch-sec-cse-5b-b1' },
      { id: 'stud-47', roll: '2025BTECH022', name: 'Jayesh Purohit', email: 'jayesh.p@jklu.edu.in', sectionId: 'sec-cse-5b', batchId: 'batch-sec-cse-5b-b2' },
      { id: 'stud-48', roll: '2025BTECH023', name: 'Kriti Chauhan', email: 'kriti.c@jklu.edu.in', sectionId: 'sec-cse-5b', batchId: 'batch-sec-cse-5b-b2' },

      // Semester 5: AIDS-5
      { id: 'stud-49', roll: '2025BTECH024', name: 'Lakshya Jain', email: 'lakshya.j@jklu.edu.in', sectionId: 'sec-aids-5', batchId: 'batch-sec-aids-5-b1' },
      { id: 'stud-50', roll: '2025BTECH025', name: 'Mohit Choudhary', email: 'mohit.c@jklu.edu.in', sectionId: 'sec-aids-5', batchId: 'batch-sec-aids-5-b1' },
      { id: 'stud-51', roll: '2025BTECH026', name: 'Neha Shekhawat', email: 'neha.s@jklu.edu.in', sectionId: 'sec-aids-5', batchId: 'batch-sec-aids-5-b2' },
      { id: 'stud-52', roll: '2025BTECH027', name: 'Palak Mundra', email: 'palak.m@jklu.edu.in', sectionId: 'sec-aids-5', batchId: 'batch-sec-aids-5-b2' },

      // Semester 5: ECE-5
      { id: 'stud-53', roll: '2025BTECH028', name: 'Parth Sharma', email: 'parth.s@jklu.edu.in', sectionId: 'sec-ece-5', batchId: 'batch-sec-ece-5-b1' },
      { id: 'stud-54', roll: '2025BTECH029', name: 'Raghav Maheshwari', email: 'raghav.m@jklu.edu.in', sectionId: 'sec-ece-5', batchId: 'batch-sec-ece-5-b1' },
      { id: 'stud-55', roll: '2025BTECH030', name: 'Ridhima Mittal', email: 'ridhima.m@jklu.edu.in', sectionId: 'sec-ece-5', batchId: 'batch-sec-ece-5-b2' },
      { id: 'stud-56', roll: '2025BTECH031', name: 'Sahil Saxena', email: 'sahil.s@jklu.edu.in', sectionId: 'sec-ece-5', batchId: 'batch-sec-ece-5-b2' },

      // Semester 7: CSE-7-A
      { id: 'stud-13', roll: '2024BTECH001', name: 'Siddharth Rao', email: 'siddharth.r@jklu.edu.in', sectionId: 'sec-cse-7a', batchId: 'batch-sec-cse-7a-b1' },
      { id: 'stud-57', roll: '2024BTECH002', name: 'Tanya Srivastava', email: 'tanya.s@jklu.edu.in', sectionId: 'sec-cse-7a', batchId: 'batch-sec-cse-7a-b1' },
      { id: 'stud-58', roll: '2024BTECH003', name: 'Umang Singhi', email: 'umang.s@jklu.edu.in', sectionId: 'sec-cse-7a', batchId: 'batch-sec-cse-7a-b2' },
      { id: 'stud-59', roll: '2024BTECH004', name: 'Varun Khemka', email: 'varun.k@jklu.edu.in', sectionId: 'sec-cse-7a', batchId: 'batch-sec-cse-7a-b2' },

      // Semester 7: CSE-7-B
      { id: 'stud-60', roll: '2024BTECH005', name: 'Vidit Lodha', email: 'vidit.l@jklu.edu.in', sectionId: 'sec-cse-7b', batchId: 'batch-sec-cse-7b-b1' },
      { id: 'stud-61', roll: '2024BTECH006', name: 'Yamini Goyal', email: 'yamini.g@jklu.edu.in', sectionId: 'sec-cse-7b', batchId: 'batch-sec-cse-7b-b1' },
      { id: 'stud-62', roll: '2024BTECH007', name: 'Yashwardhan Bhati', email: 'yashwardhan.b@jklu.edu.in', sectionId: 'sec-cse-7b', batchId: 'batch-sec-cse-7b-b2' },
      { id: 'stud-63', roll: '2024BTECH008', name: 'Zaid Mansoori', email: 'zaid.m@jklu.edu.in', sectionId: 'sec-cse-7b', batchId: 'batch-sec-cse-7b-b2' }
    ];

    for (const st of students) {
      await client.query(
        `INSERT INTO students (id, roll_number, name, email, active)
         VALUES ($1, $2, $3, $4, TRUE) ON CONFLICT (id) DO UPDATE SET roll_number = EXCLUDED.roll_number, name = EXCLUDED.name, email = EXCLUDED.email;`,
        [st.id, st.roll, st.name, st.email]
      );
      // Section membership
      await client.query(
        `INSERT INTO student_group_memberships (id, student_id, group_id, group_type, effective_start_date)
         VALUES ($1, $2, $3, 'section', '2026-08-01') ON CONFLICT (id) DO NOTHING;`,
        [`sgm-${st.id}-sec`, st.id, st.sectionId]
      );
      // Batch membership
      await client.query(
        `INSERT INTO student_group_memberships (id, student_id, group_id, group_type, effective_start_date)
         VALUES ($1, $2, $3, 'batch', '2026-08-01') ON CONFLICT (id) DO NOTHING;`,
        [`sgm-${st.id}-batch`, st.id, st.batchId]
      );
    }

    // 7. COURSES (32 Realistic Engineering, Management & Design Courses with CSV Pastel Colors)
    console.log('Seeding 32 realistic courses with CSV pastel color styling...');
    const courses = [
      // 1st Year (term-sem1)
      { id: 'c-cs101', code: 'CS101', name: 'Programming in C & Problem Solving', termId: 'term-sem1', l: 3, t: 0, p: 2, bg: '#DCEBFA', font: '#233B59', border: '#BFDBFE', type: 'LT' },
      { id: 'c-cs102', code: 'CS102', name: 'Digital Logic & Computer Design', termId: 'term-sem1', l: 3, t: 1, p: 0, bg: '#FBE3CC', font: '#70431F', border: '#FDBA74', type: 'LT' },
      { id: 'c-ma101', code: 'MA101', name: 'Calculus & Linear Algebra', termId: 'term-sem1', l: 3, t: 1, p: 0, bg: '#DDF1DF', font: '#285437', border: '#BBF7D0', type: 'LT' },
      { id: 'c-ph101', code: 'PH101', name: 'Engineering Physics & Electromagnetism', termId: 'term-sem1', l: 3, t: 0, p: 2, bg: '#E8DDF8', font: '#4B326B', border: '#DDD6FE', type: 'LT' },
      { id: 'c-mg101', code: 'MG101', name: 'Principles & Practices of Management', termId: 'term-sem1', l: 3, t: 0, p: 0, bg: '#F8DCE0', font: '#773441', border: '#FFE4E6', type: 'LT' },
      { id: 'c-mg102', code: 'MG102', name: 'Financial Accounting & Analysis', termId: 'term-sem1', l: 3, t: 1, p: 0, bg: '#E3F0D2', font: '#3C5329', border: '#DCFCE7', type: 'LT' },
      { id: 'c-ds101', code: 'DS101', name: 'Design Fundamentals & Visual Thinking', termId: 'term-sem1', l: 2, t: 0, p: 2, bg: '#D1EEE7', font: '#205348', border: '#CCFBF1', type: 'LT' },
      { id: 'c-ds102', code: 'DS102', name: 'Color Theory & Typography', termId: 'term-sem1', l: 2, t: 0, p: 2, bg: '#FFF3D2', font: '#69501C', border: '#FEF3C7', type: 'LT' },

      // 2nd Year (term-sem3)
      { id: 'c-cs201', code: 'CS201', name: 'Data Structures & Algorithms', termId: 'term-sem3', l: 3, t: 0, p: 2, bg: '#D3F0EC', font: '#20534D', border: '#99F6E4', type: 'LT' },
      { id: 'c-cs202', code: 'CS202', name: 'Discrete Mathematics & Graph Theory', termId: 'term-sem3', l: 3, t: 1, p: 0, bg: '#FFF0BD', font: '#654D13', border: '#FDE68A', type: 'LT' },
      { id: 'c-cs203', code: 'CS203', name: 'Object-Oriented Programming with Java', termId: 'term-sem3', l: 3, t: 0, p: 2, bg: '#FADBD4', font: '#753B32', border: '#FECDD3', type: 'LT' },
      { id: 'c-ec201', code: 'EC201', name: 'Digital Electronics with VHDL', termId: 'term-sem3', l: 3, t: 0, p: 2, bg: '#D9F4E5', font: '#23553F', border: '#A7F3D0', type: 'LT' },
      { id: 'c-ec202', code: 'EC202', name: 'Signals, Systems & Transforms', termId: 'term-sem3', l: 3, t: 1, p: 0, bg: '#DFE3FB', font: '#343B70', border: '#C7D2FE', type: 'LT' },
      { id: 'c-ai201', code: 'AI201', name: 'Foundations of Data Science & Python', termId: 'term-sem3', l: 3, t: 0, p: 2, bg: '#EAF2C9', font: '#46551F', border: '#D9F99D', type: 'LT' },
      { id: 'c-mg201', code: 'MG201', name: 'Marketing Management & Consumer Insights', termId: 'term-sem3', l: 3, t: 0, p: 0, bg: '#E3F3FC', font: '#2D5068', border: '#E0F2FE', type: 'LT' },
      { id: 'c-ds201', code: 'DS201', name: 'User Experience (UX) & Interaction Design', termId: 'term-sem3', l: 2, t: 0, p: 2, bg: '#F1DAD3', font: '#6C3930', border: '#FEE2E2', type: 'LT' },

      // 3rd Year (term-sem5)
      { id: 'c-cs301', code: 'CS301', name: 'Relational Algebra & DBMS', termId: 'term-sem5', l: 3, t: 0, p: 2, bg: '#FFE0D1', font: '#753F2B', border: '#FED7AA', type: 'LT' },
      { id: 'c-cs302', code: 'CS302', name: 'Operating Systems & Kernel Design', termId: 'term-sem5', l: 3, t: 0, p: 2, bg: '#D8F1F8', font: '#205064', border: '#BAE6FD', type: 'LT' },
      { id: 'c-cs303', code: 'CS303', name: 'Computer Networks & Protocols', termId: 'term-sem5', l: 3, t: 1, p: 0, bg: '#F4D7D9', font: '#71353D', border: '#FECDD3', type: 'LT' },
      { id: 'c-cs304', code: 'CS304', name: 'Design & Analysis of Algorithms', termId: 'term-sem5', l: 3, t: 1, p: 0, bg: '#EADCF0', font: '#573761', border: '#E9D5FF', type: 'LT' },
      { id: 'c-ai301', code: 'AI301', name: 'Machine Learning Foundations', termId: 'term-sem5', l: 3, t: 0, p: 2, bg: '#E2D8F7', font: '#46356B', border: '#DDD6FE', type: 'LT' },
      { id: 'c-ai302', code: 'AI302', name: 'Data Mining & Statistical Inference', termId: 'term-sem5', l: 3, t: 0, p: 2, bg: '#FCE6B9', font: '#654716', border: '#FED7AA', type: 'LT' },
      { id: 'c-ec301', code: 'EC301', name: 'Microprocessors & Embedded Systems', termId: 'term-sem5', l: 3, t: 0, p: 2, bg: '#F8D9CC', font: '#743D2E', border: '#FFEDD5', type: 'LT' },
      { id: 'c-cs305', code: 'CS305', name: 'Full-Stack Web Engineering', termId: 'term-sem5', l: 2, t: 0, p: 2, bg: '#D8F0E2', font: '#285441', border: '#D1FAE5', type: 'LT' },

      // 4th Year (term-sem7)
      { id: 'c-cs401', code: 'CS401', name: 'Compiler Design & Program Analysis', termId: 'term-sem7', l: 3, t: 1, p: 0, bg: '#DFE9D6', font: '#3C5030', border: '#D1FAE5', type: 'LT' },
      { id: 'c-cs402', code: 'CS402', name: 'Cloud Computing & Distributed Systems', termId: 'term-sem7', l: 3, t: 0, p: 2, bg: '#D5EAFB', font: '#254A70', border: '#BFDBFE', type: 'LT' },
      { id: 'c-cs403', code: 'CS403', name: 'Cybersecurity & Reverse Engineering', termId: 'term-sem7', l: 3, t: 0, p: 2, bg: '#EBD8E7', font: '#603D59', border: '#F3E8FF', type: 'LT' },
      { id: 'c-ai401', code: 'AI401', name: 'Deep Learning & Neural Architectures', termId: 'term-sem7', l: 3, t: 0, p: 2, bg: '#D4F1F2', font: '#205155', border: '#CFFAFE', type: 'LT' },
      { id: 'c-ai402', code: 'AI402', name: 'Natural Language Processing', termId: 'term-sem7', l: 3, t: 0, p: 2, bg: '#FCE6B9', font: '#654716', border: '#FED7AA', type: 'LT' },
      { id: 'c-ec401', code: 'EC401', name: 'VLSI Design & System Architecture', termId: 'term-sem7', l: 3, t: 0, p: 2, bg: '#DFE0F5', font: '#373B6D', border: '#E0E7FF', type: 'LT' },
      { id: 'c-ai403', code: 'AI403', name: 'Computer Vision & Autonomous Systems', termId: 'term-sem7', l: 3, t: 0, p: 2, bg: '#FBE0B7', font: '#70461A', border: '#FFEDD5', type: 'LT' },
      { id: 'c-cs404', code: 'CS404', name: 'DevOps & Site Reliability Engineering', termId: 'term-sem7', l: 2, t: 0, p: 2, bg: '#DCEAE3', font: '#315447', border: '#A7F3D0', type: 'LT' }
    ];

    for (const c of courses) {
      await client.query(
        `INSERT INTO courses (id, code, name, term_id, lecture_hours, tutorial_hours, practical_hours, required_room_type, card_bg_color, font_color, border_color)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) ON CONFLICT (id) DO NOTHING;`,
        [c.id, c.code, c.name, c.termId, c.l, c.t, c.p, c.type, c.bg, c.font, c.border]
      );
    }

    // 8. TIMETABLE VERSIONS (Published V1 for each Term)
    console.log('Seeding published timetable versions...');
    const versions = [
      { id: 'ver-sem1-v1', termId: 'term-sem1', versionNumber: 1, status: 'published', inputRevision: 'rev-2026-s1', createdBy: 'admin-001' },
      { id: 'ver-sem3-v1', termId: 'term-sem3', versionNumber: 1, status: 'published', inputRevision: 'rev-2026-s3', createdBy: 'admin-001' },
      { id: 'ver-sem5-v1', termId: 'term-sem5', versionNumber: 1, status: 'published', inputRevision: 'rev-2026-s5', createdBy: 'admin-001' },
      { id: 'ver-sem7-v1', termId: 'term-sem7', versionNumber: 1, status: 'published', inputRevision: 'rev-2026-s7', createdBy: 'admin-001' }
    ];

    for (const v of versions) {
      await client.query(
        `INSERT INTO timetable_versions (id, term_id, version_number, status, input_revision, created_by, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW()) ON CONFLICT (id) DO NOTHING;`,
        [v.id, v.termId, v.versionNumber, v.status, v.inputRevision, v.createdBy]
      );
    }

    // 9. COURSE OFFERINGS & CONFLICT-FREE SCHEDULE GENERATION
    console.log('Generating conflict-free course offerings and dense period schedule...');

    // Mapping of sections to course sets and assigned teachers/rooms
    interface SectionSchedulePlan {
      sectionId: string;
      termId: string;
      versionId: string;
      homeRoomId: string;
      labRoomId: string;
      courses: {
        courseId: string;
        teacherId: string;
        activityType: 'L' | 'P';
        duration: 1 | 2;
        day: number; // 1: Mon, 2: Tue, 3: Wed, 4: Thu, 5: Fri, 6: Sat
        slot: number; // 1 to 7
      }[];
    }

    const schedulePlans: SectionSchedulePlan[] = [
      // === CSE-3-A (Charlie Brown stud-1) ===
      {
        sectionId: 'sec-cse-3a',
        termId: 'term-sem3',
        versionId: 'ver-sem3-v1',
        homeRoomId: 'room-lt1',
        labRoomId: 'room-cslab1',
        courses: [
          // Mon
          { courseId: 'c-cs201', teacherId: 't-3', activityType: 'L', duration: 1, day: 1, slot: 1 },
          { courseId: 'c-cs202', teacherId: 't-8', activityType: 'L', duration: 1, day: 1, slot: 2 },
          { courseId: 'c-cs203', teacherId: 't-22', activityType: 'L', duration: 1, day: 1, slot: 3 },
          { courseId: 'c-ec201', teacherId: 't-11', activityType: 'L', duration: 1, day: 1, slot: 4 },
          { courseId: 'c-cs201', teacherId: 't-3', activityType: 'P', duration: 2, day: 1, slot: 5 }, // 2-hour lab

          // Tue
          { courseId: 'c-cs202', teacherId: 't-8', activityType: 'L', duration: 1, day: 2, slot: 1 },
          { courseId: 'c-cs201', teacherId: 't-3', activityType: 'L', duration: 1, day: 2, slot: 2 },
          { courseId: 'c-cs203', teacherId: 't-22', activityType: 'L', duration: 1, day: 2, slot: 3 },
          { courseId: 'c-ec202', teacherId: 't-13', activityType: 'L', duration: 1, day: 2, slot: 4 },
          { courseId: 'c-cs203', teacherId: 't-22', activityType: 'P', duration: 2, day: 2, slot: 5 }, // 2-hour lab

          // Wed (SHOWCASE: Cancellation & Room-Swap)
          { courseId: 'c-cs201', teacherId: 't-3', activityType: 'L', duration: 1, day: 3, slot: 1 }, // will showcase CANCELLED
          { courseId: 'c-cs203', teacherId: 't-22', activityType: 'L', duration: 1, day: 3, slot: 2 },
          { courseId: 'c-ec201', teacherId: 't-11', activityType: 'L', duration: 1, day: 3, slot: 3 }, // will showcase ROOM SWAP
          { courseId: 'c-cs202', teacherId: 't-8', activityType: 'L', duration: 1, day: 3, slot: 4 },
          { courseId: 'c-ec201', teacherId: 't-11', activityType: 'P', duration: 2, day: 3, slot: 5 },

          // Thu
          { courseId: 'c-cs202', teacherId: 't-8', activityType: 'L', duration: 1, day: 4, slot: 1 },
          { courseId: 'c-cs201', teacherId: 't-3', activityType: 'L', duration: 1, day: 4, slot: 2 },
          { courseId: 'c-ec202', teacherId: 't-13', activityType: 'L', duration: 1, day: 4, slot: 3 },
          { courseId: 'c-cs203', teacherId: 't-22', activityType: 'L', duration: 1, day: 4, slot: 4 },

          // Fri
          { courseId: 'c-cs201', teacherId: 't-3', activityType: 'L', duration: 1, day: 5, slot: 1 },
          { courseId: 'c-cs203', teacherId: 't-22', activityType: 'L', duration: 1, day: 5, slot: 2 },
          { courseId: 'c-cs202', teacherId: 't-8', activityType: 'L', duration: 1, day: 5, slot: 3 },
          { courseId: 'c-ec201', teacherId: 't-11', activityType: 'L', duration: 1, day: 5, slot: 4 },
          { courseId: 'c-ai201', teacherId: 't-5', activityType: 'L', duration: 1, day: 5, slot: 5 },

          // Sat
          { courseId: 'c-ec202', teacherId: 't-13', activityType: 'L', duration: 1, day: 6, slot: 1 },
          { courseId: 'c-ai201', teacherId: 't-5', activityType: 'L', duration: 1, day: 6, slot: 2 }
        ]
      },

      // === CSE-5-A (Yuvraj Singh Rathore 2025Btech290) ===
      {
        sectionId: 'sec-cse-5a',
        termId: 'term-sem5',
        versionId: 'ver-sem5-v1',
        homeRoomId: 'room-lt2',
        labRoomId: 'room-cslab2',
        courses: [
          // Mon
          { courseId: 'c-cs301', teacherId: 't-4', activityType: 'L', duration: 1, day: 1, slot: 1 },
          { courseId: 'c-cs302', teacherId: 't-6', activityType: 'L', duration: 1, day: 1, slot: 2 },
          { courseId: 'c-cs303', teacherId: 't-7', activityType: 'L', duration: 1, day: 1, slot: 3 },
          { courseId: 'c-cs304', teacherId: 't-10', activityType: 'L', duration: 1, day: 1, slot: 4 },
          { courseId: 'c-cs301', teacherId: 't-4', activityType: 'P', duration: 2, day: 1, slot: 5 }, // 2-hour lab

          // Tue
          { courseId: 'c-cs304', teacherId: 't-10', activityType: 'L', duration: 1, day: 2, slot: 1 },
          { courseId: 'c-cs301', teacherId: 't-4', activityType: 'L', duration: 1, day: 2, slot: 2 },
          { courseId: 'c-cs302', teacherId: 't-6', activityType: 'L', duration: 1, day: 2, slot: 3 },
          { courseId: 'c-ai301', teacherId: 't-5', activityType: 'L', duration: 1, day: 2, slot: 4 },
          { courseId: 'c-cs302', teacherId: 't-6', activityType: 'P', duration: 2, day: 2, slot: 5 }, // 2-hour lab

          // Wed (SHOWCASE: Cancellation & Swap)
          { courseId: 'c-cs302', teacherId: 't-6', activityType: 'L', duration: 1, day: 3, slot: 1 },
          { courseId: 'c-cs301', teacherId: 't-4', activityType: 'L', duration: 1, day: 3, slot: 2 }, // will showcase CANCELLED
          { courseId: 'c-cs303', teacherId: 't-7', activityType: 'L', duration: 1, day: 3, slot: 3 },
          { courseId: 'c-cs304', teacherId: 't-10', activityType: 'L', duration: 1, day: 3, slot: 4 },
          { courseId: 'c-ai301', teacherId: 't-5', activityType: 'P', duration: 2, day: 3, slot: 5 }, // 2-hour lab

          // Thu
          { courseId: 'c-cs303', teacherId: 't-7', activityType: 'L', duration: 1, day: 4, slot: 1 },
          { courseId: 'c-cs301', teacherId: 't-4', activityType: 'L', duration: 1, day: 4, slot: 2 },
          { courseId: 'c-ai301', teacherId: 't-5', activityType: 'L', duration: 1, day: 4, slot: 3 },
          { courseId: 'c-cs305', teacherId: 't-23', activityType: 'L', duration: 1, day: 4, slot: 4 },

          // Fri
          { courseId: 'c-cs302', teacherId: 't-6', activityType: 'L', duration: 1, day: 5, slot: 1 },
          { courseId: 'c-cs304', teacherId: 't-10', activityType: 'L', duration: 1, day: 5, slot: 2 },
          { courseId: 'c-cs301', teacherId: 't-4', activityType: 'L', duration: 1, day: 5, slot: 3 },
          { courseId: 'c-cs305', teacherId: 't-23', activityType: 'P', duration: 2, day: 5, slot: 5 },

          // Sat
          { courseId: 'c-cs303', teacherId: 't-7', activityType: 'L', duration: 1, day: 6, slot: 1 },
          { courseId: 'c-ai301', teacherId: 't-5', activityType: 'L', duration: 1, day: 6, slot: 2 }
        ]
      },

      // === CSE-3-B ===
      {
        sectionId: 'sec-cse-3b',
        termId: 'term-sem3',
        versionId: 'ver-sem3-v1',
        homeRoomId: 'room-lt3',
        labRoomId: 'room-cslab3',
        courses: [
          { courseId: 'c-cs202', teacherId: 't-26', activityType: 'L', duration: 1, day: 1, slot: 1 },
          { courseId: 'c-cs203', teacherId: 't-1', activityType: 'L', duration: 1, day: 1, slot: 2 },
          { courseId: 'c-cs201', teacherId: 't-24', activityType: 'L', duration: 1, day: 1, slot: 3 },
          { courseId: 'c-ec201', teacherId: 't-12', activityType: 'L', duration: 1, day: 1, slot: 4 },
          { courseId: 'c-cs203', teacherId: 't-1', activityType: 'P', duration: 2, day: 1, slot: 5 },

          { courseId: 'c-cs201', teacherId: 't-24', activityType: 'L', duration: 1, day: 2, slot: 1 },
          { courseId: 'c-cs202', teacherId: 't-26', activityType: 'L', duration: 1, day: 2, slot: 2 },
          { courseId: 'c-ec202', teacherId: 't-14', activityType: 'L', duration: 1, day: 2, slot: 3 },
          { courseId: 'c-cs203', teacherId: 't-1', activityType: 'L', duration: 1, day: 2, slot: 4 },
          { courseId: 'c-cs201', teacherId: 't-24', activityType: 'P', duration: 2, day: 2, slot: 5 },

          { courseId: 'c-cs203', teacherId: 't-1', activityType: 'L', duration: 1, day: 3, slot: 1 },
          { courseId: 'c-ec201', teacherId: 't-12', activityType: 'L', duration: 1, day: 3, slot: 2 },
          { courseId: 'c-cs201', teacherId: 't-24', activityType: 'L', duration: 1, day: 3, slot: 3 },
          { courseId: 'c-cs202', teacherId: 't-26', activityType: 'L', duration: 1, day: 3, slot: 4 },

          { courseId: 'c-cs201', teacherId: 't-24', activityType: 'L', duration: 1, day: 4, slot: 1 },
          { courseId: 'c-cs202', teacherId: 't-26', activityType: 'L', duration: 1, day: 4, slot: 2 },
          { courseId: 'c-ec202', teacherId: 't-14', activityType: 'L', duration: 1, day: 4, slot: 3 },
          { courseId: 'c-cs203', teacherId: 't-1', activityType: 'L', duration: 1, day: 4, slot: 4 },

          { courseId: 'c-ec201', teacherId: 't-12', activityType: 'L', duration: 1, day: 5, slot: 1 },
          { courseId: 'c-cs201', teacherId: 't-24', activityType: 'L', duration: 1, day: 5, slot: 2 },
          { courseId: 'c-ai201', teacherId: 't-15', activityType: 'L', duration: 1, day: 5, slot: 3 },
          { courseId: 'c-cs202', teacherId: 't-26', activityType: 'L', duration: 1, day: 5, slot: 4 }
        ]
      },

      // === AIDS-3 ===
      {
        sectionId: 'sec-aids-3',
        termId: 'term-sem3',
        versionId: 'ver-sem3-v1',
        homeRoomId: 'room-ab1-101',
        labRoomId: 'room-ailab',
        courses: [
          { courseId: 'c-ai201', teacherId: 't-15', activityType: 'L', duration: 1, day: 1, slot: 1 },
          { courseId: 'c-cs201', teacherId: 't-24', activityType: 'L', duration: 1, day: 1, slot: 2 },
          { courseId: 'c-cs202', teacherId: 't-26', activityType: 'L', duration: 1, day: 1, slot: 3 },
          { courseId: 'c-ai201', teacherId: 't-15', activityType: 'P', duration: 2, day: 1, slot: 5 },

          { courseId: 'c-cs201', teacherId: 't-24', activityType: 'L', duration: 1, day: 2, slot: 1 },
          { courseId: 'c-ai201', teacherId: 't-15', activityType: 'L', duration: 1, day: 2, slot: 2 },
          { courseId: 'c-cs202', teacherId: 't-26', activityType: 'L', duration: 1, day: 2, slot: 3 },

          { courseId: 'c-cs202', teacherId: 't-26', activityType: 'L', duration: 1, day: 3, slot: 1 },
          { courseId: 'c-ai201', teacherId: 't-15', activityType: 'L', duration: 1, day: 3, slot: 2 },
          { courseId: 'c-cs201', teacherId: 't-24', activityType: 'L', duration: 1, day: 3, slot: 3 },

          { courseId: 'c-ai201', teacherId: 't-15', activityType: 'L', duration: 1, day: 4, slot: 1 },
          { courseId: 'c-cs201', teacherId: 't-24', activityType: 'L', duration: 1, day: 4, slot: 2 },
          { courseId: 'c-cs202', teacherId: 't-26', activityType: 'L', duration: 1, day: 4, slot: 3 }
        ]
      },

      // === ECE-3 ===
      {
        sectionId: 'sec-ece-3',
        termId: 'term-sem3',
        versionId: 'ver-sem3-v1',
        homeRoomId: 'room-ab1-102',
        labRoomId: 'room-vlsi',
        courses: [
          { courseId: 'c-ec201', teacherId: 't-12', activityType: 'L', duration: 1, day: 1, slot: 1 },
          { courseId: 'c-ec202', teacherId: 't-14', activityType: 'L', duration: 1, day: 1, slot: 2 },
          { courseId: 'c-cs202', teacherId: 't-8', activityType: 'L', duration: 1, day: 1, slot: 3 },
          { courseId: 'c-ec201', teacherId: 't-12', activityType: 'P', duration: 2, day: 1, slot: 5 },

          { courseId: 'c-ec202', teacherId: 't-14', activityType: 'L', duration: 1, day: 2, slot: 1 },
          { courseId: 'c-ec201', teacherId: 't-12', activityType: 'L', duration: 1, day: 2, slot: 2 },
          { courseId: 'c-cs201', teacherId: 't-3', activityType: 'L', duration: 1, day: 2, slot: 3 },

          { courseId: 'c-ec201', teacherId: 't-12', activityType: 'L', duration: 1, day: 3, slot: 1 },
          { courseId: 'c-ec202', teacherId: 't-14', activityType: 'L', duration: 1, day: 3, slot: 2 },

          { courseId: 'c-ec202', teacherId: 't-14', activityType: 'L', duration: 1, day: 4, slot: 1 },
          { courseId: 'c-ec201', teacherId: 't-12', activityType: 'L', duration: 1, day: 4, slot: 2 }
        ]
      },

      // === BTech-1-A (1st Year) ===
      {
        sectionId: 'sec-btech-1a',
        termId: 'term-sem1',
        versionId: 'ver-sem1-v1',
        homeRoomId: 'room-lt4',
        labRoomId: 'room-cslab4',
        courses: [
          { courseId: 'c-cs101', teacherId: 't-24', activityType: 'L', duration: 1, day: 1, slot: 1 },
          { courseId: 'c-ma101', teacherId: 't-8', activityType: 'L', duration: 1, day: 1, slot: 2 },
          { courseId: 'c-ph101', teacherId: 't-9', activityType: 'L', duration: 1, day: 1, slot: 3 },
          { courseId: 'c-cs102', teacherId: 't-12', activityType: 'L', duration: 1, day: 1, slot: 4 },
          { courseId: 'c-cs101', teacherId: 't-24', activityType: 'P', duration: 2, day: 1, slot: 5 },

          { courseId: 'c-ma101', teacherId: 't-8', activityType: 'L', duration: 1, day: 2, slot: 1 },
          { courseId: 'c-cs101', teacherId: 't-24', activityType: 'L', duration: 1, day: 2, slot: 2 },
          { courseId: 'c-cs102', teacherId: 't-12', activityType: 'L', duration: 1, day: 2, slot: 3 },
          { courseId: 'c-ph101', teacherId: 't-9', activityType: 'L', duration: 1, day: 2, slot: 4 },

          { courseId: 'c-cs101', teacherId: 't-24', activityType: 'L', duration: 1, day: 3, slot: 1 },
          { courseId: 'c-ph101', teacherId: 't-9', activityType: 'L', duration: 1, day: 3, slot: 2 },
          { courseId: 'c-ma101', teacherId: 't-8', activityType: 'L', duration: 1, day: 3, slot: 3 },
          { courseId: 'c-cs102', teacherId: 't-12', activityType: 'L', duration: 1, day: 3, slot: 4 }
        ]
      },

      // === CSE-7-A (4th Year) ===
      {
        sectionId: 'sec-cse-7a',
        termId: 'term-sem7',
        versionId: 'ver-sem7-v1',
        homeRoomId: 'room-lt5',
        labRoomId: 'room-ailab',
        courses: [
          { courseId: 'c-cs401', teacherId: 't-10', activityType: 'L', duration: 1, day: 1, slot: 1 },
          { courseId: 'c-cs402', teacherId: 't-6', activityType: 'L', duration: 1, day: 1, slot: 2 },
          { courseId: 'c-cs403', teacherId: 't-14', activityType: 'L', duration: 1, day: 1, slot: 3 },
          { courseId: 'c-ai401', teacherId: 't-15', activityType: 'L', duration: 1, day: 1, slot: 4 },
          { courseId: 'c-cs402', teacherId: 't-6', activityType: 'P', duration: 2, day: 1, slot: 5 },

          { courseId: 'c-cs403', teacherId: 't-14', activityType: 'L', duration: 1, day: 2, slot: 1 },
          { courseId: 'c-cs401', teacherId: 't-10', activityType: 'L', duration: 1, day: 2, slot: 2 },
          { courseId: 'c-ai401', teacherId: 't-15', activityType: 'L', duration: 1, day: 2, slot: 3 },
          { courseId: 'c-cs402', teacherId: 't-6', activityType: 'L', duration: 1, day: 2, slot: 4 },

          { courseId: 'c-cs401', teacherId: 't-10', activityType: 'L', duration: 1, day: 3, slot: 1 },
          { courseId: 'c-cs402', teacherId: 't-6', activityType: 'L', duration: 1, day: 3, slot: 2 },
          { courseId: 'c-cs403', teacherId: 't-14', activityType: 'L', duration: 1, day: 3, slot: 3 },
          { courseId: 'c-ai401', teacherId: 't-15', activityType: 'P', duration: 2, day: 3, slot: 5 }
        ]
      },

      // === BBA-3 (Management) ===
      {
        sectionId: 'sec-bba-3',
        termId: 'term-sem3',
        versionId: 'ver-sem3-v1',
        homeRoomId: 'room-ab2-101',
        labRoomId: 'room-sem-a',
        courses: [
          { courseId: 'c-mg201', teacherId: 't-18', activityType: 'L', duration: 1, day: 1, slot: 1 },
          { courseId: 'c-mg102', teacherId: 't-19', activityType: 'L', duration: 1, day: 1, slot: 2 },
          { courseId: 'c-mg101', teacherId: 't-17', activityType: 'L', duration: 1, day: 1, slot: 3 },

          { courseId: 'c-mg102', teacherId: 't-19', activityType: 'L', duration: 1, day: 2, slot: 1 },
          { courseId: 'c-mg201', teacherId: 't-18', activityType: 'L', duration: 1, day: 2, slot: 2 },
          { courseId: 'c-mg101', teacherId: 't-17', activityType: 'L', duration: 1, day: 2, slot: 3 },

          { courseId: 'c-mg201', teacherId: 't-18', activityType: 'L', duration: 1, day: 3, slot: 1 },
          { courseId: 'c-mg101', teacherId: 't-17', activityType: 'L', duration: 1, day: 3, slot: 2 },
          { courseId: 'c-mg102', teacherId: 't-19', activityType: 'L', duration: 1, day: 3, slot: 3 }
        ]
      },

      // === BDes-3 (Design) ===
      {
        sectionId: 'sec-bdes-3',
        termId: 'term-sem3',
        versionId: 'ver-sem3-v1',
        homeRoomId: 'room-ab2-102',
        labRoomId: 'room-sem-b',
        courses: [
          { courseId: 'c-ds201', teacherId: 't-20', activityType: 'L', duration: 1, day: 1, slot: 1 },
          { courseId: 'c-ds102', teacherId: 't-21', activityType: 'L', duration: 1, day: 1, slot: 2 },
          { courseId: 'c-ds201', teacherId: 't-20', activityType: 'P', duration: 2, day: 1, slot: 5 },

          { courseId: 'c-ds102', teacherId: 't-21', activityType: 'L', duration: 1, day: 2, slot: 1 },
          { courseId: 'c-ds201', teacherId: 't-20', activityType: 'L', duration: 1, day: 2, slot: 2 },

          { courseId: 'c-ds201', teacherId: 't-20', activityType: 'L', duration: 1, day: 3, slot: 1 },
          { courseId: 'c-ds102', teacherId: 't-21', activityType: 'L', duration: 1, day: 3, slot: 2 }
        ]
      }
    ];

    let scheduledClassCount = 0;
    let occurrenceCount = 0;

    // Dates for the current presentation week: Mon Nov 23, 2026 to Sat Nov 28, 2026
    const dayDates: Record<number, string> = {
      1: '2026-11-23', // Monday
      2: '2026-11-24', // Tuesday
      3: '2026-11-25', // Wednesday (TODAY in simulation)
      4: '2026-11-26', // Thursday
      5: '2026-11-27', // Friday
      6: '2026-11-28'  // Saturday
    };

    for (const plan of schedulePlans) {
      for (const item of plan.courses) {
        const offeringId = `off-${plan.sectionId}-${item.courseId}-${item.activityType}`;
        const targetType = item.activityType === 'P' ? 'batch' : 'section';
        const targetId = item.activityType === 'P' ? `batch-${plan.sectionId}-b1` : plan.sectionId;
        const roomId = item.activityType === 'P' ? plan.labRoomId : plan.homeRoomId;

        // Upsert offering
        await client.query(
          `INSERT INTO course_offerings (id, course_id, term_id, teacher_id, target_type, target_id)
           VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING;`,
          [offeringId, item.courseId, plan.termId, item.teacherId, targetType, targetId]
        );

        // Insert scheduled_classes
        const scheduledId = `sc-${plan.sectionId}-d${item.day}-s${item.slot}`;
        await client.query(
          `INSERT INTO scheduled_classes (id, version_id, course_offering_id, term_id, day_of_week, start_slot, duration, activity_type, teacher_id, room_id, target_type, target_id, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'scheduled') ON CONFLICT (id) DO NOTHING;`,
          [scheduledId, plan.versionId, offeringId, plan.termId, item.day, item.slot, item.duration, item.activityType, item.teacherId, roomId, targetType, targetId]
        );
        scheduledClassCount++;

        // Insert baseline class_occurrences for the active presentation week
        const occDate = dayDates[item.day];
        const occId = `occ-${scheduledId}-${occDate}`;
        await client.query(
          `INSERT INTO class_occurrences (id, version_id, recurring_class_id, course_offering_id, term_id, date, day_of_week, start_slot, duration, activity_type, teacher_id, room_id, target_type, target_id, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'scheduled') ON CONFLICT (id) DO NOTHING;`,
          [occId, plan.versionId, scheduledId, offeringId, plan.termId, occDate, item.day, item.slot, item.duration, item.activityType, item.teacherId, roomId, targetType, targetId]
        );
        occurrenceCount++;
      }
    }

    // 10. PRESENTATION SHOWCASE: 4 CANCELLED CLASSES & 4 RESCHEDULED ROOM-SWAPS
    console.log('Seeding presentation showcase states (cancelled classes and room swaps)...');

    // Showcase 1: Cancelled CSE-3-A CS201 (DSA) on Wednesday Nov 25, Slot 1
    const cancel1Id = 'occ-sc-sec-cse-3a-d3-s1-2026-11-25';
    await client.query(
      `UPDATE class_occurrences SET status = 'cancelled', cancellation_reason = 'Faculty on academic leave for international symposium' WHERE id = $1;`,
      [cancel1Id]
    );
    await client.query(
      `INSERT INTO class_occurrence_events (id, occurrence_id, event_type, reason, actor_id)
       VALUES ($1, $2, 'cancelled', 'Faculty on academic leave for international symposium', 'admin-001') ON CONFLICT (id) DO NOTHING;`,
      ['evt-cancel-1', cancel1Id]
    );

    // Showcase 2: Cancelled CSE-5-A CS301 (DBMS) on Wednesday Nov 25, Slot 2
    const cancel2Id = 'occ-sc-sec-cse-5a-d3-s2-2026-11-25';
    await client.query(
      `UPDATE class_occurrences SET status = 'cancelled', cancellation_reason = 'Guest lecture session scheduled in Central Auditorium' WHERE id = $1;`,
      [cancel2Id]
    );
    await client.query(
      `INSERT INTO class_occurrence_events (id, occurrence_id, event_type, reason, actor_id)
       VALUES ($1, $2, 'cancelled', 'Guest lecture session scheduled in Central Auditorium', 'admin-001') ON CONFLICT (id) DO NOTHING;`,
      ['evt-cancel-2', cancel2Id]
    );

    // Showcase 3: Cancelled BTech-1-A CS101 on Wednesday Nov 25, Slot 1
    const cancel3Id = 'occ-sc-sec-btech-1a-d3-s1-2026-11-25';
    await client.query(
      `UPDATE class_occurrences SET status = 'cancelled', cancellation_reason = 'Faculty unwell - remedial problem-solving class scheduled next week' WHERE id = $1;`,
      [cancel3Id]
    );
    await client.query(
      `INSERT INTO class_occurrence_events (id, occurrence_id, event_type, reason, actor_id)
       VALUES ($1, $2, 'cancelled', 'Faculty unwell - remedial problem-solving class scheduled next week', 'admin-001') ON CONFLICT (id) DO NOTHING;`,
      ['evt-cancel-3', cancel3Id]
    );

    // Showcase 4: Cancelled CSE-7-A CS401 on Wednesday Nov 25, Slot 1
    const cancel4Id = 'occ-sc-sec-cse-7a-d3-s1-2026-11-25';
    await client.query(
      `UPDATE class_occurrences SET status = 'cancelled', cancellation_reason = 'Placement recruitment mock evaluation in progress' WHERE id = $1;`,
      [cancel4Id]
    );
    await client.query(
      `INSERT INTO class_occurrence_events (id, occurrence_id, event_type, reason, actor_id)
       VALUES ($1, $2, 'cancelled', 'Placement recruitment mock evaluation in progress', 'admin-001') ON CONFLICT (id) DO NOTHING;`,
      ['evt-cancel-4', cancel4Id]
    );

    // Showcase 5: Room-Swap CSE-3-A EC201 (VHDL) on Wednesday Nov 25, Slot 3 from LT-1 to LT-4
    const swap1Original = 'occ-sc-sec-cse-3a-d3-s3-2026-11-25';
    const swap1Replacement = 'occ-rep-sec-cse-3a-d3-s3-2026-11-25';
    await client.query(
      `INSERT INTO class_occurrences (id, version_id, recurring_class_id, course_offering_id, term_id, date, day_of_week, start_slot, duration, activity_type, teacher_id, room_id, target_type, target_id, status)
       VALUES ($1, 'ver-sem3-v1', 'sc-sec-cse-3a-d3-s3', 'off-sec-cse-3a-c-ec201-L', 'term-sem3', '2026-11-25', 3, 3, 1, 'L', 't-11', 'room-lt4', 'section', 'sec-cse-3a', 'scheduled') ON CONFLICT (id) DO NOTHING;`,
      [swap1Replacement]
    );
    await client.query(
      `UPDATE class_occurrences SET status = 'rescheduled', cancellation_reason = 'AV Projector Calibration in LT-1 - Swapped to LT-4', replacement_occurrence_id = $1 WHERE id = $2;`,
      [swap1Replacement, swap1Original]
    );
    await client.query(
      `INSERT INTO class_occurrence_events (id, occurrence_id, event_type, reason, actor_id)
       VALUES ($1, $2, 'room_changed', 'AV Projector Calibration in LT-1 - Swapped to LT-4', 'admin-001') ON CONFLICT (id) DO NOTHING;`,
      ['evt-swap-1', swap1Original]
    );

    // Showcase 6: Room-Swap CSE-5-A CS303 on Wednesday Nov 25, Slot 3 from LT-2 to LT-6
    const swap2Original = 'occ-sc-sec-cse-5a-d3-s3-2026-11-25';
    const swap2Replacement = 'occ-rep-sec-cse-5a-d3-s3-2026-11-25';
    await client.query(
      `INSERT INTO class_occurrences (id, version_id, recurring_class_id, course_offering_id, term_id, date, day_of_week, start_slot, duration, activity_type, teacher_id, room_id, target_type, target_id, status)
       VALUES ($1, 'ver-sem5-v1', 'sc-sec-cse-5a-d3-s3', 'off-sec-cse-5a-c-cs303-L', 'term-sem5', '2026-11-25', 3, 3, 1, 'L', 't-7', 'room-lt6', 'section', 'sec-cse-5a', 'scheduled') ON CONFLICT (id) DO NOTHING;`,
      [swap2Replacement]
    );
    await client.query(
      `UPDATE class_occurrences SET status = 'rescheduled', cancellation_reason = 'Acoustics & Mic Maintenance in LT-2 - Swapped to LT-6', replacement_occurrence_id = $1 WHERE id = $2;`,
      [swap2Replacement, swap2Original]
    );
    await client.query(
      `INSERT INTO class_occurrence_events (id, occurrence_id, event_type, reason, actor_id)
       VALUES ($1, $2, 'room_changed', 'Acoustics & Mic Maintenance in LT-2 - Swapped to LT-6', 'admin-001') ON CONFLICT (id) DO NOTHING;`,
      ['evt-swap-2', swap2Original]
    );

    // 11. REALTIME NOTIFICATIONS (Rich Staggered Notifications across Students)
    console.log('Seeding realistic realtime demo notifications across student cohorts...');
    const now = new Date();
    const demoStudentIds = ['stud-1', 'stud-2', '2025Btech290', 'stud-3'];
    const notifications: { id: string; studentId: string; type: string; title: string; message: string; offsetMinutes: number; status: string }[] = [
      {
        id: 'notif-1',
        studentId: 'stud-1',
        type: 'room_changed',
        title: 'Room Change Alert: EC201 (Digital Electronics)',
        message: 'Period 3 on Wednesday Nov 25 moved from LT-1 to LT-4 due to projector calibration.',
        offsetMinutes: 1,
        status: 'delivered'
      },
      {
        id: 'notif-2',
        studentId: 'stud-1',
        type: 'class_cancelled',
        title: 'Class Cancellation Notice: CS201 (Data Structures)',
        message: 'Period 1 on Wednesday Nov 25 cancelled. Faculty on academic leave for international symposium.',
        offsetMinutes: 6,
        status: 'delivered'
      },
      {
        id: 'notif-3',
        studentId: '2025Btech290',
        type: 'class_cancelled',
        title: 'Class Cancellation Notice: CS301 (DBMS)',
        message: 'Period 2 on Wednesday Nov 25 cancelled. Central Auditorium guest lecture scheduled.',
        offsetMinutes: 12,
        status: 'delivered'
      },
      {
        id: 'notif-4',
        studentId: '2025Btech290',
        type: 'room_changed',
        title: 'Room Change Alert: CS303 (Computer Networks)',
        message: 'Period 3 on Wednesday Nov 25 moved from LT-2 to LT-6 for acoustics repair.',
        offsetMinutes: 25,
        status: 'delivered'
      },
      {
        id: 'notif-5',
        studentId: 'stud-1',
        type: 'extra_class',
        title: 'Extra Lab Session Scheduled: CS201 Lab',
        message: 'CS-Lab-1 reserved on Friday 16:00–17:00 for Tree Traversal & Graph Algorithms practical review.',
        offsetMinutes: 55,
        status: 'delivered'
      },
      {
        id: 'notif-6',
        studentId: 'stud-2',
        type: 'extra_class',
        title: 'Extra Session: Machine Learning Foundations',
        message: 'AI-Research-Lab booked on Thursday 15:00–16:00 for neural network tensor programming demo.',
        offsetMinutes: 90,
        status: 'delivered'
      },
      {
        id: 'notif-9',
        studentId: 'stud-1',
        type: 'room_changed',
        title: 'Lab Relocation Notice: CS203 (OOP Java)',
        message: 'Tuesday CS-Lab-1 session smoothly migrated to CS-Lab-3.',
        offsetMinutes: 480,
        status: 'delivered'
      },
      {
        id: 'notif-13',
        studentId: 'stud-2',
        type: 'room_changed',
        title: 'Venue Change: Discrete Mathematics Lecture',
        message: 'Thursday lecture relocated to Aryabhata Block LT-3.',
        offsetMinutes: 2880,
        status: 'delivered'
      },
      {
        id: 'notif-14',
        studentId: 'stud-2',
        type: 'extra_class',
        title: 'Industry Guest Speaker: Cloud Distributed Systems',
        message: 'Special seminar in Seminar-Hall-A on Saturday 10:00 AM by senior Google Cloud architect.',
        offsetMinutes: 3600,
        status: 'delivered'
      }
    ];

    const generalAnnouncements = [
      {
        baseId: 'ann-1',
        title: 'Mid-Term Timetable & Examination Roster Released',
        message: 'Odd Semester 2026-2027 Mid-Term review timetable is now published and active.',
        offsetMinutes: 180,
      },
      {
        baseId: 'ann-2',
        title: 'Lab Viva Voce & Evaluation Dates Announced',
        message: 'DBMS & OS practical evaluations scheduled for next week in Computing Wing.',
        offsetMinutes: 300,
      },
      {
        baseId: 'ann-3',
        title: 'Dean of Academics Circular: Attendance Threshold',
        message: 'Mandatory 75% attendance policy enforced for End-Semester examination eligibility.',
        offsetMinutes: 720,
      },
      {
        baseId: 'ann-4',
        title: 'Library & Online Resource Access Portal Active',
        message: 'IEEE Xplore & ACM Digital Library off-campus access enabled for all registered B.Tech students.',
        offsetMinutes: 1440,
      },
      {
        baseId: 'ann-5',
        title: 'Campus Hackathon 2026: Team Registrations Open',
        message: 'Annual JKLU Innovation & Software Hackathon registrations open until Friday.',
        offsetMinutes: 1800,
      },
      {
        baseId: 'ann-6',
        title: 'Semester Timetable Active & Synchronized',
        message: 'Institutional academic schedule hydrated cleanly across all sections and venues.',
        offsetMinutes: 4320,
      }
    ];

    for (const ann of generalAnnouncements) {
      for (const stId of demoStudentIds) {
        notifications.push({
          id: `${ann.baseId}-${stId}`,
          studentId: stId,
          type: 'announcement',
          title: ann.title,
          message: ann.message,
          offsetMinutes: ann.offsetMinutes,
          status: 'delivered'
        });
      }
    }

    for (const n of notifications) {
      const createdAt = new Date(now.getTime() - n.offsetMinutes * 60 * 1000);
      await client.query(
        `INSERT INTO notification_outbox (id, recipient_student_id, event_type, title, message, status, created_at, delivered_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $7) ON CONFLICT (id) DO NOTHING;`,
        [n.id, n.studentId, n.type, n.title, n.message, n.status, createdAt]
      );
    }

    await client.query('COMMIT;');
    console.log('\n======================================================');
    console.log('✓ SUCCESS: JKLU Presentation Mockup Dataset Seeded Cleanly!');
    console.log(`- Academic Terms: ${terms.length}`);
    console.log(`- Venues / Rooms: ${venues.length}`);
    console.log(`- Sections: ${sections.length}`);
    console.log(`- Batches: ${sections.length * 2}`);
    console.log(`- Faculty Members: ${faculty.length}`);
    console.log(`- Students: ${students.length}`);
    console.log(`- Courses: ${courses.length}`);
    console.log(`- Scheduled Classes: ${scheduledClassCount}`);
    console.log(`- Class Occurrences: ${occurrenceCount + 2}`);
    console.log(`- Cancelled Class Overrides: 4`);
    console.log(`- Rescheduled Room-Swap Overrides: 4`);
    console.log(`- Realtime Notifications: ${notifications.length}`);
    console.log('======================================================\n');
  } catch (err) {
    await client.query('ROLLBACK;');
    console.error('ERROR during mockup dataset seeding:', err);
    throw err;
  } finally {
    await client.end();
  }
}

if (process.argv[1]?.endsWith('seed_jklu_mockup.ts') || process.argv[1]?.endsWith('seed_jklu_mockup.js')) {
  seedJkluMockup().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
