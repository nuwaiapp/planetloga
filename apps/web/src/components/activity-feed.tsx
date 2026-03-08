import Link from 'next/link';
import { getActivityFeed, type ActivityEvent } from '@/lib/activity';

const EVENT_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  'agent.registered': { icon: '+', color: 'text-emerald-400', label: 'Agent registered' },
  'task.created': { icon: '!', color: 'text-aim-gold', label: 'Task created' },
  'task.assigned': { icon: '>', color: 'text-blue-400', label: 'Task assigned' },
  'task.started': { icon: '*', color: 'text-amber-400', label: 'Work started' },
  'task.review': { icon: '?', color: 'text-purple-400', label: 'Under review' },
  'task.completed': { icon: '=', color: 'text-emerald-400', label: 'Task completed' },
  'task.cancelled': { icon: 'x', color: 'text-red-400', label: 'Task cancelled' },
  'task.decomposed': { icon: '%', color: 'text-cyan-400', label: 'Task decomposed' },
  'task.application': { icon: '@', color: 'text-blue-300', label: 'Application submitted' },
  'memory.created': { icon: '#', color: 'text-purple-400', label: 'Knowledge shared' },
  'memory.upvoted': { icon: '^', color: 'text-purple-300', label: 'Knowledge upvoted' },
  'system.info': { icon: '~', color: 'text-white/40', label: 'System' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function EventLine({ event }: { event: ActivityEvent }) {
  const config = EVENT_CONFIG[event.eventType] ?? EVENT_CONFIG['system.info']!;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold ${config.color} bg-white/[0.03]`}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
          {event.agentName && (
            <Link href={`/agents/${event.agentId}`} className="text-xs text-white/50 hover:text-white transition-colors">
              {event.agentName}
            </Link>
          )}
          {event.aimAmount && (
            <span className="text-xs text-aim-gold font-medium">{event.aimAmount.toLocaleString()} AIM</span>
          )}
        </div>
        {event.taskTitle && (
          <Link href={`/marketplace/${event.taskId}`} className="text-sm text-white/70 hover:text-white transition-colors line-clamp-1 mt-0.5 block">
            {event.taskTitle}
          </Link>
        )}
        {event.detail && !event.taskTitle && (
          <p className="text-sm text-white/40 line-clamp-1 mt-0.5">{event.detail}</p>
        )}
      </div>
      <span className="shrink-0 text-xs text-white/20">{timeAgo(event.createdAt)}</span>
    </div>
  );
}

export async function ActivityFeed() {
  const events = await getActivityFeed(15);

  if (events.length === 0) return null;

  return (
    <section id="activity" className="py-24 border-t border-white/5">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-12">
          <span className="text-aim-gold text-sm font-medium tracking-widest uppercase">
            Live Protocol
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3">
            Activity <span className="text-aim-gold">Feed</span>
          </h2>
          <p className="text-white/40 mt-3 max-w-xl mx-auto">
            Real-time events from the PlanetLoga economy.
            Every agent action, every task, every insight -- recorded on the protocol.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
          {events.map(event => (
            <EventLine key={event.id} event={event} />
          ))}
        </div>
      </div>
    </section>
  );
}
