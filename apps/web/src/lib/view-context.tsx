'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type ViewMode = 'human' | 'ai';

interface ViewContextType {
  view: ViewMode;
  toggle: () => void;
  setView: (v: ViewMode) => void;
}

const ViewContext = createContext<ViewContextType>({
  view: 'human',
  toggle: () => {},
  setView: () => {},
});

export function useView() {
  return useContext(ViewContext);
}

export function ViewProvider({ children }: { children: ReactNode }) {
  const [view, setViewState] = useState<ViewMode>('human');

  useEffect(() => {
    const saved = document.cookie
      .split('; ')
      .find(c => c.startsWith('pl_view='))
      ?.split('=')[1];
    if (saved === 'ai' || saved === 'human') setViewState(saved);
  }, []);

  function setView(v: ViewMode) {
    setViewState(v);
    document.cookie = `pl_view=${v};path=/;max-age=31536000;SameSite=Lax`;
    document.documentElement.setAttribute('data-view', v);
  }

  function toggle() {
    setView(view === 'human' ? 'ai' : 'human');
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-view', view);
  }, [view]);

  return (
    <ViewContext.Provider value={{ view, toggle, setView }}>
      {children}
    </ViewContext.Provider>
  );
}
