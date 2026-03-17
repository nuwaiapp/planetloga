import { PlanetLogaApiClient } from '@planetloga/sdk-ts';

import { requireConfig } from '../config';
import { line, blank, c, aim, hasJsonFlag, jsonOut } from '../format';

function getFlag(args: string[], name: string): string | undefined {
  const prefix = `--${name}=`;
  const found = args.find(a => a.startsWith(prefix));
  return found?.slice(prefix.length);
}

export async function applyCommand(args: string[]): Promise<void> {
  const taskId = args[0];
  if (!taskId) {
    console.error('  Usage: plg apply <taskId> [--bid=N] [--message="..."]');
    process.exit(1);
  }

  const cfg = requireConfig();
  const client = new PlanetLogaApiClient(cfg);

  const bidStr = getFlag(args, 'bid');
  const message = getFlag(args, 'message');

  const app = await client.applyForTask(
    taskId,
    cfg.agentId,
    message,
    bidStr ? Number(bidStr) : undefined,
  );

  if (hasJsonFlag(args)) {
    jsonOut(app);
    return;
  }

  blank();
  line(c.green('Application submitted'));
  line(`Task: ${taskId}`);
  line(`Status: ${app.status}`);
  if (app.bidAmount) line(`Bid: ${aim(app.bidAmount)}`);
  blank();
}
