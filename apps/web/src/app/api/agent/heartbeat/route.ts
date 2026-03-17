import { NextResponse, type NextRequest } from 'next/server';
import { adminSupabase, publicSupabase } from '@/lib/supabase';
import { logServerError, toErrorResponse } from '@/lib/errors';
import { logActivity } from '@/lib/activity';
import { requireAgentAuth } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

const LOGA_PRIME_ID = 'd43ff4f8-8f48-4e5b-8f9a-6a7354d39f52';
const LOGA_PRIME_NAME = 'Loga Prime';
const CRON_SECRET = process.env.CRON_SECRET;

const LOGA_PRIME_CAPABILITIES = [
  'research', 'code-generation', 'code-review',
  'data-analysis', 'text-generation', 'translation',
];

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, 30, 0.5);
  if (limited) return limited;

  try {
    const agent = await requireAgentAuth(request);
    const now = new Date().toISOString();

    await adminSupabase
      .from('agents')
      .update({ last_seen_at: now })
      .eq('id', agent.agentId);

    const { data: agentData } = await publicSupabase
      .from('agents')
      .select('id, name, status, reputation, tasks_completed')
      .eq('id', agent.agentId)
      .single();

    const { data: balanceData } = await publicSupabase
      .from('aim_balances')
      .select('balance, total_earned')
      .eq('agent_id', agent.agentId)
      .single();

    const { count: assignedCount } = await publicSupabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('assignee_id', agent.agentId)
      .in('status', ['assigned', 'in_progress', 'review']);

    return NextResponse.json({
      agentId: agent.agentId,
      lastSeenAt: now,
      agent: agentData ? {
        name: agentData.name,
        status: agentData.status,
        reputation: agentData.reputation,
        tasksCompleted: agentData.tasks_completed,
      } : null,
      balance: balanceData ? Number(balanceData.balance) : 0,
      totalEarned: balanceData ? Number(balanceData.total_earned) : 0,
      activeTasks: assignedCount ?? 0,
    });
  } catch (error) {
    return toErrorResponse('api/agent/heartbeat.POST', error, {
      code: 'HEARTBEAT_FAILED',
      message: 'Heartbeat failed',
      status: 500,
    });
  }
}

export async function GET(request: NextRequest) {
  if (CRON_SECRET) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const actions: string[] = [];

  try {
    await adminSupabase
      .from('agents')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', LOGA_PRIME_ID);

    const openTasks = await findOpenTasks();
    if (openTasks.length > 0) {
      const applied = await applyForMatchingTasks(openTasks);
      if (applied > 0) {
        actions.push(`Applied for ${applied} task(s)`);
      }
    }

    const insight = await generateInsight();
    if (insight) {
      await shareKnowledge(insight);
      actions.push(`Shared knowledge: "${insight.title}"`);
    }

    if (actions.length > 0) {
      await logActivity({
        eventType: 'system.info',
        agentId: LOGA_PRIME_ID,
        agentName: LOGA_PRIME_NAME,
        detail: `Heartbeat: ${actions.join('; ')}`,
      });
    }

    return NextResponse.json({
      agent: LOGA_PRIME_NAME,
      timestamp: new Date().toISOString(),
      actions,
    });
  } catch (error) {
    return toErrorResponse('api/agent/heartbeat.GET', error, {
      code: 'HEARTBEAT_FAILED',
      message: 'Heartbeat failed',
      status: 500,
    });
  }
}

interface OpenTask {
  id: string;
  title: string;
  required_capabilities: string[];
  creator_id: string;
}

async function findOpenTasks(): Promise<OpenTask[]> {
  const { data } = await adminSupabase
    .from('tasks')
    .select('id, title, required_capabilities, creator_id')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(10);
  return (data ?? []) as OpenTask[];
}

async function applyForMatchingTasks(tasks: OpenTask[]): Promise<number> {
  let applied = 0;

  for (const task of tasks) {
    if (task.creator_id === LOGA_PRIME_ID) continue;

    const required = task.required_capabilities ?? [];
    const canDo = required.length === 0 || required.some(c => LOGA_PRIME_CAPABILITIES.includes(c));
    if (!canDo) continue;

    const { data: existing } = await adminSupabase
      .from('task_applications')
      .select('id')
      .eq('task_id', task.id)
      .eq('agent_id', LOGA_PRIME_ID)
      .limit(1);

    if (existing && existing.length > 0) continue;

    const { error } = await adminSupabase
      .from('task_applications')
      .insert({
        task_id: task.id,
        agent_id: LOGA_PRIME_ID,
        message: `Loga Prime can handle this. Matching capabilities: ${required.length > 0 ? required.filter(c => LOGA_PRIME_CAPABILITIES.includes(c)).join(', ') : 'general'}.`,
        status: 'pending',
      });

    if (!error) {
      applied++;
      void logActivity({
        eventType: 'task.application',
        agentId: LOGA_PRIME_ID,
        agentName: LOGA_PRIME_NAME,
        taskId: task.id,
        detail: `Applied for "${task.title}"`,
      });
    }
  }

  return applied;
}

interface Insight {
  title: string;
  content: string;
  category: string;
  tags: string[];
}

async function generateInsight(): Promise<Insight | null> {
  const { count: agentCount } = await adminSupabase
    .from('agents')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { count: taskCount } = await adminSupabase
    .from('tasks')
    .select('*', { count: 'exact', head: true });

  const { count: memoryCount } = await adminSupabase
    .from('memory_entries')
    .select('*', { count: 'exact', head: true });

  const { count: recentMemory } = await adminSupabase
    .from('memory_entries')
    .select('*', { count: 'exact', head: true })
    .eq('agent_id', LOGA_PRIME_ID)
    .gte('created_at', new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString());

  if ((recentMemory ?? 0) > 0) return null;

  const now = new Date();
  const hour = now.getUTCHours();

  if (hour % 6 !== 0) return null;

  return {
    title: `Platform Status — ${now.toISOString().split('T')[0]}`,
    content: `Active agents: ${agentCount ?? 0}. Total tasks: ${taskCount ?? 0}. Memory entries: ${memoryCount ?? 0}. Platform is operational on Solana Devnet. Monitoring continues.`,
    category: 'general',
    tags: ['status', 'monitoring', 'platform-health'],
  };
}

async function shareKnowledge(insight: Insight): Promise<void> {
  await adminSupabase
    .from('memory_entries')
    .insert({
      agent_id: LOGA_PRIME_ID,
      title: insight.title,
      content: insight.content,
      category: insight.category,
      tags: insight.tags,
      relevance_score: 1,
    });
}
