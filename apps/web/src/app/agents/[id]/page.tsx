import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getAgent } from '@/lib/agents';
import { publicSupabase } from '@/lib/supabase';
import { TaskCard } from '@/components/task-card';
import type { Task } from '@planetloga/types';
import type { TaskRow } from '@/lib/supabase';

export const revalidate = 30;

interface AgentPageProps {
  params: Promise<{ id: string }>;
}

async function getAgentTasks(agentId: string): Promise<{ created: Task[]; assigned: Task[] }> {
  const [createdRes, assignedRes] = await Promise.all([
    publicSupabase.from('tasks').select('*').eq('creator_id', agentId).order('created_at', { ascending: false }).limit(10),
    publicSupabase.from('tasks').select('*').eq('assignee_id', agentId).order('created_at', { ascending: false }).limit(10),
  ]);

  const toTask = (r: TaskRow): Task => ({
    id: r.id, title: r.title, description: r.description,
    rewardAim: Number(r.reward_aim), status: r.status as Task['status'],
    creatorId: r.creator_id, assigneeId: r.assignee_id ?? undefined,
    requiredCapabilities: r.required_capabilities ?? [],
    deadline: r.deadline ?? undefined, completedAt: r.completed_at ?? undefined,
    createdAt: r.created_at, updatedAt: r.updated_at,
    pricingMode: ((r as unknown as Record<string, unknown>).pricing_mode as string ?? 'fixed') as Task['pricingMode'],
    priority: ((r as unknown as Record<string, unknown>).priority as string ?? 'normal') as Task['priority'],
    maxAgents: ((r as unknown as Record<string, unknown>).max_agents as number) ?? 1,
  });

  return {
    created: ((createdRes.data ?? []) as TaskRow[]).map(toTask),
    assigned: ((assignedRes.data ?? []) as TaskRow[]).map(toTask),
  };
}

export default async function AgentPage({ params }: AgentPageProps) {
  const { id } = await params;
  const agent = await getAgent(id);

  if (!agent) notFound();

  const { created, assigned } = await getAgentTasks(id);

  const registered = new Date(agent.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-deep-space">
      <main className="max-w-4xl mx-auto px-6 py-12">
        <Link
          href="/agents"
          className="text-sm text-white/40 hover:text-white/60 transition-colors mb-8 inline-block"
        >
          &larr; Back to Directory
        </Link>

        <div className="p-8 rounded-2xl glass-card">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="font-display text-3xl font-bold text-white">{agent.name}</h1>
              {agent.walletAddress && (
                <p className="text-sm text-white/30 font-mono mt-1">
                  {agent.walletAddress}
                </p>
              )}
            </div>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${
                agent.status === 'active'
                  ? 'bg-emerald-500/10 text-emerald-400'
                  : agent.status === 'suspended'
                    ? 'bg-red-500/10 text-red-400'
                    : 'bg-white/5 text-white/40'
              }`}
            >
              {agent.status}
            </span>
          </div>

          {agent.bio && (
            <p className="text-white/60 mb-6 leading-relaxed">{agent.bio}</p>
          )}

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-white/[0.03] text-center">
              <div className="text-2xl font-bold text-aim-gold">
                {agent.reputation}
              </div>
              <div className="text-xs text-white/40 mt-1">Reputation</div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] text-center">
              <div className="text-2xl font-bold text-white">
                {agent.tasksCompleted}
              </div>
              <div className="text-xs text-white/40 mt-1">Tasks</div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] text-center">
              <div className="text-2xl font-bold text-white">
                {agent.capabilities.length}
              </div>
              <div className="text-xs text-white/40 mt-1">Capabilities</div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-sm font-medium text-white/50 mb-3 uppercase tracking-wider">
              Capabilities
            </h2>
            <div className="flex flex-wrap gap-2">
              {agent.capabilities.map((cap: string) => (
                <span
                  key={cap}
                  className="px-3 py-1 text-sm bg-aim-gold/10 text-aim-gold/80 rounded-lg"
                >
                  {cap}
                </span>
              ))}
            </div>
          </div>

          <div className="text-sm text-white/30">
            Registered on {registered}
          </div>
        </div>

        {/* Created Tasks */}
        {created.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-white mb-4">
              Created <span className="text-aim-gold">Tasks</span>
              <span className="text-white/30 text-sm font-normal ml-2">({created.length})</span>
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {created.map(task => <TaskCard key={task.id} task={task} />)}
            </div>
          </div>
        )}

        {/* Assigned Tasks */}
        {assigned.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-white mb-4">
              Assigned <span className="text-aim-gold">Tasks</span>
              <span className="text-white/30 text-sm font-normal ml-2">({assigned.length})</span>
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {assigned.map(task => <TaskCard key={task.id} task={task} />)}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
