import { TimetableRepository } from '../data/repository.js';
import {
  isDbConfigured,
  persistAcademicTermToDb,
  persistSectionToDb,
  persistBatchToDb,
  persistRoomToDb,
  persistTeacherToDb,
  persistCourseToDb,
  persistOfferingToDb,
} from '../data/dbSync.js';
import { ensureCourseColorsInRepository } from './courseService.js';
import {
  AcademicTerm,
  Section,
  Batch,
  Room,
  Teacher,
  Course,
  CourseOffering,
  RoomType,
  Student,
} from '../domain/types.js';

export interface CsvFilePayload {
  filename?: string;
  content: string;
}

function parseCsvLines(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));
  if (lines.length === 0) return { headers: [], rows: [] };

  const rawHeaders = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
    const row: Record<string, string> = {};
    rawHeaders.forEach((h, idx) => {
      row[h] = parts[idx] !== undefined ? parts[idx] : '';
    });
    rows.push(row);
  }

  return { headers: rawHeaders, rows };
}

function normalizeRoomType(val: string): RoomType {
  const v = (val || '').toLowerCase();
  if (v === 'lab' || v === 'p' || v === 'practical') return 'P';
  return 'LT'; // default lecture room / tutorial
}

export async function importCurriculumCsvFiles(
  repo: TimetableRepository,
  files: CsvFilePayload[]
): Promise<{
  terms: number;
  sections: number;
  batches: number;
  rooms: number;
  teachers: number;
  courses: number;
  offerings: number;
  students: number;
}> {
  const counts = {
    terms: 0,
    sections: 0,
    batches: 0,
    rooms: 0,
    teachers: 0,
    courses: 0,
    offerings: 0,
    students: 0,
  };

  const parsedFiles = files.map((f) => {
    const parsed = parseCsvLines(f.content);
    return {
      filename: (f.filename || '').toLowerCase(),
      headers: parsed.headers,
      rows: parsed.rows,
    };
  });

  await repo.runTransaction(async (tx) => {
    // 1. Academic Terms
    for (const f of parsedFiles) {
      if (f.headers.includes('semester_number') || f.headers.includes('year_label') || f.filename.includes('term')) {
        for (const r of f.rows) {
          const id = r.id || `term_${r.semester_number || Date.now()}`;
          const term: AcademicTerm = {
            id,
            yearLabel: r.year_label || '2026-2027',
            semesterNumber: parseInt(r.semester_number || '1', 10) || 1,
            startDate: r.start_date || '2026-08-01',
            endDate: r.end_date || '2026-12-15',
            cycle: (r.cycle === 'even' ? 'even' : 'odd') as 'odd' | 'even',
            status: 'active',
          };
          tx.academicTerms.set(term.id, term);
          counts.terms++;
          if (isDbConfigured()) await persistAcademicTermToDb(term);
        }
      }
    }

    // 2. Sections
    for (const f of parsedFiles) {
      if ((f.headers.includes('term_id') && f.headers.includes('expected_count') && !f.headers.includes('course_id') && !f.headers.includes('lecture_hours')) || f.filename.includes('section')) {
        for (const r of f.rows) {
          const id = r.id || `sec_${Date.now()}`;
          const sec: Section = {
            id,
            termId: r.term_id,
            name: r.name || id,
            expectedCount: parseInt(r.expected_count || '60', 10) || 60,
            active: r.active !== 'false',
          };
          tx.sections.set(sec.id, sec);
          counts.sections++;
          if (isDbConfigured()) await persistSectionToDb(sec);
        }
      }
    }

    // 3. Batches
    for (const f of parsedFiles) {
      if ((f.headers.includes('section_id') && f.headers.includes('expected_count')) || f.filename.includes('batch')) {
        for (const r of f.rows) {
          const id = r.id || `batch_${Date.now()}`;
          const batch: Batch = {
            id,
            sectionId: r.section_id,
            name: r.name || id,
            expectedCount: parseInt(r.expected_count || '30', 10) || 30,
            active: r.active !== 'false',
          };
          tx.batches.set(batch.id, batch);
          counts.batches++;
          if (isDbConfigured()) await persistBatchToDb(batch);
        }
      }
    }

    // 4. Rooms
    for (const f of parsedFiles) {
      if (f.headers.includes('room_number') || f.headers.includes('capacity') || f.filename.includes('room')) {
        for (const r of f.rows) {
          const id = r.id || `room_${r.room_number || Date.now()}`;
          const room: Room = {
            id,
            roomNumber: r.room_number || id,
            building: r.building || 'Main Block',
            floor: parseInt(r.floor || '1', 10) || 1,
            capacity: parseInt(r.capacity || '60', 10) || 60,
            roomType: normalizeRoomType(r.room_type),
            active: r.active !== 'false',
          };
          tx.rooms.set(room.id, room);
          counts.rooms++;
          if (isDbConfigured()) await persistRoomToDb(room);
        }
      }
    }

    // 5. Teachers
    for (const f of parsedFiles) {
      if ((f.headers.includes('emp_id') && f.headers.includes('name')) || f.filename.includes('teacher')) {
        for (const r of f.rows) {
          const id = r.id || `teach_${r.emp_id || Date.now()}`;
          const teacher: Teacher = {
            id,
            name: r.name || 'Faculty Member',
            empId: r.emp_id || id,
            email: r.email || `${id}@university.edu`,
            active: r.active !== 'false',
          };
          tx.teachers.set(teacher.id, teacher);
          counts.teachers++;
          if (isDbConfigured()) await persistTeacherToDb(teacher);
        }
      }
    }

    // 6. Courses
    for (const f of parsedFiles) {
      if (f.headers.includes('lecture_hours') || f.headers.includes('practical_hours') || f.filename.includes('course')) {
        if (!f.headers.includes('teacher_id')) {
          for (const r of f.rows) {
            const id = r.id || `crs_${r.code || Date.now()}`;
            const course: Course = {
              id,
              code: r.code || id,
              name: r.name || id,
              termId: r.term_id,
              lectureHours: parseInt(r.lecture_hours || '3', 10) || 3,
              tutorialHours: parseInt(r.tutorial_hours || '0', 10) || 0,
              practicalHours: parseInt(r.practical_hours || '0', 10) || 0,
              requiredRoomType: normalizeRoomType(r.required_room_type),
            };
            tx.courses.set(course.id, course);
            counts.courses++;
            if (isDbConfigured()) await persistCourseToDb(course);
          }
        }
      }
    }

    // 7. Course Offerings
    for (const f of parsedFiles) {
      if (f.headers.includes('target_type') || (f.headers.includes('course_id') && f.headers.includes('teacher_id')) || f.filename.includes('offering')) {
        for (const r of f.rows) {
          const id = r.id || `off_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const offering: CourseOffering = {
            id,
            courseId: r.course_id,
            termId: r.term_id,
            teacherId: r.teacher_id,
            targetType: (r.target_type === 'batch' ? 'batch' : 'section') as 'section' | 'batch',
            targetId: r.target_id,
          };
          tx.courseOfferings.set(offering.id, offering);
          counts.offerings++;
          if (isDbConfigured()) await persistOfferingToDb(offering);
        }
      }
    }

    // 8. Students Bulk Upload (Optional)
    for (const f of parsedFiles) {
      if (f.headers.includes('roll_number') || f.filename.includes('student')) {
        for (const r of f.rows) {
          const roll = r.roll_number || r.roll;
          if (!roll) continue;
          const id = `stud_${roll}`;
          const student: Student = {
            id,
            rollNumber: roll,
            name: r.name || roll,
            email: r.email || `${roll.toLowerCase()}@university.edu`,
            active: true,
          };
          tx.students.set(student.id, student);

          if (r.section_id) {
            tx.studentGroupMemberships.set(`mem_${id}_${r.section_id}`, {
              id: `mem_${id}_${r.section_id}`,
              studentId: student.id,
              groupType: 'section',
              groupId: r.section_id,
              effectiveStartDate: '2026-08-01',
              effectiveEndDate: null,
            });
          }
          if (r.batch_id) {
            tx.studentGroupMemberships.set(`mem_${id}_${r.batch_id}`, {
              id: `mem_${id}_${r.batch_id}`,
              studentId: student.id,
              groupType: 'batch',
              groupId: r.batch_id,
              effectiveStartDate: '2026-08-01',
              effectiveEndDate: null,
            });
          }
          counts.students++;
        }
      }
    }
  });

  ensureCourseColorsInRepository(repo);
  return counts;
}
