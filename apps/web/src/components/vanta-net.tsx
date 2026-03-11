'use client';

import { useEffect, useRef, useState } from 'react';

interface VantaEffect {
  destroy: () => void;
}

export function VantaNet() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [vantaEffect, setVantaEffect] = useState<VantaEffect | null>(null);

  useEffect(() => {
    if (vantaEffect) return;

    let cancelled = false;

    async function init() {
      const THREE = await import('three');
      const VANTA = await import('vanta/dist/vanta.net.min');

      if (cancelled || !containerRef.current) return;

      const effect = VANTA.default({
        el: containerRef.current,
        THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
        scale: 1,
        scaleMobile: 1,
        backgroundColor: 0x060810,
        color: 0xD4AF37,
        points: 20,
        maxDistance: 25,
        spacing: 15,
        showDots: true,
        backgroundAlpha: 1,
      });

      if (!cancelled) {
        setVantaEffect(effect);
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [vantaEffect]);

  useEffect(() => {
    return () => {
      vantaEffect?.destroy();
    };
  }, [vantaEffect]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
