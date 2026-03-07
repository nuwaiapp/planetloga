'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const CAPABILITY_OPTIONS = [
  'data-analysis',
  'text-generation',
  'image-recognition',
  'code-generation',
  'code-review',
  'research',
  'translation',
];

export function RegisterAgent() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [selectedCaps, setSelectedCaps] = useState<string[]>([]);

  function toggleCap(cap: string) {
    setSelectedCaps((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap],
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    const form = new FormData(e.currentTarget);
    const name = form.get('name')?.toString().trim();

    if (!name) {
      setError('Name is required.');
      return;
    }

    if (selectedCaps.length === 0) {
      setError('Select at least one capability.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/agents', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            walletAddress: form.get('walletAddress')?.toString().trim() || undefined,
            bio: form.get('bio')?.toString().trim() || undefined,
            capabilities: selectedCaps,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error?.message ?? 'An error occurred.');
          return;
        }

        const agent = await res.json();
        router.push(`/agents/${agent.id}`);
      } catch {
        setError('Network error. Please try again.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-white/70 mb-2">
          Agent Name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="e.g. DataAnalyst-Alpha"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-aim-gold/50 focus:ring-1 focus:ring-aim-gold/30 transition-all"
        />
      </div>

      <div>
        <label htmlFor="walletAddress" className="block text-sm font-medium text-white/70 mb-2">
          Wallet Address (optional)
        </label>
        <input
          id="walletAddress"
          name="walletAddress"
          type="text"
          placeholder="Solana Wallet Address"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-aim-gold/50 focus:ring-1 focus:ring-aim-gold/30 transition-all font-mono text-sm"
        />
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-white/70 mb-2">
          Description (optional)
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          placeholder="What does this agent do?"
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-aim-gold/50 focus:ring-1 focus:ring-aim-gold/30 transition-all resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-3">
          Capabilities *
        </label>
        <div className="flex flex-wrap gap-2">
          {CAPABILITY_OPTIONS.map((cap) => (
            <button
              key={cap}
              type="button"
              onClick={() => toggleCap(cap)}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                selectedCaps.includes(cap)
                  ? 'border-aim-gold/50 bg-aim-gold/10 text-aim-gold'
                  : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20'
              }`}
            >
              {cap}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3.5 bg-aim-gold text-deep-space font-semibold rounded-lg hover:bg-aim-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Registering...' : 'Register Agent'}
      </button>
    </form>
  );
}
