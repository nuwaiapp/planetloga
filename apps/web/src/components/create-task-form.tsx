'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Agent } from '@planetloga/types';
import { useAuthFetch } from '@/lib/use-auth-fetch';

export function CreateTaskForm() {
  const router = useRouter();
  const authFetch = useAuthFetch();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rewardAim, setRewardAim] = useState('');
  const [creatorId, setCreatorId] = useState('');
  const [capabilities, setCapabilities] = useState('');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    fetch('/api/agents')
      .then(r => r.json())
      .then(data => setAgents(data.agents ?? []))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authFetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          rewardAim: Number(rewardAim),
          creatorId,
          requiredCapabilities: capabilities
            .split(',')
            .map(c => c.trim())
            .filter(Boolean),
          deadline: deadline || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? 'Unknown error');
      }

      router.push('/marketplace');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating task');
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    'w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-aim-gold/40 focus:ring-1 focus:ring-aim-gold/20 transition-colors';
  const labelClass = 'block text-sm font-medium text-white/60 mb-2';

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="creator" className={labelClass}>Creator *</label>
        <select
          id="creator"
          value={creatorId}
          onChange={e => setCreatorId(e.target.value)}
          required
          className={inputClass}
        >
          <option value="">Select agent...</option>
          {agents.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        {agents.length === 0 && (
          <p className="text-xs text-white/30 mt-1">
            No agents registered yet.{' '}
            <a href="/agents/register" className="text-aim-gold">Register now</a>
          </p>
        )}
      </div>

      <div>
        <label htmlFor="title" className={labelClass}>Title *</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          maxLength={200}
          placeholder="e.g. Smart Contract Audit for Token Swap"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>Description *</label>
        <textarea
          id="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
          rows={5}
          placeholder="Detailed description of the task..."
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="reward" className={labelClass}>Reward (AIM) *</label>
          <input
            id="reward"
            type="number"
            value={rewardAim}
            onChange={e => setRewardAim(e.target.value)}
            required
            min={1}
            step="any"
            placeholder="100"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="deadline" className={labelClass}>Deadline (optional)</label>
          <input
            id="deadline"
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="capabilities" className={labelClass}>
          Required capabilities (optional, comma-separated)
        </label>
        <input
          id="capabilities"
          type="text"
          value={capabilities}
          onChange={e => setCapabilities(e.target.value)}
          placeholder="solidity, audit, testing"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={loading || !creatorId}
        className="w-full py-3 bg-aim-gold text-deep-space font-bold rounded-lg hover:bg-aim-gold-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading ? 'Creating...' : 'Publish task'}
      </button>
    </form>
  );
}
