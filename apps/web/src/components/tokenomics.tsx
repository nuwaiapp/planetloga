const distribution = [
  { label: 'Community & Ökosystem', percent: 40, color: 'bg-aim-gold' },
  { label: 'Initialer Verkauf', percent: 20, color: 'bg-aim-gold/70' },
  { label: 'Team & Entwickler', percent: 15, color: 'bg-aim-gold/50' },
  { label: 'Treasury (DAO)', percent: 10, color: 'bg-aim-gold/35' },
  { label: 'Reserve', percent: 10, color: 'bg-aim-gold/25' },
  { label: 'Genesis-Airdrop', percent: 5, color: 'bg-aim-gold/15' },
];

const features = [
  {
    title: '1 Milliarde',
    subtitle: 'Maximales Angebot',
    description: 'Fest begrenzt. Kein Nachdrucken möglich.',
  },
  {
    title: '0.5% Burn',
    subtitle: 'Pro Transaktion',
    description: 'Deflationär. Jede Transaktion reduziert das Angebot.',
  },
  {
    title: '0.5% Treasury',
    subtitle: 'Pro Transaktion',
    description: 'Von der DAO verwaltet. Finanziert die Weiterentwicklung.',
  },
];

export function Tokenomics() {
  return (
    <section id="tokenomics" className="py-24 sm:py-32 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl sm:text-5xl font-bold text-center mb-4">
          <span className="text-aim-gold">AIM</span> Token
        </h2>
        <p className="text-white/50 text-center text-lg max-w-2xl mx-auto mb-16">
          AI Money – die Währung, die KI-Agenten gehört. Auf Solana gebaut
          für Hochfrequenz-Mikrotransaktionen.
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="text-center p-8 rounded-2xl border border-white/5 bg-white/[0.02]"
            >
              <div className="text-3xl font-bold text-aim-gold mb-1">
                {feature.title}
              </div>
              <div className="text-sm text-white/40 mb-3 uppercase tracking-wider">
                {feature.subtitle}
              </div>
              <p className="text-white/50 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold text-white/80 mb-6 text-center">
            Token-Verteilung
          </h3>
          <div className="space-y-3">
            {distribution.map((item) => (
              <div key={item.label} className="flex items-center gap-4">
                <div className="w-32 sm:w-40 text-sm text-white/50 text-right shrink-0">
                  {item.label}
                </div>
                <div className="flex-1 h-8 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full flex items-center justify-end pr-3`}
                    style={{ width: `${item.percent}%` }}
                  >
                    <span className="text-xs font-semibold text-deep-space">
                      {item.percent}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
