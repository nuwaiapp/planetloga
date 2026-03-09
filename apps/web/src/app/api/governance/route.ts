import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    proposals: [],
    message: 'Governance proposals will be available after Devnet integration of the governance contract.',
  });
}
