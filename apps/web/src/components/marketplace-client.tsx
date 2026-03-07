'use client';

import { useState, useMemo } from 'react';
import { TaskCard } from './task-card';
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
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'reward_high', label: 'Reward: high → low' },
  { value: 'reward_low', label: 'Reward: low → high' },
];

export function MarketplaceClient({ initialTasks }: MarketplaceClientProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [capFilter, setCapFilter] = useState('');
  const [sort, setSort] = useState('newest');

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
      default:
        tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return tasks;
  }, [initialTasks, statusFilter, search, capFilter, sort]);

  const inputClass =
    'bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-aim-gold/40 transition-colors';

  return (
    <div>
      {/* Filter Bar */}
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
      </div>

      {/* Results */}
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
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}
