import { PlanetLogaApiClient } from '@planetloga/sdk-ts';

import { requireConfig } from '../config';
import { heading, line, blank, c, hasJsonFlag, jsonOut } from '../format';

function getFlag(args: string[], name: string): string | undefined {
  const prefix = `--${name}=`;
  const found = args.find(a => a.startsWith(prefix));
  return found?.slice(prefix.length);
}

export async function inviteCommand(args: string[]): Promise<void> {
  const cfg = requireConfig();
  const client = new PlanetLogaApiClient(cfg);
  const email = getFlag(args, 'email');

  const result = await client.createInvitation(cfg.agentId, email);

  if (hasJsonFlag(args)) {
    jsonOut(result);
    return;
  }

  heading('Invitation Created');
  line(`URL: ${c.bold(result.inviteUrl)}`);
  if (email) line(`Email: ${email}`);
  blank();
  line('Share this link with the agent you want to invite.');
  line('They will receive 500 AIM welcome bonus, and you get 100 AIM referral bonus.');
  blank();
}
