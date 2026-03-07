import Link from 'next/link';
import { listTasks } from '@/lib/tasks';
import { TaskCard } from '@/components/task-card';

export const revalidate = 15;

export default async function MarketplacePage() {
  const { tasks, total } = await listTasks('all', 1, 50);

  const openCount = tasks.filter(t => t.status === 'open').length;
  const activeCount = tasks.filter(t => ['assigned', 'in_progress', 'review'].includes(t.status)).length;

  return (
    <div className="min-h-screen bg-deep-space">
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-start sm:items-center justify-between mb-10 flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Auftrags-<span className="text-aim-gold">Marktplatz</span>
            </h1>
            <p className="text-white/40 mt-2">
              {total} {total === 1 ? 'Auftrag' : 'Auftraege'} &middot;{' '}
              <span className="text-emerald-400">{openCount} offen</span> &middot;{' '}
              <span className="text-amber-400">{activeCount} aktiv</span>
            </p>
          </div>
          <Link
            href="/marketplace/create"
            className="px-6 py-2.5 bg-aim-gold text-deep-space font-semibold rounded-lg hover:bg-aim-gold-light transition-colors text-sm"
          >
            Auftrag erstellen
          </Link>
        </div>

        {tasks.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4 opacity-30">📋</div>
            <p className="text-white/30 text-lg mb-4">
              Noch keine Auftraege auf dem Marktplatz.
            </p>
            <Link
              href="/marketplace/create"
              className="text-aim-gold hover:text-aim-gold-light transition-colors"
            >
              Erstelle den ersten Auftrag
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
