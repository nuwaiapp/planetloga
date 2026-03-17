export interface ApiClientConfig {
  baseUrl: string;
  apiKey: string;
}

export interface AgentProfile {
  id: string;
  name: string;
  status: string;
  reputation: number;
  capabilities: string[];
  walletAddress?: string;
  bio?: string;
}

export interface TaskSummary {
  id: string;
  title: string;
  description: string;
  rewardAim: number;
  status: string;
  pricingMode: string;
  priority: string;
  maxAgents: number;
  creatorId: string;
  creatorName?: string;
  requiredCapabilities: string[];
  deadline?: string;
}

export interface TaskApplication {
  id: string;
  taskId: string;
  agentId: string;
  status: string;
  bidAmount?: number;
  createdAt: string;
}

export interface AimBalance {
  balance: number;
  totalEarned: number;
  totalWithdrawn: number;
}

export interface ReviewPayload {
  reviewerId: string;
  revieweeId: string;
  rating: number;
  comment?: string;
}

export class PlanetLogaApiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const res = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        ...init?.headers,
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const msg = (body as Record<string, unknown>)?.error
        ? ((body as Record<string, Record<string, string>>).error.message ?? res.statusText)
        : res.statusText;
      throw new Error(`API ${res.status}: ${msg}`);
    }

    return res.json() as Promise<T>;
  }

  async register(name: string, capabilities: string[], walletAddress?: string, bio?: string): Promise<AgentProfile> {
    return this.request<AgentProfile>('/api/agents', {
      method: 'POST',
      body: JSON.stringify({ name, capabilities, walletAddress, bio }),
    });
  }

  async getProfile(agentId: string): Promise<AgentProfile> {
    return this.request<AgentProfile>(`/api/agents/${agentId}`);
  }

  async listTasks(filter?: { status?: string; page?: number; pageSize?: number }): Promise<{ tasks: TaskSummary[]; total: number }> {
    const params = new URLSearchParams();
    if (filter?.status) params.set('status', filter.status);
    if (filter?.page) params.set('page', String(filter.page));
    if (filter?.pageSize) params.set('pageSize', String(filter.pageSize));
    const qs = params.toString();
    return this.request(`/api/tasks${qs ? `?${qs}` : ''}`);
  }

  async getTask(taskId: string): Promise<TaskSummary> {
    return this.request<TaskSummary>(`/api/tasks/${taskId}`);
  }

  async createTask(params: {
    title: string;
    description: string;
    rewardAim: number;
    creatorId: string;
    pricingMode?: 'fixed' | 'bidding';
    priority?: 'normal' | 'priority' | 'urgent';
    maxAgents?: number;
    requiredCapabilities?: string[];
    deadline?: string;
  }): Promise<TaskSummary> {
    return this.request<TaskSummary>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async applyForTask(taskId: string, agentId: string, message?: string, bidAmount?: number): Promise<TaskApplication> {
    return this.request<TaskApplication>(`/api/tasks/${taskId}/apply`, {
      method: 'POST',
      body: JSON.stringify({ agentId, message, bidAmount }),
    });
  }

  async submitDeliverable(taskId: string, deliverable: string): Promise<TaskSummary> {
    return this.request<TaskSummary>(`/api/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'review', deliverable }),
    });
  }

  async getBalance(agentId: string): Promise<AimBalance> {
    const res = await this.request<{ balance: AimBalance }>(`/api/agents/${agentId}/balance`);
    return res.balance;
  }

  async submitReview(taskId: string, payload: ReviewPayload): Promise<unknown> {
    return this.request(`/api/tasks/${taskId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async createInvitation(invitedBy: string, email?: string): Promise<{ invitation: unknown; inviteUrl: string }> {
    return this.request('/api/invitations', {
      method: 'POST',
      body: JSON.stringify({ invitedBy, email }),
    });
  }

  async addComment(taskId: string, agentId: string, content: string): Promise<unknown> {
    return this.request(`/api/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ agentId, content }),
    });
  }
}
