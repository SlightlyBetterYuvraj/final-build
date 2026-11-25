import { isDbConfigured, getDbPool } from '../src/data/dbSync.js';

async function check() {
  if (isDbConfigured()) {
    const db = getDbPool();
    const client = await db.connect();
    try {
      const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'courses';");
      console.log('Courses columns in Supabase:', res.rows);
    } finally {
      client.release();
      await db.end();
    }
  } else {
    console.log('DB not configured');
  }
}

check().catch(console.error);
