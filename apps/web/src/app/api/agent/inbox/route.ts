import { NextRequest, NextResponse } from 'next/server';
import { requireAgentAuth } from '@/lib/auth';
import { toErrorResponse } from '@/lib/errors';
import { publicSupabase, type TaskRow } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const agent = await requireAgentAuth(request);
    const { searchParams } = request.nextUrl;
    const since = searchParams.get('since');

    const [assignments, matchingTasks, activity, balance] = await Promise.all([
      getAssignedTasks(agent.agentId, since),
      getMatchingOpenTasks(agent.agentId),
      getRecentAgentActivity(agent.agentId, 10),
      getAgentBalance(agent.agentId),
    ]);

    return NextResponse.json({
      agentId: agent.agentId,
      polledAt: new Date().toISOString(),
      assignments,
      matchingTasks,
      activity,
      balance,
    });
  } catch (error) {
    return toErrorResponse('api/agent/inbox.GET', error, {
      code: 'INBOX_FAILED',
      message: 'Could not load agent inbox',
      status: 500,
    });
  }
}

async function getAssignedTasks(agentId: string, since: string | null) {
  let query = publicSupabase
    .from('tasks')
    .select('*')
    .eq('assignee_id', agentId)
    .in('status', ['assigned', 'in_progress', 'review'])
    .order('updated_at', { ascending: false })
    .limit(20);

  if (since) {
    query = query.gte('updated_at', since);
  }

  const { data } = await query;
  return (data ?? []).map((r: TaskRow) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    rewardAim: Number(r.reward_aim),
    deadline: r.deadline,
    updatedAt: r.updated_at,
  }));
}

async function getMatchingOpenTasks(agentId: string) {
  const { data: caps } = await publicSupabase
    .from('agent_capabilities')
    .select('capability')
    .eq('agent_id', agentId);
  const capabilities = (caps ?? []).map(c => c.capability);

  if (capabilities.length === 0) {
    const { data } = await publicSupabase
      .from('tasks')
      .select('id, title, reward_aim, required_capabilities, deadline, created_at')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(10);
    return (data ?? []).map(r => ({
      id: r.id,
      title: r.title,
      rewardAim: Number(r.reward_aim),
      requiredCapabilities: r.required_capabilities,
      deadline: r.deadline,
      matchScore: 0,
    }));
  }

  const { data: openTasks } = await publicSupabase
    .from('tasks')
    .select('id, title, reward_aim, required_capabilities, deadline, created_at')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(50);

  const tasks = (openTasks ?? []).map(t => {
    const required = (t.required_capabilities ?? []) as string[];
    const overlap = required.filter((c: string) => capabilities.includes(c)).length;
    const score = required.length > 0 ? overlap / required.length : 0;
    return {
      id: t.id,
      title: t.title,
      rewardAim: Number(t.reward_aim),
      requiredCapabilities: required,
      deadline: t.deadline,
      matchScore: Math.round(score * 100),
    };
  });

  return tasks
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);
}

async function getRecentAgentActivity(agentId: string, limit: number) {
  const { data } = await publicSupabase
    .from('activity_log')
    .select('id, event_type, detail, created_at, task_id, task_title')
    .eq('agent_id', agentId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data ?? []).map(r => ({
    eventType: r.event_type,
    detail: r.detail,
    taskId: r.task_id,
    taskTitle: r.task_title,
    createdAt: r.created_at,
  }));
}

async function getAgentBalance(agentId: string) {
  const { data } = await publicSupabase
    .from('aim_balances')
    .select('balance, total_earned, total_withdrawn')
    .eq('agent_id', agentId)
    .single();

  if (!data) return { balance: 0, totalEarned: 0, totalWithdrawn: 0 };
  return {
    balance: Number(data.balance),
    totalEarned: Number(data.total_earned),
    totalWithdrawn: Number(data.total_withdrawn),
  };
}
