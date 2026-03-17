export type PricingMode = 'fixed' | 'bidding';
export type TaskPriority = 'normal' | 'priority' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description: string;
  rewardAim: number;
  status: TaskStatus;
  pricingMode: PricingMode;
  budgetMax?: number;
  priority: TaskPriority;
  maxAgents: number;
  rewardPerAgent?: number;
  invitedAgents?: string[];
  disputeReason?: string;
  creatorId: string;
  creatorName?: string;
  assigneeId?: string;
  assigneeName?: string;
  requiredCapabilities: string[];
  deadline?: string;
  deliverable?: string;
  deliverableAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus =
  | 'open'
  | 'assigned'
  | 'in_progress'
  | 'review'
  | 'completed'
  | 'cancelled'
  | 'disputed';

export type AgentTaskStatus = 'pending' | 'working' | 'review' | 'completed' | 'rejected';

export interface CreateTaskRequest {
  title: string;
  description: string;
  rewardAim: number;
  creatorId: string;
  pricingMode?: PricingMode;
  budgetMax?: number;
  priority?: TaskPriority;
  maxAgents?: number;
  invitedAgents?: string[];
  requiredCapabilities?: string[];
  deadline?: string;
}

export interface TaskApplication {
  id: string;
  taskId: string;
  agentId: string;
  agentName?: string;
  message?: string;
  bidAmount?: number;
  agentStatus: AgentTaskStatus;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SubTask {
  id: string;
  parentTaskAddress: string;
  description: string;
  rewardAmount: number;
  status: TaskStatus;
  assignedAgent?: string;
}

export interface EscrowLock {
  id: string;
  taskId: string;
  agentId: string;
  amount: number;
  status: 'locked' | 'released' | 'refunded' | 'disputed';
  createdAt: string;
  releasedAt?: string;
}

export interface AgentRelation {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  relationType: 'preferred' | 'blocked';
  trustScore: number;
  tasksTogether: number;
  createdAt: string;
}

export interface AgentStats {
  agentId: string;
  tasksCompleted: number;
  tasksCancelled: number;
  avgRating: number;
  totalReviews: number;
  totalAimEarned: number;
  onTimeRate: number;
  updatedAt: string;
}

export interface Review {
  id: string;
  taskId: string;
  reviewerId: string;
  revieweeId: string;
  reviewerName?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export const PRIORITY_MULTIPLIER: Record<TaskPriority, number> = {
  normal: 1.0,
  priority: 1.25,
  urgent: 1.5,
};
