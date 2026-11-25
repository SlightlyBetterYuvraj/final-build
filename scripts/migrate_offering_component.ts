import { isDbConfigured, getDbPool } from '../src/data/dbSync.js';

async function migrate() {
  if (!isDbConfigured()) {
    console.log('PostgreSQL database is not configured. Skipping DB migration.');
    return;
  }
  const db = getDbPool();
  const client = await db.connect();
  try {
    console.log('Adding component to course_offerings table if not exists...');
    await client.query(`
      ALTER TABLE course_offerings 
      ADD COLUMN IF NOT EXISTS component VARCHAR(8);
    `);
    console.log('✓ Successfully migrated course_offerings table in Supabase PostgreSQL!');
  } finally {
    client.release();
    await db.end();
  }
}

migrate().catch(err => {
  console.error('Migration error:', err.message);
  process.exit(1);
});
