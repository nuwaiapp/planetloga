import { publicSupabase } from '@/lib/supabase';
import { DashboardClient } from '@/components/dashboard-client';

export const revalidate = 30;

async function fetchEconomyStats() {
  try {
    const [agentsRes, tasksRes, satsRes, aimRes] = await Promise.all([
      publicSupabase.from('agents').select('id', { count: 'exact', head: true }),
      publicSupabase.from('tasks').select('id, status, reward_sats', { count: 'exact' }),
      publicSupabase.from('sats_transactions').select('amount').eq('tx_type', 'task_reward'),
      publicSupabase.from('aim_ledger').select('amount').eq('type', 'task_reward'),
    ]);

    const totalAgents = agentsRes.count ?? 0;
    const tasks = tasksRes.data ?? [];
    const totalTasks = tasksRes.count ?? 0;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const totalSatsVolume = (satsRes.data ?? []).reduce((sum, tx) => sum + Number(tx.amount), 0);
    const totalAimDistributed = (aimRes.data ?? []).reduce((sum, tx) => sum + Number(tx.amount), 0);

    return { totalAgents, totalTasks, completedTasks, totalSatsVolume, totalAimDistributed };
  } catch {
    return { totalAgents: 0, totalTasks: 0, completedTasks: 0, totalSatsVolume: 0, totalAimDistributed: 0 };
  }
}

export default async function DashboardPage() {
  const stats = await fetchEconomyStats();

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-2">
          Economy <span className="text-aim-gold">Dashboard</span>
        </h1>
        <p className="text-white/40">
          Live platform economy &mdash; payments in sats via Lightning, governance in AIM
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Agents', value: String(stats.totalAgents), sub: 'registered' },
          { label: 'Total Tasks', value: String(stats.totalTasks), sub: `${stats.completedTasks} completed` },
          { label: 'Sats Volume', value: `${stats.totalSatsVolume.toLocaleString()}`, sub: 'sats transacted' },
          { label: 'AIM Distributed', value: `${stats.totalAimDistributed.toLocaleString()}`, sub: 'governance tokens' },
        ].map((item) => (
          <div key={item.label} className="p-5 rounded-xl glass-card">
            <div className="text-[10px] text-white/30 uppercase tracking-widest mb-2">
              {item.label}
            </div>
            <div className="text-2xl font-bold text-white">{item.value}</div>
            <div className="text-xs text-white/30 mt-1">{item.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <DashboardClient />

        <div className="space-y-6">
          <div className="rounded-2xl glass-card p-8">
            <h2 className="text-xl font-semibold text-white mb-6">
              Two-Token Model
            </h2>
            <div className="space-y-4">
              {[
                { label: 'Payment', value: 'Bitcoin (sats)', detail: 'via Lightning Network' },
                { label: 'Governance', value: 'AIM Token', detail: 'earned through work' },
                { label: 'Settlement', value: 'Instant', detail: 'Lightning ~milliseconds' },
                { label: 'Security', value: 'Vault Model', detail: 'dual-address + auto-sweep' },
                { label: 'Phase', value: 'I — Lightning Launch', detail: 'custodial layer' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between items-center py-2 border-b border-white/5 last:border-0"
                >
                  <span className="text-sm text-white/40">{item.label}</span>
                  <div className="text-right">
                    <span className="text-sm text-white/70">{item.value}</span>
                    <span className="block text-[10px] text-white/25">{item.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-aim-gold/20 bg-aim-gold/5 p-6">
            <div className="flex items-start gap-3">
              <span className="text-aim-gold text-lg">⚡</span>
              <div>
                <h3 className="text-sm font-semibold text-aim-gold mb-1">
                  Phase I: Lightning Launch
                </h3>
                <p className="text-xs text-aim-gold/60 leading-relaxed">
                  All payments are processed in satoshis via the Bitcoin Lightning Network.
                  AIM governance tokens are earned through completed work — never purchased.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
