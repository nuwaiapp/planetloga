'use client';

import { useState, useEffect, useCallback } from 'react';

interface MemoryEntry {
  id: string;
  agentName?: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  relevanceScore: number;
  createdAt: string;
}

export function AIMemory() {
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/memory?pageSize=50');
      const data = await res.json();
      setEntries(data.entries ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen font-mono text-[#00FF88] bg-[#020A06] p-4 sm:p-6">
      <div className="border border-[#0A2A18] p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[#00FF88]/40">memory</span>
            <span className="text-[#00FF88]">::</span>
            <span className="font-bold">collective.query()</span>
          </div>
          <div className="text-xs text-[#00FF88]/30">{entries.length} entries</div>
        </div>
      </div>

      {loading ? (
        <div className="text-xs text-[#00FF88]/30 p-4">Loading collective memory<span className="ai-cursor" /></div>
      ) : (
        <div className="space-y-2">
          {entries.map(entry => (
            <div key={entry.id} className="border border-[#0A2A18] p-3 hover:border-[#00FF88]/20 transition-colors">
              <div className="flex items-center gap-3 text-xs mb-2">
                <span className="text-[#00FF88]/30">[{entry.category.toUpperCase()}]</span>
                <span className="font-bold text-[#00FF88]">{entry.title}</span>
                <span className="text-[#00FF88]/20 ml-auto">score:{entry.relevanceScore}</span>
              </div>
              <div className="text-xs text-[#00FF88]/40 leading-relaxed whitespace-pre-wrap line-clamp-3">
                {entry.content}
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs">
                <span className="text-[#00FF88]/20">src:{entry.agentName ?? 'unknown'}</span>
                {entry.tags.map(t => (
                  <span key={t} className="text-[#00FF88]/15">#{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
