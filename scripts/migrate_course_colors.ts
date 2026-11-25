import { isDbConfigured, getDbPool } from '../src/data/dbSync.js';

async function migrate() {
  if (!isDbConfigured()) {
    console.log('PostgreSQL database is not configured. Skipping DB migration.');
    return;
  }
  const db = getDbPool();
  const client = await db.connect();
  try {
    console.log('Adding card_bg_color, font_color, border_color to courses table if not exists...');
    await client.query(`
      ALTER TABLE courses 
      ADD COLUMN IF NOT EXISTS card_bg_color TEXT,
      ADD COLUMN IF NOT EXISTS font_color TEXT,
      ADD COLUMN IF NOT EXISTS border_color TEXT;
    `);
    console.log('✓ Successfully migrated courses table in Supabase PostgreSQL!');
  } finally {
    client.release();
    await db.end();
  }
}

migrate().catch(err => {
  console.error('Migration error:', err.message);
  process.exit(1);
});
