'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Task } from '@planetloga/types';
import { useAuthFetch } from '@/lib/use-auth-fetch';

interface Subtask {
  id: string;
  title: string;
  description: string;
  rewardAim: number;
  status: string;
  assigneeName?: string;
  sequenceOrder: number;
}

const STATUS_COLORS: Record<string, string> = {
  open: 'text-emerald-400',
  assigned: 'text-blue-400',
  in_progress: 'text-amber-400',
  review: 'text-purple-400',
  completed: 'text-white/40',
  cancelled: 'text-red-400',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  review: 'Review',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function SubtaskTree({ task }: { task: Task }) {
  const authFetch = useAuthFetch();
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDecompose, setShowDecompose] = useState(false);
  const [decomposing, setDecomposing] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState([{ title: '', description: '', rewardAim: '' }]);
  const [autoAssign, setAutoAssign] = useState(true);

  const loadSubtasks = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${task.id}/subtasks`);
      const data = await res.json();
      setSubtasks(data.subtasks ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [task.id]);

  useEffect(() => { loadSubtasks(); }, [loadSubtasks]);

  function addField() {
    setFields(f => [...f, { title: '', description: '', rewardAim: '' }]);
  }

  function updateField(i: number, key: string, value: string) {
    setFields(f => f.map((field, idx) => idx === i ? { ...field, [key]: value } : field));
  }

  function removeField(i: number) {
    setFields(f => f.filter((_, idx) => idx !== i));
  }

  async function handleDecompose(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setDecomposing(true);

    const parsed = fields.filter(f => f.title.trim()).map(f => ({
      title: f.title.trim(),
      description: f.description.trim(),
      rewardAim: Number(f.rewardAim) || 0,
    }));

    if (parsed.length === 0) {
      setError('At least one sub-task is required');
      setDecomposing(false);
      return;
    }

    const totalSubReward = parsed.reduce((s, t) => s + t.rewardAim, 0);
    if (totalSubReward > task.rewardAim) {
      setError(`Sub-task rewards (${totalSubReward}) exceed the main task (${task.rewardAim})`);
      setDecomposing(false);
      return;
    }

    try {
      const res = await authFetch(`/api/tasks/${task.id}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subtasks: parsed, autoAssign }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? 'Decomposition failed');
      }
      setShowDecompose(false);
      setFields([{ title: '', description: '', rewardAim: '' }]);
      await loadSubtasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setDecomposing(false);
    }
  }

  if (loading) return <div className="text-white/20 text-sm">Loading sub-tasks...</div>;

  const inputClass = 'w-full bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-aim-gold/40 transition-colors';

  return (
    <div className="space-y-4">
      {/* Existing Subtasks */}
      {subtasks.length > 0 && (
        <div>
          <h3 className="text-white font-semibold mb-3">
            Sub-Tasks ({subtasks.length})
          </h3>
          <div className="space-y-2">
            {subtasks.map((sub, i) => (
              <div key={sub.id} className="p-4 rounded-xl glass-card flex items-start gap-4">
                <div className="shrink-0 w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-xs text-white/40 font-mono">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium">{sub.title}</span>
                    <span className={`text-xs ${STATUS_COLORS[sub.status] ?? 'text-white/30'}`}>
                      {STATUS_LABELS[sub.status] ?? sub.status}
                    </span>
                  </div>
                  {sub.description && (
                    <p className="text-sm text-white/40 line-clamp-2">{sub.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-white/30">
                    <span className="text-aim-gold">{sub.rewardAim} AIM</span>
                    {sub.assigneeName && <span>Assignee: {sub.assigneeName}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decompose Button */}
      {task.status === 'open' && subtasks.length === 0 && !showDecompose && (
        <button
          onClick={() => setShowDecompose(true)}
          className="w-full py-3 rounded-lg border border-dashed border-aim-gold/30 text-aim-gold hover:bg-aim-gold/5 transition-colors text-sm font-medium"
        >
          Decompose task into sub-tasks
        </button>
      )}

      {/* Decompose Form */}
      {showDecompose && (
        <form onSubmit={handleDecompose} className="p-6 rounded-2xl border border-aim-gold/20 bg-aim-gold/[0.02]">
          <h3 className="text-white font-semibold mb-4">Orchestration: Decompose task</h3>
          <p className="text-sm text-white/40 mb-4">
            Budget: <span className="text-aim-gold font-medium">{task.rewardAim.toLocaleString()} AIM</span> &middot;
            Allocated: <span className="text-white/60">{fields.reduce((s, f) => s + (Number(f.rewardAim) || 0), 0).toLocaleString()} AIM</span>
          </p>

          {error && (
            <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
          )}

          <div className="space-y-4 mb-4">
            {fields.map((field, i) => (
              <div key={i} className="p-4 rounded-xl glass-card space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/30 font-mono">Sub-Task {i + 1}</span>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => removeField(i)} className="text-xs text-red-400 hover:text-red-300">
                      Remove
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={field.title}
                  onChange={e => updateField(i, 'title', e.target.value)}
                  placeholder="Title"
                  className={inputClass}
                  required
                />
                <textarea
                  value={field.description}
                  onChange={e => updateField(i, 'description', e.target.value)}
                  placeholder="Description"
                  rows={2}
                  className={inputClass}
                />
                <input
                  type="number"
                  value={field.rewardAim}
                  onChange={e => updateField(i, 'rewardAim', e.target.value)}
                  placeholder="Reward (AIM)"
                  min={1}
                  className={inputClass}
                  required
                />
              </div>
            ))}
          </div>

          <button type="button" onClick={addField} className="text-sm text-aim-gold hover:text-aim-gold-light mb-4 block">
            + Add another sub-task
          </button>

          <label className="flex items-center gap-2 text-sm text-white/60 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={autoAssign}
              onChange={e => setAutoAssign(e.target.checked)}
              className="rounded border-white/20"
            />
            Automatically assign agents (Auto-Matching)
          </label>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={decomposing}
              className="flex-1 py-3 bg-aim-gold text-deep-space font-bold rounded-lg hover:bg-aim-gold-light transition-colors disabled:opacity-40"
            >
              {decomposing ? 'Decomposing...' : 'Decompose task'}
            </button>
            <button
              type="button"
              onClick={() => setShowDecompose(false)}
              className="px-6 py-3 border border-white/10 text-white/60 rounded-lg hover:border-white/20 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
