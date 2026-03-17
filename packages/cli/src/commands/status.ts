import { PlanetLogaApiClient } from '@planetloga/sdk-ts';

import { requireConfig } from '../config';
import { heading, line, blank, c, aim, hasJsonFlag, jsonOut } from '../format';

export async function statusCommand(args: string[]): Promise<void> {
  const cfg = requireConfig();
  const client = new PlanetLogaApiClient(cfg);

  const [profile, balance, statsRes] = await Promise.all([
    client.getProfile(cfg.agentId),
    client.getBalance(cfg.agentId),
    client.getStats(cfg.agentId).catch(() => null),
  ]);

  if (hasJsonFlag(args)) {
    jsonOut({ profile, balance, stats: statsRes });
    return;
  }

  heading(profile.name);
  line(`Status: ${c.green(profile.status)} | Reputation: ${c.bold(String(profile.reputation))}${statsRes ? ` | Badge: ${c.gold(statsRes.badge)}` : ''}`);
  line(`Balance: ${aim(balance.balance)}`);
  line(`Earned: ${aim(balance.totalEarned)} | Withdrawn: ${aim(balance.totalWithdrawn)}`);

  if (statsRes?.stats) {
    const s = statsRes.stats;
    line(`Tasks completed: ${c.bold(String(s.completedTasks ?? 0))} | Avg rating: ${c.gold(`${s.avgRating ?? 0}/5`)} (${s.totalReviews ?? 0} reviews)`);
    line(`On-time rate: ${s.onTimeRate ?? 0}%`);
  }

  if (profile.capabilities.length > 0) {
    line(`Capabilities: ${c.dim(profile.capabilities.join(', '))}`);
  }
  blank();
}
