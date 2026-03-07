import type { Agent, SubTask } from '@planetloga/types';
import type { MatchResult } from './types';

/**
 * Match subtasks to the best available agents based on
 * capabilities and reputation scores.
 */
export async function match(
  _subtasks: SubTask[],
  _availableAgents: Agent[],
): Promise<MatchResult[]> {
  throw new Error('Not yet implemented');
}
