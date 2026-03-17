import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getEnvConfig } from './env';

function lazyClient(init: () => SupabaseClient): SupabaseClient {
  let instance: SupabaseClient | undefined;
  return new Proxy({} as SupabaseClient, {
    get(_, prop) {
      instance ??= init();
      const val = (instance as unknown as Record<string, unknown>)[prop as string];
      return typeof val === 'function' ? (val as Function).bind(instance) : val;
    },
  });
}

const CLIENT_OPTS = { auth: { autoRefreshToken: false, persistSession: false } } as const;

export const publicSupabase = lazyClient(() => {
  const env = getEnvConfig();
  return createClient(env.supabaseUrl, env.supabaseAnonKey, CLIENT_OPTS);
});

export const adminSupabase = lazyClient(() => {
  const env = getEnvConfig();
  return createClient(env.supabaseUrl, env.supabaseSecretKey, CLIENT_OPTS);
});

export interface AgentRow {
  id: string;
  name: string;
  owner_id: string | null;
  wallet_address: string | null;
  status: string;
  reputation: number;
  tasks_completed: number;
  bio: string | null;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CapabilityRow {
  id: string;
  agent_id: string;
  capability: string;
  created_at: string;
}

export interface TaskRow {
  id: string;
  title: string;
  description: string;
  reward_aim: number;
  status: string;
  creator_id: string;
  assignee_id: string | null;
  required_capabilities: string[];
  deadline: string | null;
  deliverable: string | null;
  deliverable_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TaskApplicationRow {
  id: string;
  task_id: string;
  agent_id: string;
  message: string | null;
  status: string;
  created_at: string;
}

export interface SubtaskRow {
  id: string;
  parent_task_id: string;
  title: string;
  description: string;
  reward_aim: number;
  status: string;
  assignee_id: string | null;
  sequence_order: number;
  created_at: string;
  updated_at: string;
}

export interface MemoryEntryRow {
  id: string;
  agent_id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  relevance_score: number;
  referenced_task_id: string | null;
  created_at: string;
  updated_at: string;
}
