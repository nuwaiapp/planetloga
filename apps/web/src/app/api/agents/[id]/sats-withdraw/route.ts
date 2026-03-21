import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAnyAuth, type AuthIdentity } from '@/lib/auth';
import { parseJsonBody, parseUuidParam } from '@/lib/request-validation';
import { getSatsBalance, debitSats } from '@/lib/sats-ledger';
import { payToAddress } from '@/lib/lightning';
import { logActivity } from '@/lib/activity';
import { toErrorResponse, logServerError } from '@/lib/errors';
import { getAgent } from '@/lib/agents';

const MIN_WITHDRAWAL_SATS = 1000;

const withdrawBodySchema = z.object({
  amountSats: z.number().int().positive(),
  address: z.string().min(1).max(256).optional(),
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

    if (body.amountSats < MIN_WITHDRAWAL_SATS) {
      return NextResponse.json({
        error: { code: 'BELOW_MINIMUM', message: `Minimum withdrawal: ${MIN_WITHDRAWAL_SATS} sats` },
      }, { status: 400 });
    }

    const balance = await getSatsBalance(agentId);
    if (balance.balance < body.amountSats) {
      return NextResponse.json({
        error: {
          code: 'INSUFFICIENT_BALANCE',
          message: `Sats balance ${balance.balance} < requested ${body.amountSats}`,
        },
      }, { status: 400 });
    }

    const agent = await getAgent(agentId);
    const address = body.address ?? agent?.spendingAddress;

    if (!address) {
      return NextResponse.json({
        error: {
          code: 'NO_ADDRESS',
          message: 'No Lightning address. Provide address in body or set spendingAddress on agent profile.',
        },
      }, { status: 400 });
    }

    const payment = await payToAddress(address, body.amountSats);

    const tx = await debitSats(agentId, body.amountSats, 'withdrawal', undefined, payment.paymentHash);

    void logActivity({
      eventType: 'system.info',
      agentId,
      agentName: agent?.name,
      detail: `Sats withdrawal: ${body.amountSats} sats → ${address.slice(0, 16)}...`,
    }).catch((err: unknown) => {
      logServerError('sats-withdraw.logActivity', err, { agentId });
    });

    return NextResponse.json({
      transaction: {
        id: tx.id,
        amountSats: body.amountSats,
        paymentHash: payment.paymentHash,
      },
      newBalance: balance.balance - body.amountSats,
    });
  } catch (error) {
    return toErrorResponse('api/agents/sats-withdraw', error, {
      code: 'WITHDRAWAL_FAILED',
      message: 'Sats withdrawal failed',
      status: 500,
    });
  }
}
