'use server'

import prisma from '@/lib/prisma'
import { requireAuth, requirePermission } from '@/lib/auth/authorization'

export async function getEvents() {
  try {
    const user = await requireAuth();
    requirePermission(user, "calendar.view");
    const events = await prisma.events.findMany({
      orderBy: {
        start_event: 'asc'
      }
    })
    return { success: true, data: events }
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
    return { success: true }
  } catch (error: any) {
    console.error('Failed to delete event:', error)
    return { success: false, error: error?.message || 'Failed to delete event' }
  }
}

export async function dummyFunctionToInvalidateCache() {
  return true
}
