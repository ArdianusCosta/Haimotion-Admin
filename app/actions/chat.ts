'use server'

import prisma from '@/lib/prisma'
import { pusherServer } from '@/lib/pusher'
import { requireAuth, requirePermission } from '@/lib/auth/authorization'

export async function getUnreadChatCount() {
  try {
    const user = await requireAuth();
    const uid = typeof user.id === 'string' ? parseInt(user.id) : user.id;

    const unreadCount = await prisma.chatMessage.count({
      where: {
        is_read: false,
        sender_id: { not: uid },
        thread: {
          OR: [
            { user1_id: uid },
            { user2_id: uid }
          ]
        }
      }
    });
    
    return { success: true, count: unreadCount };
  } catch (error) {
    return { success: false, count: 0 };
  }
}

export async function getConversations(userId: number | string) {
  const user = await requireAuth();
  
  const uid = typeof userId === 'string' ? parseInt(userId) : userId;
  
  // Get 1-on-1 threads
  const threads = await prisma.chatThread.findMany({
    where: {
      OR: [
        { user1_id: uid },
        { user2_id: uid }
      ]
    },
    include: {
      user1: { select: { id: true, firstname: true, lastname: true, avatar: true } },
      user2: { select: { id: true, firstname: true, lastname: true, avatar: true } },
      messages: {
        orderBy: { created_at: 'desc' },
        take: 1
      },
      _count: {
        select: {
          messages: {
            where: {
              is_read: false,
              sender_id: { not: uid }
            }
          }
        }
      }
    },
    orderBy: {
      last_message_at: 'desc'
    }
  })

  return threads.map(t => {
    const otherUser = t.user1_id === uid ? t.user2 : t.user1
    const lastMessage = t.messages[0]
    
    return {
      id: t.id,
      type: 'thread',
      name: `${otherUser.firstname} ${otherUser.lastname}`,
      initials: `${otherUser.firstname[0]}${otherUser.lastname[0]}`,
      avatar: otherUser.avatar,
      preview: lastMessage?.message_content || 'No messages yet',
      time: lastMessage?.created_at || t.last_message_at,
      otherUserId: otherUser.id,
      unreadCount: t._count.messages
    }
  })
}

export async function markThreadAsRead(threadId: number) {
  const user = await requireAuth();
  const uid = typeof user.id === 'string' ? parseInt(user.id) : user.id;

  // Mark all unread messages in the thread not sent by current user as read
  await prisma.chatMessage.updateMany({
    where: {
      thread_id: threadId,
      sender_id: { not: uid },
      is_read: false,
    },
    data: { is_read: true }
  });

  // Notify sender that their messages were read
  await pusherServer.trigger(`private-thread-${threadId}`, 'thread:read', { threadId, readerId: uid });
  return { success: true };
}

export async function triggerTyping(threadId: number) {
  const user = await requireAuth();
  const uid = typeof user.id === 'string' ? parseInt(user.id) : user.id;
  
  await pusherServer.trigger(`private-thread-${threadId}`, 'typing', { threadId, senderId: uid });
  return { success: true };
}

export async function getMessages(threadId: number) {
  const user = await requireAuth();
  const messages = await prisma.chatMessage.findMany({
    where: { thread_id: threadId },
    include: {
      sender: { select: { id: true, firstname: true, lastname: true, avatar: true } },
      reply_to: { select: { id: true, message_content: true, attachment: true, sender: { select: { firstname: true, lastname: true } } } }
    },
  })

  const calls = await prisma.call.findMany({
    where: { thread_id: threadId },
  })

  const combined = [
    ...messages,
    ...calls.map(c => ({
      id: `call-${c.id}`,
      is_call: true,
      type: c.type,
      status: c.status,
      duration: c.duration,
      created_at: c.created_at,
      sender_id: c.caller_id
    }))
  ]

  // Sort by created_at ascending
  combined.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  return combined
}

export async function sendMessage(threadId: number, senderId: number, content: string, attachment?: string, replyToId?: number) {
  const user = await requireAuth();
  const message = await prisma.chatMessage.create({
    data: {
      thread_id: threadId,
      sender_id: senderId,
      message_content: content,
      attachment: attachment || null,
      reply_to_id: replyToId || null,
      created_at: new Date()
    },
    include: {
      sender: { select: { id: true, firstname: true, lastname: true, avatar: true } },
      reply_to: { select: { id: true, message_content: true, attachment: true, sender: { select: { firstname: true, lastname: true } } } }
    }
  })

  await prisma.chatThread.update({
    where: { id: threadId },
    data: { last_message_at: new Date() }
  })

  await pusherServer.trigger(`private-thread-${threadId}`, 'message:created', message)

  return message
}

export async function createCallSession(threadId: number, callerId: number, type: 'voice' | 'video') {
  try {
    const user = await requireAuth();
    const roomName = `room-${threadId}-${Date.now()}`
    
    const call = await prisma.call.create({
      data: {
        thread_id: threadId,
        caller_id: callerId,
        room_name: roomName,
        type: type,
        status: 'initiated',
        started_at: new Date(),
      }
    })

    const thread = await prisma.chatThread.findUnique({ where: { id: threadId } })
    if (thread) {
      const otherUserId = thread.user1_id === callerId ? thread.user2_id : thread.user1_id
      // Notify the other user globally
      await pusherServer.trigger(`private-user-${otherUserId}`, 'call:incoming', {
        ...call,
        caller_id: callerId,
        callerName: `${user.firstname} ${user.lastname}`
      })
    }

    return JSON.parse(JSON.stringify(call))
  } catch (error) {
    console.error("Error in createCallSession:", error);
    throw new Error("Failed to create call session: " + (error instanceof Error ? error.message : "Unknown error"));
  }
}

export async function endCallSession(roomName: string, durationSeconds: number) {
  const user = await requireAuth();
  const call = await prisma.call.findUnique({ where: { room_name: roomName } })
  if (!call) return null

  // Idempotency guard: if already ended, don't double-trigger Pusher events
  if (call.status === 'ended') return JSON.parse(JSON.stringify(call))

  const updatedCall = await prisma.call.update({
    where: { room_name: roomName },
    data: {
      status: 'ended',
      ended_at: new Date(),
      duration: durationSeconds,
    }
  })

  // Update history in chat
  await pusherServer.trigger(`private-thread-${call.thread_id}`, 'message:created', {
    id: `call-${call.id}`,
    is_call: true,
    type: call.type,
    duration: durationSeconds,
    created_at: new Date()
  })

  // Global event to force end the call UI for everyone in the thread
  const thread = await prisma.chatThread.findUnique({ where: { id: call.thread_id } })
  if (thread) {
    await pusherServer.trigger(`private-user-${thread.user1_id}`, 'call:ended', { roomName })
    await pusherServer.trigger(`private-user-${thread.user2_id}`, 'call:ended', { roomName })
  }

  return JSON.parse(JSON.stringify(updatedCall))
}

export async function searchUsers(query: string, currentUserId: number) {
  const user = await requireAuth();
  if (!query) return []
  return await prisma.user.findMany({
    where: {
      id: { not: currentUserId },
      OR: [
        { firstname: { contains: query } },
        { lastname: { contains: query } },
        { email: { contains: query } },
      ]
    },
    take: 10,
    select: { id: true, firstname: true, lastname: true, avatar: true }
  })
}

export async function getOrCreateThread(userId1: number, userId2: number) {
  const user = await requireAuth();
  const minId = Math.min(userId1, userId2)
  const maxId = Math.max(userId1, userId2)

  let thread = await prisma.chatThread.findFirst({
    where: { user1_id: minId, user2_id: maxId }
  })

  if (!thread) {
    thread = await prisma.chatThread.create({
      data: {
        user1_id: minId,
        user2_id: maxId,
        last_message_at: new Date()
      }
    })
  }

  return thread
}
