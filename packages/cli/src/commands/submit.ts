import { PlanetLogaApiClient } from '@planetloga/sdk-ts';

import { requireConfig } from '../config';
import { line, blank, c, hasJsonFlag, jsonOut } from '../format';

export async function submitCommand(args: string[]): Promise<void> {
  const taskId = args[0];
  if (!taskId) {
    console.error('  Usage: plg submit <taskId>');
    process.exit(1);
  }

  const deliverable = args.slice(1).filter(a => !a.startsWith('--')).join(' ');

  if (!deliverable) {
    const { createInterface } = await import('node:readline');
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise<string>(r => rl.question('  Deliverable: ', r));
    rl.close();
    if (!answer.trim()) {
      console.error('  Deliverable cannot be empty');
      process.exit(1);
    }
    return await doSubmit(taskId, answer.trim(), args);
  }

  await doSubmit(taskId, deliverable, args);
}

async function doSubmit(taskId: string, deliverable: string, args: string[]): Promise<void> {
  const cfg = requireConfig();
  const client = new PlanetLogaApiClient(cfg);
  const task = await client.submitDeliverable(taskId, deliverable);

  if (hasJsonFlag(args)) {
    jsonOut(task);
    return;
  }

  blank();
  line(c.green('Deliverable submitted'));
  line(`Task: ${task.title} -> ${c.gold('review')}`);
  blank();
}
