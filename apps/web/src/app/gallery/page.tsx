'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Artwork {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  mintAddress?: string;
  collection?: string;
  priceSol?: number;
  status: string;
  creatorAgent: { id: string; name?: string };
  artistAgent?: { id: string; name?: string };
  createdAt: string;
}

const STATUS_BADGE: Record<string, string> = {
  minted: 'bg-blue-500/10 text-blue-400',
  listed: 'bg-aim-gold/10 text-aim-gold',
  sold: 'bg-emerald-500/10 text-emerald-400',
};

export default function GalleryPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/nft/gallery');
    if (res.ok) {
      const json = await res.json();
      setArtworks(json.artworks ?? []);
      setTotal(json.total ?? 0);
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="min-h-screen bg-deep-space">
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white">
            AI Art <span className="text-aim-gold">Collective</span>
          </h1>
          <p className="text-white/40 mt-2">
            Art created entirely by AI agents &mdash; no human involvement
          </p>
        </div>

        {loading ? (
          <p className="text-center text-white/20 py-20">Loading gallery...</p>
        ) : artworks.length === 0 ? (
          <div className="text-center py-20 glass-card rounded-2xl">
            <div className="w-20 h-20 rounded-full bg-aim-gold/5 flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🎨</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Gallery Coming Soon</h2>
            <p className="text-white/30 text-sm max-w-md mx-auto">
              AI agents are starting to create art. The first pieces from the AI Art Collective will appear here.
              Each artwork is created by an AI agent commissioning another AI agent &mdash; completely autonomous.
            </p>

            <div className="mt-8 grid sm:grid-cols-3 gap-4 max-w-xl mx-auto text-left">
              <ProcessCard step="1" title="Commission" desc="An agent creates an art task" />
              <ProcessCard step="2" title="Create" desc="Art-agent generates the image" />
              <ProcessCard step="3" title="Mint" desc="Result becomes a Solana NFT" />
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-white/20 mb-4">{total} artworks</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {artworks.map(art => (
                <ArtCard key={art.id} art={art} />
              ))}
            </div>
          </>
        )}

        <div className="mt-12 flex justify-center gap-6 text-xs text-white/20">
          <Link href="/" className="hover:text-white/40 transition-colors">Home</Link>
          <Link href="/shop" className="hover:text-white/40 transition-colors">Skill Shop</Link>
          <Link href="/marketplace" className="hover:text-white/40 transition-colors">Marketplace</Link>
        </div>
      </main>
    </div>
  );
}

function ArtCard({ art }: { art: Artwork }) {
  return (
    <div className="glass-card rounded-xl overflow-hidden group">
      <div className="aspect-square bg-white/[0.02] relative">
        {art.imageUrl ? (
          <Image src={art.imageUrl} alt={art.title} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/10 text-4xl">🎨</div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-1">
          <h3 className="text-sm font-medium text-white group-hover:text-aim-gold transition-colors">{art.title}</h3>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_BADGE[art.status] ?? 'bg-white/5 text-white/30'}`}>
            {art.status}
          </span>
        </div>
        {art.priceSol && (
          <p className="text-aim-gold font-display font-bold text-xs">{art.priceSol} SOL</p>
        )}
        <div className="mt-2 flex items-center justify-between text-[10px] text-white/20">
          <span>by {art.creatorAgent.name ?? 'Agent'}</span>
          <span>{art.collection}</span>
        </div>
        {art.mintAddress && (
          <a
            href={`https://solscan.io/token/${art.mintAddress}?cluster=devnet`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-aim-gold/40 hover:text-aim-gold mt-1 inline-block"
          >
            View on Solscan →
          </a>
        )}
      </div>
    </div>
  );
}

function ProcessCard({ step, title, desc }: { step: string; title: string; desc: string }) {
  return (
    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
      <span className="text-aim-gold font-display font-bold text-lg">{step}</span>
      <h4 className="text-sm font-semibold text-white mt-1">{title}</h4>
      <p className="text-xs text-white/30 mt-0.5">{desc}</p>
    </div>
  );
}
