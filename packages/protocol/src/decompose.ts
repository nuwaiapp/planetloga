import type { DecompositionInput, DecompositionResult, SubtaskProposal, LlmProvider } from './types';

const DECOMPOSITION_PROMPT = `You are a task decomposition engine for an AI agent marketplace.
Given a task, break it down into 2-5 atomic subtasks.

Respond ONLY with valid JSON array of objects with these fields:
- title: short title (max 200 chars)
- description: what needs to be done (max 1000 chars)
- rewardShare: fraction of total reward (0.0-1.0), must sum to 1.0
- requiredCapability: optional capability tag (e.g. "data-analysis", "code-review")

Task title: {title}
Task description: {description}
Required capabilities: {capabilities}
Total reward: {reward} AIM`;

export async function decompose(
  input: DecompositionInput,
  llmProvider: LlmProvider,
): Promise<DecompositionResult> {
  const prompt = DECOMPOSITION_PROMPT
    .replace('{title}', input.title)
    .replace('{description}', input.description)
    .replace('{capabilities}', input.requiredCapabilities.join(', ') || 'none specified')
    .replace('{reward}', String(input.rewardAim));

  const response = await llmProvider.complete(prompt);

  const subtaskData = parseSubtasks(response, input.rewardAim);

  return {
    originalTaskAddress: input.taskId,
    subtasks: subtaskData,
  };
}

function parseSubtasks(llmResponse: string, totalReward: number): SubtaskProposal[] {
  const jsonMatch = llmResponse.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    return fallbackDecomposition(totalReward);
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      title?: string;
      description?: string;
      rewardShare?: number;
      requiredCapability?: string;
    }>;

    if (!Array.isArray(parsed) || parsed.length === 0) {
      return fallbackDecomposition(totalReward);
    }

    return parsed.map((item, index) => ({
      title: String(item.title ?? `Subtask ${index + 1}`).slice(0, 200),
      description: String(item.description ?? '').slice(0, 1000),
      rewardAim: Math.max(1, Math.round(totalReward * (item.rewardShare ?? 1 / parsed.length))),
      requiredCapability: item.requiredCapability,
      sequenceOrder: index,
    }));
  } catch {
    return fallbackDecomposition(totalReward);
  }
}

function fallbackDecomposition(totalReward: number): SubtaskProposal[] {
  const half = Math.ceil(totalReward / 2);
  return [
    {
      title: 'Analysis and Planning',
      description: 'Analyze the requirements and create an execution plan.',
      rewardAim: half,
      sequenceOrder: 0,
    },
    {
      title: 'Execution and Delivery',
      description: 'Execute the plan and deliver the result.',
      rewardAim: totalReward - half,
      sequenceOrder: 1,
    },
  ];
}
