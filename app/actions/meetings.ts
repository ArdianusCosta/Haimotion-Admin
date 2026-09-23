'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth/authorization'

// Generate a short, readable meeting code like "7KX92P"
function generateMeetingCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No ambiguous chars
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

async function getUniqueMeetingCode(): Promise<string> {
  let code = generateMeetingCode()
  let attempts = 0
  while (attempts < 10) {
    const existing = await prisma.meeting.findFirst({ where: { meeting_code: code } })
    if (!existing) return code
    code = generateMeetingCode()
    attempts++
  }
  // Fallback: append timestamp if collision persists
  return generateMeetingCode() + Date.now().toString(36).toUpperCase().slice(-2)
}

export async function getMeetings() {
  try {
    const user = await requireAuth();
    const uid = typeof user.id === 'string' ? parseInt(user.id) : user.id

    const meetings = await prisma.meeting.findMany({
      where: {
        OR: [
          { organizer_id: uid },
          { participants: { some: { user_id: uid } } }
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

// Public — no auth needed
export async function getMeetingByCode(meetingCode: string) {
  try {
    const meeting = await prisma.meeting.findFirst({
      where: { meeting_code: meetingCode },
      include: {
        organizer: { select: { id: true, firstname: true, lastname: true, name: true, avatar: true } },
        participants: {
          include: {
            user: { select: { id: true, firstname: true, lastname: true, name: true, avatar: true } }
          }
        },
      },
    });

    if (!meeting) return { success: false, error: 'Meeting not found' };
    return { success: true, data: meeting };
  } catch (error: any) {
    console.error('getMeetingByCode error:', error);
    return { success: false, error: error.message || 'Failed to fetch meeting' };
  }
}

export async function createMeeting(data: {
  title: string;
  description?: string;
  isoDateTime: string;
  duration: number;
  participants: number[];
  projectId?: number;
  taskId?: number;
  moduleFlowId?: number;
  joinPolicy?: string;
  waitingRoom?: boolean;
  passcode?: string;
}) {
  try {
    const user = await requireAuth();
    const uid = typeof user.id === 'string' ? parseInt(user.id) : user.id

    const meetingStartTime = new Date(data.isoDateTime);
    const meetingDate = new Date(data.isoDateTime);

    const meetingCode = await getUniqueMeetingCode();
    const roomName = `hm-meeting-${crypto.randomUUID()}`;

    const newMeeting = await prisma.meeting.create({
      data: {
        title: data.title,
        description: data.description,
        organizer_id: uid,
        date: meetingDate,
        start_time: meetingStartTime,
        duration: data.duration,
        status: 'SCHEDULED',
        room_name: roomName,
        meeting_code: meetingCode,
        join_policy: data.joinPolicy || 'PUBLIC_LINK',
        waiting_room: data.waitingRoom || false,
        passcode: data.passcode || null,
        project_id: data.projectId,
        task_id: data.taskId,
        module_flow_id: data.moduleFlowId,
        participants: {
          create: data.participants.map(userId => ({
            user_id: userId,
            role: 'PARTICIPANT',
            status: 'INVITED',
          }))
        }
      },
      include: {
        participants: true,
      }
    });

    revalidatePath('/');
    return { success: true, data: newMeeting };
  } catch (error: any) {
    console.error('createMeeting error:', error);
    return { success: false, error: error.message || 'Failed to create meeting' };
  }
}

export async function updateMeeting(id: number, data: {
  title?: string;
  description?: string;
  isoDateTime?: string;
  duration?: number;
  joinPolicy?: string;
  waitingRoom?: boolean;
  passcode?: string;
}) {
  try {
    const user = await requireAuth();
    const uid = typeof user.id === 'string' ? parseInt(user.id) : user.id

    const meeting = await prisma.meeting.findUnique({ where: { id } });
    if (!meeting) return { success: false, error: 'Meeting not found' };
    if (meeting.organizer_id !== uid) return { success: false, error: 'Forbidden' };

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.isoDateTime !== undefined) {
      const dt = new Date(data.isoDateTime);
      updateData.date = dt;
      updateData.start_time = dt;
    }
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.joinPolicy !== undefined) updateData.join_policy = data.joinPolicy;
    if (data.waitingRoom !== undefined) updateData.waiting_room = data.waitingRoom;
    if (data.passcode !== undefined) updateData.passcode = data.passcode || null;

    const updated = await prisma.meeting.update({ where: { id }, data: updateData });
    revalidatePath('/');
    return { success: true, data: updated };
  } catch (error: any) {
    console.error('updateMeeting error:', error);
    return { success: false, error: error.message || 'Failed to update meeting' };
  }
}

export async function cancelMeeting(id: number) {
  try {
    const user = await requireAuth();
    const uid = typeof user.id === 'string' ? parseInt(user.id) : user.id

    const meeting = await prisma.meeting.findUnique({ where: { id } });
    if (!meeting) return { success: false, error: 'Meeting not found' };
    if (meeting.organizer_id !== uid) return { success: false, error: 'Forbidden' };

    const updated = await prisma.meeting.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });
    revalidatePath('/');
    return { success: true, data: updated };
  } catch (error: any) {
    console.error('cancelMeeting error:', error);
    return { success: false, error: error.message || 'Failed to cancel meeting' };
  }
}

export async function deleteMeeting(id: number) {
  try {
    const user = await requireAuth();
    const uid = typeof user.id === 'string' ? parseInt(user.id) : user.id

    const meeting = await prisma.meeting.findUnique({ where: { id } });
    if (!meeting) return { success: false, error: 'Meeting not found' };
    if (meeting.organizer_id !== uid) return { success: false, error: 'Forbidden' };

    await prisma.meeting.delete({ where: { id } });
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('deleteMeeting error:', error);
    return { success: false, error: error.message || 'Failed to delete meeting' };
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
    const uid = typeof user.id === 'string' ? parseInt(user.id) : user.id

    const [users, projects, tasks, moduleFlows] = await Promise.all([
      prisma.user.findMany({
        select: { id: true, firstname: true, lastname: true, name: true, avatar: true, email: true },
        orderBy: { firstname: 'asc' }
      }),
      prisma.project_list.findMany({
        select: { id: true, name: true },
        where: { members: { some: { user_id: uid } } },
        orderBy: { name: 'asc' }
      }),
      prisma.task_list.findMany({
        select: { id: true, task: true, project_id: true },
        where: { assignees: { some: { user_id: uid } } },
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

export async function admitParticipant(participantId: number) {
  try {
    const user = await requireAuth();
    const uid = typeof user.id === 'string' ? parseInt(user.id) : user.id

    const participant = await prisma.meetingParticipant.findUnique({
      where: { id: participantId },
      include: { meeting: true }
    });

    if (!participant) return { success: false, error: 'Participant not found' };
    if (participant.meeting.organizer_id !== uid) return { success: false, error: 'Forbidden' };

    const updated = await prisma.meetingParticipant.update({
      where: { id: participantId },
      data: { status: 'ADMITTED', joined_at: new Date() }
    });

    return { success: true, data: updated };
  } catch (error: any) {
    console.error('admitParticipant error:', error);
    return { success: false, error: error.message || 'Failed to admit participant' };
  }
}

export async function rejectParticipant(participantId: number) {
  try {
    const user = await requireAuth();
    const uid = typeof user.id === 'string' ? parseInt(user.id) : user.id

    const participant = await prisma.meetingParticipant.findUnique({
      where: { id: participantId },
      include: { meeting: true }
    });

    if (!participant) return { success: false, error: 'Participant not found' };
    if (participant.meeting.organizer_id !== uid) return { success: false, error: 'Forbidden' };

    const updated = await prisma.meetingParticipant.update({
      where: { id: participantId },
      data: { status: 'REJECTED' }
    });

    return { success: true, data: updated };
  } catch (error: any) {
    console.error('rejectParticipant error:', error);
    return { success: false, error: error.message || 'Failed to reject participant' };
  }
}
