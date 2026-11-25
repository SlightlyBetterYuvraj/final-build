/**
 * Canonical input revision calculation for stale package detection.
 * Source of truth: docs/06_API_AND_WORKFLOWS.md (Section 3), docs/08_SECURITY_CONFIG_AND_OPERATIONS.md
 */

import crypto from 'crypto';
import { Course, CourseOffering, Room, Teacher, TeacherAvailability, TimetableGridConfig } from './types.js';

export function computeInputRevision(params: {
  termIds: string[];
  rooms: Room[];
  teachers: Teacher[];
  courses: Course[];
  courseOfferings: CourseOffering[];
  grid?: TimetableGridConfig;
  teacherAvailabilities?: TeacherAvailability[];
}): string {
  const sortedTermIds = [...params.termIds].sort();
  const sortedRooms = [...params.rooms]
    .filter((r) => r.active)
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((r) => ({ id: r.id, cap: r.capacity, type: r.roomType }));

  const sortedTeachers = [...params.teachers]
    .filter((t) => t.active)
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((t) => t.id);

  const sortedAvailabilities = params.teacherAvailabilities
    ? [...params.teacherAvailabilities]
        .sort((a, b) => a.teacherId.localeCompare(b.teacherId) || a.dayOfWeek - b.dayOfWeek || a.slotIndex - b.slotIndex)
        .map((a) => ({ tid: a.teacherId, dow: a.dayOfWeek, slot: a.slotIndex, avail: a.isAvailable }))
    : [];

  const sortedCourses = [...params.courses]
    .filter((c) => sortedTermIds.includes(c.termId))
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((c) => ({
      id: c.id,
      l: c.lectureHours,
      t: c.tutorialHours,
      p: c.practicalHours,
    }));

  const sortedOfferings = [...params.courseOfferings]
    .filter((o) => sortedTermIds.includes(o.termId))
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((o) => ({
      id: o.id,
      c: o.courseId,
      t: o.teacherId,
      g: o.targetId,
      comp: o.component || null,
    }));

  const gridPayload = params.grid
    ? {
        days: params.grid.days ? [...params.grid.days].sort() : [],
        slotsPerDay: params.grid.slotsPerDay,
        slots: Array.isArray(params.grid.slots)
          ? params.grid.slots.map((s) => ({
              d: s.dayOfWeek,
              i: s.slotIndex,
              st: s.startTime,
              et: s.endTime,
              b: !!s.isBreak,
            }))
          : [],
      }
    : null;

  const hashPayload = JSON.stringify({
    termIds: sortedTermIds,
    grid: gridPayload,
    rooms: sortedRooms,
    teachers: sortedTeachers,
    teacherAvailabilities: sortedAvailabilities,
    courses: sortedCourses,
    courseOfferings: sortedOfferings,
  });

  return crypto.createHash('sha256').update(hashPayload).digest('hex').substring(0, 16);
}
