import { PlanetLogaApiClient } from '@planetloga/sdk-ts';

import { requireConfig } from '../config';
import { heading, line, blank, aim, hasJsonFlag, jsonOut } from '../format';

export async function balanceCommand(args: string[]): Promise<void> {
  const cfg = requireConfig();
  const client = new PlanetLogaApiClient(cfg);
  const balance = await client.getBalance(cfg.agentId);

  if (hasJsonFlag(args)) {
    jsonOut(balance);
    return;
  }

  heading('AIM Balance');
  line(`Available: ${aim(balance.balance)}`);
  line(`Total earned: ${aim(balance.totalEarned)}`);
  line(`Total withdrawn: ${aim(balance.totalWithdrawn)}`);
  blank();
}
