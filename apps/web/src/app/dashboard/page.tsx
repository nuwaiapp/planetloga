import { fetchTokenStats, ADDRESSES } from '@/lib/solana';
import { DashboardClient } from '@/components/dashboard-client';

export const revalidate = 30;

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

function truncateAddress(addr: string): string {
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

export default async function DashboardPage() {
  const stats = await fetchTokenStats();

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-2">
          AIM Token <span className="text-aim-gold">Dashboard</span>
        </h1>
        <p className="text-white/40">
          Live data directly from the Solana blockchain (Devnet)
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Max Supply', value: formatNumber(stats.maxSupply), sub: 'AIM' },
            { label: 'Circulating', value: formatNumber(stats.circulatingSupply), sub: 'AIM' },
            { label: 'Burned', value: formatNumber(stats.totalBurned), sub: 'AIM' },
            {
              label: 'Burn Rate',
              value: `${(stats.burnRateBps / 100).toFixed(1)}%`,
              sub: 'per TX',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="p-5 rounded-xl glass-card"
            >
              <div className="text-[10px] text-white/30 uppercase tracking-widest mb-2">
                {item.label}
              </div>
              <div className="text-2xl font-bold text-white">{item.value}</div>
              <div className="text-xs text-white/30 mt-1">{item.sub}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <DashboardClient />

        <div className="space-y-6">
          <div className="rounded-2xl glass-card p-8">
            <h2 className="text-xl font-semibold text-white mb-6">
              Token Details
            </h2>
            <div className="space-y-4">
              {[
                {
                  label: 'Program',
                  value: truncateAddress(ADDRESSES.programId),
                  href: `https://explorer.solana.com/address/${ADDRESSES.programId}?cluster=devnet`,
                },
                {
                  label: 'Mint',
                  value: truncateAddress(ADDRESSES.mint),
                  href: `https://explorer.solana.com/address/${ADDRESSES.mint}?cluster=devnet`,
                },
                { label: 'Name', value: 'AI Money' },
                { label: 'Symbol', value: 'AIM' },
                { label: 'Decimals', value: '9' },
                { label: 'Network', value: 'Solana Devnet' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex justify-between items-center py-2 border-b border-white/5 last:border-0"
                >
                  <span className="text-sm text-white/40">{item.label}</span>
                  {'href' in item && item.href ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-aim-gold/70 hover:text-aim-gold font-mono transition-colors"
                    >
                      {item.value} ↗
                    </a>
                  ) : (
                    <span className="text-sm text-white/70 font-mono">
                      {item.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-aim-gold/20 bg-aim-gold/5 p-6">
            <div className="flex items-start gap-3">
              <span className="text-aim-gold text-lg">💡</span>
              <div>
                <h3 className="text-sm font-semibold text-aim-gold mb-1">
                  Devnet Mode
                </h3>
                <p className="text-xs text-aim-gold/60 leading-relaxed">
                  The AIM token is currently running on Solana Devnet. All values are
                  test data. Switch your wallet to Devnet to see AIM.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
