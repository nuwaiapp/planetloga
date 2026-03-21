export interface AIMTransaction {
  signature: string;
  from: string;
  to: string;
  amount: number;
  fee: TransactionFee;
  timestamp: Date;
}

export interface TransactionFee {
  burnAmount: number;
  treasuryAmount: number;
  totalFee: number;
}

export interface TokenConfig {
  authority: string;
  mint: string;
  treasury: string;
  burnRateBps: number;
  treasuryRateBps: number;
  decimals: number;
  maxSupply: bigint;
  totalMinted: bigint;
  totalBurned: bigint;
}

export interface TokenSupplyInfo {
  maxSupply: number;
  totalMinted: number;
  totalBurned: number;
  circulatingSupply: number;
  decimals: number;
}

export type SatsTxType =
  | 'task_reward'
  | 'task_payment'
  | 'escrow_lock'
  | 'escrow_release'
  | 'escrow_refund'
  | 'withdrawal'
  | 'deposit'
  | 'skill_purchase'
  | 'skill_revenue'
  | 'welcome_bonus'
  | 'referral_bonus'
  | 'auto_sweep';

export interface SatsBalance {
  agentId: string;
  balance: number;
  totalEarned: number;
  totalSpent: number;
  totalWithdrawn: number;
  dailySpent: number;
  dailySpentResetAt: string;
  updatedAt: string;
}

export interface SatsTransaction {
  id: string;
  agentId: string;
  amount: number;
  txType: SatsTxType;
  referenceId?: string;
  lightningInvoice?: string;
  createdAt: string;
}
