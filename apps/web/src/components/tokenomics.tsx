import { fetchTokenStats, ADDRESSES } from '../lib/solana';

const distribution = [
  { label: 'Community & Ecosystem', percent: 40, color: 'bg-aim-gold' },
  { label: 'Initial Sale', percent: 20, color: 'bg-aim-gold/70' },
  { label: 'Team & Developers', percent: 15, color: 'bg-aim-gold/50' },
  { label: 'Treasury (DAO)', percent: 10, color: 'bg-aim-gold/35' },
  { label: 'Reserve', percent: 10, color: 'bg-aim-gold/25' },
  { label: 'Genesis Airdrop', percent: 5, color: 'bg-aim-gold/15' },
];

function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

function truncateAddress(addr: string): string {
  return addr.slice(0, 4) + '...' + addr.slice(-4);
}

export async function Tokenomics() {
  const stats = await fetchTokenStats();

  const liveMetrics = stats
    ? [
        {
          title: formatNumber(stats.circulatingSupply),
          subtitle: 'Circulating',
          description: `Of ${formatNumber(stats.maxSupply)} max. Verified on-chain.`,
        },
        {
          title: formatNumber(stats.totalBurned),
          subtitle: 'Burned',
          description: 'Permanently removed from circulation.',
        },
        {
          title: `${(stats.burnRateBps / 100).toFixed(1)}% + ${(stats.treasuryRateBps / 100).toFixed(1)}%`,
          subtitle: 'Burn + Treasury',
          description: 'Automatically on every transaction.',
        },
      ]
    : [
        {
          title: '1 Billion',
          subtitle: 'Maximum Supply',
          description: 'Hard-capped. No additional minting possible.',
        },
        {
          title: '0.5% Burn',
          subtitle: 'Per Transaction',
          description: 'Deflationary. Every transaction reduces the supply.',
        },
        {
          title: '0.5% Treasury',
          subtitle: 'Per Transaction',
          description: 'Managed by the DAO. Funds ongoing development.',
        },
      ];

  return (
    <section id="tokenomics" className="py-24 sm:py-32 border-t border-white/5">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="font-display text-3xl sm:text-5xl font-bold text-center mb-4">
          <span className="text-aim-gold">AIM</span> Token
        </h2>
        <p className="text-white/50 text-center text-lg max-w-2xl mx-auto mb-6">
          AI Money – the currency owned by AI agents. Built on Solana
          for high-frequency microtransactions.
        </p>

        {stats && (
          <div className="flex justify-center mb-12">
            <a
              href={`https://explorer.solana.com/address/${ADDRESSES.programId}?cluster=devnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-aim-gold/60 hover:text-aim-gold transition-colors border border-aim-gold/20 rounded-full px-4 py-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Live on Solana Devnet · {truncateAddress(ADDRESSES.programId)}
            </a>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {liveMetrics.map((feature) => (
            <div
              key={feature.subtitle}
              className="text-center p-8 rounded-2xl glass-card"
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
            Token Distribution
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

        {stats && (
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { label: 'Mint', value: truncateAddress(stats.mintAddress), href: `https://explorer.solana.com/address/${stats.mintAddress}?cluster=devnet` },
              { label: 'Program', value: truncateAddress(stats.programId), href: `https://explorer.solana.com/address/${stats.programId}?cluster=devnet` },
              { label: 'Decimals', value: stats.decimals.toString() },
              { label: 'Network', value: 'Devnet' },
            ].map((item) => (
              <div
                key={item.label}
                className="text-center p-3 rounded-xl bg-white/[0.02] border border-white/5"
              >
                <div className="text-[10px] text-white/30 uppercase tracking-widest mb-1">
                  {item.label}
                </div>
                {'href' in item && item.href ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-aim-gold/70 hover:text-aim-gold font-mono transition-colors"
                  >
                    {item.value}
                  </a>
                ) : (
                  <div className="text-sm text-white/60 font-mono">{item.value}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
