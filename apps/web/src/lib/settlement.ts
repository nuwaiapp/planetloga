import { Keypair, PublicKey } from '@solana/web3.js';
import { PlanetLogaClient, type TransferResult } from '@planetloga/sdk-ts';
import { AppError, logServerError } from './errors';

const CLUSTER = (process.env.SOLANA_CLUSTER ?? 'devnet') as 'devnet' | 'mainnet';
const AIM_DECIMALS = 9;

function getTreasuryKeypair(): Keypair {
  const raw = process.env.TREASURY_KEYPAIR;
  if (!raw) {
    throw new AppError('CONFIG_ERROR', 'TREASURY_KEYPAIR not configured', 500);
  }
  try {
    const bytes = JSON.parse(raw) as number[];
    return Keypair.fromSecretKey(Uint8Array.from(bytes));
  } catch (error) {
    throw new AppError('CONFIG_ERROR', 'Invalid TREASURY_KEYPAIR format', 500, { cause: error });
  }
}

function getClient(wallet: Keypair): PlanetLogaClient {
  return new PlanetLogaClient({ cluster: CLUSTER, wallet });
}

function toOnChainAmount(aimAmount: number): number {
  return Math.round(aimAmount * (10 ** AIM_DECIMALS));
}

export interface WithdrawalResult {
  signature: string;
  grossAmount: number;
  netAmount: number;
  burnAmount: number;
  treasuryFee: number;
}

export async function settleWithdrawal(
  agentWalletAddress: string,
  aimAmount: number,
): Promise<WithdrawalResult> {
  if (aimAmount <= 0) {
    throw new AppError('INVALID_AMOUNT', 'Withdrawal amount must be positive', 400);
  }

  const treasuryKeypair = getTreasuryKeypair();
  const client = getClient(treasuryKeypair);

  let agentWallet: PublicKey;
  try {
    agentWallet = new PublicKey(agentWalletAddress);
  } catch {
    throw new AppError('INVALID_WALLET', 'Invalid Solana wallet address', 400);
  }

  const onChainAmount = toOnChainAmount(aimAmount);

  const { getAssociatedTokenAddressSync } = await import('@solana/spl-token');
  const mintPda = PlanetLogaClient.addresses().mint;
  const mint = new PublicKey(mintPda);

  const treasuryTokenAccount = getAssociatedTokenAddressSync(mint, treasuryKeypair.publicKey);
  const agentTokenAccount = getAssociatedTokenAddressSync(mint, agentWallet);

  let result: TransferResult;
  try {
    result = await client.transferWithFee(treasuryTokenAccount, agentTokenAccount, onChainAmount);
  } catch (error) {
    logServerError('settlement.transferWithFee', error, { agentWalletAddress, aimAmount });
    throw new AppError('SETTLEMENT_FAILED', 'On-chain transfer failed', 502, { cause: error });
  }

  return {
    signature: result.signature,
    grossAmount: aimAmount,
    netAmount: result.netAmount / (10 ** AIM_DECIMALS),
    burnAmount: result.burnAmount / (10 ** AIM_DECIMALS),
    treasuryFee: result.treasuryAmount / (10 ** AIM_DECIMALS),
  };
}
