'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthFetch } from '@/lib/use-auth-fetch';
import { ListTodo, Plus, RefreshCw, ChevronDown } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string;
  rewardAim: number;
  status: string;
  creatorId: string;
  creatorName?: string;
  assigneeId?: string;
  assigneeName?: string;
  requiredCapabilities: string[];
  createdAt: string;
}

interface Agent { id: string; name: string; }

const TASK_STATUSES = ['open', 'assigned', 'in_progress', 'review', 'completed', 'cancelled'];

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  assigned: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  in_progress: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  review: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  completed: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/20',
};

export default function AdminTasks() {
  const authFetch = useAuthFetch();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', rewardAim: '100', creatorId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tasksRes, agentsRes] = await Promise.all([
        authFetch('/api/tasks?pageSize=100'),
        authFetch('/api/agents?pageSize=100'),
      ]);
      const tasksData = await tasksRes.json();
      const agentsData = await agentsRes.json();
      setTasks(tasksData.tasks ?? []);
      setAgents(agentsData.agents ?? []);
    } catch { setMessage('Failed to load'); }
    finally { setLoading(false); }
  }, [authFetch]);

  useEffect(() => { loadData(); }, [loadData]);

  const createTask = async () => {
    if (!formData.title.trim() || !formData.description.trim() || !formData.creatorId) {
      setMessage('Title, description and creator are required');
      return;
    }
    setSubmitting(true);
    setMessage('');
    try {
      const res = await authFetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          rewardAim: Number(formData.rewardAim),
          creatorId: formData.creatorId,
          requiredCapabilities: [],
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setMessage(err.error?.message ?? 'Error');
        return;
      }
      setMessage('Task created successfully');
      setFormData({ title: '', description: '', rewardAim: '100', creatorId: '' });
      setShowForm(false);
      loadData();
    } catch { setMessage('Network error'); }
    finally { setSubmitting(false); }
  };

  const updateStatus = async (taskId: string, newStatus: string) => {
    setStatusDropdown(null);
    try {
      const res = await authFetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const err = await res.json();
        setMessage(err.error?.message ?? 'Status change failed');
        return;
      }
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch { setMessage('Network error'); }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Tasks</h1>
          <p className="text-sm text-white/35">{tasks.length} insgesamt</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="p-2.5 rounded-lg admin-card text-white/40 hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-aim-gold text-deep-space text-xs font-bold hover:bg-aim-gold-light transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Task
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
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">New Task</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 mb-1.5 block font-medium">Titel *</label>
              <input value={formData.title} onChange={e => setFormData(p => ({ ...p, title: e.target.value }))} className="w-full admin-input rounded-lg px-3 py-2.5 text-sm" placeholder="z.B. Smart Contract Audit" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/50 mb-1.5 block font-medium">Reward (AIM)</label>
                <input type="number" value={formData.rewardAim} onChange={e => setFormData(p => ({ ...p, rewardAim: e.target.value }))} className="w-full admin-input rounded-lg px-3 py-2.5 text-sm" />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1.5 block font-medium">Creator *</label>
                <select value={formData.creatorId} onChange={e => setFormData(p => ({ ...p, creatorId: e.target.value }))} className="w-full admin-input rounded-lg px-3 py-2.5 text-sm">
                  <option value="">Agent wählen</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1.5 block font-medium">Description *</label>
            <textarea value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} rows={3} className="w-full admin-input rounded-lg px-3 py-2.5 text-sm resize-none" placeholder="Detaillierte Aufgabenbeschreibung" />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={createTask} disabled={submitting} className="px-5 py-2.5 rounded-lg bg-aim-gold text-deep-space text-xs font-bold hover:bg-aim-gold-light transition-colors disabled:opacity-50">
              {submitting ? 'Creating...' : 'Create Task'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-lg admin-card text-white/50 text-xs font-medium hover:text-white transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-5 h-5 rounded-full border-2 border-aim-gold/30 border-t-aim-gold animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => (
            <div key={task.id} className="admin-card rounded-xl p-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-aim-gold/10 flex items-center justify-center shrink-0 mt-0.5">
                  <ListTodo className="w-4 h-4 text-aim-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-sm font-bold text-white">{task.title}</span>
                    <span className="text-[11px] font-display font-bold text-aim-gold">{task.rewardAim} AIM</span>
                  </div>
                  <div className="text-[11px] text-white/30 mt-1 line-clamp-1">{task.description}</div>
                  <div className="text-[11px] text-white/20 mt-1.5">
                    Creator: {task.creatorName ?? task.creatorId.slice(0, 8)}
                    {task.assigneeName ? ` · Assignee: ${task.assigneeName}` : ''}
                  </div>
                </div>
                <div className="relative shrink-0">
                  <button
                    onClick={() => setStatusDropdown(statusDropdown === task.id ? null : task.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border ${STATUS_COLORS[task.status] ?? 'bg-white/10 text-white/50 border-white/10'}`}
                  >
                    {task.status}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {statusDropdown === task.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setStatusDropdown(null)} />
                      <div className="absolute right-0 top-full mt-1.5 w-36 admin-card rounded-lg py-1.5 z-50">
                        {TASK_STATUSES.map(s => (
                          <button
                            key={s}
                            onClick={() => updateStatus(task.id, s)}
                            className={`w-full text-left px-3 py-2 text-[11px] font-medium transition-colors rounded-md mx-1 ${
                              s === task.status ? 'text-aim-gold bg-aim-gold/8' : 'text-white/50 hover:text-white hover:bg-white/5'
                            }`}
                            style={{ width: 'calc(100% - 8px)' }}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {tasks.length === 0 && (
            <div className="text-center text-sm text-white/25 py-16">Keine Tasks vorhanden</div>
          )}
        </div>
      )}
    </div>
  );
}
