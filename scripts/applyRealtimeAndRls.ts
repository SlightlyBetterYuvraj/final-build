import dotenv from 'dotenv';
dotenv.config();

import pg from 'pg';
const { Pool } = pg;

async function applyRealtimeAndRls() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  try {
    console.log('Enabling RLS on notification_outbox...');
    await client.query(`
      ALTER TABLE notification_outbox ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS outbox_student_policy ON notification_outbox;
      CREATE POLICY outbox_student_policy ON notification_outbox
        FOR SELECT USING (true);

      DROP POLICY IF EXISTS outbox_admin_all ON notification_outbox;
      CREATE POLICY outbox_admin_all ON notification_outbox
        FOR ALL USING (get_auth_role() = 'admin') WITH CHECK (get_auth_role() = 'admin');
    `);

    console.log('Configuring supabase_realtime publication...');
    // In Supabase, supabase_realtime publication exists. We add class_occurrences and notification_outbox.
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
          IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND tablename = 'class_occurrences'
          ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE class_occurrences;
          END IF;

          IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND tablename = 'notification_outbox'
          ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE notification_outbox;
          END IF;
        END IF;
      END $$;
    `);

    // Verify
    const pubs = await client.query(`
      SELECT pubname, tablename 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime';
    `);
    console.log('Verified supabase_realtime tables:', pubs.rows);

    const rls = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE tablename IN ('class_occurrences', 'notification_outbox', 'profiles', 'extra_classes', 'audit_events');
    `);
    console.log('Verified RLS status:', rls.rows);

    console.log('Migration applied successfully!');
  } finally {
    client.release();
    await pool.end();
  }
}

applyRealtimeAndRls().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
