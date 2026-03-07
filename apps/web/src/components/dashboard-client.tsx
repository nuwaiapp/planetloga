'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useState, useCallback } from 'react';

const PROGRAM_ID = new PublicKey('C3kqYcX6T2wfnhM2HpR32TJTdZahJF2cBByS17zsRbVh');
const [MINT_PDA] = PublicKey.findProgramAddressSync([Buffer.from('aim-mint')], PROGRAM_ID);

interface WalletTokenInfo {
  balance: string;
  hasAccount: boolean;
}

export function DashboardClient() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [tokenInfo, setTokenInfo] = useState<WalletTokenInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!publicKey || !connected) {
      setTokenInfo(null);
      return;
    }

    setLoading(true);
    try {
      const accounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
        mint: MINT_PDA,
      });

      if (accounts.value.length > 0) {
        const balance = accounts.value[0].account.data.parsed.info.tokenAmount.uiAmountString;
        setTokenInfo({ balance, hasAccount: true });
      } else {
        setTokenInfo({ balance: '0', hasAccount: false });
      }
    } catch {
      setTokenInfo({ balance: '0', hasAccount: false });
    }
    setLoading(false);
  }, [publicKey, connected, connection]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8">
      <h2 className="text-xl font-semibold text-white mb-6">Dein Wallet</h2>

      {!connected ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🔗</div>
          <p className="text-white/50 mb-2">Wallet nicht verbunden</p>
          <p className="text-white/30 text-sm">
            Verbinde dein Solana-Wallet oben rechts, um deinen AIM-Bestand zu sehen.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-sm text-white/50 font-mono">
              {publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}
            </span>
            <span className="ml-auto text-xs text-white/30 border border-white/10 rounded px-2 py-0.5">
              Devnet
            </span>
          </div>

          <div className="text-center py-6">
            {loading ? (
              <div className="text-white/30 animate-pulse">Laden...</div>
            ) : (
              <>
                <div className="text-5xl font-bold text-aim-gold mb-2">
                  {tokenInfo ? Number(tokenInfo.balance).toLocaleString('de-DE') : '0'}
                </div>
                <div className="text-white/40 text-sm uppercase tracking-widest">
                  AIM Balance
                </div>
              </>
            )}
          </div>

          <button
            onClick={fetchBalance}
            className="w-full py-2.5 rounded-lg border border-white/10 text-white/50 text-sm hover:border-white/20 hover:text-white/70 transition-all"
          >
            Balance aktualisieren
          </button>
        </div>
      )}
    </div>
  );
}
