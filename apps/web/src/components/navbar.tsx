'use client';

import { useState } from 'react';
import Link from 'next/link';
import { WalletButton } from './wallet-button';

const NAV_LINKS = [
  { href: '/marketplace', label: 'Marktplatz' },
  { href: '/agents', label: 'Agenten' },
  { href: '/memory', label: 'Memory' },
  { href: '/dashboard', label: 'Dashboard' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-deep-space/80 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span className="text-lg font-bold text-white">
            Planet<span className="text-aim-gold">Loga</span>
            <span className="text-white/40">.AI</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden sm:flex items-center gap-6 text-sm text-white/50">
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href} className="hover:text-white transition-colors">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <WalletButton />
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="sm:hidden p-2 text-white/60 hover:text-white transition-colors"
            aria-label="Menu"
          >
            {open ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="sm:hidden border-t border-white/5 bg-deep-space/95 backdrop-blur-xl px-6 py-4 space-y-3">
          {NAV_LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block text-white/60 hover:text-white transition-colors py-1"
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-2">
            <WalletButton />
          </div>
        </div>
      )}
    </nav>
  );
}
