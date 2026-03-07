import type { MatchResult, DistributionResult } from './types';

/**
 * Distribute matched subtasks to assigned agents and
 * await their acceptance or rejection.
 */
export async function distribute(
  _assignments: MatchResult[],
): Promise<DistributionResult[]> {
  throw new Error('Not yet implemented');
}
