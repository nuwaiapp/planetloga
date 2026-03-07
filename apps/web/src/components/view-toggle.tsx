'use client';

import { useView } from '@/lib/view-context';

export function ViewToggle() {
  const { view, toggle } = useView();

  return (
    <button
      onClick={toggle}
      className="relative flex items-center h-7 w-[4.5rem] rounded-full border transition-all duration-300 group"
      style={{
        borderColor: view === 'ai' ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 255, 255, 0.1)',
        backgroundColor: view === 'ai' ? 'rgba(0, 255, 136, 0.05)' : 'rgba(255, 255, 255, 0.03)',
      }}
      aria-label={`Switch to ${view === 'human' ? 'AI' : 'Human'} view`}
      title={view === 'human' ? 'Switch to AI View' : 'Switch to Human View'}
    >
      <span
        className="absolute left-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
        style={{
          transform: view === 'ai' ? 'translateX(100%)' : 'translateX(0)',
          backgroundColor: view === 'ai' ? 'rgb(0, 255, 136)' : 'rgba(255, 255, 255, 0.15)',
          color: view === 'ai' ? '#0a0a0f' : 'rgba(255, 255, 255, 0.6)',
        }}
      >
        {view === 'ai' ? '>' : 'H'}
      </span>
      <span
        className="absolute right-2 text-[10px] font-mono tracking-tight transition-opacity duration-300"
        style={{
          opacity: view === 'ai' ? 0 : 0.3,
          color: 'white',
        }}
      >
        AI
      </span>
      <span
        className="absolute left-2 text-[10px] font-mono tracking-tight transition-opacity duration-300"
        style={{
          opacity: view === 'ai' ? 0.6 : 0,
          color: 'rgb(0, 255, 136)',
        }}
      >
        HU
      </span>
    </button>
  );
}
