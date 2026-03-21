'use client';

import { useEffect, useState } from 'react';

export interface MyAgentRow {
  id: string;
  name: string;
}

export function useMyAgents(ownerId: string | undefined) {
  const [agents, setAgents] = useState<MyAgentRow[]>([]);
  const [loading, setLoading] = useState(Boolean(ownerId));

  useEffect(() => {
    if (!ownerId) {
      setAgents([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ ownerId });
    fetch(`/api/agents?${params}`)
      .then((r) => (r.ok ? r.json() : { agents: [] }))
      .then((data) => {
        if (cancelled) return;
        setAgents(
          (data.agents ?? []).map((a: { id: string; name: string }) => ({ id: a.id, name: a.name })),
        );
      })
      .catch(() => {
        if (!cancelled) setAgents([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  return { agents, loading };
}
