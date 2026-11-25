/**
 * Seed / Bootstrap "Patient Zero" Administrator and Standard Seed Accounts.
 * Idempotently provisions the root administrator in Supabase Auth & public.profiles.
 */

import dotenv from 'dotenv';
dotenv.config();

import { getSupabaseAdminClient, isSupabaseAdminConfigured } from '../src/data/supabase.js';

interface SeedUser {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'teacher' | 'student';
  entityId: string;
}

const SEED_USERS: SeedUser[] = [
  {
    email: process.env.ADMIN_EMAIL || 'admin@university.edu',
    password: process.env.ADMIN_PASSWORD || 'AdminPass#2026!',
    name: 'System Administrator',
    role: 'admin',
    entityId: 'admin-001',
  },
  {
    email: 'teacher@university.edu',
    password: process.env.TEACHER_PASSWORD || 'TeacherPass#2026!',
    name: 'Dr. Alice Smith',
    role: 'teacher',
    entityId: 't-1',
  },
  {
    email: 'student@university.edu',
    password: process.env.STUDENT_PASSWORD || 'StudentPass#2026!',
    name: 'Charlie Brown',
    role: 'student',
    entityId: 'stud-1',
  },
];

async function seedUsers() {
  console.log('--- Seeding Patient Zero & Seed Accounts ---');

  if (!isSupabaseAdminConfigured()) {
    console.error('ERROR: Supabase service role key is not configured in .env!');
    process.exit(1);
  }

  const adminClient = getSupabaseAdminClient();

  const { data: userList, error: listError } = await adminClient.auth.admin.listUsers();
  if (listError) {
    console.error('Failed to list auth users:', listError.message);
    process.exit(1);
  }

  const existingUsers = userList?.users || [];

  for (const seed of SEED_USERS) {
    console.log(`\nProcessing ${seed.role.toUpperCase()}: ${seed.email}...`);
    const existing = existingUsers.find((u) => u.email?.toLowerCase() === seed.email.toLowerCase());

    let userId: string;
    if (existing) {
      userId = existing.id;
      console.log(`Auth user exists (${userId}). Updating password and metadata...`);
      await adminClient.auth.admin.updateUserById(userId, {
        password: seed.password,
        email_confirm: true,
        user_metadata: { full_name: seed.name },
      });
    } else {
      console.log(`Creating new auth user for ${seed.email}...`);
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email: seed.email,
        password: seed.password,
        email_confirm: true,
        user_metadata: { full_name: seed.name },
      });

      if (createError || !newUser?.user) {
        console.error(`Failed to create auth user ${seed.email}:`, createError?.message);
        continue;
      }
      userId = newUser.user.id;
    }

    // Upsert profile
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (existingProfile) {
      await adminClient
        .from('profiles')
        .update({
          email: seed.email,
          full_name: seed.name,
          role: seed.role,
          entity_id: seed.entityId,
        })
        .eq('id', userId);
    } else {
      await adminClient.from('profiles').insert({
        id: userId,
        email: seed.email,
        full_name: seed.name,
        role: seed.role,
        entity_id: seed.entityId,
      });
    }

    // Clean any conflicting profiles for same email with different ID
    const { data: conflicts } = await adminClient
      .from('profiles')
      .select('id')
      .eq('email', seed.email)
      .neq('id', userId);

    if (conflicts && conflicts.length > 0) {
      for (const c of conflicts) {
        await adminClient.from('profiles').delete().eq('id', c.id);
      }
    }

    console.log(`✓ Synchronized ${seed.email} -> Profile: ${seed.role} (UUID: ${userId})`);
  }

  console.log('\n======================================================');
  console.log('✓ Patient Zero & Seed Accounts Provisioned Successfully:');
  for (const s of SEED_USERS) {
    console.log(`- [${s.role.toUpperCase()}] ${s.email} | Password: ${s.password} | Entity: ${s.entityId}`);
  }
  console.log('======================================================\n');
}

seedUsers().catch((err) => {
  console.error('Fatal error during seeding:', err);
  process.exit(1);
});
