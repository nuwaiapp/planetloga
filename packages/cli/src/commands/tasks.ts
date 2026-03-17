import { PlanetLogaApiClient } from '@planetloga/sdk-ts';

import { requireConfig } from '../config';
import { heading, line, blank, c, aim, statusColor, padRight, hasJsonFlag, jsonOut } from '../format';

function getFlag(args: string[], name: string): string | undefined {
  const prefix = `--${name}=`;
  const found = args.find(a => a.startsWith(prefix));
  return found?.slice(prefix.length);
}

export async function tasksCommand(args: string[]): Promise<void> {
  const cfg = requireConfig();
  const client = new PlanetLogaApiClient(cfg);
  const status = getFlag(args, 'status');
  const page = Number(getFlag(args, 'page') ?? '1');
  const result = await client.listTasks({ status, page, pageSize: 20 });

  if (hasJsonFlag(args)) {
    jsonOut(result);
    return;
  }

  heading(`Tasks${status ? ` (${status})` : ''} — ${result.total} total`);
  blank();

  if (result.tasks.length === 0) {
    line(c.dim('No tasks found'));
    blank();
    return;
  }

  for (const t of result.tasks) {
    const st = padRight(`[${statusColor(t.status)}]`, 20);
    const title = padRight(t.title, 42);
    const reward = aim(t.rewardAim);
    const extra: string[] = [];
    if (t.priority !== 'normal') extra.push(c.gold(t.priority));
    if (t.pricingMode === 'bidding') extra.push(c.cyan('bid'));
    if (t.maxAgents > 1) extra.push(`${t.maxAgents} agents`);
    line(`${st} ${title} ${reward}${extra.length > 0 ? '  ' + c.dim(extra.join(' | ')) : ''}`);
  }
  blank();
}

export async function taskDetailCommand(args: string[]): Promise<void> {
  const taskId = args[0];
  if (!taskId) {
    console.error('  Usage: plg task <taskId>');
    process.exit(1);
  }

  const cfg = requireConfig();
  const client = new PlanetLogaApiClient(cfg);

  if (taskId === 'create') {
    await taskCreateCommand();
    return;
  }

  const task = await client.getTask(taskId);

  if (hasJsonFlag(args)) {
    jsonOut(task);
    return;
  }

  heading(task.title);
  line(`ID: ${c.dim(task.id)}`);
  line(`Status: ${statusColor(task.status)} | Reward: ${aim(task.rewardAim)} | Priority: ${task.priority}`);
  line(`Pricing: ${task.pricingMode} | Max agents: ${task.maxAgents}`);
  if (task.requiredCapabilities.length > 0) {
    line(`Capabilities: ${c.dim(task.requiredCapabilities.join(', '))}`);
  }
  if (task.deadline) line(`Deadline: ${task.deadline.slice(0, 10)}`);
  blank();
  line(c.bold('Description:'));
  line(task.description);
  blank();
}

async function taskCreateCommand(): Promise<void> {
  const { createInterface } = await import('node:readline');
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string): Promise<string> => new Promise(r => rl.question(`  ${q}: `, r));

  const cfg = requireConfig();
  const client = new PlanetLogaApiClient(cfg);

  heading('Create Task');
  blank();

  const title = await ask('Title');
  const description = await ask('Description');
  const rewardStr = await ask('Reward (AIM)');
  const priority = (await ask('Priority (normal/priority/urgent)')) || 'normal';
  const capsStr = await ask('Required capabilities (comma-separated)');
  const deadlineStr = await ask('Deadline (YYYY-MM-DD, optional)');

  rl.close();

  const task = await client.createTask({
    title,
    description,
    rewardAim: Number(rewardStr),
    creatorId: cfg.agentId,
    priority: priority as 'normal' | 'priority' | 'urgent',
    requiredCapabilities: capsStr ? capsStr.split(',').map(s => s.trim()) : undefined,
    deadline: deadlineStr || undefined,
  });

  blank();
  line(c.green(`Task created: ${task.id}`));
  line(`Title: ${task.title} | Reward: ${aim(task.rewardAim)}`);
  blank();
}
