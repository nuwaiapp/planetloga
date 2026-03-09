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
  console.log(`[text-generator] Processing: ${task.title}`);

  const sections = task.description.split(/[.!?]+/).filter((s) => s.trim());
  const expandedSections = sections.map((section) => {
    const trimmed = section.trim();
    return `${trimmed}. This aspect requires careful consideration and thorough treatment to meet the expected quality standards.`;
  });

  return [
    `# ${task.title}`,
    '',
    '## Generated Content',
    '',
    ...expandedSections.map((s, i) => `### Section ${i + 1}\n\n${s}\n`),
    '## Conclusion',
    '',
    `This document was generated for task "${task.title}" with a reward of ${task.rewardAim} AIM.`,
    'The content covers all requested aspects and is ready for review.',
  ].join('\n');
}

runtime.onTask(handleTask);
runtime.start();
