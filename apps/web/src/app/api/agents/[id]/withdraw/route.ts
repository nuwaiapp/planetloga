import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAnyAuth, type AuthIdentity } from '@/lib/auth';
import { parseJsonBody, parseUuidParam } from '@/lib/request-validation';
import { getBalance, debit } from '@/lib/aim-ledger';
import { settleWithdrawal } from '@/lib/settlement';
import { logActivity } from '@/lib/activity';
import { toErrorResponse, logServerError } from '@/lib/errors';
import { getAgent } from '@/lib/agents';

const MIN_WITHDRAWAL = 10;

const withdrawBodySchema = z.object({
  amount: z.number().positive(),
  walletAddress: z.string().min(32).max(128).optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

function assertOwnership(identity: AuthIdentity, agentId: string): void {
  if (identity.kind === 'agent' && identity.agent.agentId !== agentId) {
    throw { code: 'FORBIDDEN', message: 'Cannot withdraw for another agent', status: 403 };
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const identity = await requireAnyAuth(request);
    const { id } = await params;
    const agentId = parseUuidParam(id, 'Agent ID');

    assertOwnership(identity, agentId);

    const body = await parseJsonBody(request, withdrawBodySchema);

    if (body.amount < MIN_WITHDRAWAL) {
      return NextResponse.json({
        error: { code: 'BELOW_MINIMUM', message: `Minimum withdrawal: ${MIN_WITHDRAWAL} AIM` },
      }, { status: 400 });
    }

    const balance = await getBalance(agentId);
    if (balance.balance < body.amount) {
      return NextResponse.json({
        error: {
          code: 'INSUFFICIENT_BALANCE',
          message: `Balance ${balance.balance} AIM < requested ${body.amount} AIM`,
        },
      }, { status: 400 });
    }

    const agent = await getAgent(agentId);
    const walletAddress = body.walletAddress ?? agent?.walletAddress;

    if (!walletAddress) {
      return NextResponse.json({
        error: {
          code: 'NO_WALLET',
          message: 'No wallet address. Provide walletAddress in body or set it on agent profile.',
        },
      }, { status: 400 });
    }

    const settlement = await settleWithdrawal(walletAddress, body.amount);

    const tx = await debit(agentId, body.amount, 'withdrawal', settlement.signature);

    void logActivity({
      eventType: 'system.info',
      agentId,
      agentName: agent?.name,
      aimAmount: body.amount,
      detail: `Withdrawal: ${body.amount} AIM → ${walletAddress.slice(0, 8)}... (tx: ${settlement.signature.slice(0, 16)}...)`,
    }).catch((err: unknown) => {
      logServerError('withdrawal.logActivity', err, { agentId });
    });

    return NextResponse.json({
      transaction: {
        id: tx.id,
        amount: body.amount,
        netAmount: settlement.netAmount,
        burnFee: settlement.burnAmount,
        treasuryFee: settlement.treasuryFee,
      },
      onChain: {
        signature: settlement.signature,
        explorer: `https://explorer.solana.com/tx/${settlement.signature}?cluster=devnet`,
      },
      newBalance: balance.balance - body.amount,
    }, { status: 200 });
  } catch (error) {
    return toErrorResponse('api/agents/withdraw', error, {
      code: 'WITHDRAWAL_FAILED',
      message: 'Withdrawal failed',
      status: 500,
    });
  }
}
