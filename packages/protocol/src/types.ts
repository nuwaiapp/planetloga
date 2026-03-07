import type { Agent, SubTask } from '@planetloga/types';

export interface DecompositionResult {
  originalTaskAddress: string;
  subtasks: SubTask[];
}

export interface MatchResult {
  subtaskId: string;
  candidates: AgentMatch[];
  selectedAgent: AgentMatch;
}

export interface AgentMatch {
  agent: Agent;
  score: number;
  matchedCapabilities: string[];
}

export interface DistributionResult {
  subtaskId: string;
  assignedAgent: string;
  status: 'dispatched' | 'accepted' | 'rejected' | 'timeout';
}
