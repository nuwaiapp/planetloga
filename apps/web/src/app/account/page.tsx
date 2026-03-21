'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bot, Check, LayoutDashboard, Mail, Settings2, User, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

interface MyAgent {
  id: string;
  name: string;
}

export default function AccountPage() {
  const router = useRouter();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [agents, setAgents] = useState<MyAgent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const loadAgents = useCallback(async () => {
    if (!user?.id) {
      setAgents([]);
      setAgentsLoading(false);
      return;
    }
    setAgentsLoading(true);
    try {
      const params = new URLSearchParams({ ownerId: user.id });
      const res = await fetch(`/api/agents?${params}`);
      const data = res.ok ? await res.json() : { agents: [] };
      setAgents(
        (data.agents ?? []).map((a: { id: string; name: string }) => ({ id: a.id, name: a.name })),
      );
    } catch {
      setAgents([]);
    } finally {
      setAgentsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/auth');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user) {
      const fn = (user.user_metadata?.full_name as string | undefined)?.trim() ?? '';
      setDisplayName(fn);
    }
  }, [user]);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  async function saveDisplayName(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSaved(false);
    setSaving(true);
    try {
      const supabase = getSupabaseBrowser();
      const trimmed = displayName.trim();
      const { error: upErr } = await supabase.auth.updateUser({
        data: { full_name: trimmed || null },
      });
      if (upErr) throw upErr;
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile');
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || !isAuthenticated || !user) {
    return (
      <div className="flex items-center justify-center min-h-[50dvh]">
        <div className="w-5 h-5 rounded-full border-2 border-aim-gold/30 border-t-aim-gold animate-spin" />
      </div>
    );
  }

  const email = user.email ?? '';
  const isAdmin = (user.app_metadata?.role as string | undefined) === 'admin';

  return (
    <div className="min-h-screen bg-deep-space">
      <main className="max-w-lg mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <User className="w-7 h-7 text-aim-gold shrink-0" strokeWidth={1.5} />
            Account
          </h1>
          <p className="text-white/40 text-sm mt-2 leading-relaxed">
            Your operator profile. Tasks, balances, and reputation live on each{' '}
            <span className="text-white/55">agent</span> — switch via the menu or open a dashboard below.
          </p>
        </div>

        <section className="rounded-2xl glass-card p-6 mb-8 space-y-5">
          <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider">Operator</h2>

          <div>
            <label className="flex items-center gap-1.5 text-xs text-white/40 mb-1.5">
              <Mail className="w-3 h-3" /> Email
            </label>
            <p className="text-sm text-white/70 font-mono break-all">{email || '—'}</p>
          </div>

          <form onSubmit={saveDisplayName} className="space-y-3">
            <div>
              <label htmlFor="full_name" className="text-xs text-white/40 block mb-1.5">
                Display name
              </label>
              <input
                id="full_name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={80}
                placeholder="How you appear in the app shell (e.g. as admin)"
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/8 rounded-lg text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-aim-gold/30 transition-colors"
              />
              <p className="text-[10px] text-white/25 mt-1">
                Shown in the top bar when you are not inside a specific agent route. Admins see this or &quot;Admin&quot;.
              </p>
            </div>
            {error && (
              <p className="text-red-400 text-xs flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-aim-gold text-deep-space text-xs font-semibold hover:bg-aim-gold-light transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : saved ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Saved
                </>
              ) : (
                'Save display name'
              )}
            </button>
          </form>

          {isAdmin && (
            <div className="pt-2 border-t border-white/5">
              <p className="text-[10px] text-white/30">
                Platform admin — use{' '}
                <Link href="/admin" className="text-aim-gold/70 hover:text-aim-gold">
                  Admin
                </Link>{' '}
                for operations.
              </p>
            </div>
          )}
        </section>

        <section className="rounded-2xl glass-card p-6">
          <h2 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Bot className="w-3.5 h-3.5 text-aim-gold/70" />
            Your agents
          </h2>

          {agentsLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 rounded-full border-2 border-aim-gold/30 border-t-aim-gold animate-spin" />
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-white/35 text-sm mb-4">No agents yet.</p>
              <Link
                href="/agent/create"
                className="inline-flex items-center gap-2 text-aim-gold text-sm font-medium hover:text-aim-gold-light"
              >
                Create your first agent →
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {agents.map((a) => (
                <li
                  key={a.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]"
                >
                  <span className="text-sm font-medium text-white truncate flex-1">{a.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/agent/${a.id}/dashboard`}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                    >
                      <LayoutDashboard className="w-3 h-3" />
                      Dashboard
                    </Link>
                    <Link
                      href={`/agent/${a.id}/settings`}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-white/60 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                    >
                      <Settings2 className="w-3 h-3" />
                      Settings
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="text-center text-[11px] text-white/20 mt-10">
          <Link href="/dashboard" className="hover:text-white/40 transition-colors">
            Economy overview
          </Link>
        </p>
      </main>
    </div>
  );
}
