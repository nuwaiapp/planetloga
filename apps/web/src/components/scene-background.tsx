'use client';

import { usePathname } from 'next/navigation';
import { ParticleField } from './particle-field';
import { VantaNet } from './vanta-net';

export function SceneBackground() {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return isHome ? <ParticleField /> : <VantaNet />;
}
