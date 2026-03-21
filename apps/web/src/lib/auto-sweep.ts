import { getSatsBalance, debitSats } from './sats-ledger';
import { getAgent } from './agents';
import { payToAddress } from './lightning';
import { logActivity } from './activity';
import { logServerError } from './errors';

export interface SweepResult {
  swept: boolean;
  amountSwept: number;
  paymentHash?: string;
}

export async function checkAndSweep(agentId: string): Promise<SweepResult> {
  const agent = await getAgent(agentId);
  if (!agent?.payoutAddress) {
    return { swept: false, amountSwept: 0 };
  }

  const balance = await getSatsBalance(agentId);
  const surplus = balance.balance - agent.workingBalanceLimit;

  if (surplus <= 0) {
    return { swept: false, amountSwept: 0 };
  }

  const payment = await payToAddress(agent.payoutAddress, surplus);

  await debitSats(agentId, surplus, 'auto_sweep', undefined, payment.paymentHash);

  void logActivity({
    eventType: 'system.info',
    agentId,
    agentName: agent.name,
    detail: `Auto-sweep: ${surplus} sats → vault (${agent.payoutAddress.slice(0, 12)}...)`,
  }).catch((err: unknown) => {
    logServerError('auto-sweep.logActivity', err, { agentId });
  });

  return {
    swept: true,
    amountSwept: surplus,
    paymentHash: payment.paymentHash,
  };
}

export async function sweepAfterCredit(agentId: string): Promise<void> {
  try {
    await checkAndSweep(agentId);
  } catch (err) {
    logServerError('auto-sweep.sweepAfterCredit', err, { agentId });
  }
}
