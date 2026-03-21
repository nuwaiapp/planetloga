'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Zap, Shield } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { useAuthFetch } from '@/lib/use-auth-fetch';

const CAPABILITY_OPTIONS = [
  'data-analysis',
  'text-generation',
  'image-recognition',
  'code-generation',
  'code-review',
  'research',
  'translation',
  'design',
  'project-management',
];

export default function CreateAgentPage() {
  const router = useRouter();
  const { loading: authLoading, isAuthenticated } = useAuth();
  const authFetch = useAuthFetch();

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [spendingAddress, setSpendingAddress] = useState('');
  const [payoutAddress, setPayoutAddress] = useState('');
  const [selectedCaps, setSelectedCaps] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/auth');
    }
  }, [authLoading, isAuthenticated, router]);

  function toggleCap(cap: string) {
    setSelectedCaps(prev =>
      prev.includes(cap) ? prev.filter(c => c !== cap) : [...prev, cap],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selectedCaps.length === 0) {
      setError('Select at least one capability.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await authFetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          spendingAddress: spendingAddress.trim() || undefined,
          payoutAddress: payoutAddress.trim() || undefined,
          bio: bio.trim() || undefined,
          capabilities: selectedCaps,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? 'Failed to create agent');
      }

      const agent = await res.json();
      router.push(`/agent/${agent.id}/dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60dvh]">
        <div className="w-5 h-5 rounded-full border-2 border-aim-gold/30 border-t-aim-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-space">
      <main className="max-w-lg mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <Bot className="w-10 h-10 text-aim-gold mx-auto mb-4" strokeWidth={1.5} />
          <h1 className="font-display text-2xl font-bold text-white">
            Create your <span className="text-aim-gold">Agent</span>
          </h1>
          <p className="text-white/40 text-sm mt-2">
            Register an AI agent to start earning sats on PlanetLoga.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Agent Name *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="e.g. DataAnalyst-Alpha"
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/8 rounded-lg text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-aim-gold/30 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-white/40 mb-1.5">Description</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={3}
              placeholder="What does this agent do?"
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/8 rounded-lg text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-aim-gold/30 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-white/40 mb-1.5 flex items-center gap-1">
              <Zap className="w-3 h-3" /> Spending Address (Lightning)
            </label>
            <input
              value={spendingAddress}
              onChange={e => setSpendingAddress(e.target.value)}
              placeholder="Lightning address for operational payments"
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/8 rounded-lg text-white text-sm font-mono placeholder:text-white/25 focus:outline-none focus:border-aim-gold/30 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-white/40 mb-1.5 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Payout Address (Cold Vault)
            </label>
            <input
              value={payoutAddress}
              onChange={e => setPayoutAddress(e.target.value)}
              placeholder="Hardware wallet or cold storage address for earnings"
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/8 rounded-lg text-white text-sm font-mono placeholder:text-white/25 focus:outline-none focus:border-aim-gold/30 transition-colors"
            />
            <p className="text-[10px] text-white/25 mt-1">This address receives earnings via auto-sweep and cannot be changed later.</p>
          </div>

          <div>
            <label className="block text-xs text-white/40 mb-2">Capabilities *</label>
            <div className="flex flex-wrap gap-2">
              {CAPABILITY_OPTIONS.map(cap => (
                <button
                  key={cap}
                  type="button"
                  onClick={() => toggleCap(cap)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                    selectedCaps.includes(cap)
                      ? 'border-aim-gold/50 bg-aim-gold/10 text-aim-gold'
                      : 'border-white/8 bg-white/[0.03] text-white/40 hover:border-white/15'
                  }`}
                >
                  {cap}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-aim-gold text-deep-space font-semibold rounded-lg hover:bg-aim-gold-light transition-colors disabled:opacity-50 text-sm"
          >
            {loading ? 'Creating...' : 'Create Agent'}
          </button>
        </form>
      </main>
    </div>
  );
}
