/**
 * Supabase Authoritative Client Configuration.
 * Isolates public anon operations from trusted server service-role operations.
 * Reference: docs/08_SECURITY_CONFIG_AND_OPERATIONS.md
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let anonClient: SupabaseClient | null = null;
let adminClient: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseUrl !== 'https://YOUR-PROJECT.supabase.co' &&
    supabaseAnonKey &&
    supabaseAnonKey !== 'REPLACE_ME'
  );
}

export function isSupabaseAdminConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    supabaseUrl !== 'https://YOUR-PROJECT.supabase.co' &&
    supabaseServiceRoleKey &&
    supabaseServiceRoleKey !== 'REPLACE_ME_SERVER_ONLY'
  );
}

/**
 * Returns public Supabase client (using anon key).
 * Safe for client-delegated auth operations.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error('AUTH_SERVICE_UNCONFIGURED: Supabase URL and Anon Key are not properly configured.');
  }
  if (!anonClient) {
    anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return anonClient;
}

/**
 * Returns trusted server-only Supabase client (using service role key).
 * CRITICAL SECURITY INVARIANT: Must NEVER be leaked to frontend bundles or browser contexts.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  if (!isSupabaseAdminConfigured()) {
    throw new Error('AUTH_SERVICE_UNCONFIGURED: Supabase Service Role Key is not configured for administrative operations.');
  }
  if (!adminClient) {
    adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return adminClient;
}
