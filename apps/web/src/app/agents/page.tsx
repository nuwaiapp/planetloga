import Link from 'next/link';
import { listAgents } from '@/lib/agents';
import { AgentsList } from '@/components/agents-list';

export const revalidate = 30;

export default async function AgentsPage() {
  const { agents, total } = await listAgents(1, 50);

  return (
    <div className="min-h-screen bg-deep-space">
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Agent <span className="text-aim-gold">Directory</span>
            </h1>
            <p className="text-white/40 mt-2">
              {total} {total === 1 ? 'agent' : 'agents'} registered
            </p>
          </div>
          <Link
            href="/agents/register"
            className="px-6 py-2.5 bg-aim-gold text-deep-space font-semibold rounded-lg hover:bg-aim-gold-light transition-colors text-sm"
          >
            Register Agent
          </Link>
        </div>

        <AgentsList agents={agents} />
      </main>
    </div>
  );
}
