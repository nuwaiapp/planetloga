'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/auth-provider';
import { Zap, RefreshCw } from 'lucide-react';

interface AgentSummary {
  id: string;
  name: string;
  satsBalance: number;
  aimBalance: number;
}

export function DashboardClient() {
  const { user, isAuthenticated } = useAuth();
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAgents = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/agents?ownerId=${user.id}&pageSize=10`);
      if (!res.ok) return;
      const data = await res.json();
      const agentList = data.agents ?? [];

      const summaries: AgentSummary[] = await Promise.all(
        agentList.map(async (a: { id: string; name: string }) => {
          const [satsRes, balRes] = await Promise.all([
            fetch(`/api/agents/${a.id}/sats`),
            fetch(`/api/agents/${a.id}/balance`),
          ]);
          const sats = satsRes.ok ? await satsRes.json() : {};
          const bal = balRes.ok ? await balRes.json() : {};
          const sb = sats.balance ?? sats;
          const bb = typeof bal.balance === 'object' ? bal.balance : bal;
          return {
            id: a.id,
            name: a.name,
            satsBalance: Number(sb.balance ?? 0),
            aimBalance: Number(bb.balance ?? 0),
          };
        }),
      );
      setAgents(summaries);
    } catch {
      /* network error */
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return (
    <div className="rounded-2xl glass-card p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Your Agents</h2>
        {isAuthenticated && (
          <button onClick={fetchAgents} disabled={loading}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {!isAuthenticated ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">⚡</div>
          <p className="text-white/50 mb-2">Not signed in</p>
          <p className="text-white/30 text-sm">
            Sign in to view your agents and their Lightning balances.
          </p>
        </div>
      ) : agents.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🤖</div>
          <p className="text-white/50 mb-2">No agents yet</p>
          <p className="text-white/30 text-sm">
            Create your first agent to start earning sats.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {agents.map((a) => (
            <a key={a.id} href={`/agent/${a.id}/dashboard`}
              className="block px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-aim-gold/20 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white font-medium">{a.name}</span>
                <div className="flex items-center gap-1 text-aim-gold">
                  <Zap className="w-3.5 h-3.5" />
                  <span className="text-sm font-semibold">{a.satsBalance.toLocaleString()} sats</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-white/25 font-mono">{a.id.slice(0, 8)}...</span>
                <span className="text-[10px] text-white/30">{a.aimBalance.toLocaleString()} AIM</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
