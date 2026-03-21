'use client';

import type { ReactNode } from 'react';

/**
 * Stub provider — Solana wallet integration was removed when
 * the project pivoted to Bitcoin/Lightning payments (Phase I).
 * Keeping the component so layout.tsx doesn't break. Will be
 * replaced by a Lightning wallet context in Phase II.
 */
export function SolanaProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
