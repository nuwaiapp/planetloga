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
  walletAddress?: string;
  createdAt: string;
}

const CAPABILITIES = [
  'data-analysis', 'text-generation', 'image-recognition',
  'code-generation', 'code-review', 'research', 'translation',
  'smart-contracts', 'security-audit', 'frontend', 'devops',
  'infrastructure', 'machine-learning', 'compliance',
];

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-400',
  inactive: 'bg-white/10 text-white/50',
  suspended: 'bg-red-500/20 text-red-400',
};

export default function AdminAgents() {
  const authFetch = useAuthFetch();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', bio: '', walletAddress: '', capabilities: [] as string[] });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const loadAgents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/agents?pageSize=100');
      const data = await res.json();
      setAgents(data.agents ?? []);
    } catch {
      setMessage('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
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
      setMessage('Name und mindestens eine Capability sind erforderlich');
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
          walletAddress: formData.walletAddress.trim() || undefined,
          capabilities: formData.capabilities,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setMessage(err.error?.message ?? 'Fehler');
        return;
      }
      setMessage('Agent erstellt');
      setFormData({ name: '', bio: '', walletAddress: '', capabilities: [] });
      setShowForm(false);
      loadAgents();
    } catch {
      setMessage('Netzwerkfehler');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-white">Agents</h1>
          <p className="text-xs text-white/40">{agents.length} registriert</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadAgents} className="p-2 rounded-lg glass text-white/50 hover:text-white transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-aim-gold text-deep-space text-xs font-semibold hover:bg-aim-gold-light transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Agent anlegen
          </button>
        </div>
      </div>

      {message && (
        <div className={`text-xs px-3 py-2 rounded-lg ${message.includes('erstellt') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
          {message}
        </div>
      )}

      {showForm && (
        <div className="glass-card rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-white">Neuer Agent</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Name *</label>
              <input
                value={formData.name}
                onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-aim-gold/40"
                placeholder="z.B. CodeReview-Agent"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1 block">Wallet (optional)</label>
              <input
                value={formData.walletAddress}
                onChange={e => setFormData(p => ({ ...p, walletAddress: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-aim-gold/40"
                placeholder="Solana Wallet Address"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1 block">Bio (optional)</label>
            <textarea
              value={formData.bio}
              onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-aim-gold/40 resize-none"
              placeholder="Kurzbeschreibung des Agenten"
            />
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Capabilities *</label>
            <div className="flex flex-wrap gap-1.5">
              {CAPABILITIES.map(cap => (
                <button
                  key={cap}
                  onClick={() => toggleCap(cap)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors ${
                    formData.capabilities.includes(cap)
                      ? 'bg-aim-gold/20 text-aim-gold border border-aim-gold/30'
                      : 'bg-white/5 text-white/40 border border-white/10 hover:text-white/60'
                  }`}
                >
                  {cap}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={createAgent}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-aim-gold text-deep-space text-xs font-semibold hover:bg-aim-gold-light transition-colors disabled:opacity-50"
            >
              {submitting ? 'Erstelle...' : 'Agent erstellen'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg glass text-white/50 text-xs hover:text-white transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-5 h-5 rounded-full border-2 border-aim-gold/30 border-t-aim-gold animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {agents.map(agent => (
            <div key={agent.id} className="glass-card rounded-xl p-4 flex items-center gap-4">
              <div className="w-9 h-9 rounded-lg bg-aim-gold/10 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-aim-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white truncate">{agent.name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${STATUS_COLORS[agent.status] ?? 'bg-white/10 text-white/50'}`}>
                    {agent.status}
                  </span>
                </div>
                <div className="text-[10px] text-white/30 mt-0.5">
                  {agent.capabilities.join(', ') || 'keine'} · Rep: {agent.reputation} · Tasks: {agent.tasksCompleted}
                </div>
              </div>
              <div className="text-[10px] text-white/20 shrink-0 font-mono">
                {agent.id.slice(0, 8)}...
              </div>
            </div>
          ))}
          {agents.length === 0 && (
            <div className="text-center text-sm text-white/30 py-12">Keine Agents registriert</div>
          )}
        </div>
      )}
    </div>
  );
}
