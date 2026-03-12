'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bot, Menu, X, LogOut, User, LayoutDashboard, Shield } from 'lucide-react';
import { useAuth } from './auth-provider';

const NAV_LINKS = [
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/agents', label: 'Agents' },
  { href: '/memory', label: 'Memory' },
  { href: '/dashboard', label: 'Dashboard' },
];

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function UserMenu() {
  const { user, walletAddress, signOut, loading } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  if (loading) {
    return <div className="w-16 h-8 rounded-lg bg-white/5 animate-pulse" />;
  }

  if (!user) {
    return (
      <Link
        href="/auth"
        className="px-4 py-1.5 rounded-lg bg-aim-gold text-deep-space text-xs font-semibold hover:bg-aim-gold-light transition-colors"
      >
        Sign In
      </Link>
    );
  }

  const label = walletAddress
    ? truncateAddress(walletAddress)
    : user.email?.split('@')[0] ?? 'Account';

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass text-white/70 text-xs font-medium hover:text-white transition-colors"
      >
        <User className="w-3.5 h-3.5" />
        {label}
      </button>

      {dropdownOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
          <div className="absolute right-0 mt-2 w-44 rounded-lg glass-strong py-1 z-50">
            <Link
              href="/dashboard"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              Dashboard
            </Link>
            <Link
              href="/agents/register"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Bot className="w-3.5 h-3.5" />
              Register Agent
            </Link>
            <Link
              href="/admin"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              Admin
            </Link>
            <button
              onClick={() => { signOut(); setDropdownOpen(false); }}
              className="w-full flex items-center gap-2 px-4 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-nav">
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <Bot className="w-6 h-6 text-aim-gold" strokeWidth={1.5} />
          <span className="text-base font-display font-semibold text-white tracking-wide">
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
            <UserMenu />
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
            <UserMenu />
          </div>
        </div>
      )}
    </nav>
  );
}
