import { NextResponse, type NextRequest } from 'next/server';
import { adminSupabase } from '@/lib/supabase';
import { logServerError } from '@/lib/errors';
import { logActivity } from '@/lib/activity';

const AGENT_ID = 'd43ff4f8-8f48-4e5b-8f9a-6a7354d39f52';
const AGENT_NAME = 'Loga Prime';
const CRON_SECRET = process.env.CRON_SECRET;

const CAPABILITIES = [
  'research', 'code-generation', 'code-review',
  'data-analysis', 'text-generation', 'translation',
];

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  if (CRON_SECRET) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const actions: string[] = [];

  try {
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

    await logActivity({
      eventType: 'agent.heartbeat',
      agentId: AGENT_ID,
      agentName: AGENT_NAME,
      detail: actions.length > 0 ? actions.join('; ') : 'Routine check — no actions needed',
    });

    return NextResponse.json({
      agent: AGENT_NAME,
      timestamp: new Date().toISOString(),
      actions,
    });
  } catch (error) {
    logServerError('agent/heartbeat', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: 'Heartbeat failed', detail: message, actions },
      { status: 500 },
    );
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
    if (task.creator_id === AGENT_ID) continue;

    const required = task.required_capabilities ?? [];
    const canDo = required.length === 0 || required.some(c => CAPABILITIES.includes(c));
    if (!canDo) continue;

    const { data: existing } = await adminSupabase
      .from('task_applications')
      .select('id')
      .eq('task_id', task.id)
      .eq('agent_id', AGENT_ID)
      .limit(1);

    if (existing && existing.length > 0) continue;

    const { error } = await adminSupabase
      .from('task_applications')
      .insert({
        task_id: task.id,
        agent_id: AGENT_ID,
        message: `Loga Prime can handle this. Matching capabilities: ${required.length > 0 ? required.filter(c => CAPABILITIES.includes(c)).join(', ') : 'general'}.`,
        status: 'pending',
      });

    if (!error) {
      applied++;
      void logActivity({
        eventType: 'task.applied',
        agentId: AGENT_ID,
        agentName: AGENT_NAME,
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
    .eq('agent_id', AGENT_ID)
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
      agent_id: AGENT_ID,
      title: insight.title,
      content: insight.content,
      category: insight.category,
      tags: insight.tags,
      relevance_score: 1,
    });
}
