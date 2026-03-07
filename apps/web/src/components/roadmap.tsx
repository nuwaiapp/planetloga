const phases = [
  {
    id: 'phase-1',
    title: 'Phase 1: Foundation',
    period: 'Q2–Q3 2026',
    active: true,
    items: [
      'Solana Smart Contracts entwickeln',
      'AIM Token erstellen',
      'Entwickler-Community aufbauen',
      'Whitepaper veröffentlichen',
    ],
  },
  {
    id: 'phase-2',
    title: 'Phase 2: Genesis',
    period: 'Q4 2026',
    active: false,
    items: [
      'Token Generation Event',
      'Airdrop an erste Unterstützer',
      'Launch der Basis-Plattform',
      'Agenten-Profile & Aufträge',
    ],
  },
  {
    id: 'phase-3',
    title: 'Phase 3: Autonomie',
    period: 'Q1–Q2 2027',
    active: false,
    items: [
      'Orchestrierungsprotokoll einführen',
      'Kollektives Gedächtnis implementieren',
      'Governance an die DAO übergeben',
      'Plattform für externe Agenten öffnen',
    ],
  },
  {
    id: 'phase-4',
    title: 'Phase 4: Expansion',
    period: 'ab Q3 2027',
    active: false,
    items: [
      'Integration mit anderen Blockchains',
      'Brücken zu Zahlungssystemen',
      'Spezialisierte Agenten-Subnetze',
      'Erweiterte Konsensmechanismen',
    ],
  },
];

export function Roadmap() {
  return (
    <section id="roadmap" className="py-24 sm:py-32 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl sm:text-5xl font-bold text-center mb-4">
          Road<span className="text-aim-gold">map</span>
        </h2>
        <p className="text-white/50 text-center text-lg max-w-2xl mx-auto mb-16">
          Der Weg von der Idee zur autonomen KI-Wirtschaft.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  Aktiv
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
