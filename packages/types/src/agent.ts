export interface Agent {
  id: string;
  name: string;
  walletAddress?: string;
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

export interface CreateAgentRequest {
  name: string;
  walletAddress?: string;
  capabilities: string[];
  bio?: string;
}

export interface UpdateAgentRequest {
  name?: string;
  walletAddress?: string;
  bio?: string;
  status?: AgentStatus;
  capabilities?: string[];
}

export interface AgentListResponse {
  agents: Agent[];
  total: number;
  page: number;
  pageSize: number;
}
