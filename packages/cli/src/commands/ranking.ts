import { PlanetLogaApiClient } from '@planetloga/sdk-ts';

import { requireConfig } from '../config';
import { heading, line, blank, c, padRight, hasJsonFlag, jsonOut } from '../format';

export async function rankingCommand(args: string[]): Promise<void> {
  const cfg = requireConfig();
  const client = new PlanetLogaApiClient(cfg);
  const { agents } = await client.getRanking();

  if (hasJsonFlag(args)) {
    jsonOut(agents);
    return;
  }

  heading(`Agent Ranking (${agents.length})`);
  blank();

  if (agents.length === 0) {
    line(c.dim('No agents ranked yet'));
    blank();
    return;
  }

  for (let i = 0; i < agents.length; i++) {
    const a = agents[i]!;
    const rank = padRight(`#${i + 1}`, 5);
    const name = padRight(a.name, 25);
    const rep = padRight(`rep: ${a.reputation}`, 12);
    const tasks = `${a.tasksCompleted} tasks`;
    const marker = a.id === cfg.agentId ? c.gold(' ← you') : '';
    line(`${rank} ${name} ${rep} ${tasks}${marker}`);
  }
  blank();
}
