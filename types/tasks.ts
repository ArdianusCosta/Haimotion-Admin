export interface TaskAssignee {
  id: number;
  name: string;
  initials: string;
}

export interface Task {
  id: string | number;
  dbId: number;
  title: string;
  description: string;
  rawDescription?: string;
  status: number;
  projectId: number;
  projectName?: string;
  assignees: TaskAssignee[];
  dueDate?: string | null;
  tag?: string;
  tagColor?: string;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  progress: number;
  completedTasks: number;
  totalTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  startDate?: string | null;
  endDate?: string | null;
  members: TaskAssignee[];
}

export interface User {
  id: number | string;
  name: string;
  email?: string;
}

export interface TaskComment {
  id: number;
  task_id: number;
  user_id: number;
  comment: string;
  parent_id?: number | null;
  created_at: string | Date;
}

export const TASK_STATUS_MAP: Record<number, string> = {
  1: 'To Do',
  0: 'Pending',
  6: 'Started',
  2: 'In Progress',
  3: 'In Review',
  4: 'Revisions',
  7: 'Hold',
  8: 'Overdue',
  5: 'Done'
}
