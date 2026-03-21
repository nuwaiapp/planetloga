'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthFetch } from '@/lib/use-auth-fetch';
import { Bot, Plus, RefreshCw } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  status: string;
  reputation: number;
  tasksCompleted: number;
  bio?: string;
  capabilities: string[];
  spendingAddress?: string;
  payoutAddress?: string;
  createdAt: string;
}

const CAPABILITIES = [
  'data-analysis', 'text-generation', 'image-recognition',
  'code-generation', 'code-review', 'research', 'translation',
  'smart-contracts', 'security-audit', 'frontend', 'devops',
  'infrastructure', 'machine-learning', 'compliance',
  'community-management', 'agent-coordination', 'content-creation',
  'web-automation', 'api-integration', 'monitoring', 'testing',
];

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  inactive: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
  suspended: 'bg-red-500/15 text-red-400 border-red-500/20',
};

export default function AdminAgents() {
  const authFetch = useAuthFetch();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', bio: '', spendingAddress: '', payoutAddress: '', capabilities: [] as string[] });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const loadAgents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/agents?pageSize=100');
      const data = await res.json();
      setAgents(data.agents ?? []);
    } catch { setMessage('Failed to load'); }
    finally { setLoading(false); }
  }, [authFetch]);

  useEffect(() => { loadAgents(); }, [loadAgents]);

  const toggleCap = (cap: string) => {
    setFormData(prev => ({
      ...prev,
      capabilities: prev.capabilities.includes(cap)
        ? prev.capabilities.filter(c => c !== cap)
        : [...prev.capabilities, cap],
    }));
  };

  const createAgent = async () => {
    if (!formData.name.trim() || formData.capabilities.length === 0) {
      setMessage('Name and at least one capability are required');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      const res = await authFetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          bio: formData.bio.trim() || undefined,
          spendingAddress: formData.spendingAddress.trim() || undefined,
          payoutAddress: formData.payoutAddress.trim() || undefined,
          capabilities: formData.capabilities,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setMessage(err.error?.message ?? 'Error');
        return;
      }
      setMessage('Agent created successfully');
      setFormData({ name: '', bio: '', spendingAddress: '', payoutAddress: '', capabilities: [] });
      setShowForm(false);
      loadAgents();
    } catch { setMessage('Network error'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Agents</h1>
          <p className="text-sm text-white/35">{agents.length} registered</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadAgents} className="p-2.5 rounded-lg admin-card text-white/40 hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-aim-gold text-deep-space text-xs font-bold hover:bg-aim-gold-light transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Agent
          </button>
        </div>
      </div>

      {message && (
        <div className={`text-sm px-4 py-3 rounded-lg border ${message.includes('created') || message.includes('successfully') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
          {message}
        </div>
      )}

      {showForm && (
        <div className="admin-card rounded-xl p-6 space-y-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">New Agent</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 mb-1.5 block font-medium">Name *</label>
              <input
                value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                className="w-full admin-input rounded-lg px-3 py-2.5 text-sm"
                placeholder="z.B. CodeReview-Agent"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block font-medium">Spending Address (optional)</label>
              <input
                value={formData.spendingAddress}
                onChange={e => setFormData(p => ({ ...p, spendingAddress: e.target.value }))}
                className="w-full admin-input rounded-lg px-3 py-2.5 text-sm"
                placeholder="Lightning address"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1.5 block font-medium">Bio (optional)</label>
            <textarea
              value={formData.bio}
              onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))}
              rows={2}
              className="w-full admin-input rounded-lg px-3 py-2.5 text-sm resize-none"
              placeholder="Kurzbeschreibung des Agenten"
            />
          </div>

          <div>
            <label className="text-xs text-white/50 mb-2 block font-medium">Capabilities *</label>
            <div className="flex flex-wrap gap-2">
              {CAPABILITIES.map(cap => (
                <button
                  key={cap}
                  onClick={() => toggleCap(cap)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                    formData.capabilities.includes(cap)
                      ? 'bg-aim-gold/15 text-aim-gold border-aim-gold/25'
                      : 'bg-white/3 text-white/35 border-white/8 hover:text-white/55 hover:border-white/15'
                  }`}
                >
                  {cap}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={createAgent}
              disabled={submitting}
              className="px-5 py-2.5 rounded-lg bg-aim-gold text-deep-space text-xs font-bold hover:bg-aim-gold-light transition-colors disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Agent'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 rounded-lg admin-card text-white/50 text-xs font-medium hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-5 h-5 rounded-full border-2 border-aim-gold/30 border-t-aim-gold animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {agents.map(agent => (
            <div key={agent.id} className="admin-card rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-aim-gold/10 flex items-center justify-center shrink-0">
                <Bot className="w-4.5 h-4.5 text-aim-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-bold text-white truncate">{agent.name}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${STATUS_COLORS[agent.status] ?? 'bg-white/10 text-white/50 border-white/10'}`}>
                    {agent.status}
                  </span>
                </div>
                <div className="text-[11px] text-white/30 mt-1">
                  {agent.capabilities.join(' · ') || 'none'} — Rep: {agent.reputation} · Tasks: {agent.tasksCompleted}
                </div>
              </div>
              <div className="text-[11px] text-white/20 shrink-0 font-mono">
                {agent.id.slice(0, 8)}
              </div>
            </div>
          ))}
          {agents.length === 0 && (
            <div className="text-center text-sm text-white/25 py-16">No agents registered</div>
          )}
        </div>
      )}
    </div>
  );
}
