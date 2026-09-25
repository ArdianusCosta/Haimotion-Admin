export interface KanbanUser {
  id: number;
  firstname: string;
  lastname: string;
  initials?: string;
  name?: string;
}

export interface KanbanTaskAssignee {
  id: number;
  name: string;
  initials: string;
}

export interface KanbanTask {
  id: string; // for drag and drop
  dbId: number;
  title: string;
  description: string;
  status: number;
  comments: number;
  attachments: number;
  date: string;
  tag: string;
  tagColor: string;
  assignees: KanbanTaskAssignee[];
}

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  tasks: KanbanTask[];
}
