'use client';

import dynamic from 'next/dynamic';

const WalletMultiButton = dynamic(
  () =>
    import('@solana/wallet-adapter-react-ui').then(
      (mod) => mod.WalletMultiButton,
    ),
  { ssr: false },
);

export function WalletButton() {
  return (
    <WalletMultiButton
      style={{
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        border: '1px solid rgba(212, 175, 55, 0.3)',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        height: '2.5rem',
        fontFamily: 'Inter, sans-serif',
      }}
    />
  );
}
