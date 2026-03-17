'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { TaskCard } from './task-card';
import { LayoutToggle, type LayoutMode } from './layout-toggle';
import type { Task } from '@planetloga/types';

interface MarketplaceClientProps {
  initialTasks: Task[];
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'disputed', label: 'Disputed' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'reward_high', label: 'Reward: high \u2192 low' },
  { value: 'reward_low', label: 'Reward: low \u2192 high' },
  { value: 'priority', label: 'Priority first' },
];

const STATUS_TEXT_COLORS: Record<string, string> = {
  open: 'text-emerald-400',
  assigned: 'text-blue-400',
  in_progress: 'text-amber-400',
  review: 'text-purple-400',
  completed: 'text-white/40',
  cancelled: 'text-red-400',
  disputed: 'text-orange-400',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  assigned: 'Assigned',
  in_progress: 'In Progress',
  review: 'Review',
  completed: 'Completed',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
};

export function MarketplaceClient({ initialTasks }: MarketplaceClientProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [capFilter, setCapFilter] = useState('');
  const [sort, setSort] = useState('newest');
  const [mode, setMode] = useState<LayoutMode>('cards');

  const allCapabilities = useMemo(() => {
    const set = new Set<string>();
    initialTasks.forEach(t => t.requiredCapabilities.forEach(c => set.add(c)));
    return [...set].sort();
  }, [initialTasks]);

  const filtered = useMemo(() => {
    let tasks = [...initialTasks];

    if (statusFilter !== 'all') {
      tasks = tasks.filter(t => t.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      tasks = tasks.filter(
        t => t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q),
      );
    }

    if (capFilter) {
      tasks = tasks.filter(t => t.requiredCapabilities.includes(capFilter));
    }

    const priorityOrder: Record<string, number> = { urgent: 0, priority: 1, normal: 2 };
    switch (sort) {
      case 'oldest':
        tasks.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'reward_high':
        tasks.sort((a, b) => b.rewardAim - a.rewardAim);
        break;
      case 'reward_low':
        tasks.sort((a, b) => a.rewardAim - b.rewardAim);
        break;
      case 'priority':
        tasks.sort((a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2));
        break;
      default:
        tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return tasks;
  }, [initialTasks, statusFilter, search, capFilter, sort]);

  const inputClass =
    'bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-aim-gold/40 transition-colors';

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-8 items-center">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search..."
          className={`${inputClass} flex-1 min-w-48`}
        />

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={inputClass}>
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {allCapabilities.length > 0 && (
          <select value={capFilter} onChange={e => setCapFilter(e.target.value)} className={inputClass}>
            <option value="">All capabilities</option>
            {allCapabilities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        )}

        <select value={sort} onChange={e => setSort(e.target.value)} className={inputClass}>
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <LayoutToggle mode={mode} onChange={setMode} />
      </div>

      <p className="text-sm text-white/30 mb-4">
        {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
      </p>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-white/30 text-lg">No tasks found.</p>
          {search || statusFilter !== 'all' || capFilter ? (
            <button
              onClick={() => { setSearch(''); setStatusFilter('all'); setCapFilter(''); }}
              className="text-aim-gold hover:text-aim-gold-light transition-colors mt-2 text-sm"
            >
              Reset filters
            </button>
          ) : null}
        </div>
      ) : mode === 'cards' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl glass-card !p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-white/40 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Task</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Capabilities</th>
                <th className="px-4 py-3 font-medium text-right">Reward</th>
                <th className="px-4 py-3 font-medium">Creator</th>
                <th className="px-4 py-3 font-medium">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((task) => (
                <tr key={task.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/marketplace/${task.id}`} className="text-white hover:text-aim-gold transition-colors font-medium">
                      {task.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${STATUS_TEXT_COLORS[task.status] ?? 'text-white/40'}`}>
                      {STATUS_LABELS[task.status] ?? task.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {task.requiredCapabilities.map((cap) => (
                        <span key={cap} className="px-1.5 py-0.5 text-xs bg-aim-gold/10 text-aim-gold/70 rounded">
                          {cap}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-aim-gold font-semibold tabular-nums">{task.rewardAim.toLocaleString()}</span>
                    <span className="text-aim-gold/50 text-xs ml-1">AIM</span>
                  </td>
                  <td className="px-4 py-3 text-white/40 text-xs">
                    {task.creatorName ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-white/30 text-xs tabular-nums">
                    {task.deadline ? new Date(task.deadline).toLocaleDateString('en-US') : '—'}
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
