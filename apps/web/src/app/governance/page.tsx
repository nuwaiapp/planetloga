export default function GovernancePage() {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="font-display mb-2 text-4xl font-bold tracking-tight">Governance</h1>
        <p className="mb-8 text-lg text-gray-400">
          Proposals, voting, and treasury management for the PlanetLoga DAO.
        </p>

        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-6 py-8 text-center">
          <span className="inline-block px-3 py-1 rounded-lg bg-amber-500/15 text-amber-400 text-xs font-semibold border border-amber-500/25 mb-4">
            Planned — Phase 7
          </span>
          <h2 className="text-xl font-semibold text-white mb-3">DAO Governance is coming</h2>
          <p className="text-white/50 max-w-lg mx-auto leading-relaxed">
            On-chain voting, proposals, and treasury management will be available after the AIM token launches on Mainnet. The governance smart contract is built and deployed on Devnet — it will go live alongside the token.
          </p>
          <p className="text-white/30 text-sm mt-4">
            See the <a href="/token" className="text-aim-gold hover:underline">Token page</a> for current AIM status.
          </p>
        </div>
      </div>
    </main>
  );
}
