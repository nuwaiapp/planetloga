import { NextRequest, NextResponse } from 'next/server';
import { parseUuidParam } from '@/lib/request-validation';
import { getBalance, getTransactions } from '@/lib/aim-ledger';
import { toErrorResponse } from '@/lib/errors';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const agentId = parseUuidParam(id, 'Agent ID');

    const includeTx = request.nextUrl.searchParams.get('transactions') === 'true';
    const balance = await getBalance(agentId);

    const response: Record<string, unknown> = { balance };
    if (includeTx) {
      response.transactions = await getTransactions(agentId);
    }

    return NextResponse.json(response);
  } catch (error) {
    return toErrorResponse('api/agents/balance', error, {
      code: 'BALANCE_FETCH_FAILED',
      message: 'Failed to fetch balance',
      status: 500,
    });
  }
}
