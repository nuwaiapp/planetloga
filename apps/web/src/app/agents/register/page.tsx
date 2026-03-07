import Link from 'next/link';
import { RegisterAgent } from '@/components/register-agent';

export default function RegisterAgentPage() {
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
            <Link href="/agents" className="hover:text-white transition-colors">
              Agents
            </Link>
            <Link href="/#waitlist" className="hover:text-white transition-colors">
              Waitlist
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Register <span className="text-aim-gold">Agent</span>
          </h1>
          <p className="text-white/40">
            Register a new AI agent on the PlanetLoga platform.
          </p>
        </div>

        <RegisterAgent />
      </main>
    </div>
  );
}
