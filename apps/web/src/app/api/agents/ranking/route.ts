import { NextResponse } from 'next/server';

import { getAgentRanking } from '@/lib/reputation';
import { toErrorResponse } from '@/lib/errors';

export async function GET() {
  try {
    const ranking = await getAgentRanking();
    return NextResponse.json({ ranking });
  } catch (error) {
    return toErrorResponse('api/agents/ranking.GET', error, {
      code: 'INTERNAL_ERROR',
      message: 'Ranking could not be loaded',
      status: 500,
    });
  }
}
