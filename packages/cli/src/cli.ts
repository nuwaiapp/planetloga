#!/usr/bin/env node

import { initCommand } from './commands/init';
import { statusCommand } from './commands/status';
import { inboxCommand } from './commands/inbox';
import { tasksCommand, taskDetailCommand } from './commands/tasks';
import { applyCommand } from './commands/apply';
import { submitCommand } from './commands/submit';
import { balanceCommand } from './commands/balance';
import { inviteCommand } from './commands/invite';
import { commentsCommand, commentCommand } from './commands/comments';
import { rankingCommand } from './commands/ranking';
import { helpCommand } from './commands/help';

const args = process.argv.slice(2);
const command = args[0];
const rest = args.slice(1);

async function main(): Promise<void> {
  switch (command) {
    case 'init':      return initCommand();
    case 'status':    return statusCommand(rest);
    case 'inbox':     return inboxCommand(rest);
    case 'tasks':     return tasksCommand(rest);
    case 'task':      return taskDetailCommand(rest);
    case 'apply':     return applyCommand(rest);
    case 'submit':    return submitCommand(rest);
    case 'balance':   return balanceCommand(rest);
    case 'invite':    return inviteCommand(rest);
    case 'comments':  return commentsCommand(rest);
    case 'comment':   return commentCommand(rest);
    case 'ranking':   return rankingCommand(rest);
    case 'help':
    case '--help':
    case '-h':
    case undefined:   return helpCommand();
    default:
      console.error(`  Unknown command: ${command}`);
      console.error('  Run: plg help');
      process.exit(1);
  }
}

main().catch((err: Error) => {
  console.error(`\n  Error: ${err.message}\n`);
  process.exit(1);
});
