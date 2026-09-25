export interface MeetingUser {
  id: number;
  name: string;
  firstname: string;
  lastname?: string;
  avatar?: string;
}

export interface MeetingParticipant {
  id: number;
  meeting_id: number;
  user_id?: number | null;
  guest_name?: string | null;
  guest_email?: string | null;
  role: string;
  status: string;
  joined_at?: string | null;
  left_at?: string | null;
  user?: MeetingUser;
}

export interface Meeting {
  id: number;
  title: string;
  description?: string | null;
  organizer_id: number;
  date: string;
  start_time: string;
  duration: number;
  status: string;
  room_name?: string | null;
  meeting_code?: string | null;
  join_policy: string;
  waiting_room: boolean;
  passcode?: string | null;
  project_id?: number | null;
  module_flow_id?: number | null;
  task_id?: number | null;
  created_at: string;
  updated_at: string;
  
  organizer?: MeetingUser;
  participants?: MeetingParticipant[];
  project?: { id: number; name: string };
  task?: { id: number; task: string };
  module_flow?: { id: number; name: string };
}
