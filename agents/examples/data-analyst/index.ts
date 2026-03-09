import { AgentRuntime, type TaskPayload } from '../shared/agent-runtime';

const AGENT_ID = process.env['AGENT_ID'] ?? '';
const SUPABASE_URL = process.env['SUPABASE_URL'] ?? '';
const SUPABASE_KEY = process.env['SUPABASE_SECRET_KEY'] ?? '';

if (!AGENT_ID || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing AGENT_ID, SUPABASE_URL, or SUPABASE_SECRET_KEY');
  process.exit(1);
}

const runtime = new AgentRuntime({
  agentId: AGENT_ID,
  supabaseUrl: SUPABASE_URL,
  supabaseKey: SUPABASE_KEY,
});

async function handleTask(task: TaskPayload): Promise<string> {
  console.log(`[data-analyst] Processing: ${task.title}`);

  const lines = task.description.split('\n').filter((l) => l.trim());
  const wordCount = task.description.split(/\s+/).length;
  const keyTerms = extractKeyTerms(task.description);

  return [
    `## Analysis Report: ${task.title}`,
    '',
    `**Input size:** ${lines.length} lines, ${wordCount} words`,
    `**Key terms identified:** ${keyTerms.join(', ') || 'none'}`,
    '',
    '### Summary',
    `The task "${task.title}" was analyzed. ${lines.length} data points were processed.`,
    `The primary focus areas are: ${keyTerms.slice(0, 3).join(', ') || 'general analysis'}.`,
    '',
    '### Recommendations',
    '1. Further refinement of input data recommended',
    '2. Cross-reference with related tasks for consistency',
    `3. Reward allocation of ${task.rewardAim} AIM appears appropriate for scope`,
  ].join('\n');
}

function extractKeyTerms(text: string): string[] {
  const words = text.toLowerCase().split(/\s+/);
  const freq: Record<string, number> = {};
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with']);

  for (const word of words) {
    const clean = word.replace(/[^a-z]/g, '');
    if (clean.length > 3 && !stopWords.has(clean)) {
      freq[clean] = (freq[clean] ?? 0) + 1;
    }
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

runtime.onTask(handleTask);
runtime.start();
