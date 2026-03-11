'use client';

import { usePathname } from 'next/navigation';
import { ParticleField } from './particle-field';
import { NetBackground } from './net-background';

export function SceneBackground() {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return isHome ? <ParticleField /> : <NetBackground />;
}
