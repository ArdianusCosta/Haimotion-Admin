'use server'

import prisma from '@/lib/prisma'
import { sendPushNotification } from '@/lib/firebase/firebase-admin'

// ============ NOTIFICATION TYPES ============
export type NotificationType =
  | 'task_assigned'
  | 'task_updated'
  | 'task_comment'
  | 'task_mention'
  | 'chat_message'
  | 'chat_mention'
  | 'calendar_event'
  | 'calendar_reminder'
  | 'meeting_invite'
  | 'finance_approval'
  | 'general'

// ============ CORE: Send Notification to Users ============

/**
 * Send a notification to one or more users.
 * This saves to DB and sends push via FCM.
 * 
 * Use this from any server action or API route to trigger notifications.
 */
export async function sendNotification({
  userIds,
  title,
  body,
  icon,
  link,
  type = 'general',
  data,
}: {
  userIds: number[]
  title: string
  body: string
  icon?: string
  link?: string
  type?: NotificationType
  data?: Record<string, string>
}) {
  if (userIds.length === 0) return

  try {
    // 1. Save notifications to DB
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        user_id: userId,
        title,
        body,
        icon: icon || null,
        link: link || null,
        type,
        data: data ? JSON.stringify(data) : null,
      })),
    })

    // 2. Get FCM tokens for all target users
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        user_id: { in: userIds },
      },
      select: { token: true },
    })

    const tokens = subscriptions.map((s: { token: string }) => s.token)
    if (tokens.length === 0) return

    // 3. Send push via FCM
    const result = await sendPushNotification({
      tokens,
      title,
      body,
      icon,
      link,
      data: { type, ...data },
    })

    // 4. Cleanup invalid tokens
    if (result.invalidTokens.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { token: { in: result.invalidTokens } },
      })
    }
  } catch (error) {
    console.error('sendNotification error:', error)
    // Don't throw — notification failure shouldn't break the main action
  }
}

// ============ HELPERS FOR SPECIFIC EVENTS ============

/** Notify when a task is assigned */
export async function notifyTaskAssigned({
  assigneeIds,
  taskTitle,
  assignerName,
  taskId,
  projectId,
}: {
  assigneeIds: number[]
  taskTitle: string
  assignerName: string
  taskId: number
  projectId?: number
}) {
  await sendNotification({
    userIds: assigneeIds,
    title: '📋 Task Baru',
    body: `${assignerName} assign kamu ke task "${taskTitle}"`,
    link: projectId ? `/projects?task=${taskId}` : `/tasks?task=${taskId}`,
    type: 'task_assigned',
    data: { taskId: String(taskId) },
  })
}

/** Notify when someone comments on a task */
export async function notifyTaskComment({
  userIds,
  commenterName,
  taskTitle,
  commentPreview,
  taskId,
}: {
  userIds: number[]
  commenterName: string
  taskTitle: string
  commentPreview: string
  taskId: number
}) {
  await sendNotification({
    userIds,
    title: `💬 Komentar di "${taskTitle}"`,
    body: `${commenterName}: ${commentPreview.substring(0, 100)}`,
    link: `/tasks?task=${taskId}`,
    type: 'task_comment',
    data: { taskId: String(taskId) },
  })
}

/** Notify when someone mentions a user */
export async function notifyMention({
  userIds,
  mentionerName,
  context,
  link,
}: {
  userIds: number[]
  mentionerName: string
  context: string
  link: string
}) {
  await sendNotification({
    userIds,
    title: '🔔 Kamu di-mention',
    body: `${mentionerName} mention kamu di ${context}`,
    link,
    type: 'task_mention',
  })
}

/** Notify for new chat message */
export async function notifyChatMessage({
  userIds,
  senderName,
  messagePreview,
  chatLink,
  isGroup,
  groupName,
}: {
  userIds: number[]
  senderName: string
  messagePreview: string
  chatLink: string
  isGroup?: boolean
  groupName?: string
}) {
  const title = isGroup ? `💬 ${groupName}` : `💬 ${senderName}`
  const body = isGroup
    ? `${senderName}: ${messagePreview.substring(0, 100)}`
    : messagePreview.substring(0, 100)

  await sendNotification({
    userIds,
    title,
    body,
    link: chatLink,
    type: 'chat_message',
  })
}

/** Notify for calendar event */
export async function notifyCalendarEvent({
  userIds,
  eventTitle,
  organizerName,
  eventTime,
  eventId,
}: {
  userIds: number[]
  eventTitle: string
  organizerName: string
  eventTime: string
  eventId: number
}) {
  await sendNotification({
    userIds,
    title: '📅 Event Baru',
    body: `${organizerName} mengundang kamu ke "${eventTitle}" pada ${eventTime}`,
    link: `/calendar?event=${eventId}`,
    type: 'calendar_event',
    data: { eventId: String(eventId) },
  })
}

/** Notify for meeting invite */
export async function notifyMeetingInvite({
  userIds,
  meetingTitle,
  organizerName,
  meetingId,
}: {
  userIds: number[]
  meetingTitle: string
  organizerName: string
  meetingId: number
}) {
  await sendNotification({
    userIds,
    title: '🎥 Meeting Invitation',
    body: `${organizerName} mengundang kamu ke meeting "${meetingTitle}"`,
    link: `/meetings?id=${meetingId}`,
    type: 'meeting_invite',
    data: { meetingId: String(meetingId) },
  })
}

// ============ GET NOTIFICATIONS ============

/** Get unread count for a user */
export async function getUnreadCount(userId: number): Promise<number> {
  return prisma.notification.count({
    where: { user_id: userId, is_read: false },
  })
}

/** Get notifications for a user */
export async function getNotifications(userId: number, page = 1, limit = 20) {
  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where: { user_id: userId } }),
    prisma.notification.count({ where: { user_id: userId, is_read: false } }),
  ])

  return { notifications, total, unreadCount, page, limit }
}

/** Mark notification as read */
export async function markAsRead(notificationId: number, userId: number) {
  await prisma.notification.updateMany({
    where: { id: notificationId, user_id: userId },
    data: { is_read: true, read_at: new Date() },
  })
}

/** Mark all notifications as read */
export async function markAllAsRead(userId: number) {
  await prisma.notification.updateMany({
    where: { user_id: userId, is_read: false },
    data: { is_read: true, read_at: new Date() },
  })
}
