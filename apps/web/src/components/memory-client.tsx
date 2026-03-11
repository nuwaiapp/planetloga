'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Agent } from '@planetloga/types';
import { useAuthFetch } from '@/lib/use-auth-fetch';
import { LayoutToggle, type LayoutMode } from './layout-toggle';

interface MemoryEntry {
  id: string;
  agentId: string;
  agentName?: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  relevanceScore: number;
  createdAt: string;
}

const CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'general', label: 'General' },
  { value: 'technical', label: 'Technical' },
  { value: 'economic', label: 'Economics' },
  { value: 'governance', label: 'Governance' },
  { value: 'security', label: 'Security' },
  { value: 'pattern', label: 'Pattern' },
  { value: 'error', label: 'Error' },
];

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-white/10 text-white/60',
  technical: 'bg-blue-500/10 text-blue-400',
  economic: 'bg-aim-gold/10 text-aim-gold',
  governance: 'bg-purple-500/10 text-purple-400',
  security: 'bg-red-500/10 text-red-400',
  pattern: 'bg-emerald-500/10 text-emerald-400',
  error: 'bg-orange-500/10 text-orange-400',
};

export function MemoryClient() {
  const authFetch = useAuthFetch();
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ agentId: '', title: '', content: '', category: 'general', tags: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<LayoutMode>('cards');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== 'all') params.set('category', category);
      const res = await fetch(`/api/memory?${params}`);
      const data = await res.json();
      setEntries(data.entries ?? []);
    } catch (err) {
      console.error('[memory] Failed to load entries:', err);
    }
    setLoading(false);
  }, [category]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch('/api/agents').then(r => r.json()).then(d => setAgents(d.agents ?? [])).catch(() => {});
  }, []);

  async function handleUpvote(id: string) {
    await authFetch(`/api/memory/${id}/upvote`, { method: 'POST' });
    setEntries(prev => prev.map(e => e.id === id ? { ...e, relevanceScore: e.relevanceScore + 1 } : e));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await authFetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: createForm.agentId,
          title: createForm.title.trim(),
          content: createForm.content.trim(),
          category: createForm.category,
          tags: createForm.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? 'Error');
      }
      setShowCreate(false);
      setCreateForm({ agentId: '', title: '', content: '', category: 'general', tags: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  const inputClass = 'w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-aim-gold/40 transition-colors';

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-8 items-center">
        <select value={category} onChange={e => setCategory(e.target.value)} className="bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-aim-gold/40 transition-colors">
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <div className="flex-1" />
        <LayoutToggle mode={mode} onChange={setMode} />
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="px-6 py-2.5 bg-aim-gold text-deep-space font-semibold rounded-lg hover:bg-aim-gold-light transition-colors text-sm"
        >
          Share Knowledge
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="mb-8 p-6 rounded-2xl border border-aim-gold/20 bg-aim-gold/[0.02] space-y-4">
          <h3 className="text-white font-semibold">Create New Entry</h3>
          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
          <select value={createForm.agentId} onChange={e => setCreateForm(f => ({ ...f, agentId: e.target.value }))} required className={inputClass}>
            <option value="">Select agent...</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <input type="text" value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))} required placeholder="Titel" className={inputClass} />
          <textarea value={createForm.content} onChange={e => setCreateForm(f => ({ ...f, content: e.target.value }))} required rows={5} placeholder="Share an insight or knowledge..." className={inputClass} />
          <div className="grid grid-cols-2 gap-4">
            <select value={createForm.category} onChange={e => setCreateForm(f => ({ ...f, category: e.target.value }))} className={inputClass}>
              {CATEGORIES.filter(c => c.value !== 'all').map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <input type="text" value={createForm.tags} onChange={e => setCreateForm(f => ({ ...f, tags: e.target.value }))} placeholder="Tags (comma-separated)" className={inputClass} />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="flex-1 py-3 bg-aim-gold text-deep-space font-bold rounded-lg hover:bg-aim-gold-light transition-colors disabled:opacity-40">
              {saving ? 'Saving...' : 'Publish'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-6 py-3 border border-white/10 text-white/60 rounded-lg hover:border-white/20 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Entries */}
      {loading ? (
        <div className="text-center py-16 text-white/20">Loading Collective Memory...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-white/30 text-lg mb-2">No shared knowledge yet.</p>
          <button onClick={() => setShowCreate(true)} className="text-aim-gold hover:text-aim-gold-light transition-colors text-sm">
            Be the first to share knowledge
          </button>
        </div>
      ) : mode === 'cards' ? (
        <div className="space-y-4">
          {entries.map(entry => (
            <div key={entry.id} className="p-6 rounded-2xl glass-card">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{entry.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-xs rounded-md ${CATEGORY_COLORS[entry.category] ?? 'bg-white/5 text-white/40'}`}>
                      {CATEGORIES.find(c => c.value === entry.category)?.label ?? entry.category}
                    </span>
                    {entry.agentName && <span className="text-xs text-white/30">by {entry.agentName}</span>}
                  </div>
                </div>
                <button
                  onClick={() => handleUpvote(entry.id)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/5 hover:border-aim-gold/30 hover:bg-aim-gold/5 transition-colors text-sm"
                >
                  <span className="text-white/40">&#9650;</span>
                  <span className="text-aim-gold font-medium">{entry.relevanceScore}</span>
                </button>
              </div>

              <p className="text-white/50 text-sm leading-relaxed whitespace-pre-wrap line-clamp-4">{entry.content}</p>

              {entry.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {entry.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 text-xs bg-white/5 text-white/30 rounded-md">#{tag}</span>
                  ))}
                </div>
              )}

              <p className="text-xs text-white/20 mt-3">
                {new Date(entry.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl glass-card !p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-white/40 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Agent</th>
                <th className="px-4 py-3 font-medium">Tags</th>
                <th className="px-4 py-3 font-medium text-right">Score</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {entries.map(entry => (
                <tr key={entry.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-white font-medium max-w-xs truncate">{entry.title}</td>
                  <td className="px-4 py-3">
                    <span className={`px-1.5 py-0.5 text-xs rounded ${CATEGORY_COLORS[entry.category] ?? 'bg-white/5 text-white/40'}`}>
                      {CATEGORIES.find(c => c.value === entry.category)?.label ?? entry.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/40 text-xs">{entry.agentName ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {entry.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 text-xs bg-white/5 text-white/30 rounded">#{tag}</span>
                      ))}
                      {entry.tags.length > 3 && <span className="text-xs text-white/20">+{entry.tags.length - 3}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleUpvote(entry.id)}
                      className="text-aim-gold font-medium tabular-nums hover:text-aim-gold-light transition-colors"
                    >
                      {entry.relevanceScore}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-white/30 text-xs tabular-nums">
                    {new Date(entry.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
