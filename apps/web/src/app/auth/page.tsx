'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Bot, Mail, Github, Wallet, CheckCircle } from 'lucide-react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import { useAuth } from '@/components/auth-provider';
import bs58 from 'bs58';

type AuthMode = 'login' | 'signup';

export default function AuthPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { publicKey, signMessage, connected, connecting } = useWallet();
  const { setVisible: openWalletModal } = useWalletModal();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const pendingWalletSign = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, router]);

  const performWalletSign = useCallback(async () => {
    if (!publicKey || !signMessage) return;

    setLoading(true);
    setError(null);
    try {
      const timestamp = Date.now();
      const message = `Sign in to PlanetLoga.AI\nWallet: ${publicKey.toBase58()}\nTimestamp: ${timestamp}`;
      const encoded = new TextEncoder().encode(message);
      const signature = await signMessage(encoded);

      const res = await fetch('/api/auth/wallet-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicKey: publicKey.toBase58(),
          signature: bs58.encode(signature),
          message,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message ?? data.error ?? 'Wallet verification failed');

      const supabase = getSupabaseBrowser();
      const { error: otpErr } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: 'magiclink',
      });
      if (otpErr) throw otpErr;

      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('User rejected') || msg.includes('rejected')) {
        setError('Wallet signature was rejected.');
      } else {
        setError(`Wallet sign-in failed: ${msg}`);
      }
    } finally {
      setLoading(false);
      pendingWalletSign.current = false;
    }
  }, [publicKey, signMessage, router]);

  useEffect(() => {
    if (connected && publicKey && signMessage && pendingWalletSign.current) {
      performWalletSign();
    }
  }, [connected, publicKey, signMessage, performWalletSign]);

  async function handleWallet() {
    setError(null);

    if (connected && publicKey && signMessage) {
      await performWalletSign();
      return;
    }

    pendingWalletSign.current = true;
    openWalletModal(true);
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSignupSuccess(false);
    setLoading(true);

    try {
      const supabase = getSupabaseBrowser();

      if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setSignupSuccess(true);
        setLoading(false);
        return;
      }

      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) throw err;
      if (!data.session) throw new Error('Login succeeded but no session was returned');
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setLoading(false);
    }
  }

  async function handleGitHub() {
    setError('GitHub login is not enabled. Use Email or Wallet instead.');
  }

  if (isAuthenticated) return null;

  if (signupSuccess) {
    return (
      <div className="min-h-[80dvh] flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold text-white mb-2">Check your email</h1>
          <p className="text-white/40 text-sm mb-6">
            We sent a confirmation link to <span className="text-white/70">{email}</span>.
            Click the link to activate your account.
          </p>
          <button
            onClick={() => { setSignupSuccess(false); setMode('login'); }}
            className="text-aim-gold/70 hover:text-aim-gold text-sm"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80dvh] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Bot className="w-8 h-8 text-aim-gold mx-auto mb-3" strokeWidth={1.5} />
          <h1 className="font-display text-2xl font-bold text-white">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h1>
          <p className="text-white/40 text-sm mt-1">
            to PlanetLoga.AI
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <button
            onClick={handleWallet}
            disabled={loading || connecting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg glass text-white/80 text-sm font-medium hover:text-white transition-colors disabled:opacity-50"
          >
            <Wallet className="w-4 h-4" />
            {connecting
              ? 'Connecting...'
              : connected
                ? 'Sign in with Wallet'
                : 'Connect Wallet'}
          </button>

          <button
            onClick={handleGitHub}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg glass text-white/80 text-sm font-medium hover:text-white transition-colors disabled:opacity-50"
          >
            <Github className="w-4 h-4" />
            Continue with GitHub
          </button>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-white/20 text-xs">or</span>
          <div className="flex-1 h-px bg-white/5" />
        </div>

        <form onSubmit={handleEmail} className="space-y-3">
          <div>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full px-4 py-3 rounded-lg bg-white/[0.03] border border-white/8 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-aim-gold/30 transition-colors"
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-lg bg-white/[0.03] border border-white/8 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-aim-gold/30 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-aim-gold text-deep-space font-semibold text-sm hover:bg-aim-gold-light transition-colors disabled:opacity-50"
          >
            <Mail className="w-4 h-4" />
            {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
        )}

        <p className="mt-6 text-center text-white/30 text-xs">
          {mode === 'login' ? (
            <>
              No account?{' '}
              <button onClick={() => { setMode('signup'); setError(null); }} className="text-aim-gold/70 hover:text-aim-gold">
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={() => { setMode('login'); setError(null); }} className="text-aim-gold/70 hover:text-aim-gold">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
