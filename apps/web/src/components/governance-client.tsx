'use client';

import { useEffect, useState } from 'react';

interface Proposal {
  id: string;
  title: string;
  description: string;
  proposer_name?: string;
  votes_for: number;
  votes_against: number;
  status: string;
  created_at: string;
  voting_ends_at: string;
}

export function GovernanceClient() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/governance')
      .then((res) => res.json())
      .then((data) => setProposals(data.proposals ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-gray-400">Proposals werden geladen...</div>;
  }

  if (proposals.length === 0) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-12 text-center">
        <h2 className="mb-2 text-xl font-semibold">Noch keine Proposals</h2>
        <p className="text-gray-400">
          Die DAO-Governance wird aktiviert, sobald der Governance-Contract
          auf Devnet integriert ist.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {proposals.map((p) => (
        <ProposalCard key={p.id} proposal={p} />
      ))}
    </div>
  );
}

function ProposalCard({ proposal }: { proposal: Proposal }) {
  const totalVotes = proposal.votes_for + proposal.votes_against;
  const forPercent = totalVotes > 0 ? Math.round((proposal.votes_for / totalVotes) * 100) : 0;
  const againstPercent = totalVotes > 0 ? 100 - forPercent : 0;

  const statusColors: Record<string, string> = {
    active: 'bg-green-500/10 text-green-400 border-green-500/30',
    passed: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/30',
    executed: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    cancelled: 'bg-gray-500/10 text-gray-400 border-gray-500/30',
  };

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
      <div className="mb-4 flex items-start justify-between">
        <h3 className="text-xl font-semibold">{proposal.title}</h3>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-medium ${statusColors[proposal.status] ?? statusColors.cancelled}`}
        >
          {proposal.status}
        </span>
      </div>

      <p className="mb-4 text-sm text-gray-400">{proposal.description}</p>

      <div className="mb-2 flex items-center gap-4 text-sm">
        <span className="text-green-400">Dafuer: {proposal.votes_for} AIM ({forPercent}%)</span>
        <span className="text-red-400">Dagegen: {proposal.votes_against} AIM ({againstPercent}%)</span>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-gray-800">
        <div
          className="h-full bg-green-500 transition-all"
          style={{ width: `${forPercent}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Erstellt: {new Date(proposal.created_at).toLocaleDateString('de-DE')}</span>
        <span>Endet: {new Date(proposal.voting_ends_at).toLocaleDateString('de-DE')}</span>
      </div>

      {proposal.status === 'active' && (
        <div className="mt-4 flex gap-3">
          <button className="rounded bg-green-600 px-4 py-2 text-sm font-medium transition hover:bg-green-500">
            Dafuer stimmen
          </button>
          <button className="rounded bg-red-600 px-4 py-2 text-sm font-medium transition hover:bg-red-500">
            Dagegen stimmen
          </button>
        </div>
      )}
    </div>
  );
}
