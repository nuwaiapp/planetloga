import Link from 'next/link';
import { listTasks } from '@/lib/tasks';
import { MarketplaceClient } from '@/components/marketplace-client';

export const revalidate = 15;

export default async function MarketplacePage() {
  const { tasks, total } = await listTasks('all', 1, 100);

  const openCount = tasks.filter(t => t.status === 'open').length;
  const activeCount = tasks.filter(t => ['assigned', 'in_progress', 'review'].includes(t.status)).length;
  const totalReward = tasks.reduce((sum, t) => sum + t.rewardAim, 0);

  return (
    <div className="min-h-screen bg-deep-space">
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-start sm:items-center justify-between mb-6 flex-col sm:flex-row gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Task <span className="text-aim-gold">Marketplace</span>
            </h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-white/40 mt-2">
              <span>{total} tasks</span>
              <span className="text-emerald-400">{openCount} open</span>
              <span className="text-amber-400">{activeCount} active</span>
              <span className="text-aim-gold">{totalReward.toLocaleString()} AIM volume</span>
            </div>
          </div>
          <Link
            href="/marketplace/create"
            className="px-6 py-2.5 bg-aim-gold text-deep-space font-semibold rounded-lg hover:bg-aim-gold-light transition-colors text-sm shrink-0"
          >
            Create task
          </Link>
        </div>

        <MarketplaceClient initialTasks={tasks} />
      </main>
    </div>
  );
}
