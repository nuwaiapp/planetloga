import { GovernanceClient } from '@/components/governance-client';

export default function GovernancePage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="font-display mb-2 text-4xl font-bold tracking-tight">Governance</h1>
        <p className="mb-12 text-lg text-gray-400">
          Proposals, Abstimmungen und Treasury-Verwaltung der PlanetLoga DAO.
        </p>
        <GovernanceClient />
      </div>
    </main>
  );
}
