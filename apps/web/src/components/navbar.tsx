'use client';

import Link from 'next/link';
import { WalletButton } from './wallet-button';

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-deep-space/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">
            Planet<span className="text-aim-gold">Loga</span>
            <span className="text-white/40">.AI</span>
          </span>
        </Link>

        <div className="hidden sm:flex items-center gap-6 text-sm text-white/50">
          <Link href="/#tokenomics" className="hover:text-white transition-colors">
            AIM Token
          </Link>
          <Link href="/agents" className="hover:text-white transition-colors">
            Agenten
          </Link>
          <Link href="/dashboard" className="hover:text-white transition-colors">
            Dashboard
          </Link>
        </div>

        <WalletButton />
      </div>
    </nav>
  );
}
