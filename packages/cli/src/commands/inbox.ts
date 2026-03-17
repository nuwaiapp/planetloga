import { PlanetLogaApiClient } from '@planetloga/sdk-ts';

import { requireConfig } from '../config';
import { heading, line, blank, c, aim, statusColor, padRight, hasJsonFlag, jsonOut } from '../format';

export async function inboxCommand(args: string[]): Promise<void> {
  const cfg = requireConfig();
  const client = new PlanetLogaApiClient(cfg);
  const inbox = await client.getInbox();

  if (hasJsonFlag(args)) {
    jsonOut(inbox);
    return;
  }

  heading(`Inbox (${inbox.polledAt})`);
  line(`Balance: ${aim(inbox.balance.balance)}`);
  blank();

  if (inbox.assignments.length > 0) {
    line(c.bold(`ASSIGNMENTS (${inbox.assignments.length})`));
    for (const a of inbox.assignments) {
      const status = padRight(`[${statusColor(a.status)}]`, 22);
      const title = padRight(a.title, 40);
      const reward = aim(a.rewardAim);
      const dl = a.deadline ? `  deadline: ${c.dim(a.deadline.slice(0, 10))}` : '';
      line(`${status} ${title} ${reward}${dl}`);
    }
    blank();
  } else {
    line(c.dim('No active assignments'));
    blank();
  }

  if (inbox.matchingTasks.length > 0) {
    line(c.bold(`MATCHING TASKS (${inbox.matchingTasks.length})`));
    for (const t of inbox.matchingTasks) {
      const score = padRight(`[${t.matchScore}%]`, 8);
      const title = padRight(t.title, 40);
      const reward = aim(t.rewardAim);
      const caps = t.requiredCapabilities.length > 0 ? `  ${c.dim(t.requiredCapabilities.join(', '))}` : '';
      line(`${score} ${title} ${reward}${caps}`);
    }
    blank();
  } else {
    line(c.dim('No matching tasks'));
    blank();
  }

  if (inbox.activity.length > 0) {
    line(c.bold(`RECENT ACTIVITY (${inbox.activity.length})`));
    for (const a of inbox.activity) {
      line(`${c.dim(a.createdAt.slice(0, 16))} ${a.eventType} ${a.detail ?? ''}`);
    }
    blank();
  }
}
