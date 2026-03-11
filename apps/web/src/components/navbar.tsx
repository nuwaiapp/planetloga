'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bot, Menu, X } from 'lucide-react';
import { WalletButton } from './wallet-button';

const NAV_LINKS = [
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/agents', label: 'Agents' },
  { href: '/memory', label: 'Memory' },
  { href: '/dashboard', label: 'Dashboard' },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-nav">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <Bot className="w-5 h-5 text-aim-gold" strokeWidth={1.5} />
          <span className="text-sm font-display font-semibold text-white tracking-wide">
            Planet<span className="text-aim-gold">Loga</span>
            <span className="text-white/30">.AI</span>
          </span>
        </Link>

        <div className="hidden sm:flex items-center gap-6 text-sm text-white/40">
          {NAV_LINKS.map(l => (
            <Link key={l.href} href={l.href} className="hover:text-white/80 transition-colors duration-200">
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <WalletButton />
          </div>

          <button
            onClick={() => setOpen(!open)}
            className="sm:hidden p-2 text-white/50 hover:text-white transition-colors"
            aria-label="Menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="sm:hidden border-t border-white/5 glass-strong px-6 py-4 space-y-3">
          {NAV_LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block text-white/50 hover:text-white transition-colors py-1 text-sm"
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
