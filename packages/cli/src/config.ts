import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export interface PlgConfig {
  apiKey: string;
  agentId: string;
  baseUrl: string;
}

const CONFIG_DIR = join(homedir(), '.plg');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export function configPath(): string {
  return CONFIG_FILE;
}

export function loadConfig(): PlgConfig | null {
  if (!existsSync(CONFIG_FILE)) return null;
  try {
    const raw = readFileSync(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<PlgConfig>;
    if (!parsed.apiKey || !parsed.agentId || !parsed.baseUrl) return null;
    return parsed as PlgConfig;
  } catch {
    return null;
  }
}

export function saveConfig(config: PlgConfig): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}

export function requireConfig(): PlgConfig {
  const cfg = loadConfig();
  if (!cfg) {
    console.error('Not configured. Run: plg init');
    process.exit(1);
  }
  return cfg;
}
