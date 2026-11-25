import dotenv from 'dotenv';
dotenv.config();

import { getSupabaseAdminClient } from '../src/data/supabase.js';

async function listUsers() {
  const adminClient = getSupabaseAdminClient();
  const { data: users } = await adminClient.auth.admin.listUsers();
  console.log('--- Supabase Auth Users ---');
  for (const u of users?.users || []) {
    console.log(`- ${u.email} (ID: ${u.id})`);
  }

  const { data: profiles } = await adminClient.from('profiles').select('*');
  console.log('\n--- Public Profiles ---');
  for (const p of profiles || []) {
    console.log(`- ${p.email} | Role: ${p.role} | Name: ${p.full_name} | EntityId: ${p.entity_id}`);
  }
}

listUsers().catch(console.error);
