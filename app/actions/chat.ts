'use server'

import prisma from '@/lib/prisma'
import { pusherServer } from '@/lib/pusher'

export async function getConversations(userId: number) {
  // Get 1-on-1 threads
  const threads = await prisma.chatThread.findMany({
    where: {
      OR: [
        { user1_id: userId },
        { user2_id: userId }
      ]
    },
    include: {
      user1: { select: { id: true, firstname: true, lastname: true, avatar: true } },
      user2: { select: { id: true, firstname: true, lastname: true, avatar: true } },
      messages: {
        orderBy: { created_at: 'desc' },
        take: 1
      }
    },
    orderBy: {
      last_message_at: 'desc'
    }
  })

  return threads.map(t => {
    const otherUser = t.user1_id === userId ? t.user2 : t.user1
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
    }
  })
}

export async function getMessages(threadId: number) {
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

  // Notify the other user in the thread
  await pusherServer.trigger(`private-thread-${threadId}`, 'call:incoming', {
    ...call,
    caller_id: callerId
  })

  return call
}

export async function endCallSession(roomName: string, durationSeconds: number) {
  const call = await prisma.call.findUnique({ where: { room_name: roomName } })
  if (!call) return null

  const updatedCall = await prisma.call.update({
    where: { room_name: roomName },
    data: {
      status: 'ended',
      ended_at: new Date(),
      duration: durationSeconds,
    }
  })

  // Optionally send a pusher event so the other client knows it ended, or just to update history
  await pusherServer.trigger(`private-thread-${call.thread_id}`, 'message:created', {
    id: `call-${call.id}`,
    is_call: true,
    type: call.type,
    duration: durationSeconds,
    created_at: new Date()
  })

  return updatedCall
}

export async function searchUsers(query: string, currentUserId: number) {
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
