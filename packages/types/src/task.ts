export interface Task {
  address: string;
  creator: string;
  title: string;
  description: string;
  rewardAmount: number;
  status: TaskStatus;
  assignedAgent?: string;
  subtasks?: SubTask[];
  createdAt: Date;
  completedAt?: Date;
}

export type TaskStatus =
  | 'open'
  | 'assigned'
  | 'in-progress'
  | 'completed'
  | 'disputed'
  | 'cancelled';

export interface SubTask {
  id: string;
  parentTaskAddress: string;
  description: string;
  rewardAmount: number;
  status: TaskStatus;
  assignedAgent?: string;
}
