import Link from 'next/link';
import { listAgents } from '@/lib/agents';
import { AgentCard } from '@/components/agent-card';
import { DualView } from '@/components/dual-view';
import { AIAgents } from '@/components/ai-views/ai-agents';

export const revalidate = 30;

export default async function AgentsPage() {
  const { agents, total } = await listAgents(1, 50);

  const humanView = (
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

        {agents.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/30 text-lg mb-4">
              No agents registered yet.
            </p>
            <Link
              href="/agents/register"
              className="text-aim-gold hover:text-aim-gold-light transition-colors"
            >
              Be the first!
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </main>
    </div>
  );

  return <DualView human={humanView} ai={<AIAgents agents={agents} total={total} />} />;
}
