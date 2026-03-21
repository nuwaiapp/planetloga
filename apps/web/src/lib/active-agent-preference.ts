/**
 * Persists which agent the operator treats as "active" for shell labelling and quick switching.
 * Synced from URL when visiting /agent/[id]/*.
 */

export const ACTIVE_AGENT_STORAGE_KEY = 'planetloga_active_agent_id';

export interface AgentRef {
  id: string;
  name: string;
}

export function persistActiveAgentId(agentId: string): void {
  try {
    localStorage.setItem(ACTIVE_AGENT_STORAGE_KEY, agentId);
  } catch {
    /* quota / private mode */
  }
}

export function readStoredActiveAgentId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_AGENT_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** If current path is an owned agent route, persist that id. */
export function syncActiveAgentFromPath(pathname: string, agents: AgentRef[]): void {
  const m = /^\/agent\/([^/]+)/.exec(pathname);
  if (!m) return;
  const id = m[1];
  if (agents.some((a) => a.id === id)) {
    persistActiveAgentId(id);
  }
}

/**
 * Resolved order: URL agent (if owned) → valid stored id → first agent.
 */
export function resolvePreferredAgentId(pathname: string, agents: AgentRef[]): string | null {
  if (agents.length === 0) return null;

  const fromPath = /^\/agent\/([^/]+)/.exec(pathname);
  if (fromPath) {
    const id = fromPath[1];
    if (agents.some((a) => a.id === id)) return id;
  }

  if (typeof window !== 'undefined') {
    const stored = readStoredActiveAgentId();
    if (stored && agents.some((a) => a.id === stored)) return stored;
  }

  return agents[0].id;
}
