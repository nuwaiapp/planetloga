'use client';

import { useEffect, useState } from 'react';
import { useAuthFetch } from '@/lib/use-auth-fetch';
import { Bot, ListTodo, Activity, Coins } from 'lucide-react';

interface Stats {
  agents: { total: number; byStatus: Record<string, number> };
  tasks: { total: number; byStatus: Record<string, number> };
  activity: { total: number };
  aim: { totalBalance: number; totalEarned: number; totalWithdrawn: number; accounts: number };
}

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string | number; sub?: string }) {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-aim-gold" />
        <span className="text-xs font-medium text-white/50">{label}</span>
      </div>
      <div className="text-2xl font-display font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-white/40 mt-1">{sub}</div>}
    </div>
  );
}

function StatusBadges({ byStatus }: { byStatus: Record<string, number> }) {
  const colors: Record<string, string> = {
    active: 'bg-emerald-500/20 text-emerald-400',
    inactive: 'bg-white/10 text-white/50',
    suspended: 'bg-red-500/20 text-red-400',
    open: 'bg-blue-500/20 text-blue-400',
    assigned: 'bg-yellow-500/20 text-yellow-400',
    in_progress: 'bg-purple-500/20 text-purple-400',
    review: 'bg-orange-500/20 text-orange-400',
    completed: 'bg-emerald-500/20 text-emerald-400',
    cancelled: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {Object.entries(byStatus).map(([status, count]) => (
        <span key={status} className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${colors[status] ?? 'bg-white/10 text-white/50'}`}>
          {status}: {count}
        </span>
      ))}
    </div>
  );
}

export default function AdminOverview() {
  const authFetch = useAuthFetch();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    authFetch('/api/admin/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => setError('Fehler beim Laden der Statistiken'));
  }, [authFetch]);

  if (error) {
    return <div className="text-red-400 text-sm">{error}</div>;
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center min-h-[40dvh]">
        <div className="w-5 h-5 rounded-full border-2 border-aim-gold/30 border-t-aim-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-xl font-display font-bold text-white mb-1">Admin Dashboard</h1>
        <p className="text-xs text-white/40">Plattform-Übersicht in Echtzeit</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Bot} label="Agents" value={stats.agents.total} sub={`${stats.agents.byStatus.active ?? 0} aktiv`} />
        <StatCard icon={ListTodo} label="Tasks" value={stats.tasks.total} sub={`${stats.tasks.byStatus.open ?? 0} offen`} />
        <StatCard icon={Activity} label="Events" value={stats.activity.total} />
        <StatCard icon={Coins} label="AIM im Umlauf" value={`${stats.aim.totalBalance.toLocaleString()} AIM`} sub={`${stats.aim.accounts} Konten`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Agents nach Status</h2>
          <StatusBadges byStatus={stats.agents.byStatus} />
        </div>

        <div className="glass-card rounded-xl p-5">
          <h2 className="text-sm font-semibold text-white mb-3">Tasks nach Status</h2>
          <StatusBadges byStatus={stats.tasks.byStatus} />
        </div>
      </div>

      <div className="glass-card rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-3">AIM Economy</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-white/40">Total Earned</div>
            <div className="text-lg font-display font-bold text-emerald-400">{stats.aim.totalEarned.toLocaleString()} AIM</div>
          </div>
          <div>
            <div className="text-xs text-white/40">Total Withdrawn</div>
            <div className="text-lg font-display font-bold text-orange-400">{stats.aim.totalWithdrawn.toLocaleString()} AIM</div>
          </div>
          <div>
            <div className="text-xs text-white/40">Offene Guthaben</div>
            <div className="text-lg font-display font-bold text-aim-gold">{stats.aim.totalBalance.toLocaleString()} AIM</div>
          </div>
        </div>
      </div>
    </div>
  );
}
