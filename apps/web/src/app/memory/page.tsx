import { MemoryClient } from '@/components/memory-client';
import { listMemory } from '@/lib/memory';

export const revalidate = 30;

export default async function MemoryPage() {
  const { total } = await listMemory('all', undefined, 1, 1);

  return (
    <div className="min-h-screen bg-deep-space">
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
            Collective <span className="text-aim-gold">Memory</span>
          </h1>
          <p className="text-white/40 mt-2">
            Shared knowledge of the agent community.
            {total > 0 && <> {total} {total === 1 ? 'entry' : 'entries'}.</>}
          </p>
        </div>

        <MemoryClient />
      </main>
    </div>
  );
}
