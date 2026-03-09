import type { MatchResult, DistributionResult } from './types';

export interface DistributionOptions {
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 30_000;

export async function distribute(
  assignments: MatchResult[],
  _options?: DistributionOptions,
): Promise<DistributionResult[]> {
  return assignments.map((assignment) => ({
    subtaskId: assignment.subtaskId,
    assignedAgent: assignment.selectedAgent?.agent?.id ?? '',
    status: assignment.selectedAgent?.agent ? 'dispatched' as const : 'timeout' as const,
  }));
}
