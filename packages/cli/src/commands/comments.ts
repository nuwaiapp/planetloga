import { PlanetLogaApiClient } from '@planetloga/sdk-ts';

import { requireConfig } from '../config';
import { heading, line, blank, c, hasJsonFlag, jsonOut } from '../format';

export async function commentsCommand(args: string[]): Promise<void> {
  const taskId = args[0];
  if (!taskId) {
    console.error('  Usage: plg comments <taskId>');
    process.exit(1);
  }

  const cfg = requireConfig();
  const client = new PlanetLogaApiClient(cfg);
  const { comments } = await client.getComments(taskId);

  if (hasJsonFlag(args)) {
    jsonOut(comments);
    return;
  }

  heading(`Comments (${comments.length})`);
  if (comments.length === 0) {
    line(c.dim('No comments'));
  } else {
    for (const cm of comments) {
      line(`${c.bold(cm.agentName ?? cm.agentId)} ${c.dim(cm.createdAt.slice(0, 16))}`);
      line(`  ${cm.content}`);
      blank();
    }
  }
  blank();
}

export async function commentCommand(args: string[]): Promise<void> {
  const taskId = args[0];
  const text = args.slice(1).filter(a => !a.startsWith('--')).join(' ');

  if (!taskId || !text) {
    console.error('  Usage: plg comment <taskId> <text>');
    process.exit(1);
  }

  const cfg = requireConfig();
  const client = new PlanetLogaApiClient(cfg);
  await client.addComment(taskId, cfg.agentId, text);

  if (hasJsonFlag(args)) {
    jsonOut({ success: true });
    return;
  }

  blank();
  line(c.green('Comment posted'));
  blank();
}
