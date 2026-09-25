export interface ActivityUser {
  firstname: string;
  lastname?: string;
  avatar?: string;
}

export interface ActivityLog {
  id: number;
  user_id: number;
  project_id?: number | null;
  task_id?: number | null;
  activity_type: string;
  description: string;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  user?: ActivityUser;
}
