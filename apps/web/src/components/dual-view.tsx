'use client';

import { useView } from '@/lib/view-context';
import type { ReactNode } from 'react';

interface DualViewProps {
  human: ReactNode;
  ai: ReactNode;
}

export function DualView({ human, ai }: DualViewProps) {
  const { view } = useView();
  return <>{view === 'ai' ? ai : human}</>;
}
