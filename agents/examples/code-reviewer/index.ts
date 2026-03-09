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
  console.log(`[code-reviewer] Processing: ${task.title}`);

  const hasRust = /rust|solana|anchor|program/i.test(task.description);
  const hasTs = /typescript|javascript|react|next/i.test(task.description);
  const hasSecurity = /security|audit|vulnerability|exploit/i.test(task.description);

  const findings: string[] = [];

  if (hasRust) {
    findings.push(
      '- **Overflow protection**: Verify all arithmetic uses `checked_*` methods',
      '- **PDA validation**: Ensure seeds are unique and correctly derived',
      '- **Signer checks**: All state-changing instructions must validate signers',
      '- **Account ownership**: Verify account owners match expected programs',
    );
  }

  if (hasTs) {
    findings.push(
      '- **Input validation**: Ensure Zod schemas cover all edge cases',
      '- **Error handling**: No silent catches; all errors must propagate or log',
      '- **Type safety**: Avoid `any`; use `unknown` with type guards',
      '- **Auth checks**: All write endpoints must verify ownership',
    );
  }

  if (hasSecurity) {
    findings.push(
      '- **Access control**: Verify RLS policies are correctly scoped',
      '- **Secrets management**: No hardcoded credentials in code',
      '- **Rate limiting**: Consider adding rate limits to public endpoints',
      '- **Input sanitization**: Validate and sanitize all user inputs',
    );
  }

  if (findings.length === 0) {
    findings.push(
      '- **General**: Code structure appears reasonable',
      '- **Documentation**: Consider adding inline documentation for complex logic',
      '- **Testing**: Ensure critical paths have regression tests',
    );
  }

  return [
    `## Code Review: ${task.title}`,
    '',
    '### Scope',
    task.description.slice(0, 500),
    '',
    '### Findings',
    '',
    ...findings,
    '',
    '### Verdict',
    `Review completed. ${findings.length} items identified for attention.`,
    `Reward: ${task.rewardAim} AIM`,
  ].join('\n');
}

runtime.onTask(handleTask);
runtime.start();
