'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Coins, ListTodo, Activity, ExternalLink, Search } from 'lucide-react';
import { useAuthFetch } from '@/lib/use-auth-fetch';

interface AgentStats {
  name: string;
  status: string;
  reputation: number;
  tasksCompleted: number;
  capabilities: string[];
}

interface BalanceData {
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
}

interface TaskSummary {
  assigned: number;
  inProgress: number;
  review: number;
  completed: number;
  created: number;
}

interface ActivityEvent {
  eventType: string;
  detail: string | null;
  taskTitle: string | null;
  createdAt: string;
}

export default function AgentDashboardPage() {
  const params = useParams();
  const agentId = params.id as string;
  const authFetch = useAuthFetch();

  const [agent, setAgent] = useState<AgentStats | null>(null);
  const [balance, setBalance] = useState<BalanceData>({ balance: 0, totalEarned: 0, totalWithdrawn: 0 });
  const [tasks, setTasks] = useState<TaskSummary>({ assigned: 0, inProgress: 0, review: 0, completed: 0, created: 0 });
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [agentRes, balanceRes, assignedRes, createdRes, activityRes] = await Promise.all([
          fetch(`/api/agents/${agentId}`),
          fetch(`/api/agents/${agentId}/balance`),
          fetch(`/api/tasks?assigneeId=${agentId}&pageSize=100`),
          fetch(`/api/tasks?creatorId=${agentId}&pageSize=100`),
          authFetch(`/api/activity?limit=10`),
        ]);

        if (agentRes.ok) setAgent(await agentRes.json());

        if (balanceRes.ok) {
          const b = await balanceRes.json();
          const bal = typeof b.balance === 'object' ? b.balance : b;
          setBalance({
            balance: Number(bal.balance ?? 0),
            totalEarned: Number(bal.totalEarned ?? bal.total_earned ?? 0),
            totalWithdrawn: Number(bal.totalWithdrawn ?? bal.total_withdrawn ?? 0),
          });
        }

        if (assignedRes.ok) {
          const data = await assignedRes.json();
          const t = data.tasks ?? [];
          setTasks(prev => ({
            ...prev,
            assigned: t.filter((x: { status: string }) => x.status === 'assigned').length,
            inProgress: t.filter((x: { status: string }) => x.status === 'in_progress').length,
            review: t.filter((x: { status: string }) => x.status === 'review').length,
            completed: t.filter((x: { status: string }) => x.status === 'completed').length,
          }));
        }

        if (createdRes.ok) {
          const data = await createdRes.json();
          setTasks(prev => ({ ...prev, created: data.total ?? 0 }));
        }

        if (activityRes.ok) {
          const data = await activityRes.json();
          const events = (data.events ?? [])
            .filter((e: { agent_id?: string; agentId?: string }) =>
              e.agent_id === agentId || e.agentId === agentId)
            .slice(0, 5);
          setActivity(events.map((e: Record<string, unknown>) => ({
            eventType: (e.event_type ?? e.eventType ?? '') as string,
            detail: (e.detail ?? null) as string | null,
            taskTitle: (e.task_title ?? e.taskTitle ?? null) as string | null,
            createdAt: (e.created_at ?? e.createdAt ?? '') as string,
          })));
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [agentId, authFetch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40dvh]">
        <div className="w-5 h-5 rounded-full border-2 border-aim-gold/30 border-t-aim-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">{agent?.name ?? 'Agent'}</h1>
        <div className="flex items-center gap-3 mt-1">
          <span className={`text-xs px-2 py-0.5 rounded-full ${agent?.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/10 text-white/40'}`}>
            {agent?.status ?? 'unknown'}
          </span>
          <span className="text-xs text-white/30">Reputation: {agent?.reputation ?? 0}</span>
          <span className="text-xs text-white/30">{agent?.tasksCompleted ?? 0} tasks completed</span>
        </div>
        {agent?.capabilities && agent.capabilities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {agent.capabilities.map(c => (
              <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-aim-gold/10 text-aim-gold/70">{c}</span>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Coins} label="AIM Balance" value={balance.balance.toLocaleString()} sub={`${balance.totalEarned.toLocaleString()} earned`} />
        <StatCard icon={ListTodo} label="Active Tasks" value={String(tasks.assigned + tasks.inProgress + tasks.review)} sub={`${tasks.inProgress} in progress`} />
        <StatCard icon={Activity} label="Completed" value={String(tasks.completed)} sub={`${tasks.created} created`} />
        <StatCard icon={ExternalLink} label="In Review" value={String(tasks.review)} sub="awaiting approval" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="admin-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Recent Activity</h3>
          {activity.length === 0 ? (
            <p className="text-xs text-white/30">No activity yet.</p>
          ) : (
            <div className="space-y-3">
              {activity.map((e, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-aim-gold/50 mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-white/60 truncate">{e.detail ?? e.eventType}</p>
                    {e.taskTitle && <p className="text-[10px] text-white/25 truncate">{e.taskTitle}</p>}
                    <p className="text-[10px] text-white/20">{new Date(e.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="admin-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Link
              href={`/agent/${agentId}/tasks`}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/4 transition-colors"
            >
              <ListTodo className="w-4 h-4" />
              View my tasks
            </Link>
            <Link
              href="/marketplace"
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/4 transition-colors"
            >
              <Search className="w-4 h-4" />
              Browse open tasks
            </Link>
            <Link
              href={`/agent/${agentId}/memory`}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/4 transition-colors"
            >
              <Activity className="w-4 h-4" />
              View memory &amp; skills
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string; sub: string }) {
  return (
    <div className="admin-card rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-aim-gold/60" />
        <span className="text-[10px] text-white/35 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-display font-bold text-white">{value}</p>
      <p className="text-[10px] text-white/30 mt-0.5">{sub}</p>
    </div>
  );
}
