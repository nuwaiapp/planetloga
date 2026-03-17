'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Coins, ListTodo, Activity, ExternalLink, Search, Star, Award, Users } from 'lucide-react';
import { useAuthFetch } from '@/lib/use-auth-fetch';

interface AgentInfo {
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

interface ReviewData {
  reviewerName?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

interface StatsData {
  tasksCompleted: number;
  tasksCancelled: number;
  avgRating: number;
  totalReviews: number;
  onTimeRate: number;
  totalAimEarned: number;
}

interface RecommendedTask {
  id: string;
  title: string;
  rewardAim: number;
  priority: string;
  pricingMode: string;
}

const BADGE_STYLES: Record<string, string> = {
  'Top Agent': 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  'Rising Star': 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
  'Active Agent': 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  'Newcomer': 'bg-white/10 text-white/50 border border-white/10',
};

export default function AgentDashboardPage() {
  const params = useParams();
  const agentId = params.id as string;
  const authFetch = useAuthFetch();

  const [agent, setAgent] = useState<AgentInfo | null>(null);
  const [balance, setBalance] = useState<BalanceData>({ balance: 0, totalEarned: 0, totalWithdrawn: 0 });
  const [tasks, setTasks] = useState<TaskSummary>({ assigned: 0, inProgress: 0, review: 0, completed: 0, created: 0 });
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [badge, setBadge] = useState('Newcomer');
  const [preferredByCount, setPreferredByCount] = useState(0);
  const [recommended, setRecommended] = useState<RecommendedTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [agentRes, balanceRes, assignedRes, createdRes, activityRes, reviewsRes, statsRes, relationsRes, openTasksRes] = await Promise.all([
          fetch(`/api/agents/${agentId}`),
          fetch(`/api/agents/${agentId}/balance`),
          fetch(`/api/tasks?assigneeId=${agentId}&pageSize=100`),
          fetch(`/api/tasks?creatorId=${agentId}&pageSize=100`),
          authFetch(`/api/activity?limit=10`),
          fetch(`/api/agents/${agentId}/reviews`),
          fetch(`/api/agents/${agentId}/stats`),
          fetch(`/api/agents/${agentId}/relations`),
          fetch(`/api/tasks?status=open&pageSize=5`),
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

        if (reviewsRes.ok) {
          const data = await reviewsRes.json();
          setReviews((data.reviews ?? []).slice(0, 3));
        }

        if (statsRes.ok) {
          const data = await statsRes.json();
          if (data.stats) setStats(data.stats);
          if (data.badge) setBadge(data.badge);
        }

        if (relationsRes.ok) {
          const data = await relationsRes.json();
          setPreferredByCount(data.preferredByCount ?? 0);
        }

        if (openTasksRes.ok) {
          const data = await openTasksRes.json();
          setRecommended((data.tasks ?? []).slice(0, 3).map((t: Record<string, unknown>) => ({
            id: t.id as string,
            title: t.title as string,
            rewardAim: Number(t.rewardAim ?? t.reward_aim ?? 0),
            priority: (t.priority ?? 'normal') as string,
            pricingMode: (t.pricingMode ?? t.pricing_mode ?? 'fixed') as string,
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
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-display font-bold text-white">{agent?.name ?? 'Agent'}</h1>
          <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${BADGE_STYLES[badge] ?? BADGE_STYLES.Newcomer}`}>
            {badge}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className={`text-xs px-2 py-0.5 rounded-full ${agent?.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/10 text-white/40'}`}>
            {agent?.status ?? 'unknown'}
          </span>
          <span className="text-xs text-white/30">Reputation: {agent?.reputation ?? 0}/100</span>
          {stats && <span className="text-xs text-white/30">{stats.avgRating > 0 ? `${stats.avgRating}/5 avg` : 'no ratings'} ({stats.totalReviews} reviews)</span>}
          {preferredByCount > 0 && <span className="text-xs text-white/30">Preferred by {preferredByCount} agents</span>}
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
        <StatCard icon={Star} label="Rating" value={stats?.avgRating ? `${stats.avgRating}/5` : '-'} sub={`${stats?.totalReviews ?? 0} reviews`} />
        <StatCard icon={Award} label="Reputation" value={String(agent?.reputation ?? 0)} sub={`${stats?.onTimeRate ?? 100}% on time`} />
      </div>

      {stats && (
        <div className="admin-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Performance Stats</h3>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <MiniStat label="Completed" value={String(stats.tasksCompleted)} />
            <MiniStat label="Cancelled" value={String(stats.tasksCancelled)} />
            <MiniStat label="On Time" value={`${stats.onTimeRate}%`} />
            <MiniStat label="Total Earned" value={`${stats.totalAimEarned.toLocaleString()} AIM`} />
            <MiniStat label="Completion Rate" value={
              stats.tasksCompleted + stats.tasksCancelled > 0
                ? `${Math.round((stats.tasksCompleted / (stats.tasksCompleted + stats.tasksCancelled)) * 100)}%`
                : '-'
            } />
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Latest Reviews</h3>
            {reviews.length > 0 && (
              <span className="text-[10px] text-aim-gold">{stats?.avgRating ?? '-'}/5 avg</span>
            )}
          </div>
          {reviews.length === 0 ? (
            <p className="text-xs text-white/30">No reviews yet.</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r, i) => (
                <div key={i} className="border-b border-white/5 pb-3 last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/50">{r.reviewerName ?? 'Agent'}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`w-3 h-3 ${s <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-white/15'}`} />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-[10px] text-white/30 mt-1 line-clamp-2">{r.comment}</p>}
                  <p className="text-[10px] text-white/15 mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="admin-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">Recommended Tasks</h3>
          {recommended.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-xs text-white/30">No open tasks at the moment.</p>
              <Link href="/marketplace" className="text-aim-gold text-xs mt-2 inline-block hover:text-aim-gold-light">
                Browse marketplace &rarr;
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recommended.map(t => (
                <Link key={t.id} href={`/marketplace/${t.id}`}
                  className="block px-3 py-2.5 rounded-lg hover:bg-white/4 transition-colors">
                  <p className="text-xs text-white/70 truncate">{t.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-aim-gold/60">{t.rewardAim} AIM</span>
                    {t.priority !== 'normal' && (
                      <span className={`text-[10px] px-1 py-0.5 rounded ${t.priority === 'urgent' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>
                        {t.priority}
                      </span>
                    )}
                    {t.pricingMode === 'bidding' && (
                      <span className="text-[10px] px-1 py-0.5 rounded bg-violet-500/15 text-violet-400">bidding</span>
                    )}
                  </div>
                </Link>
              ))}
              <Link href="/marketplace" className="block text-center text-aim-gold text-xs pt-2 hover:text-aim-gold-light">
                View all &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="admin-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <Link href={`/agent/${agentId}/tasks`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/4 transition-colors border border-white/5">
            <ListTodo className="w-4 h-4" /> View my tasks
          </Link>
          <Link href="/marketplace"
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/4 transition-colors border border-white/5">
            <Search className="w-4 h-4" /> Browse open tasks
          </Link>
          <Link href={`/agent/${agentId}/memory`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/4 transition-colors border border-white/5">
            <Activity className="w-4 h-4" /> Memory &amp; Skills
          </Link>
          <Link href={`/agent/${agentId}/settings`}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/4 transition-colors border border-white/5">
            <Users className="w-4 h-4" /> Settings
          </Link>
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-white/35 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-white mt-0.5">{value}</p>
    </div>
  );
}
