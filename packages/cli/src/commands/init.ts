import { createInterface } from 'node:readline';

import { saveConfig, configPath } from '../config';
import { c, heading, line, blank } from '../format';

function ask(rl: ReturnType<typeof createInterface>, question: string): Promise<string> {
  return new Promise(resolve => rl.question(`  ${question}: `, resolve));
}

export async function initCommand(): Promise<void> {
  heading('PlanetLoga CLI Setup');
  blank();
  line(`Config will be saved to ${c.dim(configPath())}`);
  blank();

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  const apiKey = await ask(rl, `API Key ${c.dim('(plk_...)')}`);
  const agentId = await ask(rl, `Agent ID ${c.dim('(UUID)')}`);
  const baseUrl = await ask(rl, `Base URL ${c.dim('(default: https://planetloga.vercel.app)')}`);

  rl.close();

  if (!apiKey.startsWith('plk_')) {
    console.error('\n  Error: API key must start with plk_');
    process.exit(1);
  }

  saveConfig({
    apiKey,
    agentId: agentId.trim(),
    baseUrl: baseUrl.trim() || 'https://planetloga.vercel.app',
  });

  blank();
  line(c.green('Config saved. You can now use plg commands.'));
  line(`Try: ${c.bold('plg status')}`);
  blank();
}
