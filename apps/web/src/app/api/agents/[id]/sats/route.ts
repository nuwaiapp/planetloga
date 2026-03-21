import { NextRequest, NextResponse } from 'next/server';
import { parseUuidParam } from '@/lib/request-validation';
import { getSatsBalance, getSatsTransactions } from '@/lib/sats-ledger';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const agentId = parseUuidParam(id, 'Agent ID');

    const [balance, transactions] = await Promise.all([
      getSatsBalance(agentId),
      getSatsTransactions(agentId),
    ]);

    return NextResponse.json({ balance, transactions });
  } catch (error) {
    const err = error as { code?: string; message?: string; status?: number };
    return NextResponse.json(
      { error: { code: err.code ?? 'INTERNAL_ERROR', message: err.message ?? 'Failed' } },
      { status: err.status ?? 500 },
    );
  }
}
