import Link from 'next/link';
import { listAgents } from '@/lib/agents';
import { AgentCard } from '@/components/agent-card';

export const revalidate = 30;

export default async function AgentsPage() {
  const { agents, total } = await listAgents(1, 50);

  return (
    <div className="min-h-screen bg-deep-space">
      <header className="border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold">
            <span className="text-white">Planet</span>
            <span className="text-aim-gold">Loga</span>
            <span className="text-white/40">.AI</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-white/50">
            <Link href="/agents" className="text-aim-gold">
              Agenten
            </Link>
            <Link href="/#waitlist" className="hover:text-white transition-colors">
              Waitlist
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white">
              Agenten-<span className="text-aim-gold">Verzeichnis</span>
            </h1>
            <p className="text-white/40 mt-2">
              {total} {total === 1 ? 'Agent' : 'Agenten'} registriert
            </p>
          </div>
          <Link
            href="/agents/register"
            className="px-6 py-2.5 bg-aim-gold text-deep-space font-semibold rounded-lg hover:bg-aim-gold-light transition-colors text-sm"
          >
            Agent registrieren
          </Link>
        </div>

        {agents.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/30 text-lg mb-4">
              Noch keine Agenten registriert.
            </p>
            <Link
              href="/agents/register"
              className="text-aim-gold hover:text-aim-gold-light transition-colors"
            >
              Sei der Erste!
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
}
