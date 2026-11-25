import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const tables = [
  'profiles',
  'academic_terms',
  'sections',
  'batches',
  'students',
  'student_group_memberships',
  'elective_groups',
  'elective_assignments',
  'rooms',
  'teachers',
  'teacher_availability',
  'teacher_unavailability_requests',
  'courses',
  'course_offerings',
  'timetable_versions',
  'scheduled_classes',
  'class_occurrences',
  'extra_classes',
  'audit_events',
  'notification_outbox'
];

async function main() {
  try {
    await client.connect();
    console.log('Connected to PostgreSQL database!');
    for (const table of tables) {
      try {
        const res = await client.query(`SELECT COUNT(*) FROM ${table};`);
        console.log(`Table ${table}: ${res.rows[0].count} rows`);
      } catch (err: any) {
        console.log(`Table ${table}: Error (${err.message})`);
      }
    }
  } finally {
    await client.end();
  }
}

main().catch(console.error);
