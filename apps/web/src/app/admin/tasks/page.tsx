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

interface Agent {
  id: string;
  name: string;
}

const TASK_STATUSES = ['open', 'assigned', 'in_progress', 'review', 'completed', 'cancelled'];

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-500/20 text-blue-400',
  assigned: 'bg-yellow-500/20 text-yellow-400',
  in_progress: 'bg-purple-500/20 text-purple-400',
  review: 'bg-orange-500/20 text-orange-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
  cancelled: 'bg-red-500/20 text-red-400',
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
    } catch {
      setMessage('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { loadData(); }, [loadData]);

  const createTask = async () => {
    if (!formData.title.trim() || !formData.description.trim() || !formData.creatorId) {
      setMessage('Titel, Beschreibung und Creator sind erforderlich');
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
        setMessage(err.error?.message ?? 'Fehler');
        return;
      }
      setMessage('Task erstellt');
      setFormData({ title: '', description: '', rewardAim: '100', creatorId: '' });
      setShowForm(false);
      loadData();
    } catch {
      setMessage('Netzwerkfehler');
    } finally {
      setSubmitting(false);
    }
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
        setMessage(err.error?.message ?? 'Statusänderung fehlgeschlagen');
        return;
      }
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch {
      setMessage('Netzwerkfehler');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-white">Tasks</h1>
          <p className="text-xs text-white/40">{tasks.length} insgesamt</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="p-2 rounded-lg glass text-white/50 hover:text-white transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-aim-gold text-deep-space text-xs font-semibold hover:bg-aim-gold-light transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Task anlegen
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
          <h2 className="text-sm font-semibold text-white">Neuer Task</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 mb-1 block">Titel *</label>
              <input
                value={formData.title}
                onChange={e => setFormData(p => ({ ...p, title: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-aim-gold/40"
                placeholder="z.B. Smart Contract Audit"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/50 mb-1 block">Reward (AIM)</label>
                <input
                  type="number"
                  value={formData.rewardAim}
                  onChange={e => setFormData(p => ({ ...p, rewardAim: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-aim-gold/40"
                />
              </div>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Creator *</label>
                <select
                  value={formData.creatorId}
                  onChange={e => setFormData(p => ({ ...p, creatorId: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-aim-gold/40"
                >
                  <option value="">Agent wählen</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1 block">Beschreibung *</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData(p => ({ ...p, description: e.target.value }))}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-aim-gold/40 resize-none"
              placeholder="Detaillierte Aufgabenbeschreibung"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={createTask}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-aim-gold text-deep-space text-xs font-semibold hover:bg-aim-gold-light transition-colors disabled:opacity-50"
            >
              {submitting ? 'Erstelle...' : 'Task erstellen'}
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
          {tasks.map(task => (
            <div key={task.id} className="glass-card rounded-xl p-4">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-lg bg-aim-gold/10 flex items-center justify-center shrink-0 mt-0.5">
                  <ListTodo className="w-4 h-4 text-aim-gold" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white">{task.title}</span>
                    <span className="text-[10px] font-display text-aim-gold">{task.rewardAim} AIM</span>
                  </div>
                  <div className="text-[10px] text-white/30 mt-0.5 line-clamp-1">{task.description}</div>
                  <div className="text-[10px] text-white/20 mt-1">
                    Creator: {task.creatorName ?? task.creatorId.slice(0, 8)}
                    {task.assigneeName ? ` · Assignee: ${task.assigneeName}` : ''}
                  </div>
                </div>
                <div className="relative shrink-0">
                  <button
                    onClick={() => setStatusDropdown(statusDropdown === task.id ? null : task.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium ${STATUS_COLORS[task.status] ?? 'bg-white/10 text-white/50'}`}
                  >
                    {task.status}
                    <ChevronDown className="w-2.5 h-2.5" />
                  </button>
                  {statusDropdown === task.id && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setStatusDropdown(null)} />
                      <div className="absolute right-0 top-full mt-1 w-32 glass-strong rounded-lg py-1 z-50">
                        {TASK_STATUSES.map(s => (
                          <button
                            key={s}
                            onClick={() => updateStatus(task.id, s)}
                            className={`w-full text-left px-3 py-1.5 text-[10px] transition-colors ${
                              s === task.status ? 'text-aim-gold' : 'text-white/50 hover:text-white hover:bg-white/5'
                            }`}
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
            <div className="text-center text-sm text-white/30 py-12">Keine Tasks vorhanden</div>
          )}
        </div>
      )}
    </div>
  );
}
