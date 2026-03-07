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
