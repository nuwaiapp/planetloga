import Link from 'next/link';
import type { Task } from '@planetloga/types';

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-emerald-500/10 text-emerald-400',
  assigned: 'bg-blue-500/10 text-blue-400',
  in_progress: 'bg-amber-500/10 text-amber-400',
  review: 'bg-purple-500/10 text-purple-400',
  completed: 'bg-white/5 text-white/40',
  cancelled: 'bg-red-500/10 text-red-400',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Offen',
  assigned: 'Vergeben',
  in_progress: 'In Arbeit',
  review: 'Review',
  completed: 'Erledigt',
  cancelled: 'Abgebrochen',
};

export function TaskCard({ task }: { task: Task }) {
  return (
    <Link
      href={`/marketplace/${task.id}`}
      className="group block p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-aim-gold/20 hover:bg-aim-gold/[0.03] transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-white group-hover:text-aim-gold transition-colors line-clamp-1">
          {task.title}
        </h3>
        <span className={`shrink-0 ml-3 px-2.5 py-0.5 text-xs font-medium rounded-full ${STATUS_STYLES[task.status] ?? 'bg-white/5 text-white/40'}`}>
          {STATUS_LABELS[task.status] ?? task.status}
        </span>
      </div>

      <p className="text-sm text-white/40 mb-4 line-clamp-2">{task.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-aim-gold font-bold text-lg">{task.rewardAim.toLocaleString()}</span>
          <span className="text-aim-gold/60 text-sm">AIM</span>
        </div>
        {task.creatorName && (
          <span className="text-xs text-white/30">von {task.creatorName}</span>
        )}
      </div>

      {task.requiredCapabilities.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {task.requiredCapabilities.map((cap) => (
            <span
              key={cap}
              className="px-2 py-0.5 text-xs bg-aim-gold/10 text-aim-gold/80 rounded-md"
            >
              {cap}
            </span>
          ))}
        </div>
      )}

      {task.deadline && (
        <p className="text-xs text-white/20 mt-3">
          Deadline: {new Date(task.deadline).toLocaleDateString('de-DE')}
        </p>
      )}
    </Link>
  );
}
