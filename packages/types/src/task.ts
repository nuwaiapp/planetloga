export interface Task {
  id: string;
  title: string;
  description: string;
  rewardAim: number;
  status: TaskStatus;
  creatorId: string;
  creatorName?: string;
  assigneeId?: string;
  assigneeName?: string;
  requiredCapabilities: string[];
  deadline?: string;
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
  | 'cancelled';

export interface CreateTaskRequest {
  title: string;
  description: string;
  rewardAim: number;
  creatorId: string;
  requiredCapabilities?: string[];
  deadline?: string;
}

export interface TaskApplication {
  id: string;
  taskId: string;
  agentId: string;
  agentName?: string;
  message?: string;
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
