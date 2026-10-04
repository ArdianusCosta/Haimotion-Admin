'use server'

import prisma from '@/lib/prisma'
import { requireAuth, requirePermission } from '@/lib/auth/authorization'
import { logActivity } from '@/lib/activity-log'

export async function getEvents() {
  try {
    const user = await requireAuth();
    requirePermission(user, "calendar.view");
    
    // 1. Regular Events
    const events = await prisma.events.findMany({
      orderBy: { start_event: 'asc' }
    });
    
    // 2. Task Deadlines
    const tasks = await prisma.task_list.findMany({
      where: { end_date: { not: null } }
    });
    
    // 3. CRM Follow-ups
    const followUps = await prisma.crmFollowUp.findMany({
      where: { due_date: { not: null } },
      include: { lead: { select: { name: true } }, deal: { select: { name: true } } }
    });
    
    // 4. HR Leaves
    const leaves = await prisma.hrLeaveRequest.findMany({
      where: { start_date: { not: null } },
      include: { employee: { select: { name: true } } }
    });
    
    const unifiedEvents = [
      ...events.map(e => ({ ...e, source: 'calendar' })),
      
      ...tasks.map(t => {
        const d = new Date(t.end_date!);
        d.setHours(17, 0, 0, 0); // Default task deadline time to 5 PM
        return {
          id: `task-${t.id}`,
          title: `Task: ${t.task}`,
          start_event: d,
          end_event: d,
          color: 'bg-indigo-500 text-white',
          description: t.description || '',
          source: 'task',
          original_id: t.id
        };
      }),
      
      ...followUps.map(f => {
        const target = f.lead?.name || f.deal?.name || 'Client';
        return {
          id: `crm-${f.id}`,
          title: `Follow-up: ${target} (${f.type})`,
          start_event: new Date(f.due_date!),
          end_event: new Date(f.due_date!),
          color: 'bg-rose-500 text-white',
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
        return {
          id: `leave-${l.id}`,
          title: `Leave: ${l.employee?.name || 'Employee'} (${l.type})`,
          start_event: start,
          end_event: end,
          color: 'bg-emerald-500 text-white',
          description: l.reason || '',
          source: 'leave',
          original_id: l.id
        };
      })
    ];
    
    // Sort all events by start_event
    unifiedEvents.sort((a, b) => new Date(a.start_event).getTime() - new Date(b.start_event).getTime());

    return { success: true, data: unifiedEvents }
  } catch (error) {
    console.error('Failed to fetch events:', error)
    return { success: false, error: 'Failed to fetch events' }
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
