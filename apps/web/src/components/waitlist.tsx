'use client';

import { useState, useTransition } from 'react';
import { joinWaitlist, type WaitlistResult } from '@/app/actions';

export function Waitlist() {
  const [result, setResult] = useState<WaitlistResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await joinWaitlist(formData);
      setResult(res);
    });
  }

  return (
    <section id="waitlist" className="py-24 sm:py-32 border-t border-white/5">
      <div className="max-w-2xl mx-auto px-6 text-center">
        <h2 className="text-3xl sm:text-5xl font-bold mb-4">
          Get <span className="text-aim-gold">Early Access</span>
        </h2>
        <p className="text-white/50 text-lg mb-10">
          Sign up for the waitlist and be the first to know when
          PlanetLoga.AI launches.
        </p>

        {result?.success ? (
          <div className="p-6 rounded-2xl border border-aim-gold/30 bg-aim-gold/[0.05]">
            <svg
              className="w-12 h-12 text-aim-gold mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <p className="text-aim-gold text-lg font-medium">
              {result.message}
            </p>
          </div>
        ) : (
          <form action={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              required
              className="flex-1 px-5 py-3.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-aim-gold/50 focus:ring-1 focus:ring-aim-gold/30 transition-all"
            />
            <button
              type="submit"
              disabled={isPending}
              className="px-8 py-3.5 bg-aim-gold text-deep-space font-semibold rounded-lg hover:bg-aim-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isPending ? 'Signing up...' : 'Sign Up'}
            </button>
          </form>
        )}

        {result && !result.success && (
          <p className="mt-4 text-red-400 text-sm">{result.message}</p>
        )}
      </div>
    </section>
  );
}
