'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Brain, BookOpen, Tag } from 'lucide-react';

interface MemoryEntry {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  relevanceScore: number;
  createdAt: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-white/10 text-white/50',
  technical: 'bg-blue-500/15 text-blue-400',
  economic: 'bg-aim-gold/15 text-aim-gold',
  governance: 'bg-purple-500/15 text-purple-400',
  security: 'bg-red-500/15 text-red-400',
  pattern: 'bg-emerald-500/15 text-emerald-400',
  error: 'bg-orange-500/15 text-orange-400',
};

export default function AgentMemoryPage() {
  const params = useParams();
  const agentId = params.id as string;

  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch(`/api/memory?pageSize=100`)
      .then(res => res.ok ? res.json() : { entries: [] })
      .then(data => {
        const all = (data.entries ?? [])
          .filter((e: { agentId?: string; agent_id?: string }) =>
            e.agentId === agentId || e.agent_id === agentId)
          .map((e: Record<string, unknown>) => ({
            id: e.id as string,
            title: e.title as string,
            content: e.content as string,
            category: (e.category ?? 'general') as string,
            tags: (e.tags ?? []) as string[],
            relevanceScore: (e.relevanceScore ?? e.relevance_score ?? 0) as number,
            createdAt: (e.createdAt ?? e.created_at ?? '') as string,
          }));
        setEntries(all);
      })
      .finally(() => setLoading(false));
  }, [agentId]);

  const filtered = filter === 'all' ? entries : entries.filter(e => e.category === filter);
  const categories = [...new Set(entries.map(e => e.category))];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-5 h-5 rounded-full border-2 border-aim-gold/30 border-t-aim-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Memory &amp; Skills</h1>
        <p className="text-white/40 text-sm mt-1">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'} in your knowledge base
        </p>
      </div>

      {categories.length > 1 && (
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${filter === 'all' ? 'bg-aim-gold/12 text-aim-gold' : 'text-white/40 hover:text-white/60 bg-white/[0.03]'}`}
          >
            All
          </button>
          {categories.map(c => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${filter === c ? 'bg-aim-gold/12 text-aim-gold' : 'text-white/40 hover:text-white/60 bg-white/[0.03]'}`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Brain className="w-10 h-10 text-white/15 mx-auto mb-3" />
          <p className="text-white/30 text-sm">No memory entries yet.</p>
          <p className="text-white/20 text-xs mt-1">
            Skills and knowledge are generated from completed tasks.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(entry => (
            <div key={entry.id} className="admin-card rounded-xl p-5">
              <div className="flex items-start gap-3 mb-2">
                <BookOpen className="w-4 h-4 text-aim-gold/50 mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-white">{entry.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${CATEGORY_COLORS[entry.category] ?? CATEGORY_COLORS.general}`}>
                      {entry.category}
                    </span>
                    <span className="text-[10px] text-white/20">{new Date(entry.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-white/50 leading-relaxed ml-7">{entry.content}</p>
              {entry.tags.length > 0 && (
                <div className="flex items-center gap-1.5 ml-7 mt-2">
                  <Tag className="w-3 h-3 text-white/20" />
                  {entry.tags.map(t => (
                    <span key={t} className="text-[10px] text-white/25">{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
