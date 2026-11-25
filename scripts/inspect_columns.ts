import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const tables = ['programmes', 'departments', 'academic_terms', 'sections', 'batches', 'students', 'student_group_memberships', 'teachers', 'teacher_availability', 'rooms', 'courses', 'course_offerings', 'elective_groups', 'elective_assignments'];
  for (const t of tables) {
    const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1;", [t]);
    console.log(t + ': ' + res.rows.map(r => r.column_name).join(', '));
  }
  await client.end();
}

run().catch(console.error);
