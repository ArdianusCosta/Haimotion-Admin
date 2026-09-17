'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth/authorization'

export async function getMeetings() {
  try {
    const user = await requireAuth();
    
    const meetings = await prisma.meeting.findMany({
      where: {
        OR: [
          { organizer_id: user.id },
          { participants: { some: { user_id: user.id } } }
        ]
      },
      include: {
        organizer: { select: { id: true, name: true, firstname: true, lastname: true, avatar: true } },
        participants: {
          include: {
            user: { select: { id: true, name: true, firstname: true, lastname: true, avatar: true } }
          }
        },
        project: { select: { id: true, name: true } },
        task: { select: { id: true, task: true } },
        module_flow: { select: { id: true, name: true } }
      },
      orderBy: { date: 'asc' }
    });

    return { success: true, data: meetings };
  } catch (error: any) {
    console.error('getMeetings error:', error);
    return { success: false, error: error.message || 'Failed to fetch meetings' };
  }
}

export async function createMeeting(data: {
  title: string;
  description?: string;
  isoDateTime: string; // The fully combined ISO string from the client
  duration: number; // minutes
  participants: number[];
  projectId?: number;
  taskId?: number;
  moduleFlowId?: number;
}) {
  try {
    const user = await requireAuth();
    
    // Format date and time
    const meetingStartTime = new Date(data.isoDateTime);
    const meetingDate = new Date(data.isoDateTime);
    
    const jitsiRoomName = `haimotion-meeting-${crypto.randomUUID()}`;

    const newMeeting = await prisma.meeting.create({
      data: {
        title: data.title,
        description: data.description,
        organizer_id: parseInt(user.id),
        date: meetingDate,
        start_time: meetingStartTime,
        duration: data.duration,
        status: 'SCHEDULED',
        jitsi_room_name: jitsiRoomName,
        project_id: data.projectId,
        task_id: data.taskId,
        module_flow_id: data.moduleFlowId,
        participants: {
          create: data.participants.map(userId => ({
            user_id: userId,
            role: 'PARTICIPANT'
          }))
        }
      }
    });

    revalidatePath('/'); 
    return { success: true, data: newMeeting };
  } catch (error: any) {
    console.error('createMeeting error:', error);
    return { success: false, error: error.message || 'Failed to create meeting' };
  }
}

export async function updateMeetingStatus(id: number, status: string) {
  try {
    const user = await requireAuth();
    
    const meeting = await prisma.meeting.findUnique({ where: { id } });
    if (!meeting) throw new Error("Meeting not found");
    
    const updated = await prisma.meeting.update({
      where: { id },
      data: { status }
    });

    revalidatePath('/');
    return { success: true, data: updated };
  } catch (error: any) {
    console.error('updateMeetingStatus error:', error);
    return { success: false, error: error.message || 'Failed to update meeting status' };
  }
}

export async function getMeetingFormData() {
  try {
    const user = await requireAuth();
    
    const [users, projects, tasks, moduleFlows] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          firstname: true,
          lastname: true,
          name: true,
          avatar: true,
          email: true
        },
        orderBy: { firstname: 'asc' }
      }),
      prisma.project_list.findMany({
        select: { id: true, name: true },
        where: { members: { some: { user_id: user.id } } }, // only projects they are part of
        orderBy: { name: 'asc' }
      }),
      prisma.task_list.findMany({
        select: { id: true, task: true, project_id: true },
        where: { assignees: { some: { user_id: user.id } } }, // only tasks they are assigned to
        orderBy: { task: 'asc' }
      }),
      prisma.moduleFlow.findMany({
        select: { id: true, name: true, project_id: true },
        orderBy: { name: 'asc' }
      })
    ]);
    
    return { success: true, data: { users, projects, tasks, moduleFlows } };
  } catch (error: any) {
    console.error('getMeetingFormData error:', error);
    return { success: false, error: error.message || 'Failed to fetch form data' };
  }
}
