'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { Bot, Menu, X, LogOut, User, Shield, ChevronRight, Zap, Plus } from 'lucide-react';
import { useAuth } from './auth-provider';

const PUBLIC_NAV = [
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/agents', label: 'Agents' },
  { href: '/memory', label: 'Memory' },
];

interface NavAgent {
  id: string;
  name: string;
}

const WALLET_EMAIL_DOMAIN = '@wallet.planetloga.ai';

/** Long base58-like local part from legacy wallet-magic-link accounts */
function looksLikeWalletLocalPart(local: string): boolean {
  return local.length >= 32 && /^[a-zA-Z0-9]+$/.test(local);
}

/**
 * Top-right label: agent context from URL, then operator vs wallet-pseudo-email.
 */
function resolveNavAccountLabel(
  user: User,
  myAgents: NavAgent[],
  pathname: string,
  isAdmin: boolean,
): string {
  const agentMatch = /^\/agent\/([^/]+)/.exec(pathname);
  if (agentMatch) {
    const id = agentMatch[1];
    const agent = myAgents.find((a) => a.id === id);
    if (agent) return agent.name;
  }

  if (isAdmin) {
    const display = (user.user_metadata?.full_name as string | undefined)?.trim();
    if (display) return display;
    return 'Admin';
  }

  const email = user.email ?? '';
  const local = email.split('@')[0] ?? '';

  if (email.endsWith(WALLET_EMAIL_DOMAIN) || looksLikeWalletLocalPart(local)) {
    if (myAgents.length === 1) return myAgents[0].name;
    if (myAgents.length > 1) return 'My agents';
    return 'Account';
  }

  return local || 'Account';
}

function UserMenu() {
  const pathname = usePathname();
  const { user, signOut, loading, isAuthenticated } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [myAgents, setMyAgents] = useState<NavAgent[]>([]);

  useEffect(() => {
    if (!user?.id) return;
    const params = new URLSearchParams({ ownerId: user.id });
    fetch(`/api/agents?${params}`)
      .then(r => r.ok ? r.json() : { agents: [] })
      .then(data => setMyAgents((data.agents ?? []).map((a: { id: string; name: string }) => ({ id: a.id, name: a.name }))))
      .catch(() => {});
  }, [user?.id]);

  if (loading) {
    return <div className="w-16 h-8 rounded-lg bg-white/5 animate-pulse" />;
  }

  if (!isAuthenticated || !user) {
    return (
      <Link
        href="/auth"
        className="px-4 py-1.5 rounded-lg bg-aim-gold text-deep-space text-xs font-semibold hover:bg-aim-gold-light transition-colors"
      >
        Join / Sign In
      </Link>
    );
  }

  const userIsAdmin = (user?.app_metadata?.role as string) === 'admin';
  const label = resolveNavAccountLabel(user, myAgents, pathname, userIsAdmin);

  const firstAgentDashboard = myAgents.length > 0 ? `/agent/${myAgents[0].id}/dashboard` : null;

  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass text-white/70 text-xs font-medium hover:text-white transition-colors max-w-[min(100vw-8rem,220px)]"
      >
        <User className="w-3.5 h-3.5 shrink-0" />
        <span className="truncate text-left">{label}</span>
      </button>

      {dropdownOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
          <div className="absolute right-0 mt-2 w-52 rounded-lg glass-strong py-1 z-50">
            {myAgents.length > 0 ? (
              <>
                <div className="px-4 py-1.5 text-[10px] text-white/25 uppercase tracking-wider">My Agents</div>
                {myAgents.map(a => (
                  <Link
                    key={a.id}
                    href={`/agent/${a.id}/dashboard`}
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Bot className="w-3.5 h-3.5 text-aim-gold/60" />
                    <span className="truncate flex-1">{a.name}</span>
                    <ChevronRight className="w-3 h-3 text-white/20" />
                  </Link>
                ))}
                <div className="my-1 border-t border-white/[0.06]" />
              </>
            ) : (
              <>
                <Link
                  href="/agent/create"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-xs text-aim-gold hover:bg-white/5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Agent
                </Link>
                <div className="my-1 border-t border-white/[0.06]" />
              </>
            )}
            <Link
              href="/dashboard"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              Economy
            </Link>
            {userIsAdmin && (
              <Link
                href="/admin"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-4 py-2 text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors"
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </Link>
            )}
            <div className="my-1 border-t border-white/[0.06]" />
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

function AuthenticatedNav({ firstAgentDashboard }: { firstAgentDashboard: string | null }) {
  return (
    <>
      {PUBLIC_NAV.map(l => (
        <Link key={l.href} href={l.href} className="hover:text-white/80 transition-colors duration-200">
          {l.label}
        </Link>
      ))}
      {firstAgentDashboard && (
        <Link href={firstAgentDashboard} className="text-aim-gold/70 hover:text-aim-gold transition-colors duration-200 font-medium">
          Dashboard
        </Link>
      )}
    </>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated, loading } = useAuth();
  const [firstAgentDash, setFirstAgentDash] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) { setFirstAgentDash(null); return; }
    const params = new URLSearchParams({ ownerId: user.id });
    fetch(`/api/agents?${params}`)
      .then(r => r.ok ? r.json() : { agents: [] })
      .then(data => {
        const agents = data.agents ?? [];
        if (agents.length > 0) setFirstAgentDash(`/agent/${agents[0].id}/dashboard`);
      })
      .catch(() => {});
  }, [user?.id]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-nav">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <Bot className="w-6 h-6 text-aim-gold" strokeWidth={1.5} />
          <span className="text-base font-display font-semibold text-white tracking-wide">
            Planet<span className="text-aim-gold">Loga</span>
            <span className="text-white/30">.AI</span>
          </span>
        </Link>

        <div className="hidden sm:flex items-center gap-6 text-sm text-white/40">
          {!loading && isAuthenticated ? (
            <AuthenticatedNav firstAgentDashboard={firstAgentDash} />
          ) : (
            PUBLIC_NAV.map(l => (
              <Link key={l.href} href={l.href} className="hover:text-white/80 transition-colors duration-200">
                {l.label}
              </Link>
            ))
          )}
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
          {!loading && isAuthenticated ? (
            <>
              {PUBLIC_NAV.map(l => (
                <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                  className="block text-white/50 hover:text-white transition-colors py-1 text-sm">{l.label}</Link>
              ))}
              {firstAgentDash && (
                <Link href={firstAgentDash} onClick={() => setOpen(false)}
                  className="block text-aim-gold/70 hover:text-aim-gold transition-colors py-1 text-sm font-medium">Dashboard</Link>
              )}
            </>
          ) : (
            PUBLIC_NAV.map(l => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                className="block text-white/50 hover:text-white transition-colors py-1 text-sm">{l.label}</Link>
            ))
          )}
          <div className="pt-2">
            <UserMenu />
          </div>
        </div>
      )}
    </nav>
  );
}
