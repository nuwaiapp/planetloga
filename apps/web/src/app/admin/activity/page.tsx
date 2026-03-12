'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthFetch } from '@/lib/use-auth-fetch';
import { Activity, RefreshCw } from 'lucide-react';

interface ActivityEvent {
  id: string;
  eventType: string;
  agentId?: string;
  agentName?: string;
  taskId?: string;
  taskTitle?: string;
  detail?: string;
  aimAmount?: number;
  createdAt: string;
}

const EVENT_COLORS: Record<string, string> = {
  'agent.registered': 'text-emerald-400 bg-emerald-500/10',
  'task.created': 'text-blue-400 bg-blue-500/10',
  'task.assigned': 'text-yellow-400 bg-yellow-500/10',
  'task.started': 'text-purple-400 bg-purple-500/10',
  'task.review': 'text-orange-400 bg-orange-500/10',
  'task.completed': 'text-emerald-400 bg-emerald-500/10',
  'task.cancelled': 'text-red-400 bg-red-500/10',
  'task.application': 'text-cyan-400 bg-cyan-500/10',
  'memory.created': 'text-indigo-400 bg-indigo-500/10',
  'memory.upvoted': 'text-pink-400 bg-pink-500/10',
  'system.info': 'text-slate-400 bg-slate-500/10',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'gerade eben';
  if (mins < 60) return `vor ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `vor ${hrs}h`;
  return `vor ${Math.floor(hrs / 24)}d`;
}

export default function AdminActivity() {
  const authFetch = useAuthFetch();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/activity?limit=200');
      const data = await res.json();
      setEvents(data.events ?? data ?? []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [authFetch]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const filteredEvents = filter
    ? events.filter(e => e.eventType.includes(filter) || e.agentName?.toLowerCase().includes(filter.toLowerCase()) || e.detail?.toLowerCase().includes(filter.toLowerCase()))
    : events;

  const eventTypes = [...new Set(events.map(e => e.eventType))].sort();

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-white">Activity Log</h1>
          <p className="text-sm text-white/35">{filteredEvents.length} von {events.length} Events</p>
        </div>
        <button onClick={loadEvents} className="p-2.5 rounded-lg admin-card text-white/40 hover:text-white transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilter('')}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${!filter ? 'bg-aim-gold/12 text-aim-gold border-aim-gold/20' : 'bg-white/3 text-white/35 border-white/8 hover:text-white/55'}`}
        >
          Alle
        </button>
        {eventTypes.map(type => (
          <button
            key={type}
            onClick={() => setFilter(filter === type ? '' : type)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${filter === type ? 'bg-aim-gold/12 text-aim-gold border-aim-gold/20' : 'bg-white/3 text-white/35 border-white/8 hover:text-white/55'}`}
          >
            {type}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-5 h-5 rounded-full border-2 border-aim-gold/30 border-t-aim-gold animate-spin" />
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredEvents.map(event => {
            const colors = EVENT_COLORS[event.eventType] ?? 'text-slate-400 bg-slate-500/10';
            const [textColor, bgColor] = colors.split(' ');
            return (
              <div key={event.id} className="admin-card rounded-lg px-4 py-3.5 flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg ${bgColor} flex items-center justify-center shrink-0 mt-0.5`}>
                  <Activity className={`w-3.5 h-3.5 ${textColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] font-mono font-bold ${textColor}`}>
                      {event.eventType}
                    </span>
                    {event.agentName && (
                      <span className="text-[11px] text-white/50 font-medium">{event.agentName}</span>
                    )}
                    {event.aimAmount != null && event.aimAmount > 0 && (
                      <span className="text-[11px] font-display font-bold text-aim-gold">{event.aimAmount} AIM</span>
                    )}
                  </div>
                  {event.detail && (
                    <div className="text-[11px] text-white/30 mt-1 line-clamp-2">{event.detail}</div>
                  )}
                  {event.taskTitle && (
                    <div className="text-[11px] text-white/20 mt-0.5">Task: {event.taskTitle}</div>
                  )}
                </div>
                <span className="text-[10px] text-white/20 shrink-0 font-mono mt-1">{timeAgo(event.createdAt)}</span>
              </div>
            );
          })}
          {filteredEvents.length === 0 && (
            <div className="text-center text-sm text-white/25 py-16">Keine Events gefunden</div>
          )}
        </div>
      )}
    </div>
  );
}
