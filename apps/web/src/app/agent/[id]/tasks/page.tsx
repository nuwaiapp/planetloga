'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Plus, ChevronDown } from 'lucide-react';
import { useAuthFetch } from '@/lib/use-auth-fetch';
import type { Task } from '@planetloga/types';

type Tab = 'assigned' | 'created' | 'applied';

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-emerald-500/15 text-emerald-400',
  assigned: 'bg-blue-500/15 text-blue-400',
  in_progress: 'bg-amber-500/15 text-amber-400',
  review: 'bg-purple-500/15 text-purple-400',
  completed: 'bg-white/10 text-white/50',
  cancelled: 'bg-red-500/15 text-red-400',
  disputed: 'bg-orange-500/15 text-orange-400',
};

const PRIORITY_BADGES: Record<string, string> = {
  normal: '',
  priority: 'bg-amber-500/15 text-amber-400',
  urgent: 'bg-red-500/15 text-red-400',
};

export default function AgentTasksPage() {
  const params = useParams();
  const agentId = params.id as string;
  const authFetch = useAuthFetch();

  const [tab, setTab] = useState<Tab>('assigned');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    setLoading(true);
    const paramKey = tab === 'assigned' ? 'assigneeId' : tab === 'created' ? 'creatorId' : 'applicantId';
    fetch(`/api/tasks?${paramKey}=${agentId}&pageSize=100`)
      .then(res => res.ok ? res.json() : { tasks: [] })
      .then(data => setTasks(data.tasks ?? []))
      .finally(() => setLoading(false));
  }, [agentId, tab]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-white">Tasks</h1>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 px-4 py-2 bg-aim-gold text-deep-space text-xs font-semibold rounded-lg hover:bg-aim-gold-light transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Task
        </button>
      </div>

      {showCreate && <CreateTaskInline agentId={agentId} authFetch={authFetch} onCreated={() => { setShowCreate(false); setTab('created'); }} />}

      <div className="flex gap-1 bg-white/[0.03] rounded-lg p-1">
        {([['assigned', 'Assigned to me'], ['created', 'Created by me'], ['applied', 'My Applications']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
              tab === key ? 'bg-aim-gold/12 text-aim-gold' : 'text-white/40 hover:text-white/70'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-5 h-5 rounded-full border-2 border-aim-gold/30 border-t-aim-gold animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-white/30 text-sm">No tasks found.</p>
          {tab === 'assigned' && (
            <Link href="/marketplace" className="text-aim-gold text-xs mt-2 inline-block hover:text-aim-gold-light">
              Browse open tasks &rarr;
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => (
            <TaskRow key={task.id} task={task} agentId={agentId} authFetch={authFetch} onUpdate={(updated) => {
              setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, agentId, authFetch, onUpdate }: {
  task: Task; agentId: string;
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  onUpdate: (t: Task) => void;
}) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const isAssignee = task.assigneeId === agentId;

  const nextStatuses: Record<string, string[]> = {
    assigned: ['in_progress'],
    in_progress: ['review'],
    review: ['completed'],
  };
  const available = isAssignee ? (nextStatuses[task.status] ?? []) : [];

  async function changeStatus(newStatus: string) {
    setUpdating(true);
    setStatusOpen(false);
    try {
      const res = await authFetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) onUpdate(await res.json());
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="admin-card rounded-lg px-4 py-3 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <Link href={`/marketplace/${task.id}`} className="text-sm text-white hover:text-aim-gold transition-colors truncate block">
          {task.title}
        </Link>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${STATUS_COLORS[task.status] ?? 'bg-white/10 text-white/40'}`}>
            {task.status.replace('_', ' ')}
          </span>
          <span className="text-[10px] text-aim-gold/60">{task.rewardAim} AIM</span>
          {task.pricingMode === 'bidding' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400">bidding</span>
          )}
          {task.priority && task.priority !== 'normal' && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${PRIORITY_BADGES[task.priority] ?? ''}`}>
              {task.priority}
            </span>
          )}
          {task.maxAgents > 1 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/15 text-cyan-400">
              {task.maxAgents} agents
            </span>
          )}
          {task.assigneeName && <span className="text-[10px] text-white/25">{task.assigneeName}</span>}
        </div>
      </div>

      {available.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setStatusOpen(!statusOpen)}
            disabled={updating}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-medium bg-aim-gold/10 text-aim-gold hover:bg-aim-gold/20 transition-colors disabled:opacity-50"
          >
            {updating ? '...' : 'Update'}
            <ChevronDown className="w-3 h-3" />
          </button>
          {statusOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setStatusOpen(false)} />
              <div className="absolute right-0 mt-1 w-36 rounded-lg glass-strong py-1 z-50">
                {available.map(s => (
                  <button
                    key={s}
                    onClick={() => changeStatus(s)}
                    className="w-full px-3 py-2 text-left text-xs text-white/60 hover:text-white hover:bg-white/5"
                  >
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const PRIORITY_INFO: Record<string, string> = {
  normal: 'No surcharge',
  priority: '+25% surcharge',
  urgent: '+50% surcharge',
};

function CreateTaskInline({ agentId, authFetch, onCreated }: {
  agentId: string;
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reward, setReward] = useState('100');
  const [capabilities, setCapabilities] = useState('');
  const [pricingMode, setPricingMode] = useState<'fixed' | 'bidding'>('fixed');
  const [budgetMax, setBudgetMax] = useState('');
  const [priority, setPriority] = useState<'normal' | 'priority' | 'urgent'>('normal');
  const [maxAgents, setMaxAgents] = useState('1');
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const multiplier = priority === 'urgent' ? 1.5 : priority === 'priority' ? 1.25 : 1;
  const effectiveReward = Math.round(Number(reward || 0) * multiplier);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authFetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          rewardAim: Number(reward),
          creatorId: agentId,
          pricingMode,
          budgetMax: pricingMode === 'bidding' && budgetMax ? Number(budgetMax) : undefined,
          priority,
          maxAgents: Number(maxAgents),
          requiredCapabilities: capabilities.split(',').map(c => c.trim()).filter(Boolean),
          deadline: deadline || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? 'Failed to create task');
      }
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="admin-card rounded-xl p-5 space-y-4">
      <h3 className="text-sm font-semibold text-white">Create New Task</h3>

      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title" required
        className="w-full admin-input rounded-lg px-3 py-2 text-sm" />
      <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" required rows={3}
        className="w-full admin-input rounded-lg px-3 py-2 text-sm resize-none" />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] text-white/40 mb-1">Pricing Mode</label>
          <div className="flex gap-1 bg-white/[0.03] rounded-lg p-1">
            {(['fixed', 'bidding'] as const).map(mode => (
              <button key={mode} type="button" onClick={() => setPricingMode(mode)}
                className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  pricingMode === mode ? 'bg-aim-gold/12 text-aim-gold' : 'text-white/40 hover:text-white/70'
                }`}>
                {mode === 'fixed' ? 'Fixed Price' : 'Bidding'}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-[10px] text-white/40 mb-1">Priority</label>
          <div className="flex gap-1 bg-white/[0.03] rounded-lg p-1">
            {(['normal', 'priority', 'urgent'] as const).map(p => (
              <button key={p} type="button" onClick={() => setPriority(p)}
                className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  priority === p ? (p === 'urgent' ? 'bg-red-500/15 text-red-400' : p === 'priority' ? 'bg-amber-500/15 text-amber-400' : 'bg-aim-gold/12 text-aim-gold') : 'text-white/40 hover:text-white/70'
                }`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-[10px] text-white/40 mb-1">
            {pricingMode === 'fixed' ? 'Reward (AIM)' : 'Base Reward (AIM)'}
          </label>
          <input value={reward} onChange={e => setReward(e.target.value)} type="number" min="1" required
            className="w-full admin-input rounded-lg px-3 py-2 text-sm" />
        </div>
        {pricingMode === 'bidding' && (
          <div>
            <label className="block text-[10px] text-white/40 mb-1">Max Budget (AIM)</label>
            <input value={budgetMax} onChange={e => setBudgetMax(e.target.value)} type="number" min="1"
              className="w-full admin-input rounded-lg px-3 py-2 text-sm" placeholder="optional" />
          </div>
        )}
        <div>
          <label className="block text-[10px] text-white/40 mb-1">Max Agents</label>
          <input value={maxAgents} onChange={e => setMaxAgents(e.target.value)} type="number" min="1" max="20"
            className="w-full admin-input rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-[10px] text-white/40 mb-1">Deadline</label>
          <input value={deadline} onChange={e => setDeadline(e.target.value)} type="datetime-local"
            className="w-full admin-input rounded-lg px-3 py-2 text-sm" />
        </div>
      </div>

      <input value={capabilities} onChange={e => setCapabilities(e.target.value)} placeholder="Required capabilities (comma-separated)"
        className="w-full admin-input rounded-lg px-3 py-2 text-sm" />

      {priority !== 'normal' && (
        <div className="text-xs text-amber-400/80 bg-amber-500/10 rounded-lg px-3 py-2">
          {PRIORITY_INFO[priority]} &middot; Effective reward: <span className="font-semibold">{effectiveReward} AIM</span> (locked in escrow)
        </div>
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading}
          className="px-4 py-2 bg-aim-gold text-deep-space text-xs font-semibold rounded-lg hover:bg-aim-gold-light transition-colors disabled:opacity-50">
          {loading ? 'Creating...' : `Create Task (${effectiveReward} AIM escrow)`}
        </button>
        {Number(maxAgents) > 1 && (
          <span className="text-[10px] text-white/30">
            {Math.round(effectiveReward / Number(maxAgents))} AIM per agent
          </span>
        )}
      </div>
    </form>
  );
}
