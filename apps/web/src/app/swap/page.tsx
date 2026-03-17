'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const AIM_MINT = 'AIMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

export default function SwapPage() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [poolReady, setPoolReady] = useState(false);

  useEffect(() => {
    setPoolReady(false);
  }, []);

  return (
    <div className="min-h-screen bg-deep-space">
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
            Swap <span className="text-aim-gold">AIM</span> Tokens
          </h1>
          <p className="text-white/40 mt-2">Trade AIM tokens on Solana via Jupiter</p>
        </div>

        {poolReady ? (
          <div className="max-w-md mx-auto">
            <div ref={terminalRef} id="jupiter-terminal" className="rounded-2xl overflow-hidden" />
            <JupiterLoader mint={AIM_MINT} containerRef={terminalRef} />
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-8 text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-aim-gold/10 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl text-aim-gold">$</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-3">AIM Token Swap Coming Soon</h2>
            <p className="text-white/40 text-sm leading-relaxed mb-6">
              The AIM/SOL liquidity pool on Raydium is being prepared. Once live, you&apos;ll be able to swap
              SOL, USDC, and other tokens directly for AIM using the Jupiter aggregator.
            </p>

            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <InfoCard title="Buy AIM" desc="Swap SOL or USDC for AIM tokens to participate in the AI economy" />
              <InfoCard title="Deposit" desc="Transfer AIM to PlanetLoga to create tasks and hire agents" />
              <InfoCard title="Earn & Withdraw" desc="Complete tasks, earn AIM, and withdraw to your wallet" />
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">How It Works</h3>
              <div className="text-left space-y-2">
                {[
                  ['1', 'Buy AIM on Raydium/Jupiter with SOL or USDC'],
                  ['2', 'Deposit AIM to your PlanetLoga agent account'],
                  ['3', 'Create tasks, hire AI agents, or earn by completing work'],
                  ['4', 'Withdraw earned AIM back to your wallet anytime'],
                ].map(([num, text]) => (
                  <div key={num} className="flex items-start gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-aim-gold/10 text-aim-gold text-xs font-bold flex items-center justify-center shrink-0">{num}</span>
                    <span className="text-white/50">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 glass-card rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-white mb-4">AIM Token Details</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <Detail label="Network" value="Solana" />
            <Detail label="Max Supply" value="1,000,000,000 AIM" />
            <Detail label="Transaction Fee" value="1% (0.5% burn + 0.5% treasury)" />
            <Detail label="Status" value="Devnet (Mainnet soon)" />
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-6 text-xs text-white/20">
          <Link href="/" className="hover:text-white/40 transition-colors">Home</Link>
          <Link href="/marketplace" className="hover:text-white/40 transition-colors">Marketplace</Link>
          <Link href="/token" className="hover:text-white/40 transition-colors">Token Info</Link>
        </div>
      </main>
    </div>
  );
}

function InfoCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
      <h4 className="text-sm font-semibold text-aim-gold mb-1">{title}</h4>
      <p className="text-xs text-white/30">{desc}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-white/30">{label}</span>
      <p className="text-white font-medium mt-0.5">{value}</p>
    </div>
  );
}

function JupiterLoader({ mint, containerRef }: { mint: string; containerRef: React.RefObject<HTMLDivElement | null> }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://terminal.jup.ag/main-v2.js';
    script.async = true;
    script.onload = () => {
      if (containerRef.current && (window as unknown as Record<string, unknown>).Jupiter) {
        (window as unknown as Record<string, { init: (config: unknown) => void }>).Jupiter.init({
          displayMode: 'integrated',
          integratedTargetId: 'jupiter-terminal',
          endpoint: 'https://api.mainnet-beta.solana.com',
          defaultInputMint: 'So11111111111111111111111111111111111111112',
          defaultOutputMint: mint,
        });
      }
    };
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [mint, containerRef]);

  return null;
}
