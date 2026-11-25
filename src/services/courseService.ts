/**
 * Course Service with Dynamic Palette Assignment.
 * Reads color pool from src/data/course_palette.csv and assigns complementary
 * (card_bg_color, font_color, border_color) pairs collision-free across courses.
 */

import * as fs from 'fs';
import * as path from 'path';
import { Course } from '../domain/types.js';
import { TimetableRepository } from '../data/repository.js';
import { getDbPool, isDbConfigured } from '../data/dbSync.js';

export interface CourseColorPair {
  cardBgColor: string;
  fontColor: string;
  borderColor?: string;
}

const DEFAULT_PALETTE: CourseColorPair[] = [
  { cardBgColor: '#EEF2FF', fontColor: '#3730A3', borderColor: '#C7D2FE' }, // Indigo
  { cardBgColor: '#F0FDF4', fontColor: '#166534', borderColor: '#BBF7D0' }, // Emerald
  { cardBgColor: '#FEF3C7', fontColor: '#92400E', borderColor: '#FDE68A' }, // Amber
  { cardBgColor: '#FDF2F8', fontColor: '#9D174D', borderColor: '#FBCFE8' }, // Pink
  { cardBgColor: '#F3E8FF', fontColor: '#6B21A8', borderColor: '#E9D5FF' }, // Purple
  { cardBgColor: '#E0F2FE', fontColor: '#075985', borderColor: '#BAE6FD' }, // Sky Blue
  { cardBgColor: '#FFF7ED', fontColor: '#9A3412', borderColor: '#FFEDD5' }, // Orange
  { cardBgColor: '#ECFDF5', fontColor: '#065F46', borderColor: '#A7F3D0' }, // Teal
  { cardBgColor: '#F1F5F9', fontColor: '#334155', borderColor: '#CBD5E1' }, // Slate
  { cardBgColor: '#FEF2F2', fontColor: '#991B1B', borderColor: '#FECACA' }, // Rose
  { cardBgColor: '#F5F3FF', fontColor: '#5B21B6', borderColor: '#DDD6FE' }, // Violet
  { cardBgColor: '#F0FDFA', fontColor: '#115E59', borderColor: '#99F6E4' }, // Cyan
];

/**
 * Loads color pairs from CSV file with fallback to DEFAULT_PALETTE.
 * Checks for timetable_pastel_colours.csv first, then src/data/course_palette.csv.
 */
export function loadColorPalette(): CourseColorPair[] {
  try {
    const candidates = [
      path.resolve(process.cwd(), 'timetable_pastel_colours.csv'),
      path.resolve(process.cwd(), 'src/data/timetable_pastel_colours.csv'),
      path.resolve(process.cwd(), 'src/data/course_palette.csv'),
    ];

    let csvPath = '';
    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        csvPath = cand;
        break;
      }
    }

    if (!csvPath) {
      return DEFAULT_PALETTE;
    }

    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length <= 1) return DEFAULT_PALETTE;

    const pairs: CourseColorPair[] = [];
    // Detect delimiter (; or ,) from header line
    const delimiter = lines[0].includes(';') ? ';' : ',';

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(delimiter).map(p => p.trim());
      // Handle timetable_pastel_colours.csv format: Colour Name;Background HEX;Font HEX
      if (parts.length >= 3 && parts[1].startsWith('#') && parts[2].startsWith('#')) {
        pairs.push({
          cardBgColor: parts[1],
          fontColor: parts[2],
          borderColor: undefined,
        });
      } else if (parts.length >= 2 && parts[0].startsWith('#') && parts[1].startsWith('#')) {
        // Handle course_palette.csv format: card_bg_color,font_color,border_color
        pairs.push({
          cardBgColor: parts[0],
          fontColor: parts[1],
          borderColor: parts[2] || undefined,
        });
      }
    }
    return pairs.length > 0 ? pairs : DEFAULT_PALETTE;
  } catch (err) {
    console.warn('[CourseService] Could not load color palette CSV, using default palette:', err);
    return DEFAULT_PALETTE;
  }
}

/**
 * Assigns an unused color pair from the pool, or falls back deterministically to hash/cycling.
 */
export function allocateCourseColor(courseId: string, existingAssignedColors: CourseColorPair[]): CourseColorPair {
  const palette = loadColorPalette();
  const occupiedSet = new Set(existingAssignedColors.map(c => `${c.cardBgColor.toLowerCase()}|${c.fontColor.toLowerCase()}`));

  // 1. Select the first unused color pair from the pool
  for (const pair of palette) {
    const key = `${pair.cardBgColor.toLowerCase()}|${pair.fontColor.toLowerCase()}`;
    if (!occupiedSet.has(key)) {
      return pair;
    }
  }

  // 2. If all pool colors are consumed, fall back deterministically to stable hash
  let hash = 0;
  for (let i = 0; i < courseId.length; i++) {
    hash = (hash * 31 + courseId.charCodeAt(i)) >>> 0;
  }
  const index = hash % palette.length;
  return palette[index];
}

/**
 * Persists course record to Supabase PostgreSQL.
 */
export async function persistCourseToDb(course: Course): Promise<void> {
  if (!isDbConfigured()) return;
  try {
    const db = getDbPool();
    await db.query(
      `INSERT INTO courses (
        id, code, name, term_id, lecture_hours, tutorial_hours, practical_hours, required_room_type,
        card_bg_color, font_color, border_color
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        code = EXCLUDED.code,
        name = EXCLUDED.name,
        term_id = EXCLUDED.term_id,
        lecture_hours = EXCLUDED.lecture_hours,
        tutorial_hours = EXCLUDED.tutorial_hours,
        practical_hours = EXCLUDED.practical_hours,
        required_room_type = EXCLUDED.required_room_type,
        card_bg_color = EXCLUDED.card_bg_color,
        font_color = EXCLUDED.font_color,
        border_color = EXCLUDED.border_color;`,
      [
        course.id,
        course.code,
        course.name,
        course.termId,
        course.lectureHours,
        course.tutorialHours,
        course.practicalHours,
        course.requiredRoomType,
        course.cardBgColor || null,
        course.fontColor || null,
        course.borderColor || null,
      ]
    );
  } catch (err: any) {
    console.warn(`[Supabase DB] Failed to persist course ${course.id} to database:`, err.message);
  }
}

/**
 * Ensures all courses in repository have assigned colors.
 */
export function ensureCourseColorsInRepository(repo: TimetableRepository): void {
  const state = repo.getState();
  const existingColors: CourseColorPair[] = [];

  for (const course of state.courses.values()) {
    if (course.cardBgColor && course.fontColor) {
      existingColors.push({
        cardBgColor: course.cardBgColor,
        fontColor: course.fontColor,
        borderColor: course.borderColor,
      });
    }
  }

  for (const course of state.courses.values()) {
    if (!course.cardBgColor || !course.fontColor) {
      const allocated = allocateCourseColor(course.id, existingColors);
      course.cardBgColor = allocated.cardBgColor;
      course.fontColor = allocated.fontColor;
      course.borderColor = allocated.borderColor;
      existingColors.push(allocated);

      // Async mirror to DB if configured
      persistCourseToDb(course).catch(() => {});
    }
  }
}
