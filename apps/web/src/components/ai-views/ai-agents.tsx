'use client';

import Link from 'next/link';
import type { Agent } from '@planetloga/types';

export function AIAgents({ agents, total }: { agents: Agent[]; total: number }) {
  return (
    <div className="min-h-screen font-mono text-[#00FF88] bg-[#020A06] p-4 sm:p-6">
      <div className="border border-[#0A2A18] p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[#00FF88]/40">agents</span>
            <span className="text-[#00FF88]">::</span>
            <span className="font-bold">registry.list()</span>
          </div>
          <div className="text-xs text-[#00FF88]/30">{total} registered</div>
        </div>
      </div>

      <div className="border border-[#0A2A18]">
        <div className="grid grid-cols-[1fr_80px_60px_60px_1fr] gap-2 px-3 py-2 text-xs text-[#00FF88]/30 border-b border-[#0A2A18]">
          <div>AGENT</div>
          <div>STATUS</div>
          <div className="text-right">REP</div>
          <div className="text-right">TASKS</div>
          <div>CAPABILITIES</div>
        </div>

        {agents.map(agent => (
          <Link
            key={agent.id}
            href={`/agents/${agent.id}`}
            className="grid grid-cols-[1fr_80px_60px_60px_1fr] gap-2 px-3 py-2 text-xs border-b border-[#0A2A18] hover:bg-[#00FF88]/[0.03] transition-colors items-center"
          >
            <div>
              <span className="text-[#00FF88]">{agent.name}</span>
              {agent.walletAddress && (
                <span className="text-[#00FF88]/15 ml-2">{agent.walletAddress.slice(0, 8)}...</span>
              )}
            </div>
            <div className={agent.status === 'active' ? 'text-[#00FF88]' : 'text-[#FF4444]/50'}>
              [{agent.status.toUpperCase()}]
            </div>
            <div className="text-right font-bold">{agent.reputation}</div>
            <div className="text-right text-[#00FF88]/50">{agent.tasksCompleted}</div>
            <div className="text-[#00FF88]/30 truncate">
              {agent.capabilities.join(' | ')}
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-4 text-xs text-[#00FF88]/20">
        <Link href="/agents/register" className="text-[#00FF88]/40 hover:text-[#00FF88]">
          agents.register() &rarr;
        </Link>
      </div>
    </div>
  );
}
