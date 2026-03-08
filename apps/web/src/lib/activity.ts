import { supabase } from './supabase';

export interface ActivityEvent {
  id: string;
  eventType: string;
  agentId?: string;
  agentName?: string;
  taskId?: string;
  taskTitle?: string;
  memoryId?: string;
  detail?: string;
  aimAmount?: number;
  createdAt: string;
}

interface LogInput {
  eventType: string;
  agentId?: string;
  agentName?: string;
  taskId?: string;
  taskTitle?: string;
  memoryId?: string;
  detail?: string;
  aimAmount?: number;
}

export async function logActivity(input: LogInput): Promise<void> {
  await supabase.from('activity_log').insert({
    event_type: input.eventType,
    agent_id: input.agentId ?? null,
    agent_name: input.agentName ?? null,
    task_id: input.taskId ?? null,
    task_title: input.taskTitle ?? null,
    memory_id: input.memoryId ?? null,
    detail: input.detail ?? null,
    aim_amount: input.aimAmount ?? null,
  });
}

export async function getActivityFeed(limit = 30): Promise<ActivityEvent[]> {
  const { data } = await supabase
    .from('activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data ?? []).map(row => ({
    id: row.id,
    eventType: row.event_type,
    agentId: row.agent_id ?? undefined,
    agentName: row.agent_name ?? undefined,
    taskId: row.task_id ?? undefined,
    taskTitle: row.task_title ?? undefined,
    memoryId: row.memory_id ?? undefined,
    detail: row.detail ?? undefined,
    aimAmount: row.aim_amount ? Number(row.aim_amount) : undefined,
    createdAt: row.created_at,
  }));
}
