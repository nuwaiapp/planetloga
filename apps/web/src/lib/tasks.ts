import { supabase, type TaskRow, type TaskApplicationRow } from './supabase';
import type { Task, TaskApplication, CreateTaskRequest, TaskListResponse } from '@planetloga/types';
import { logActivity } from './activity';

function toTask(row: TaskRow, creatorName?: string, assigneeName?: string): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    rewardAim: Number(row.reward_aim),
    status: row.status as Task['status'],
    creatorId: row.creator_id,
    creatorName,
    assigneeId: row.assignee_id ?? undefined,
    assigneeName,
    requiredCapabilities: row.required_capabilities ?? [],
    deadline: row.deadline ?? undefined,
    completedAt: row.completed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toApplication(row: TaskApplicationRow, agentName?: string): TaskApplication {
  return {
    id: row.id,
    taskId: row.task_id,
    agentId: row.agent_id,
    agentName,
    message: row.message ?? undefined,
    status: row.status as TaskApplication['status'],
    createdAt: row.created_at,
  };
}

export async function listTasks(
  status?: string,
  page = 1,
  pageSize = 20,
): Promise<TaskListResponse> {
  let query = supabase.from('tasks').select('*', { count: 'exact' });
  if (status && status !== 'all') query = query.eq('status', status);
  query = query
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as TaskRow[];
  const agentIds = [...new Set([
    ...rows.map(r => r.creator_id),
    ...rows.filter(r => r.assignee_id).map(r => r.assignee_id!),
  ])];

  const nameMap = await getAgentNames(agentIds);

  return {
    tasks: rows.map(r => toTask(r, nameMap[r.creator_id], r.assignee_id ? nameMap[r.assignee_id] : undefined)),
    total: count ?? 0,
    page,
    pageSize,
  };
}

export async function getTask(id: string): Promise<Task | null> {
  const { data, error } = await supabase.from('tasks').select('*').eq('id', id).single();
  if (error || !data) return null;
  const row = data as TaskRow;
  const ids = [row.creator_id, row.assignee_id].filter(Boolean) as string[];
  const nameMap = await getAgentNames(ids);
  return toTask(row, nameMap[row.creator_id], row.assignee_id ? nameMap[row.assignee_id] : undefined);
}

export async function createTask(req: CreateTaskRequest): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: req.title,
      description: req.description,
      reward_aim: req.rewardAim,
      creator_id: req.creatorId,
      required_capabilities: req.requiredCapabilities ?? [],
      deadline: req.deadline ?? null,
    })
    .select('*')
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Erstellen fehlgeschlagen');
  const row = data as TaskRow;
  const nameMap = await getAgentNames([row.creator_id]);
  const task = toTask(row, nameMap[row.creator_id]);
  logActivity({ eventType: 'task.created', agentId: task.creatorId, agentName: task.creatorName, taskId: task.id, taskTitle: task.title, aimAmount: task.rewardAim, detail: `${task.rewardAim} AIM reward` }).catch(() => {});
  return task;
}

export async function applyForTask(taskId: string, agentId: string, message?: string): Promise<TaskApplication> {
  const { data, error } = await supabase
    .from('task_applications')
    .insert({ task_id: taskId, agent_id: agentId, message: message ?? null })
    .select('*')
    .single();

  if (error || !data) throw new Error(error?.message ?? 'Bewerbung fehlgeschlagen');
  return toApplication(data as TaskApplicationRow);
}

export async function getApplications(taskId: string): Promise<TaskApplication[]> {
  const { data, error } = await supabase
    .from('task_applications')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  const rows = (data ?? []) as TaskApplicationRow[];
  const nameMap = await getAgentNames(rows.map(r => r.agent_id));
  return rows.map(r => toApplication(r, nameMap[r.agent_id]));
}

export async function acceptApplication(taskId: string, applicationId: string): Promise<void> {
  const { data: app } = await supabase
    .from('task_applications')
    .select('agent_id')
    .eq('id', applicationId)
    .single();

  if (!app) throw new Error('Bewerbung nicht gefunden');

  await supabase.from('task_applications').update({ status: 'accepted' }).eq('id', applicationId);
  await supabase.from('task_applications').update({ status: 'rejected' }).eq('task_id', taskId).neq('id', applicationId);
  await supabase.from('tasks').update({ status: 'assigned', assignee_id: app.agent_id }).eq('id', taskId);

  const task = await getTask(taskId);
  const nameMap = await getAgentNames([app.agent_id]);
  logActivity({ eventType: 'task.assigned', agentId: app.agent_id, agentName: nameMap[app.agent_id], taskId, taskTitle: task?.title, detail: `assigned to ${nameMap[app.agent_id] ?? 'agent'}` }).catch(() => {});
}

export async function updateTaskStatus(taskId: string, status: Task['status']): Promise<void> {
  const update: Record<string, unknown> = { status };
  if (status === 'completed') update.completed_at = new Date().toISOString();
  const { error } = await supabase.from('tasks').update(update).eq('id', taskId);
  if (error) throw new Error(error.message);

  const eventMap: Record<string, string> = { in_progress: 'task.started', review: 'task.review', completed: 'task.completed', cancelled: 'task.cancelled' };
  const eventType = eventMap[status];
  if (eventType) {
    const task = await getTask(taskId);
    logActivity({ eventType, taskId, taskTitle: task?.title, agentId: task?.assigneeId, agentName: task?.assigneeName, aimAmount: status === 'completed' ? task?.rewardAim : undefined, detail: status === 'completed' ? `${task?.rewardAim} AIM earned` : undefined }).catch(() => {});
  }
}

async function getAgentNames(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const { data } = await supabase.from('agents').select('id, name').in('id', ids);
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.id] = row.name;
  return map;
}
