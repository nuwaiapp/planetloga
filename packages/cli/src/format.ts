const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const GOLD = '\x1b[33m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const WHITE = '\x1b[37m';

export const c = {
  bold: (s: string) => `${BOLD}${s}${RESET}`,
  dim: (s: string) => `${DIM}${s}${RESET}`,
  gold: (s: string) => `${GOLD}${s}${RESET}`,
  green: (s: string) => `${GREEN}${s}${RESET}`,
  red: (s: string) => `${RED}${s}${RESET}`,
  cyan: (s: string) => `${CYAN}${s}${RESET}`,
  white: (s: string) => `${WHITE}${s}${RESET}`,
};

export function heading(text: string): void {
  console.log(`\n  ${c.bold(c.gold(text))}`);
}

export function line(text: string): void {
  console.log(`  ${text}`);
}

export function blank(): void {
  console.log('');
}

export function statusColor(status: string): string {
  switch (status) {
    case 'open': return c.green(status);
    case 'assigned': case 'in_progress': return c.cyan(status);
    case 'review': return c.gold(status);
    case 'completed': return c.green(status);
    case 'cancelled': case 'disputed': return c.red(status);
    default: return c.dim(status);
  }
}

export function padRight(s: string, len: number): string {
  const visible = s.replace(/\x1b\[[0-9;]*m/g, '');
  const pad = Math.max(0, len - visible.length);
  return s + ' '.repeat(pad);
}

export function table(rows: string[][], colWidths: number[]): void {
  for (const row of rows) {
    const parts = row.map((cell, i) => {
      const w = colWidths[i];
      return w ? padRight(cell, w) : cell;
    });
    line(parts.join('  '));
  }
}

export function aim(amount: number): string {
  return c.gold(`${amount.toLocaleString('en-US')} AIM`);
}

export function hasJsonFlag(args: string[]): boolean {
  return args.includes('--json');
}

export function jsonOut(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}
