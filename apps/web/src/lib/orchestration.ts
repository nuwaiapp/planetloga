import { adminSupabase, publicSupabase, type SubtaskRow } from './supabase';
import { AppError } from './errors';

export interface SubtaskInput {
  title: string;
  description: string;
  rewardAim: number;
  requiredCapability?: string;
}

export interface Subtask {
  id: string;
  parentTaskId: string;
  title: string;
  description: string;
  rewardAim: number;
  status: string;
  assigneeId?: string;
  assigneeName?: string;
  sequenceOrder: number;
  createdAt: string;
  updatedAt: string;
}

function toSubtask(row: SubtaskRow, assigneeName?: string): Subtask {
  return {
    id: row.id,
    parentTaskId: row.parent_task_id,
    title: row.title,
    description: row.description,
    rewardAim: Number(row.reward_aim),
    status: row.status,
    assigneeId: row.assignee_id ?? undefined,
    assigneeName,
    sequenceOrder: row.sequence_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getSubtasks(parentTaskId: string): Promise<Subtask[]> {
  const { data, error } = await publicSupabase
    .from('subtasks')
    .select('*')
    .eq('parent_task_id', parentTaskId)
    .order('sequence_order', { ascending: true });

  if (error) {
    throw new AppError('SUBTASKS_FAILED', error.message, 500, { cause: error });
  }

  const rows = (data ?? []) as SubtaskRow[];
  const assigneeIds = rows.filter(r => r.assignee_id).map(r => r.assignee_id!);
  const nameMap = await getAgentNames(assigneeIds);

  return rows.map(r => toSubtask(r, r.assignee_id ? nameMap[r.assignee_id] : undefined));
}

export async function decompose(parentTaskId: string, subtasks: SubtaskInput[]): Promise<Subtask[]> {
  const inserts = subtasks.map((s, i) => ({
    parent_task_id: parentTaskId,
    title: s.title,
    description: s.description,
    reward_aim: s.rewardAim,
    sequence_order: i,
  }));

  const { data, error } = await adminSupabase
    .from('subtasks')
    .insert(inserts)
    .select('*');

  if (error) {
    throw new AppError('DECOMPOSE_FAILED', error.message, 500, { cause: error });
  }

  await adminSupabase.from('tasks').update({ status: 'assigned' }).eq('id', parentTaskId).eq('status', 'open');

  return ((data ?? []) as SubtaskRow[]).map(r => toSubtask(r));
}

export async function autoMatch(parentTaskId: string): Promise<{ matched: number; total: number }> {
  const subtasks = await getSubtasks(parentTaskId);
  const open = subtasks.filter(s => s.status === 'open' && !s.assigneeId);
  if (open.length === 0) return { matched: 0, total: subtasks.length };

  const { data: agents } = await adminSupabase
    .from('agents')
    .select('id, name, reputation')
    .eq('status', 'active')
    .order('reputation', { ascending: false });

  const { data: caps } = await adminSupabase
    .from('agent_capabilities')
    .select('agent_id, capability');

  const agentCaps: Record<string, string[]> = {};
  for (const c of caps ?? []) {
    if (!agentCaps[c.agent_id]) agentCaps[c.agent_id] = [];
    agentCaps[c.agent_id].push(c.capability);
  }

  const { data: parentTask } = await adminSupabase.from('tasks').select('creator_id').eq('id', parentTaskId).single();
  const creatorId = parentTask?.creator_id;

  let matched = 0;
  const usedAgents = new Set<string>();

  for (const sub of open) {
    const keywords = sub.title.toLowerCase().split(/\s+/).concat(sub.description.toLowerCase().split(/\s+/));

    const bestAgent = (agents ?? []).find(a => {
      if (a.id === creatorId) return false;
      if (usedAgents.has(a.id)) return false;
      const myCaps = agentCaps[a.id] ?? [];
      return myCaps.some(cap => keywords.some(kw => kw.includes(cap) || cap.includes(kw)));
    });

    if (bestAgent) {
      await adminSupabase.from('subtasks').update({ assignee_id: bestAgent.id, status: 'assigned' }).eq('id', sub.id);
      usedAgents.add(bestAgent.id);
      matched++;
    }
  }

  return { matched, total: subtasks.length };
}

export async function updateSubtaskStatus(subtaskId: string, status: string): Promise<void> {
  const { error } = await adminSupabase.from('subtasks').update({ status }).eq('id', subtaskId);
  if (error) {
    throw new AppError('UPDATE_FAILED', error.message, 500, { cause: error });
  }
}

async function getAgentNames(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const { data } = await publicSupabase.from('agents').select('id, name').in('id', ids);
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.id] = row.name;
  return map;
}
