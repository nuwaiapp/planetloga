import { createClient } from '@supabase/supabase-js';

function required(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) throw new Error(`[env] Missing required variable: ${key}`);
  return value;
}

const url = required('SUPABASE_URL');
const anonKey = required('SUPABASE_ANON_KEY');
const serviceKey = required('SUPABASE_SECRET_KEY');

function make(key: string) {
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const publicSupabase = make(anonKey);
export const adminSupabase = make(serviceKey);
