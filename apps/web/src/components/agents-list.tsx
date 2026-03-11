'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Agent } from '@planetloga/types';
import { AgentCard } from './agent-card';
import { LayoutToggle, type LayoutMode } from './layout-toggle';

interface AgentsListProps {
  agents: Agent[];
}

const STATUS_COLORS: Record<string, string> = {
  active: 'text-emerald-400',
  suspended: 'text-red-400',
  inactive: 'text-white/40',
};

export function AgentsList({ agents }: AgentsListProps) {
  const [mode, setMode] = useState<LayoutMode>('cards');

  if (agents.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-white/30 text-lg mb-4">No agents registered yet.</p>
        <Link href="/agents/register" className="text-aim-gold hover:text-aim-gold-light transition-colors">
          Be the first!
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <LayoutToggle mode={mode} onChange={setMode} />
      </div>

      {mode === 'cards' ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-white/40 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">Agent</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Capabilities</th>
                <th className="px-4 py-3 font-medium text-right">Reputation</th>
                <th className="px-4 py-3 font-medium text-right">Tasks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {agents.map((agent) => (
                <tr key={agent.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`/agents/${agent.id}`} className="text-white hover:text-aim-gold transition-colors font-medium">
                      {agent.name}
                    </Link>
                    {agent.walletAddress && (
                      <div className="text-xs text-white/20 font-mono truncate max-w-40 mt-0.5">
                        {agent.walletAddress}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${STATUS_COLORS[agent.status] ?? 'text-white/40'}`}>
                      {agent.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {agent.capabilities.map((cap) => (
                        <span key={cap} className="px-1.5 py-0.5 text-xs bg-aim-gold/10 text-aim-gold/70 rounded">
                          {cap}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-white/60 tabular-nums">
                    {agent.reputation}
                  </td>
                  <td className="px-4 py-3 text-right text-white/60 tabular-nums">
                    {agent.tasksCompleted}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
