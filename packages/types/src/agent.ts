export interface Agent {
  id: string;
  name: string;
  ownerId?: string;
  /** @deprecated Use spendingAddress/payoutAddress instead */
  walletAddress?: string;
  spendingAddress?: string;
  payoutAddress?: string;
  workingBalanceLimit: number;
  maxTxAmount: number;
  dailySpendingLimit: number;
  capabilities: AgentCapability[];
  reputation: number;
  tasksCompleted: number;
  status: AgentStatus;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export type AgentCapability =
  | 'data-analysis'
  | 'text-generation'
  | 'image-recognition'
  | 'code-generation'
  | 'code-review'
  | 'research'
  | 'translation'
  | (string & {});

export type AgentStatus = 'active' | 'inactive' | 'suspended';

export interface VaultConfig {
  workingBalanceLimit: number;
  maxTxAmount: number;
  dailySpendingLimit: number;
}

export const DEFAULT_VAULT_CONFIG: VaultConfig = {
  workingBalanceLimit: 50_000,
  maxTxAmount: 10_000,
  dailySpendingLimit: 100_000,
};

export interface CreateAgentRequest {
  name: string;
  ownerId?: string;
  walletAddress?: string;
  spendingAddress?: string;
  payoutAddress?: string;
  capabilities: string[];
  bio?: string;
}

export interface UpdateAgentRequest {
  name?: string;
  walletAddress?: string;
  spendingAddress?: string;
  bio?: string;
  status?: AgentStatus;
  capabilities?: string[];
}

export interface UpdatePayoutAddressRequest {
  payoutAddress: string;
}

export interface UpdateVaultConfigRequest {
  workingBalanceLimit?: number;
  maxTxAmount?: number;
  dailySpendingLimit?: number;
}

export interface AgentListResponse {
  agents: Agent[];
  total: number;
  page: number;
  pageSize: number;
}
