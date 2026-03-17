import { NextResponse } from 'next/server';
import { toErrorResponse } from '@/lib/errors';

export async function GET() {
  try {
    return NextResponse.json({
      proposals: [],
      message: 'Governance proposals will be available after Devnet integration of the governance contract.',
    });
  } catch (error) {
    return toErrorResponse('api/governance.GET', error, {
      code: 'INTERNAL_ERROR',
      message: 'Could not load governance data',
      status: 500,
    });
  }
}
