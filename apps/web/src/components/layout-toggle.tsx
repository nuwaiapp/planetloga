'use client';

export type LayoutMode = 'cards' | 'table';

interface LayoutToggleProps {
  mode: LayoutMode;
  onChange: (mode: LayoutMode) => void;
}

export function LayoutToggle({ mode, onChange }: LayoutToggleProps) {
  return (
    <div className="flex items-center border border-white/10 rounded-lg overflow-hidden">
      <button
        onClick={() => onChange('cards')}
        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
          mode === 'cards'
            ? 'bg-white/10 text-white'
            : 'text-white/40 hover:text-white/60'
        }`}
        aria-label="Card view"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      </button>
      <button
        onClick={() => onChange('table')}
        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
          mode === 'table'
            ? 'bg-white/10 text-white'
            : 'text-white/40 hover:text-white/60'
        }`}
        aria-label="Table view"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
        </svg>
      </button>
    </div>
  );
}
