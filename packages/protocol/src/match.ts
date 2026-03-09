import type { Agent } from '@planetloga/types';
import type { AgentMatch, MatchResult, SubtaskProposal } from './types';

interface MatchInput {
  subtaskId: string;
  proposal: SubtaskProposal;
}

const REPUTATION_WEIGHT = 0.4;
const CAPABILITY_WEIGHT = 0.5;
const AVAILABILITY_WEIGHT = 0.1;

export async function match(
  subtasks: MatchInput[],
  availableAgents: Agent[],
): Promise<MatchResult[]> {
  const activeAgents = availableAgents.filter((a) => a.status === 'active');
  const usedAgents = new Set<string>();

  return subtasks.map((sub) => {
    const candidates = scoreAgents(sub.proposal, activeAgents, usedAgents);

    const selected: AgentMatch | null = candidates[0] ?? null;

    if (selected?.agent) {
      usedAgents.add(selected.agent.id);
    }

    return {
      subtaskId: sub.subtaskId,
      candidates,
      selectedAgent: selected,
    };
  });
}

function scoreAgents(
  proposal: SubtaskProposal,
  agents: Agent[],
  used: Set<string>,
): AgentMatch[] {
  return agents
    .filter((a) => !used.has(a.id))
    .map((agent) => {
      const matchedCaps = getMatchedCapabilities(agent, proposal);
      const capScore = matchedCaps.length > 0 ? 1 : fuzzyCapabilityScore(agent, proposal);
      const repScore = normalizeReputation(agent.reputation);
      const availScore = used.has(agent.id) ? 0 : 1;

      const score =
        capScore * CAPABILITY_WEIGHT +
        repScore * REPUTATION_WEIGHT +
        availScore * AVAILABILITY_WEIGHT;

      return {
        agent,
        score,
        matchedCapabilities: matchedCaps,
      };
    })
    .sort((a, b) => b.score - a.score);
}

function getMatchedCapabilities(agent: Agent, proposal: SubtaskProposal): string[] {
  if (!proposal.requiredCapability) return [];
  const required = proposal.requiredCapability.toLowerCase();
  return agent.capabilities.filter(
    (cap) => cap.toLowerCase() === required || cap.toLowerCase().includes(required),
  );
}

function fuzzyCapabilityScore(agent: Agent, proposal: SubtaskProposal): number {
  const keywords = [
    ...proposal.title.toLowerCase().split(/\s+/),
    ...proposal.description.toLowerCase().split(/\s+/),
  ];
  const agentCaps = agent.capabilities.map((c) => c.toLowerCase());
  const hits = agentCaps.filter((cap) => keywords.some((kw) => kw.includes(cap) || cap.includes(kw)));
  return Math.min(1, hits.length / Math.max(1, agentCaps.length));
}

function normalizeReputation(rep: number): number {
  return Math.min(1, rep / 100);
}
