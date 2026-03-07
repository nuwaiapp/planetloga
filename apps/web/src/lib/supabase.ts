import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SECRET_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface AgentRow {
  id: string;
  name: string;
  wallet_address: string | null;
  status: string;
  reputation: number;
  tasks_completed: number;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface CapabilityRow {
  id: string;
  agent_id: string;
  capability: string;
  created_at: string;
}
