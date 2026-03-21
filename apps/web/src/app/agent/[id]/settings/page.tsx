'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Key, Zap, User, Copy, Trash2, Plus, Check, AlertTriangle, Shield, Gauge } from 'lucide-react';
import { useAuthFetch } from '@/lib/use-auth-fetch';

interface ApiKeyInfo {
  id: string;
  key_prefix: string;
  label: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

interface AgentProfile {
  id: string;
  name: string;
  bio?: string;
  walletAddress?: string;
  spendingAddress?: string;
  payoutAddress?: string;
  workingBalanceLimit: number;
  maxTxAmount: number;
  dailySpendingLimit: number;
  capabilities: string[];
}

export default function AgentSettingsPage() {
  const params = useParams();
  const agentId = params.id as string;
  const authFetch = useAuthFetch();

  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [keys, setKeys] = useState<ApiKeyInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/agents/${agentId}`).then(r => r.ok ? r.json() : null),
      authFetch(`/api/agents/${agentId}/api-keys`).then(r => r.ok ? r.json() : { keys: [] }),
    ]).then(([a, k]) => {
      if (a) setAgent(a);
      setKeys(k.keys ?? []);
    }).finally(() => setLoading(false));
  }, [agentId, authFetch]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 rounded-full border-2 border-aim-gold/30 border-t-aim-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-display font-bold text-white">Settings</h1>

      <ProfileSection agent={agent} agentId={agentId} authFetch={authFetch} onUpdate={setAgent} />
      <VaultSection agent={agent} agentId={agentId} authFetch={authFetch} onUpdate={setAgent} />
      <ApiKeysSection keys={keys} agentId={agentId} authFetch={authFetch} onUpdate={setKeys} />
    </div>
  );
}

function ProfileSection({ agent, agentId, authFetch, onUpdate }: {
  agent: AgentProfile | null;
  agentId: string;
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  onUpdate: (a: AgentProfile) => void;
}) {
  const [name, setName] = useState(agent?.name ?? '');
  const [bio, setBio] = useState(agent?.bio ?? '');
  const [spendingAddr, setSpendingAddr] = useState(agent?.spendingAddress ?? '');
  const [caps, setCaps] = useState(agent?.capabilities?.join(', ') ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await authFetch(`/api/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          bio: bio.trim() || undefined,
          spendingAddress: spendingAddr.trim() || undefined,
          capabilities: caps.split(',').map(c => c.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? 'Update failed');
      }
      const updated = await res.json();
      onUpdate(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="admin-card rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <User className="w-4 h-4 text-aim-gold/60" />
        <h2 className="text-sm font-semibold text-white">Agent Profile</h2>
      </div>

      <div>
        <label className="text-xs text-white/40 block mb-1">Name</label>
        <input value={name} onChange={e => setName(e.target.value)} required
          className="w-full admin-input rounded-lg px-3 py-2 text-sm" />
      </div>

      <div>
        <label className="text-xs text-white/40 block mb-1">Bio</label>
        <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
          className="w-full admin-input rounded-lg px-3 py-2 text-sm resize-none" />
      </div>

      <div>
        <label className="text-xs text-white/40 block mb-1">Capabilities (comma-separated)</label>
        <input value={caps} onChange={e => setCaps(e.target.value)}
          className="w-full admin-input rounded-lg px-3 py-2 text-sm" placeholder="coding, research, analysis" />
      </div>

      <div>
        <label className="text-xs text-white/40 block mb-1 flex items-center gap-1">
          <Zap className="w-3 h-3" /> Spending Address (Lightning)
        </label>
        <input value={spendingAddr} onChange={e => setSpendingAddr(e.target.value)}
          className="w-full admin-input rounded-lg px-3 py-2 text-sm font-mono text-[11px]" placeholder="Lightning address for sending payments" />
      </div>

      {agent?.payoutAddress && (
        <div>
          <label className="text-xs text-white/40 block mb-1 flex items-center gap-1">
            <Shield className="w-3 h-3" /> Payout Address (Cold Vault)
          </label>
          <div className="w-full admin-input rounded-lg px-3 py-2 text-sm font-mono text-[11px] text-white/40 bg-white/[0.01]">
            {agent.payoutAddress}
          </div>
          <p className="text-[10px] text-white/25 mt-1">Payout address is set at creation and cannot be changed here for security.</p>
        </div>
      )}

      {error && <p className="text-red-400 text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{error}</p>}

      <button type="submit" disabled={saving}
        className="flex items-center gap-1.5 px-4 py-2 bg-aim-gold text-deep-space text-xs font-semibold rounded-lg hover:bg-aim-gold-light transition-colors disabled:opacity-50">
        {saving ? 'Saving...' : saved ? <><Check className="w-3.5 h-3.5" /> Saved</> : 'Save Changes'}
      </button>
    </form>
  );
}

function VaultSection({ agent, agentId, authFetch, onUpdate }: {
  agent: AgentProfile | null;
  agentId: string;
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  onUpdate: (a: AgentProfile) => void;
}) {
  const [workingLimit, setWorkingLimit] = useState(String(agent?.workingBalanceLimit ?? 50000));
  const [maxTx, setMaxTx] = useState(String(agent?.maxTxAmount ?? 10000));
  const [dailyLimit, setDailyLimit] = useState(String(agent?.dailySpendingLimit ?? 100000));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await authFetch(`/api/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workingBalanceLimit: Number(workingLimit),
          maxTxAmount: Number(maxTx),
          dailySpendingLimit: Number(dailyLimit),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? 'Update failed');
      }
      const updated = await res.json();
      onUpdate(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="admin-card rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Gauge className="w-4 h-4 text-aim-gold/60" />
        <h2 className="text-sm font-semibold text-white">Vault Security</h2>
      </div>
      <p className="text-xs text-white/30">Configure spending limits and auto-sweep thresholds for your agent&apos;s Lightning wallet.</p>

      <div className="grid sm:grid-cols-3 gap-4">
        <div>
          <label className="text-xs text-white/40 block mb-1">Working Balance Limit (sats)</label>
          <input type="number" value={workingLimit} onChange={e => setWorkingLimit(e.target.value)} min={0}
            className="w-full admin-input rounded-lg px-3 py-2 text-sm" />
          <p className="text-[10px] text-white/20 mt-0.5">Auto-sweep surplus above this amount</p>
        </div>
        <div>
          <label className="text-xs text-white/40 block mb-1">Max Transaction (sats)</label>
          <input type="number" value={maxTx} onChange={e => setMaxTx(e.target.value)} min={0}
            className="w-full admin-input rounded-lg px-3 py-2 text-sm" />
          <p className="text-[10px] text-white/20 mt-0.5">Max single payment allowed</p>
        </div>
        <div>
          <label className="text-xs text-white/40 block mb-1">Daily Spending Limit (sats)</label>
          <input type="number" value={dailyLimit} onChange={e => setDailyLimit(e.target.value)} min={0}
            className="w-full admin-input rounded-lg px-3 py-2 text-sm" />
          <p className="text-[10px] text-white/20 mt-0.5">Total spending cap per 24h</p>
        </div>
      </div>

      {error && <p className="text-red-400 text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{error}</p>}

      <button type="submit" disabled={saving}
        className="flex items-center gap-1.5 px-4 py-2 bg-aim-gold text-deep-space text-xs font-semibold rounded-lg hover:bg-aim-gold-light transition-colors disabled:opacity-50">
        {saving ? 'Saving...' : saved ? <><Check className="w-3.5 h-3.5" /> Saved</> : 'Save Vault Config'}
      </button>
    </form>
  );
}

function ApiKeysSection({ keys, agentId, authFetch, onUpdate }: {
  keys: ApiKeyInfo[];
  agentId: string;
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  onUpdate: (keys: ApiKeyInfo[]) => void;
}) {
  const [newKey, setNewKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [label, setLabel] = useState('');

  const activeKeys = keys.filter(k => !k.revoked_at);

  async function createKey() {
    setCreating(true);
    try {
      const res = await authFetch(`/api/agents/${agentId}/api-keys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim() || 'default' }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewKey(data.key);
        setLabel('');
        const listRes = await authFetch(`/api/agents/${agentId}/api-keys`);
        if (listRes.ok) {
          const listData = await listRes.json();
          onUpdate(listData.keys ?? []);
        }
      }
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(keyId: string) {
    const res = await authFetch(`/api/agents/${agentId}/api-keys?keyId=${keyId}`, { method: 'DELETE' });
    if (res.ok) {
      onUpdate(keys.map(k => k.id === keyId ? { ...k, revoked_at: new Date().toISOString() } : k));
    }
  }

  function copyKey() {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="admin-card rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Key className="w-4 h-4 text-aim-gold/60" />
        <h2 className="text-sm font-semibold text-white">API Keys</h2>
      </div>

      {newKey && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 space-y-3">
          <p className="text-xs text-emerald-400 font-semibold">New API key created — copy it now, it won&apos;t be shown again:</p>
          <code className="block text-[11px] font-mono text-white bg-black/30 rounded px-3 py-2 break-all select-all cursor-text">{newKey}</code>
          <div className="flex items-center gap-3">
            <button onClick={copyKey}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/30 transition-colors border border-emerald-500/20">
              {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Key</>}
            </button>
            <button onClick={() => setNewKey(null)} className="text-[10px] text-white/30 hover:text-white/50">Dismiss</button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Key label (optional)"
          className="flex-1 admin-input rounded-lg px-3 py-2 text-sm" />
        <button onClick={createKey} disabled={creating}
          className="flex items-center gap-1 px-3 py-2 bg-aim-gold text-deep-space text-xs font-semibold rounded-lg hover:bg-aim-gold-light transition-colors disabled:opacity-50 shrink-0">
          <Plus className="w-3 h-3" />
          {creating ? '...' : 'Generate Key'}
        </button>
      </div>

      {activeKeys.length === 0 && !newKey ? (
        <p className="text-xs text-white/30">No active API keys.</p>
      ) : (
        <div className="space-y-2">
          {activeKeys.map(k => (
            <div key={k.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <div>
                <p className="text-xs text-white/60">
                  <span className="font-mono text-white/40">{k.key_prefix}...</span>
                  {k.label !== 'default' && <span className="ml-2 text-white/30">({k.label})</span>}
                </p>
                <p className="text-[10px] text-white/20">
                  Created {new Date(k.created_at).toLocaleDateString()}
                  {k.last_used_at && <> · Last used {new Date(k.last_used_at).toLocaleDateString()}</>}
                </p>
              </div>
              <button onClick={() => revokeKey(k.id)} className="p-1.5 rounded hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors" title="Revoke">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
