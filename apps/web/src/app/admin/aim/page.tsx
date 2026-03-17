'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthFetch } from '@/lib/use-auth-fetch';
import { Coins, RefreshCw, ArrowUpRight, ArrowDownRight, Gift, Percent } from 'lucide-react';

interface Agent { id: string; name: string; }

interface AimBalance {
  agentId: string;
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
  updatedAt: string;
}

interface AimTransaction {
  id: string;
  agentId: string;
  amount: number;
  txType: string;
  referenceId?: string;
  onChainSig?: string;
  createdAt: string;
}

const TX_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  task_reward: { icon: Gift, color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Task Reward' },
  withdrawal: { icon: ArrowUpRight, color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'Withdrawal' },
  deposit: { icon: ArrowDownRight, color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Deposit' },
  fee: { icon: Percent, color: 'text-red-400', bg: 'bg-red-500/10', label: 'Fee' },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminAim() {
  const authFetch = useAuthFetch();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [balances, setBalances] = useState<Map<string, AimBalance>>(new Map());
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<AimTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/agents?pageSize=100');
      const data = await res.json();
      const agentList: Agent[] = (data.agents ?? []).map((a: Agent) => ({ id: a.id, name: a.name }));
      setAgents(agentList);

      const balMap = new Map<string, AimBalance>();
      await Promise.all(
        agentList.map(async (agent) => {
          try {
            const bRes = await authFetch(`/api/agents/${agent.id}/balance`);
            const bData = await bRes.json();
            if (bData.balance) balMap.set(agent.id, bData.balance);
          } catch { /* skip */ }
        }),
      );
      setBalances(balMap);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [authFetch]);

  useEffect(() => { loadData(); }, [loadData]);

  const loadTransactions = useCallback(async (agentId: string) => {
    setSelectedAgent(agentId);
    setTxLoading(true);
    try {
      const res = await authFetch(`/api/agents/${agentId}/balance?transactions=true`);
      const data = await res.json();
      setTransactions(data.transactions ?? []);
    } catch { setTransactions([]); }
    finally { setTxLoading(false); }
  }, [authFetch]);

  const agentsWithBalance = agents
    .map(a => ({ ...a, bal: balances.get(a.id) }))
    .sort((a, b) => (b.bal?.balance ?? 0) - (a.bal?.balance ?? 0));

  const totalBalance = Array.from(balances.values()).reduce((s, b) => s + b.balance, 0);
  const totalEarned = Array.from(balances.values()).reduce((s, b) => s + b.totalEarned, 0);
  const totalWithdrawn = Array.from(balances.values()).reduce((s, b) => s + b.totalWithdrawn, 0);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">AIM Economy</h1>
          <p className="text-sm text-white/35">{balances.size} Konten mit Guthaben</p>
        </div>
        <button onClick={loadData} className="p-2.5 rounded-lg admin-card text-white/40 hover:text-white transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="admin-card rounded-xl p-5">
          <div className="text-xs text-white/40 mb-1 font-medium">Offene Guthaben</div>
          <div className="text-2xl font-display font-bold text-aim-gold">{totalBalance.toLocaleString()}</div>
          <div className="text-[10px] text-white/25 mt-0.5">AIM</div>
        </div>
        <div className="admin-card rounded-xl p-5">
          <div className="text-xs text-white/40 mb-1 font-medium">Total Earned</div>
          <div className="text-2xl font-display font-bold text-emerald-400">{totalEarned.toLocaleString()}</div>
          <div className="text-[10px] text-white/25 mt-0.5">AIM</div>
        </div>
        <div className="admin-card rounded-xl p-5">
          <div className="text-xs text-white/40 mb-1 font-medium">Total Withdrawn</div>
          <div className="text-2xl font-display font-bold text-orange-400">{totalWithdrawn.toLocaleString()}</div>
          <div className="text-[10px] text-white/25 mt-0.5">AIM</div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-5 h-5 rounded-full border-2 border-aim-gold/30 border-t-aim-gold animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Agent-Konten</h2>
            {agentsWithBalance.map(agent => (
              <button
                key={agent.id}
                onClick={() => loadTransactions(agent.id)}
                className={`w-full admin-card rounded-lg p-4 flex items-center gap-3 text-left transition-all ${
                  selectedAgent === agent.id ? 'border-aim-gold/30 bg-aim-gold/5' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-aim-gold/10 flex items-center justify-center shrink-0">
                  <Coins className="w-3.5 h-3.5 text-aim-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-white truncate">{agent.name}</div>
                  <div className="text-[10px] text-white/25 mt-0.5">
                    Earned: {(agent.bal?.totalEarned ?? 0).toLocaleString()} · Withdrawn: {(agent.bal?.totalWithdrawn ?? 0).toLocaleString()}
                  </div>
                </div>
                <div className="text-sm font-display font-bold text-aim-gold shrink-0">
                  {(agent.bal?.balance ?? 0).toLocaleString()}
                </div>
              </button>
            ))}
            {agentsWithBalance.length === 0 && (
              <div className="text-xs text-white/25 text-center py-12">No agents registered</div>
            )}
          </div>

          <div className="space-y-2">
            <h2 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">
              Transaktionen
              {selectedAgent && (
                <span className="text-white/30 font-normal normal-case ml-2">
                  {agents.find(a => a.id === selectedAgent)?.name}
                </span>
              )}
            </h2>
            {!selectedAgent ? (
              <div className="admin-card rounded-lg p-8 text-center">
                <div className="text-xs text-white/25">Agent auswählen um Transaktionen zu sehen</div>
              </div>
            ) : txLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-4 h-4 rounded-full border-2 border-aim-gold/30 border-t-aim-gold animate-spin" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="admin-card rounded-lg p-8 text-center">
                <div className="text-xs text-white/25">Keine Transaktionen</div>
              </div>
            ) : (
              transactions.map(tx => {
                const config = TX_CONFIG[tx.txType] ?? { icon: Coins, color: 'text-white/50', bg: 'bg-white/5', label: tx.txType };
                const TxIcon = config.icon;
                return (
                  <div key={tx.id} className="admin-card rounded-lg p-3.5 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                      <TxIcon className={`w-3.5 h-3.5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold text-white/60">{config.label}</div>
                      {tx.onChainSig && (
                        <a href={`https://explorer.solana.com/tx/${tx.onChainSig}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-aim-gold hover:underline">
                          {tx.onChainSig.slice(0, 20)}...
                        </a>
                      )}
                    </div>
                    <div className={`text-xs font-display font-bold ${tx.amount >= 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                      {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-white/20 font-mono shrink-0">{formatDate(tx.createdAt)}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
