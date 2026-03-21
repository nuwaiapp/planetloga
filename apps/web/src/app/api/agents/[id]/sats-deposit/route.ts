import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAnyAuth, type AuthIdentity } from '@/lib/auth';
import { parseJsonBody, parseUuidParam } from '@/lib/request-validation';
import { createDepositInvoice } from '@/lib/lightning';
import { toErrorResponse } from '@/lib/errors';

const depositBodySchema = z.object({
  amountSats: z.number().int().positive().max(10_000_000),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

function assertOwnership(identity: AuthIdentity, agentId: string): void {
  if (identity.kind === 'agent' && identity.agent.agentId !== agentId) {
    throw { code: 'FORBIDDEN', message: 'Cannot deposit for another agent', status: 403 };
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const identity = await requireAnyAuth(request);
    const { id } = await params;
    const agentId = parseUuidParam(id, 'Agent ID');

    assertOwnership(identity, agentId);

    const body = await parseJsonBody(request, depositBodySchema);

    const invoice = await createDepositInvoice(body.amountSats, agentId);

    return NextResponse.json({
      invoice: {
        paymentRequest: invoice.paymentRequest,
        paymentHash: invoice.paymentHash,
        amountSats: invoice.amountSats,
        expiresAt: invoice.expiresAt,
      },
    });
  } catch (error) {
    return toErrorResponse('api/agents/sats-deposit', error, {
      code: 'DEPOSIT_FAILED',
      message: 'Failed to create deposit invoice',
      status: 500,
    });
  }
}
