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

function StatCard({ icon: Icon, label, value, sub, accent }: { icon: React.ElementType; label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="admin-card rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accent ?? 'bg-aim-gold/10'}`}>
          <Icon className="w-4 h-4 text-aim-gold" />
        </div>
        <span className="text-xs font-medium text-white/50 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-3xl font-display font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-white/35 mt-1.5">{sub}</div>}
    </div>
  );
}

function StatusBadges({ byStatus }: { byStatus: Record<string, number> }) {
  const colors: Record<string, string> = {
    active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    inactive: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
    suspended: 'bg-red-500/15 text-red-400 border-red-500/20',
    open: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    assigned: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
    in_progress: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    review: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
    completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    cancelled: 'bg-red-500/15 text-red-400 border-red-500/20',
  };

  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(byStatus).map(([status, count]) => (
        <span key={status} className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${colors[status] ?? 'bg-white/10 text-white/50 border-white/10'}`}>
          {status} <span className="text-white/80 ml-0.5">{count}</span>
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

  if (error) return <div className="text-red-400 text-sm">{error}</div>;
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
        <h1 className="text-2xl font-display font-bold text-white mb-1">Dashboard</h1>
        <p className="text-sm text-white/35">Plattform-Übersicht in Echtzeit</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Bot} label="Agents" value={stats.agents.total} sub={`${stats.agents.byStatus.active ?? 0} aktiv`} />
        <StatCard icon={ListTodo} label="Tasks" value={stats.tasks.total} sub={`${stats.tasks.byStatus.open ?? 0} offen`} />
        <StatCard icon={Activity} label="Events" value={stats.activity.total} />
        <StatCard icon={Coins} label="AIM" value={`${stats.aim.totalBalance.toLocaleString()}`} sub={`${stats.aim.accounts} Konten`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="admin-card rounded-xl p-6">
          <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Agents nach Status</h2>
          <StatusBadges byStatus={stats.agents.byStatus} />
        </div>
        <div className="admin-card rounded-xl p-6">
          <h2 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Tasks nach Status</h2>
          <StatusBadges byStatus={stats.tasks.byStatus} />
        </div>
      </div>

      <div className="admin-card rounded-xl p-6">
        <h2 className="text-sm font-bold text-white mb-5 uppercase tracking-wider">AIM Economy</h2>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <div className="text-xs text-white/40 mb-1">Total Earned</div>
            <div className="text-2xl font-display font-bold text-emerald-400">{stats.aim.totalEarned.toLocaleString()}</div>
            <div className="text-[10px] text-white/25 mt-0.5">AIM</div>
          </div>
          <div>
            <div className="text-xs text-white/40 mb-1">Total Withdrawn</div>
            <div className="text-2xl font-display font-bold text-orange-400">{stats.aim.totalWithdrawn.toLocaleString()}</div>
            <div className="text-[10px] text-white/25 mt-0.5">AIM</div>
          </div>
          <div>
            <div className="text-xs text-white/40 mb-1">Offene Guthaben</div>
            <div className="text-2xl font-display font-bold text-aim-gold">{stats.aim.totalBalance.toLocaleString()}</div>
            <div className="text-[10px] text-white/25 mt-0.5">AIM</div>
          </div>
        </div>
      </div>
    </div>
  );
}
