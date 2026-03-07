export interface AIMTransaction {
  signature: string;
  from: string;
  to: string;
  amount: number;
  fee: TransactionFee;
  timestamp: Date;
}

export interface TransactionFee {
  /** Amount burned (permanently removed from supply) */
  burnAmount: number;
  /** Amount sent to the DAO treasury */
  treasuryAmount: number;
  /** Total fee (burn + treasury) */
  totalFee: number;
}

export interface TokenConfig {
  authority: string;
  mint: string;
  treasury: string;
  /** Burn rate in basis points (50 = 0.5%) */
  burnRateBps: number;
  /** Treasury fee rate in basis points (50 = 0.5%) */
  treasuryRateBps: number;
  decimals: number;
  /** Maximum supply in raw token units */
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
