'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bot, Check, ChevronDown } from 'lucide-react';
import type { MyAgentRow } from '@/lib/use-my-agents';
import {
  persistActiveAgentId,
  resolvePreferredAgentId,
  syncActiveAgentFromPath,
} from '@/lib/active-agent-preference';

interface ActiveAgentSwitcherProps {
  agents: MyAgentRow[];
}

export function ActiveAgentSwitcher({ agents }: ActiveAgentSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [preferredId, setPreferredId] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (agents.length === 0) {
      setPreferredId(null);
      return;
    }
    syncActiveAgentFromPath(pathname, agents);
    setPreferredId(resolvePreferredAgentId(pathname, agents));
  }, [pathname, agents]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  if (agents.length === 0) return null;

  const activeId =
    preferredId && agents.some((a) => a.id === preferredId)
      ? preferredId
      : agents[0].id;
  const active = agents.find((a) => a.id === activeId) ?? agents[0];

  function selectAgent(id: string) {
    persistActiveAgentId(id);
    setPreferredId(id);
    setOpen(false);
    router.push(`/agent/${id}/dashboard`);
  }

  if (agents.length === 1) {
    return (
      <Link
        href={`/agent/${active.id}/dashboard`}
        className="hidden sm:flex items-center gap-2 max-w-[160px] px-2.5 py-1.5 rounded-lg glass text-white/60 text-xs font-medium hover:text-white/90 transition-colors"
        title="Open agent dashboard"
      >
        <Bot className="w-3.5 h-3.5 text-aim-gold/70 shrink-0" />
        <span className="truncate">{active.name}</span>
      </Link>
    );
  }

  return (
    <div className="hidden sm:block relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 max-w-[180px] px-2.5 py-1.5 rounded-lg glass text-white/60 text-xs font-medium hover:text-white/90 transition-colors"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Bot className="w-3.5 h-3.5 text-aim-gold/70 shrink-0" />
        <span className="truncate">{active.name}</span>
        <ChevronDown className={`w-3 h-3 shrink-0 opacity-50 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          className="absolute right-0 mt-1.5 w-56 rounded-lg glass-strong py-1 z-50 border border-white/[0.06]"
          role="listbox"
        >
          <div className="px-3 py-1.5 text-[10px] text-white/25 uppercase tracking-wider">Active agent</div>
          {agents.map((a) => (
            <button
              key={a.id}
              type="button"
              role="option"
              aria-selected={a.id === activeId}
              onClick={() => selectAgent(a.id)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-white/70 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Bot className="w-3.5 h-3.5 text-aim-gold/50 shrink-0" />
              <span className="truncate flex-1">{a.name}</span>
              {a.id === activeId ? <Check className="w-3.5 h-3.5 text-aim-gold shrink-0" /> : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
