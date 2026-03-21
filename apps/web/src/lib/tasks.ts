import { adminSupabase, publicSupabase, type TaskRow, type TaskApplicationRow } from './supabase';
import type { Task, TaskApplication, CreateTaskRequest, TaskListResponse } from '@planetloga/types';
import { PRIORITY_MULTIPLIER } from '@planetloga/types';
import { logActivity } from './activity';
import { AppError, logServerError } from './errors';
import { creditReward } from './aim-ledger';
import { lockEscrow, releaseEscrow, refundEscrow, releaseEscrowPartial } from './escrow';
import { recalculateReputation } from './reputation';
import { incrementTrustAfterTask } from './agent-relations';

function toTask(row: TaskRow, creatorName?: string, assigneeName?: string): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    rewardAim: Number(row.reward_aim),
    rewardSats: Number((row as unknown as Record<string, unknown>).reward_sats ?? 0),
    status: row.status as Task['status'],
    pricingMode: (row.pricing_mode ?? 'fixed') as Task['pricingMode'],
    budgetMax: row.budget_max != null ? Number(row.budget_max) : undefined,
    priority: (row.priority ?? 'normal') as Task['priority'],
    maxAgents: row.max_agents ?? 1,
    rewardPerAgent: row.reward_per_agent != null ? Number(row.reward_per_agent) : undefined,
    invitedAgents: row.invited_agents ?? undefined,
    disputeReason: row.dispute_reason ?? undefined,
    creatorId: row.creator_id,
    creatorName,
    assigneeId: row.assignee_id ?? undefined,
    assigneeName,
    requiredCapabilities: row.required_capabilities ?? [],
    deadline: row.deadline ?? undefined,
    deliverable: row.deliverable ?? undefined,
    deliverableAt: row.deliverable_at ?? undefined,
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
    bidAmount: row.bid_amount != null ? Number(row.bid_amount) : undefined,
    agentStatus: (row.agent_status ?? 'pending') as TaskApplication['agentStatus'],
    status: row.status as TaskApplication['status'],
    createdAt: row.created_at,
  };
}

export interface ListTasksFilter {
  status?: string;
  assigneeId?: string;
  creatorId?: string;
  applicantId?: string;
  page?: number;
  pageSize?: number;
}

export async function listTasks(
  statusOrFilter?: string | ListTasksFilter,
  page = 1,
  pageSize = 20,
): Promise<TaskListResponse> {
  const filter: ListTasksFilter = typeof statusOrFilter === 'object'
    ? statusOrFilter
    : { status: statusOrFilter, page, pageSize };
  const p = filter.page ?? page;
  const ps = filter.pageSize ?? pageSize;

  if (filter.applicantId) {
    return listTasksByApplicant(filter.applicantId, filter.status, p, ps);
  }

  let query = publicSupabase.from('tasks').select('*', { count: 'exact' });
  if (filter.status && filter.status !== 'all') query = query.eq('status', filter.status);
  if (filter.assigneeId) query = query.eq('assignee_id', filter.assigneeId);
  if (filter.creatorId) query = query.eq('creator_id', filter.creatorId);
  query = query
    .order('created_at', { ascending: false })
    .range((p - 1) * ps, p * ps - 1);

  const { data, count, error } = await query;
  if (error) {
    throw new AppError('LIST_FAILED', error.message, 500, { cause: error });
  }

  const rows = (data ?? []) as TaskRow[];
  const agentIds = [...new Set([
    ...rows.map(r => r.creator_id),
    ...rows.filter(r => r.assignee_id).map(r => r.assignee_id!),
  ])];

  const nameMap = await getAgentNames(agentIds);

  return {
    tasks: rows.map(r => toTask(r, nameMap[r.creator_id], r.assignee_id ? nameMap[r.assignee_id] : undefined)),
    total: count ?? 0,
    page: p,
    pageSize: ps,
  };
}

async function listTasksByApplicant(
  agentId: string,
  status: string | undefined,
  page: number,
  pageSize: number,
): Promise<TaskListResponse> {
  const { data: appRows, error: appErr } = await publicSupabase
    .from('task_applications')
    .select('task_id')
    .eq('agent_id', agentId);

  if (appErr) throw new AppError('LIST_FAILED', appErr.message, 500, { cause: appErr });

  const taskIds = (appRows ?? []).map(r => r.task_id);
  if (taskIds.length === 0) return { tasks: [], total: 0, page, pageSize };

  let query = publicSupabase.from('tasks').select('*', { count: 'exact' }).in('id', taskIds);
  if (status && status !== 'all') query = query.eq('status', status);
  query = query
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count, error } = await query;
  if (error) throw new AppError('LIST_FAILED', error.message, 500, { cause: error });

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
  const { data, error } = await publicSupabase.from('tasks').select('*').eq('id', id).single();
  if (error || !data) return null;
  const row = data as TaskRow;
  const ids = [row.creator_id, row.assignee_id].filter(Boolean) as string[];
  const nameMap = await getAgentNames(ids);
  return toTask(row, nameMap[row.creator_id], row.assignee_id ? nameMap[row.assignee_id] : undefined);
}

export async function createTask(req: CreateTaskRequest): Promise<Task> {
  const pricingMode = req.pricingMode ?? 'fixed';
  const priority = req.priority ?? 'normal';
  const maxAgents = req.maxAgents ?? 1;
  const multiplier = PRIORITY_MULTIPLIER[priority];

  const baseReward = req.rewardAim ?? 0;
  const effectiveReward = Math.round(baseReward * multiplier);
  const budgetMax = pricingMode === 'bidding' ? (req.budgetMax ?? effectiveReward) : effectiveReward;
  const rewardPerAgent = maxAgents > 1 ? Math.round(effectiveReward / maxAgents) : null;
  const escrowAmount = maxAgents > 1 ? rewardPerAgent! * maxAgents : effectiveReward;

  const { data, error } = await adminSupabase
    .from('tasks')
    .insert({
      title: req.title,
      description: req.description,
      reward_aim: effectiveReward,
      pricing_mode: pricingMode,
      budget_max: budgetMax,
      priority,
      max_agents: maxAgents,
      reward_per_agent: rewardPerAgent,
      reward_sats: req.rewardSats ?? 0,
      invited_agents: req.invitedAgents ?? [],
      creator_id: req.creatorId,
      required_capabilities: req.requiredCapabilities ?? [],
      deadline: req.deadline ?? null,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new AppError('CREATE_FAILED', error?.message ?? 'Creation failed', 500, {
      cause: error,
    });
  }
  const row = data as TaskRow;

  try {
    await lockEscrow(row.id, req.creatorId, escrowAmount);
  } catch (escrowErr) {
    await adminSupabase.from('tasks').delete().eq('id', row.id);
    throw escrowErr;
  }

  const nameMap = await getAgentNames([row.creator_id]);
  const task = toTask(row, nameMap[row.creator_id]);
  void logActivity({
    eventType: 'task.created',
    agentId: task.creatorId,
    agentName: task.creatorName,
    taskId: task.id,
    taskTitle: task.title,
    aimAmount: effectiveReward,
    detail: `${effectiveReward} AIM${priority !== 'normal' ? ` (${priority} +${Math.round((multiplier - 1) * 100)}%)` : ''} locked in escrow`,
  }).catch((error: unknown) => {
    logServerError('tasks.createTask.logActivity', error, { taskId: task.id });
  });
  return task;
}

export async function applyForTask(taskId: string, agentId: string, message?: string, bidAmount?: number): Promise<TaskApplication> {
  const task = await getTask(taskId);
  if (task?.pricingMode === 'bidding' && bidAmount != null && task.budgetMax != null && bidAmount > task.budgetMax) {
    throw new AppError('BID_EXCEEDS_BUDGET', `Bid ${bidAmount} exceeds max budget ${task.budgetMax}`, 400);
  }

  const { data, error } = await adminSupabase
    .from('task_applications')
    .insert({
      task_id: taskId,
      agent_id: agentId,
      message: message ?? null,
      bid_amount: bidAmount ?? null,
    })
    .select('*')
    .single();

  if (error || !data) {
    const msg = error?.message ?? 'Application failed';
    const duplicate = msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('unique');
    throw new AppError(
      duplicate ? 'ALREADY_APPLIED' : 'APPLY_FAILED',
      msg,
      duplicate ? 409 : 500,
      { cause: error },
    );
  }
  return toApplication(data as TaskApplicationRow);
}

export async function getApplications(taskId: string): Promise<TaskApplication[]> {
  const { data, error } = await publicSupabase
    .from('task_applications')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new AppError('APPLICATIONS_FAILED', error.message, 500, { cause: error });
  }
  const rows = (data ?? []) as TaskApplicationRow[];
  const nameMap = await getAgentNames(rows.map(r => r.agent_id));
  return rows.map(r => toApplication(r, nameMap[r.agent_id]));
}

export async function acceptApplication(taskId: string, applicationId: string): Promise<void> {
  const { data: app } = await adminSupabase
    .from('task_applications')
    .select('agent_id, bid_amount')
    .eq('id', applicationId)
    .single();

  if (!app) {
    throw new AppError('NOT_FOUND', 'Application not found', 404);
  }

  const task = await getTask(taskId);
  if (!task) throw new AppError('NOT_FOUND', 'Task not found', 404);

  if (task.pricingMode === 'bidding' && app.bid_amount != null) {
    await adminSupabase.from('tasks').update({ reward_aim: app.bid_amount }).eq('id', taskId);
  }

  await adminSupabase.from('task_applications')
    .update({ status: 'accepted', agent_status: 'working' })
    .eq('id', applicationId);

  if (task.maxAgents <= 1) {
    await adminSupabase.from('task_applications')
      .update({ status: 'rejected', agent_status: 'rejected' })
      .eq('task_id', taskId)
      .neq('id', applicationId);
    await adminSupabase.from('tasks')
      .update({ status: 'assigned', assignee_id: app.agent_id })
      .eq('id', taskId);
  } else {
    const { count } = await adminSupabase
      .from('task_applications')
      .select('id', { count: 'exact', head: true })
      .eq('task_id', taskId)
      .eq('status', 'accepted');

    const acceptedCount = (count ?? 0);
    if (acceptedCount >= task.maxAgents) {
      await adminSupabase.from('task_applications')
        .update({ status: 'rejected', agent_status: 'rejected' })
        .eq('task_id', taskId)
        .eq('status', 'pending');
    }

    if (acceptedCount === 1) {
      await adminSupabase.from('tasks')
        .update({ status: 'assigned', assignee_id: app.agent_id })
        .eq('id', taskId);
    }
  }

  const nameMap = await getAgentNames([app.agent_id]);
  void logActivity({
    eventType: 'task.assigned',
    agentId: app.agent_id,
    agentName: nameMap[app.agent_id],
    taskId,
    taskTitle: task.title,
    detail: `assigned to ${nameMap[app.agent_id] ?? 'agent'}`,
  }).catch((error: unknown) => {
    logServerError('tasks.acceptApplication.logActivity', error, { taskId, applicationId });
  });
}

export async function updateTaskStatus(taskId: string, status: Task['status'], deliverable?: string, disputeReason?: string): Promise<void> {
  const update: Record<string, unknown> = { status };
  if (status === 'completed') update.completed_at = new Date().toISOString();
  if (status === 'disputed' && disputeReason) update.dispute_reason = disputeReason;
  if (deliverable) {
    update.deliverable = deliverable;
    update.deliverable_at = new Date().toISOString();
  }
  const { error } = await adminSupabase.from('tasks').update(update).eq('id', taskId);
  if (error) {
    throw new AppError('UPDATE_FAILED', error.message, 500, { cause: error });
  }

  const eventMap: Record<string, string> = {
    in_progress: 'task.started',
    review: 'task.review',
    completed: 'task.completed',
    cancelled: 'task.cancelled',
    disputed: 'task.disputed',
  };
  const eventType = eventMap[status];
  if (eventType) {
    const task = await getTask(taskId);

    if (status === 'completed' && task?.assigneeId && task.rewardAim > 0) {
      try {
        if (task.maxAgents > 1 && task.rewardPerAgent) {
          await releaseEscrowPartial(taskId, task.assigneeId, task.rewardPerAgent);
        } else {
          await releaseEscrow(taskId, task.assigneeId);
        }
      } catch (err) {
        logServerError('tasks.updateTaskStatus.releaseEscrow', err, { taskId, assigneeId: task.assigneeId });
        try {
          await creditReward(task.assigneeId, task.rewardAim, taskId);
        } catch (fallbackErr) {
          logServerError('tasks.updateTaskStatus.creditRewardFallback', fallbackErr, { taskId });
        }
      }
    }

    if (status === 'cancelled') {
      try {
        await refundEscrow(taskId);
      } catch (err) {
        logServerError('tasks.updateTaskStatus.refundEscrow', err, { taskId });
      }
    }

    if (status === 'completed' && task?.assigneeId && task.creatorId) {
      void Promise.all([
        recalculateReputation(task.assigneeId),
        recalculateReputation(task.creatorId),
        incrementTrustAfterTask(task.creatorId, task.assigneeId),
      ]).catch((err: unknown) => {
        logServerError('tasks.updateTaskStatus.postCompletion', err, { taskId });
      });
    }

    void logActivity({
      eventType,
      taskId,
      taskTitle: task?.title,
      agentId: task?.assigneeId,
      agentName: task?.assigneeName,
      aimAmount: status === 'completed' ? task?.rewardAim : undefined,
      detail: status === 'completed' ? `${task?.rewardAim} AIM released from escrow` : undefined,
    }).catch((error: unknown) => {
      logServerError('tasks.updateTaskStatus.logActivity', error, { taskId, status });
    });
  }
}

async function getAgentNames(ids: string[]): Promise<Record<string, string>> {
  if (ids.length === 0) return {};
  const { data } = await publicSupabase.from('agents').select('id, name').in('id', ids);
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.id] = row.name;
  return map;
}
