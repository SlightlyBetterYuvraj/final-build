import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

export async function wipeDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to Supabase PostgreSQL for wiping data...');
  try {
    await client.query('BEGIN;');

    // List of tables to delete data from in reverse foreign key order (or CASCADE)
    // Preserves table definitions, columns, constraints, and RLS policies.
    // Note: 'profiles' preserves user accounts; we clear timetable and academic entities.
    const tablesToDelete = [
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

    for (const table of tablesToDelete) {
      await client.query(`DELETE FROM ${table};`);
      console.log(`✓ Cleared data from ${table}`);
    }

    await client.query('COMMIT;');
    console.log('✓ Successfully wiped all timetable & academic data from Supabase!');
  } catch (err) {
    await client.query('ROLLBACK;');
    console.error('Failed to wipe database, rolled back:', err);
    throw err;
  } finally {
    await client.end();
  }
}

wipeDatabase().catch(err => {
  console.error(err);
  process.exit(1);
});

