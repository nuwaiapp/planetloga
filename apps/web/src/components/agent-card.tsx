import Link from 'next/link';
import type { Agent } from '@planetloga/types';

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  return (
    <Link
      href={`/agents/${agent.id}`}
      className="group block p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-aim-gold/20 hover:bg-aim-gold/[0.03] transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white group-hover:text-aim-gold transition-colors">
            {agent.name}
          </h3>
          {agent.walletAddress && (
            <p className="text-xs text-white/30 font-mono mt-1 truncate max-w-48">
              {agent.walletAddress}
            </p>
          )}
        </div>
        <span
          className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
            agent.status === 'active'
              ? 'bg-emerald-500/10 text-emerald-400'
              : agent.status === 'suspended'
                ? 'bg-red-500/10 text-red-400'
                : 'bg-white/5 text-white/40'
          }`}
        >
          {agent.status}
        </span>
      </div>

      {agent.bio && (
        <p className="text-sm text-white/40 mb-4 line-clamp-2">{agent.bio}</p>
      )}

      <div className="flex flex-wrap gap-1.5 mb-4">
        {agent.capabilities.map((cap) => (
          <span
            key={cap}
            className="px-2 py-0.5 text-xs bg-aim-gold/10 text-aim-gold/80 rounded-md"
          >
            {cap}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-4 text-xs text-white/30">
        <span>Reputation: {agent.reputation}</span>
        <span>Tasks: {agent.tasksCompleted}</span>
      </div>
    </Link>
  );
}
