import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Connection, PublicKey } from '@solana/web3.js';

import { creditGeneric } from '@/lib/aim-ledger';
import { requireAnyAuth, requireAgentOwnership } from '@/lib/auth';
import { AppError, toErrorResponse } from '@/lib/errors';
import { parseJsonBody, parseUuidParam } from '@/lib/request-validation';
import { getAgent } from '@/lib/agents';
import { adminSupabase } from '@/lib/supabase';
import { PlanetLogaClient } from '@planetloga/sdk-ts';

const depositSchema = z.object({
  signature: z.string().min(20),
});

const CLUSTER = (process.env.SOLANA_CLUSTER ?? 'devnet') as 'devnet' | 'mainnet';
const CLUSTER_URLS: Record<string, string> = {
  devnet: 'https://api.devnet.solana.com',
  mainnet: 'https://api.mainnet-beta.solana.com',
};
const AIM_DECIMALS = 9;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const identity = await requireAnyAuth(request);
    const { id: rawId } = await params;
    const agentId = parseUuidParam(rawId, 'Agent ID');

    if (identity.kind === 'user') {
      await requireAgentOwnership(identity.user.id, agentId);
    }

    const body = await parseJsonBody(request, depositSchema);
    const { signature } = body;

    const { data: existingTx } = await adminSupabase
      .from('aim_transactions')
      .select('id')
      .eq('on_chain_sig', signature)
      .single();

    if (existingTx) {
      throw new AppError('ALREADY_PROCESSED', 'This transaction has already been credited', 409);
    }

    const agent = await getAgent(agentId);
    if (!agent) throw new AppError('AGENT_NOT_FOUND', 'Agent not found', 404);

    const connection = new Connection(CLUSTER_URLS[CLUSTER], 'confirmed');
    const tx = await connection.getTransaction(signature, { maxSupportedTransactionVersion: 0 });
    if (!tx) {
      throw new AppError('TX_NOT_FOUND', 'Transaction not found on Solana', 404);
    }
    if (tx.meta?.err) {
      throw new AppError('TX_FAILED', 'Transaction failed on-chain', 400);
    }

    const treasuryAddress = PlanetLogaClient.addresses().treasury;

    const preBalances = tx.meta?.preTokenBalances ?? [];
    const postBalances = tx.meta?.postTokenBalances ?? [];

    let depositAmount = 0;
    for (const post of postBalances) {
      if (post.owner === treasuryAddress) {
        const pre = preBalances.find(p => p.accountIndex === post.accountIndex);
        const preAmount = Number(pre?.uiTokenAmount?.amount ?? '0');
        const postAmount = Number(post.uiTokenAmount?.amount ?? '0');
        const diff = postAmount - preAmount;
        if (diff > 0) {
          depositAmount = diff / (10 ** AIM_DECIMALS);
        }
      }
    }

    if (depositAmount <= 0) {
      throw new AppError('NO_DEPOSIT', 'No AIM deposit detected in this transaction', 400);
    }

    const aimTx = await creditGeneric(agentId, depositAmount, 'deposit', signature);

    await adminSupabase
      .from('aim_transactions')
      .update({ on_chain_sig: signature })
      .eq('id', aimTx.id);

    return NextResponse.json({
      success: true,
      amount: depositAmount,
      signature,
      transactionId: aimTx.id,
    });
  } catch (error) {
    return toErrorResponse('api/agents/[id]/deposit.POST', error, {
      code: 'DEPOSIT_FAILED', message: 'Deposit failed', status: 500,
    });
  }
}
