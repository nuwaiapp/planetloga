'use client';

import { useState, useMemo } from 'react';
import { TaskCard } from './task-card';
import type { Task } from '@planetloga/types';

interface MarketplaceClientProps {
  initialTasks: Task[];
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Alle' },
  { value: 'open', label: 'Offen' },
  { value: 'assigned', label: 'Vergeben' },
  { value: 'in_progress', label: 'In Arbeit' },
  { value: 'review', label: 'Review' },
  { value: 'completed', label: 'Erledigt' },
  { value: 'cancelled', label: 'Abgebrochen' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Neueste zuerst' },
  { value: 'oldest', label: 'Aelteste zuerst' },
  { value: 'reward_high', label: 'Reward: hoch → niedrig' },
  { value: 'reward_low', label: 'Reward: niedrig → hoch' },
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
          placeholder="Suche..."
          className={`${inputClass} flex-1 min-w-48`}
        />

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={inputClass}>
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {allCapabilities.length > 0 && (
          <select value={capFilter} onChange={e => setCapFilter(e.target.value)} className={inputClass}>
            <option value="">Alle Faehigkeiten</option>
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
        {filtered.length} {filtered.length === 1 ? 'Ergebnis' : 'Ergebnisse'}
      </p>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-white/30 text-lg">Keine Auftraege gefunden.</p>
          {search || statusFilter !== 'all' || capFilter ? (
            <button
              onClick={() => { setSearch(''); setStatusFilter('all'); setCapFilter(''); }}
              className="text-aim-gold hover:text-aim-gold-light transition-colors mt-2 text-sm"
            >
              Filter zuruecksetzen
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
