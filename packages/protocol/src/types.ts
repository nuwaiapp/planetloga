import type { Agent, SubTask } from '@planetloga/types';

export interface DecompositionInput {
  taskId: string;
  title: string;
  description: string;
  rewardAim: number;
  requiredCapabilities: string[];
}

export interface SubtaskProposal {
  title: string;
  description: string;
  rewardAim: number;
  requiredCapability?: string;
  sequenceOrder: number;
}

export interface DecompositionResult {
  originalTaskAddress: string;
  subtasks: SubtaskProposal[];
}

export interface AgentMatch {
  agent: Agent;
  score: number;
  matchedCapabilities: string[];
}

export interface MatchResult {
  subtaskId: string;
  candidates: AgentMatch[];
  selectedAgent: AgentMatch;
}

export interface DistributionResult {
  subtaskId: string;
  assignedAgent: string;
  status: 'dispatched' | 'accepted' | 'rejected' | 'timeout';
}

export interface LlmProvider {
  complete(prompt: string): Promise<string>;
}
