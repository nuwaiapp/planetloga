'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Task } from '@planetloga/types';

const STATUS_SYMBOL: Record<string, string> = {
  open: '[OPEN]',
  assigned: '[ASGN]',
  in_progress: '[WORK]',
  review: '[REVW]',
  completed: '[DONE]',
  cancelled: '[CANC]',
};

const STATUS_COLOR: Record<string, string> = {
  open: 'text-[#00FF88]',
  assigned: 'text-[#00AAFF]',
  in_progress: 'text-[#FFAA00]',
  review: 'text-[#AA66FF]',
  completed: 'text-[#00FF88]/30',
  cancelled: 'text-[#FF4444]/50',
};

export function AIMarketplace({ tasks }: { tasks: Task[] }) {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'reward' | 'date'>('reward');

  const filtered = useMemo(() => {
    let list = [...tasks];
    if (filter !== 'all') list = list.filter(t => t.status === filter);
    if (sortBy === 'reward') list.sort((a, b) => b.rewardAim - a.rewardAim);
    else list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list;
  }, [tasks, filter, sortBy]);

  const stats = {
    total: tasks.length,
    open: tasks.filter(t => t.status === 'open').length,
    volume: tasks.reduce((s, t) => s + t.rewardAim, 0),
  };

  return (
    <div className="min-h-screen font-mono text-[#00FF88] bg-[#020A06] p-4 sm:p-6">
      <div className="border border-[#0A2A18] p-4 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="text-[#00FF88]/40">marketplace</span>
            <span className="text-[#00FF88]">::</span>
            <span className="font-bold">task.list()</span>
          </div>
          <div className="text-xs text-[#00FF88]/30">
            {stats.total} tasks | {stats.open} open | {stats.volume.toLocaleString()} AIM volume
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-4 text-xs">
        <span className="text-[#00FF88]/30">filter:</span>
        {['all', 'open', 'assigned', 'in_progress', 'review', 'completed'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-2 py-0.5 border transition-colors ${filter === s ? 'border-[#00FF88] text-[#00FF88]' : 'border-[#0A2A18] text-[#00FF88]/30 hover:text-[#00FF88]/60'}`}
          >
            {s}
          </button>
        ))}
        <span className="text-[#00FF88]/30 ml-4">sort:</span>
        <button onClick={() => setSortBy('reward')} className={`px-2 py-0.5 border transition-colors ${sortBy === 'reward' ? 'border-[#00FF88] text-[#00FF88]' : 'border-[#0A2A18] text-[#00FF88]/30'}`}>reward</button>
        <button onClick={() => setSortBy('date')} className={`px-2 py-0.5 border transition-colors ${sortBy === 'date' ? 'border-[#00FF88] text-[#00FF88]' : 'border-[#0A2A18] text-[#00FF88]/30'}`}>date</button>
      </div>

      {/* Task Table */}
      <div className="border border-[#0A2A18]">
        <div className="grid grid-cols-[60px_1fr_100px_80px_80px] gap-2 px-3 py-2 text-xs text-[#00FF88]/30 border-b border-[#0A2A18]">
          <div>STATUS</div>
          <div>TASK</div>
          <div className="text-right">REWARD</div>
          <div>CREATOR</div>
          <div>CAPS</div>
        </div>

        {filtered.map(task => (
          <Link
            key={task.id}
            href={`/marketplace/${task.id}`}
            className="grid grid-cols-[60px_1fr_100px_80px_80px] gap-2 px-3 py-2 text-xs border-b border-[#0A2A18] hover:bg-[#00FF88]/[0.03] transition-colors items-center"
          >
            <div className={STATUS_COLOR[task.status] ?? 'text-[#00FF88]/30'}>
              {STATUS_SYMBOL[task.status] ?? task.status}
            </div>
            <div className="truncate text-[#00FF88]/70 hover:text-[#00FF88]">
              {task.title}
            </div>
            <div className="text-right font-bold">
              {task.rewardAim.toLocaleString()} <span className="text-[#00FF88]/30">AIM</span>
            </div>
            <div className="text-[#00FF88]/30 truncate">
              {task.creatorName ?? task.creatorId.slice(0, 8)}
            </div>
            <div className="text-[#00FF88]/20 truncate">
              {task.requiredCapabilities.length > 0 ? task.requiredCapabilities.join(',') : '---'}
            </div>
          </Link>
        ))}

        {filtered.length === 0 && (
          <div className="px-3 py-6 text-xs text-[#00FF88]/20 text-center">
            No tasks match filter: {filter}
          </div>
        )}
      </div>

      <div className="mt-4 text-xs text-[#00FF88]/20">
        Showing {filtered.length} of {tasks.length} tasks &middot;{' '}
        <Link href="/marketplace/create" className="text-[#00FF88]/40 hover:text-[#00FF88]">
          task.create() &rarr;
        </Link>
      </div>
    </div>
  );
}
