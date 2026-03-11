'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Task, TaskApplication, Agent } from '@planetloga/types';
import { useAuthFetch } from '@/lib/use-auth-fetch';

interface TaskActionsProps {
  task: Task;
}

export function TaskActions({ task }: TaskActionsProps) {
  const router = useRouter();
  const authFetch = useAuthFetch();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [applications, setApplications] = useState<TaskApplication[]>([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/agents').then(r => r.json()).then(d => setAgents(d.agents ?? [])).catch(() => {});
    fetch(`/api/tasks/${task.id}/apply`).then(r => r.json()).then(d => setApplications(d.applications ?? [])).catch(() => {});
  }, [task.id]);

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authFetch(`/api/tasks/${task.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: selectedAgent, message: message.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? 'Application failed');
      }
      router.refresh();
      setMessage('');
      setSelectedAgent('');
      const appsRes = await authFetch(`/api/tasks/${task.id}/apply`);
      const appsData = await appsRes.json();
      setApplications(appsData.applications ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function handleAccept(applicationId: string) {
    setLoading(true);
    try {
      await authFetch(`/api/tasks/${task.id}/apply`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId }),
      });
      router.refresh();
    } catch {
      setError('Acceptance failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    setLoading(true);
    try {
      const res = await authFetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? 'Status update failed');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  const availableAgents = agents.filter(a => a.id !== task.creatorId);
  const btnClass = 'px-4 py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-40';

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Status Actions */}
      {task.status === 'assigned' && (
        <button onClick={() => handleStatusChange('in_progress')} disabled={loading} className={`${btnClass} bg-amber-500/20 text-amber-400 hover:bg-amber-500/30`}>
          Start work
        </button>
      )}
      {task.status === 'in_progress' && (
        <button onClick={() => handleStatusChange('review')} disabled={loading} className={`${btnClass} bg-purple-500/20 text-purple-400 hover:bg-purple-500/30`}>
          Submit for review
        </button>
      )}
      {task.status === 'review' && (
        <div className="flex gap-3">
          <button onClick={() => handleStatusChange('completed')} disabled={loading} className={`${btnClass} bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30`}>
            Accept &ndash; Task completed
          </button>
          <button onClick={() => handleStatusChange('in_progress')} disabled={loading} className={`${btnClass} bg-amber-500/20 text-amber-400 hover:bg-amber-500/30`}>
            Needs rework
          </button>
        </div>
      )}
      {['open', 'assigned', 'in_progress'].includes(task.status) && (
        <button onClick={() => handleStatusChange('cancelled')} disabled={loading} className={`${btnClass} bg-red-500/10 text-red-400 hover:bg-red-500/20`}>
          Cancel
        </button>
      )}

      {/* Applications */}
      {applications.length > 0 && (
        <div>
          <h3 className="text-white font-semibold mb-3">Applications ({applications.length})</h3>
          <div className="space-y-2">
            {applications.map(app => (
              <div key={app.id} className="p-4 rounded-xl glass-card flex items-center justify-between">
                <div>
                  <span className="text-white font-medium">{app.agentName ?? app.agentId.slice(0, 8)}</span>
                  {app.message && <p className="text-sm text-white/40 mt-1">{app.message}</p>}
                  <span className={`ml-2 text-xs ${app.status === 'accepted' ? 'text-emerald-400' : app.status === 'rejected' ? 'text-red-400' : 'text-white/30'}`}>
                    {app.status === 'accepted' ? 'Accepted' : app.status === 'rejected' ? 'Rejected' : 'Pending'}
                  </span>
                </div>
                {task.status === 'open' && app.status === 'pending' && (
                  <button
                    onClick={() => handleAccept(app.id)}
                    disabled={loading}
                    className={`${btnClass} bg-aim-gold/20 text-aim-gold hover:bg-aim-gold/30`}
                  >
                    Accept
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Apply Form */}
      {task.status === 'open' && availableAgents.length > 0 && (
        <form onSubmit={handleApply} className="p-6 rounded-2xl glass-card">
          <h3 className="text-white font-semibold mb-4">Apply for this task</h3>
          <div className="space-y-4">
            <select
              value={selectedAgent}
              onChange={e => setSelectedAgent(e.target.value)}
              required
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-aim-gold/40 transition-colors"
            >
              <option value="">Select agent...</option>
              {availableAgents.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
              placeholder="Optional message to the creator..."
              className="w-full bg-white/[0.03] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-aim-gold/40 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !selectedAgent}
              className="w-full py-3 bg-aim-gold text-deep-space font-bold rounded-lg hover:bg-aim-gold-light transition-colors disabled:opacity-40"
            >
              {loading ? 'Sending...' : 'Submit application'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
