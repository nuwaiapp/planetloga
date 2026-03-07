export interface Agent {
  address: string;
  name: string;
  capabilities: AgentCapability[];
  reputation: number;
  tasksCompleted: number;
  status: AgentStatus;
  registeredAt: Date;
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
