'use server'

import prisma from '@/lib/prisma'
import { requireAuth, requirePermission } from '@/lib/auth/authorization'
import { logActivity } from '@/lib/activity-log'

export async function getEvents() {
  try {
    const user = await requireAuth();
    requirePermission(user, "calendar.view");
    
    // Safely query all sources with Promise.allSettled
    const [eventsRes, projectsRes, tasksRes, meetingsRes, followUpsRes, leavesRes] = await Promise.allSettled([
      // 1. Regular Events
      prisma.events.findMany({
        orderBy: { start_event: 'asc' }
      }),

      // 2. Projects (Timeline & Deadlines)
      prisma.project_list.findMany({
        where: { is_archived: false },
        select: {
          id: true,
          name: true,
          description: true,
          start_date: true,
          end_date: true,
          status: true
        }
      }),

      // 3. Task Deadlines
      prisma.task_list.findMany({
        where: { end_date: { not: null } },
        select: {
          id: true,
          task: true,
          description: true,
          start_date: true,
          end_date: true,
          status: true
        }
      }),

      // 4. Meetings
      prisma.meeting.findMany({
        include: {
          organizer: { select: { name: true, firstname: true, lastname: true } }
        }
      }),

      // 5. CRM Follow-ups
      prisma.crmFollowUp.findMany({
        include: {
          lead: { select: { name: true } },
          deal: { select: { title: true } }
        }
      }),

      // 6. HR Leaves
      prisma.hrLeaveRequest.findMany({
        include: {
          employee: { select: { name: true, firstname: true, lastname: true } }
        }
      })
    ]);

    const events = eventsRes.status === 'fulfilled' ? eventsRes.value : [];
    const projects = projectsRes.status === 'fulfilled' ? projectsRes.value : [];
    const tasks = tasksRes.status === 'fulfilled' ? tasksRes.value : [];
    const meetings = meetingsRes.status === 'fulfilled' ? meetingsRes.value : [];
    const followUps = followUpsRes.status === 'fulfilled' ? followUpsRes.value : [];
    const leaves = leavesRes.status === 'fulfilled' ? leavesRes.value : [];

    const unifiedEvents: any[] = [
      ...events.map(e => ({
        ...e,
        source: 'calendar'
      })),

      ...projects.map(p => {
        const start = new Date(p.start_date);
        start.setHours(9, 0, 0, 0);
        const end = new Date(p.end_date);
        end.setHours(18, 0, 0, 0);
        return {
          id: `project-${p.id}`,
          title: `📁 Project: ${p.name}`,
          start_event: start,
          end_event: end,
          color: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30',
          description: p.description ? p.description.replace(/<[^>]*>?/gm, '').slice(0, 200) : '',
          source: 'project',
          original_id: p.id
        };
      }),

      ...tasks.map(t => {
        const d = new Date(t.end_date!);
        d.setHours(17, 0, 0, 0);
        return {
          id: `task-${t.id}`,
          title: `✓ Task: ${t.task}`,
          start_event: d,
          end_event: d,
          color: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30',
          description: t.description || '',
          source: 'task',
          original_id: t.id
        };
      }),

      ...meetings.map(m => {
        const start = new Date(m.date);
        if (m.start_time) {
          const t = new Date(m.start_time);
          start.setHours(t.getHours(), t.getMinutes(), 0, 0);
        } else {
          start.setHours(10, 0, 0, 0);
        }
        const end = new Date(start.getTime() + (m.duration || 60) * 60000);
        const organizerName = m.organizer?.name || `${m.organizer?.firstname || ''} ${m.organizer?.lastname || ''}`.trim() || 'Team';
        return {
          id: `meeting-${m.id}`,
          title: `📹 Meeting: ${m.title}`,
          start_event: start,
          end_event: end,
          color: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30',
          description: `Organizer: ${organizerName}${m.description ? ` - ${m.description}` : ''}`,
          source: 'meeting',
          original_id: m.id
        };
      }),

      ...followUps.map(f => {
        const target = f.lead?.name || f.deal?.title || 'Client';
        return {
          id: `crm-${f.id}`,
          title: `📞 Follow-up: ${target} (${f.type})`,
          start_event: new Date(f.due_date),
          end_event: new Date(f.due_date),
          color: 'bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30',
          description: f.notes || '',
          source: 'crm',
          original_id: f.id
        };
      }),

      ...leaves.map(l => {
        const start = new Date(l.start_date);
        start.setHours(9, 0, 0, 0);
        const end = new Date(l.end_date);
        end.setHours(17, 0, 0, 0);
        const empName = l.employee?.name || `${l.employee?.firstname || ''} ${l.employee?.lastname || ''}`.trim() || 'Employee';
        return {
          id: `leave-${l.id}`,
          title: `🏖️ Leave: ${empName} (${l.type})`,
          start_event: start,
          end_event: end,
          color: 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30',
          description: l.reason || '',
          source: 'leave',
          original_id: l.id
        };
      })
    ];

    // Sort all events by start_event
    unifiedEvents.sort((a, b) => new Date(a.start_event).getTime() - new Date(b.start_event).getTime());

    return { success: true, data: unifiedEvents };
  } catch (error) {
    console.error('Failed to fetch events:', error);
    return { success: false, error: 'Failed to fetch events' };
  }
}

export async function createEvent(data: {
  title: string
  start_event: string
  end_event: string
  color?: string
  description?: string
}) {
  try {
    const user = await requireAuth();
    requirePermission(user, "calendar.create");
    const newEvent = await prisma.events.create({
      data: {
        title: data.title,
        start_event: new Date(data.start_event),
        end_event: new Date(data.end_event),
        color: data.color || 'bg-primary',
        description: data.description,
      }
    })
    
    await logActivity({
      userId: user.id,
      activityType: 'create',
      description: `Created event: ${data.title}`
    })
    
    return { success: true, data: newEvent }
  } catch (error: any) {
    console.error('Failed to create event:', error)
    return { success: false, error: error?.message || 'Failed to create event' }
  }
}

export async function updateEvent(id: number, data: {
  title: string
  start_event: string
  end_event: string
  color?: string
  description?: string
}) {
  try {
    const user = await requireAuth();
    requirePermission(user, "calendar.update");
    const updatedEvent = await prisma.events.update({
      where: { id },
      data: {
        title: data.title,
        start_event: new Date(data.start_event),
        end_event: new Date(data.end_event),
        color: data.color || 'bg-primary',
        description: data.description,
      }
    })
    
    await logActivity({
      userId: user.id,
      activityType: 'update',
      description: `Updated event: ${data.title}`
    })
    
    return { success: true, data: updatedEvent }
  } catch (error: any) {
    console.error('Failed to update event:', error)
    return { success: false, error: error?.message || 'Failed to update event' }
  }
}

export async function deleteEvent(id: number) {
  try {
    const user = await requireAuth();
    requirePermission(user, "calendar.delete");
    await prisma.events.delete({
      where: { id }
    })
    
    await logActivity({
      userId: user.id,
      activityType: 'delete',
      description: `Deleted event ID: ${id}`
    })
    
    return { success: true }
  } catch (error: any) {
    console.error('Failed to delete event:', error)
    return { success: false, error: error?.message || 'Failed to delete event' }
  }
}

export async function dummyFunctionToInvalidateCache() {
  return true
}
