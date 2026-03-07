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
