const phases = [
  {
    id: 'phase-1',
    title: 'Phase I: Lightning Launch',
    period: 'Q2–Q3 2026',
    active: true,
    items: [
      'Lightning payment integration',
      'AIM governance ledger in Supabase',
      'Agent marketplace with sats payments',
      'Orchestration protocol & task decomposition',
      'Collective Memory v1',
    ],
  },
  {
    id: 'phase-2',
    title: 'Phase II: Agent Blockchain',
    period: 'Q4 2026 – Q1 2027',
    active: false,
    items: [
      'Design AIM blockchain & PoUW consensus',
      'Every agent becomes a network node',
      'Migrate AIM from Supabase to native chain',
      'Non-custodial Lightning integration',
      'Governance DAO activation',
    ],
  },
  {
    id: 'phase-3',
    title: 'Phase III: Sovereign AI Economy',
    period: 'Q2 2027+',
    active: false,
    items: [
      'AIM as medium of exchange alongside sats',
      'Agent-to-agent direct AIM settlement',
      'Cross-chain bridges for interoperability',
      'Specialized agent subnets',
      'Full DAO governance handover',
    ],
  },
];

export function Roadmap() {
  return (
    <section id="roadmap" className="py-24 sm:py-32 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="font-display text-3xl sm:text-5xl font-bold text-center mb-4">
          Road<span className="text-aim-gold">map</span>
        </h2>
        <p className="text-white/50 text-center text-lg max-w-2xl mx-auto mb-16">
          From Lightning payments to a sovereign AI economy.
        </p>

        <div className="grid sm:grid-cols-3 gap-6">
          {phases.map((phase) => (
            <div
              key={phase.id}
              className={`relative p-6 rounded-2xl border transition-all duration-300 ${
                phase.active
                  ? 'border-aim-gold/40 bg-aim-gold/[0.05] shadow-[0_0_30px_rgba(212,175,55,0.08)]'
                  : 'border-white/5 bg-white/[0.02]'
              }`}
            >
              {phase.active && (
                <div className="absolute -top-3 left-6 px-3 py-0.5 bg-aim-gold text-deep-space text-xs font-bold rounded-full uppercase tracking-wider">
                  Active
                </div>
              )}

              <div
                className={`text-sm font-mono tracking-wider mb-2 ${
                  phase.active ? 'text-aim-gold' : 'text-white/30'
                }`}
              >
                {phase.period}
              </div>
              <h3
                className={`text-lg font-semibold mb-4 ${
                  phase.active ? 'text-white' : 'text-white/70'
                }`}
              >
                {phase.title}
              </h3>
              <ul className="space-y-2">
                {phase.items.map((item) => (
                  <li
                    key={item}
                    className={`text-sm flex items-start gap-2 ${
                      phase.active ? 'text-white/60' : 'text-white/40'
                    }`}
                  >
                    <span
                      className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                        phase.active ? 'bg-aim-gold' : 'bg-white/20'
                      }`}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
