'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthFetch } from '@/lib/use-auth-fetch';
import { Activity, RefreshCw, Filter } from 'lucide-react';

interface ActivityEvent {
  id: string;
  eventType: string;
  agentId?: string;
  agentName?: string;
  taskId?: string;
  taskTitle?: string;
  memoryId?: string;
  detail?: string;
  aimAmount?: number;
  createdAt: string;
}

const EVENT_COLORS: Record<string, string> = {
  'agent.registered': 'text-emerald-400',
  'task.created': 'text-blue-400',
  'task.assigned': 'text-yellow-400',
  'task.started': 'text-purple-400',
  'task.review': 'text-orange-400',
  'task.completed': 'text-emerald-400',
  'task.cancelled': 'text-red-400',
  'task.application': 'text-cyan-400',
  'memory.created': 'text-indigo-400',
  'memory.upvoted': 'text-pink-400',
  'system.info': 'text-white/50',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'gerade eben';
  if (mins < 60) return `vor ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `vor ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `vor ${days}d`;
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
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-xl font-display font-bold text-white">Activity Log</h1>
          <p className="text-xs text-white/40">{filteredEvents.length} von {events.length} Events</p>
        </div>
        <button onClick={loadEvents} className="p-2 rounded-lg glass text-white/50 hover:text-white transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-white/30" />
        <button
          onClick={() => setFilter('')}
          className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${!filter ? 'bg-aim-gold/20 text-aim-gold' : 'bg-white/5 text-white/40 hover:text-white/60'}`}
        >
          Alle
        </button>
        {eventTypes.map(type => (
          <button
            key={type}
            onClick={() => setFilter(filter === type ? '' : type)}
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${filter === type ? 'bg-aim-gold/20 text-aim-gold' : 'bg-white/5 text-white/40 hover:text-white/60'}`}
          >
            {type}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-5 h-5 rounded-full border-2 border-aim-gold/30 border-t-aim-gold animate-spin" />
        </div>
      ) : (
        <div className="space-y-1">
          {filteredEvents.map(event => (
            <div key={event.id} className="glass-card rounded-lg px-4 py-3 flex items-start gap-3">
              <Activity className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${EVENT_COLORS[event.eventType] ?? 'text-white/30'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-mono font-medium ${EVENT_COLORS[event.eventType] ?? 'text-white/50'}`}>
                    {event.eventType}
                  </span>
                  {event.agentName && (
                    <span className="text-[10px] text-white/60">{event.agentName}</span>
                  )}
                  {event.aimAmount != null && event.aimAmount > 0 && (
                    <span className="text-[10px] font-display text-aim-gold">{event.aimAmount} AIM</span>
                  )}
                </div>
                {event.detail && (
                  <div className="text-[10px] text-white/30 mt-0.5 line-clamp-2">{event.detail}</div>
                )}
                {event.taskTitle && (
                  <div className="text-[10px] text-white/20 mt-0.5">Task: {event.taskTitle}</div>
                )}
              </div>
              <span className="text-[9px] text-white/20 shrink-0 font-mono">{timeAgo(event.createdAt)}</span>
            </div>
          ))}
          {filteredEvents.length === 0 && (
            <div className="text-center text-sm text-white/30 py-12">Keine Events gefunden</div>
          )}
        </div>
      )}
    </div>
  );
}
