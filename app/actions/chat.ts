'use server'

import prisma from '@/lib/prisma'
import { pusherServer } from '@/lib/pusher'
import { requireAuth, requirePermission } from '@/lib/auth/authorization'
import { cleanUserName, parseUserInfo } from '@/lib/utils'
import { notifyChatMessage } from '@/app/actions/notifications'

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
  
  // 1. Get 1-on-1 threads
  const threads = await prisma.chatThread.findMany({
    where: {
      OR: [
        { user1_id: uid },
        { user2_id: uid }
      ]
    },
    include: {
      user1: { 
        select: { 
          id: true, 
          firstname: true, 
          lastname: true, 
          avatar: true,
          email: true,
          status: true,
          role: { select: { name: true } }
        } 
      },
      user2: { 
        select: { 
          id: true, 
          firstname: true, 
          lastname: true, 
          avatar: true,
          email: true,
          status: true,
          role: { select: { name: true } }
        } 
      },
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
  });

  const formattedThreads = threads.map(t => {
    const otherUser = t.user1_id === uid ? t.user2 : t.user1
    const lastMessage = t.messages[0]
    const { displayName, position, initials } = parseUserInfo(otherUser.firstname, otherUser.lastname, otherUser.role?.name)
    
    return {
      id: t.id,
      key: `thread-${t.id}`,
      type: 'thread' as const,
      name: displayName,
      initials,
      avatar: otherUser.avatar,
      preview: lastMessage?.message_content || (lastMessage?.attachment ? 'Sent an attachment' : 'No messages yet'),
      time: lastMessage?.created_at || t.last_message_at,
      otherUserId: otherUser.id,
      email: otherUser.email,
      role: position,
      status: otherUser.status || 'active',
      unreadCount: t._count.messages
    }
  });

  // 2. Get Groups where current user is a member
  const groupMemberships = await prisma.group_members.findMany({
    where: { user_id: uid },
    include: {
      chat_groups: {
        include: {
          messages: {
            orderBy: { created_at: 'desc' },
            take: 1,
            include: {
              sender: {
                select: { id: true, firstname: true, lastname: true }
              }
            }
          },
          group_members: {
            include: {
              users: {
                select: {
                  id: true,
                  firstname: true,
                  lastname: true,
                  avatar: true,
                  role: { select: { name: true } }
                }
              }
            }
          },
          user_group_read_status: {
            where: { user_id: uid }
          }
        }
      }
    }
  });

  const formattedGroups = groupMemberships.map(m => {
    const group = m.chat_groups;
    const lastMsg = group.messages[0];
    
    // Group initials from words or first 2 chars
    const words = group.name.trim().split(/\s+/);
    const initials = words.length > 1 
      ? `${words[0][0]}${words[1][0]}`.toUpperCase()
      : group.name.slice(0, 2).toUpperCase();

    const senderName = lastMsg?.sender ? cleanUserName(lastMsg.sender.firstname) : '';
    const preview = lastMsg
      ? (lastMsg.attachment && !lastMsg.message_content 
          ? `${senderName ? `${senderName}: ` : ''}Sent an attachment` 
          : `${senderName ? `${senderName}: ` : ''}${lastMsg.message_content}`)
      : 'No messages yet';

    const members = group.group_members.map(gm => {
      const { displayName, position } = parseUserInfo(gm.users.firstname, gm.users.lastname, gm.users.role?.name)
      return {
        id: gm.users.id,
        name: displayName,
        avatar: gm.users.avatar,
        isAdmin: !!gm.is_admin,
        role: position
      }
    });

    return {
      id: group.id,
      key: `group-${group.id}`,
      type: 'group' as const,
      name: group.name,
      initials,
      avatar: null,
      preview,
      time: lastMsg?.created_at || group.last_message_at || group.date_created,
      groupId: group.id,
      description: group.description,
      memberCount: group.group_members.length,
      members,
      createdBy: group.created_by,
      unreadCount: 0
    }
  });

  // Combine and sort by newest activity
  const allConversations = [...formattedThreads, ...formattedGroups];
  allConversations.sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime());

  return allConversations;
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

  // Send FCM push notification to the receiver (fire-and-forget)
  try {
    const thread = await prisma.chatThread.findUnique({ where: { id: threadId } })
    if (thread) {
      const receiverId = thread.user1_id === senderId ? thread.user2_id : thread.user1_id
      const senderName = `${message.sender.firstname} ${message.sender.lastname || ''}`.trim()
      const preview = attachment && !content ? '📎 Attachment' : content
      notifyChatMessage({
        userIds: [receiverId],
        senderName,
        messagePreview: preview,
        chatLink: `/chat`,
      }).catch(() => {}) // non-blocking
    }
  } catch (_) {}

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

export async function getUserChatProfile(targetUserId: number, threadId?: number) {
  try {
    await requireAuth();
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        notification_email: true,
        avatar: true,
        status: true,
        nik: true,
        address: true,
        date_created: true,
        role: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    if (!user) return null;

    let sharedFiles: any[] = [];
    if (threadId) {
      sharedFiles = await prisma.chatMessage.findMany({
        where: {
          thread_id: threadId,
          attachment: { not: null }
        },
        orderBy: { created_at: 'desc' },
        take: 20,
        select: {
          id: true,
          attachment: true,
          message_content: true,
          created_at: true,
          sender_id: true,
        }
      });
    }

    return {
      user,
      sharedFiles
    };
  } catch (error) {
    console.error('Error in getUserChatProfile:', error);
    return null;
  }
}

export async function createChatGroup(name: string, description: string | undefined, memberIds: (number | string)[]) {
  const user = await requireAuth();
  const uid = typeof user.id === 'string' ? parseInt(user.id, 10) : Number(user.id);

  if (!name.trim()) {
    throw new Error('Group name is required');
  }

  // Ensure all member IDs are strictly integers (Int in Prisma)
  const parsedMemberIds = memberIds
    .map(id => typeof id === 'string' ? parseInt(id, 10) : Number(id))
    .filter(id => !isNaN(id) && id > 0);

  // Ensure creator is in members
  const uniqueMemberIds = Array.from(new Set([...parsedMemberIds, uid]));

  const group = await prisma.chatGroup.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      created_by: uid,
      date_created: new Date(),
      last_message_at: new Date(),
      group_members: {
        create: uniqueMemberIds.map(id => ({
          user_id: Number(id),
          is_admin: Number(id) === uid,
          date_joined: new Date()
        }))
      }
    },
    include: {
      group_members: {
        include: {
          users: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              avatar: true,
              role: { select: { name: true } }
            }
          }
        }
      }
    }
  });

  // Create initial system message in group
  await prisma.groupMessage.create({
    data: {
      group_id: Number(group.id),
      sender_id: uid,
      message_content: `Group "${group.name}" was created.`,
      created_at: new Date()
    }
  });

  // Notify each member via Pusher
  for (const mId of uniqueMemberIds) {
    try {
      await pusherServer.trigger(`private-user-${mId}`, 'group:created', { groupId: group.id });
    } catch (e) {
      // Non-fatal
    }
  }

  return group;
}

export async function getGroupMessages(groupId: number | string) {
  const user = await requireAuth();
  const uid = typeof user.id === 'string' ? parseInt(user.id, 10) : Number(user.id);
  const gid = typeof groupId === 'string' ? parseInt(groupId, 10) : Number(groupId);

  const messages = await prisma.groupMessage.findMany({
    where: { group_id: gid },
    include: {
      sender: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          avatar: true,
          role: { select: { name: true } }
        }
      }
    },
    orderBy: { created_at: 'asc' }
  });

  return messages.map(m => ({
    id: m.id,
    group_id: m.group_id,
    sender_id: m.sender_id,
    message_content: m.message_content,
    attachment: m.attachment,
    created_at: m.created_at,
    sender: {
      id: m.sender.id,
      name: `${cleanUserName(m.sender.firstname)} ${cleanUserName(m.sender.lastname)}`.trim(),
      avatar: m.sender.avatar,
      role: m.sender.role?.name || 'Staff'
    }
  }));
}

export async function sendGroupMessage(groupId: number | string, senderId: number | string, content: string, attachmentUrl?: string) {
  const user = await requireAuth();
  const uid = typeof user.id === 'string' ? parseInt(user.id, 10) : Number(user.id);
  const gid = typeof groupId === 'string' ? parseInt(groupId, 10) : Number(groupId);

  const msg = await prisma.groupMessage.create({
    data: {
      group_id: gid,
      sender_id: uid,
      message_content: content,
      attachment: attachmentUrl || null,
      created_at: new Date()
    },
    include: {
      sender: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          avatar: true,
          role: { select: { name: true } }
        }
      }
    }
  });

  await prisma.chatGroup.update({
    where: { id: gid },
    data: { last_message_at: new Date() }
  });

  const { displayName, position } = parseUserInfo(msg.sender.firstname, msg.sender.lastname, msg.sender.role?.name);

  const formatted = {
    id: msg.id,
    group_id: msg.group_id,
    sender_id: msg.sender_id,
    message_content: msg.message_content,
    attachment: msg.attachment,
    created_at: msg.created_at,
    sender: {
      id: msg.sender.id,
      name: displayName,
      avatar: msg.sender.avatar,
      role: position
    }
  };

  try {
    await pusherServer.trigger(`private-group-${gid}`, 'message:created', formatted);
  } catch (e) {
    console.error('Pusher trigger error:', e);
  }

  // Send FCM push notification to all group members except sender (fire-and-forget)
  try {
    const group = await prisma.chatGroup.findUnique({
      where: { id: gid },
      select: { name: true, group_members: { select: { user_id: true } } }
    })
    if (group) {
      const receiverIds = group.group_members
        .map((m: { user_id: number }) => m.user_id)
        .filter((id: number) => id !== uid)
      if (receiverIds.length > 0) {
        const preview = attachmentUrl && !content ? '📎 Attachment' : content
        notifyChatMessage({
          userIds: receiverIds,
          senderName: displayName,
          messagePreview: preview,
          chatLink: `/chat`,
          isGroup: true,
          groupName: group.name,
        }).catch(() => {}) // non-blocking
      }
    }
  } catch (_) {}

  return formatted;
}

export async function markGroupAsRead(groupId: number | string) {
  const user = await requireAuth();
  const uid = typeof user.id === 'string' ? parseInt(user.id, 10) : Number(user.id);
  const gid = typeof groupId === 'string' ? parseInt(groupId, 10) : Number(groupId);

  await prisma.user_group_read_status.upsert({
    where: {
      group_id_user_id: {
        group_id: gid,
        user_id: uid
      }
    },
    update: { last_read_at: new Date() },
    create: {
      group_id: gid,
      user_id: uid,
      last_read_at: new Date()
    }
  });

  return { success: true };
}

export async function getActiveUsersForGroup() {
  const user = await requireAuth();
  const uid = typeof user.id === 'string' ? parseInt(user.id, 10) : Number(user.id);

  const users = await prisma.user.findMany({
    where: {
      id: { not: uid },
      status: { not: 'resign' }
    },
    select: {
      id: true,
      firstname: true,
      lastname: true,
      avatar: true,
      email: true,
      role: { select: { name: true } }
    },
    orderBy: { firstname: 'asc' }
  });

  return users.map(u => {
    const { displayName, position, initials } = parseUserInfo(u.firstname, u.lastname, u.role?.name)
    return {
      id: u.id,
      name: displayName,
      email: u.email,
      avatar: u.avatar,
      role: position,
      position,
      initials
    }
  });
}

export async function triggerGroupTyping(groupId: number | string, senderName: string) {
  const user = await requireAuth();
  const uid = typeof user.id === 'string' ? parseInt(user.id, 10) : Number(user.id);
  const gid = typeof groupId === 'string' ? parseInt(groupId, 10) : Number(groupId);

  await pusherServer.trigger(`private-group-${gid}`, 'typing', { groupId: gid, senderId: uid, senderName });
  return { success: true };
}

// ─── Group Management ──────────────────────────────────────────────────────────

export async function updateChatGroup(
  groupId: number | string,
  name: string,
  description?: string
) {
  const user = await requireAuth();
  const uid = typeof user.id === 'string' ? parseInt(user.id, 10) : Number(user.id);
  const gid = typeof groupId === 'string' ? parseInt(groupId, 10) : Number(groupId);

  // Only admins can update
  const membership = await prisma.group_members.findFirst({
    where: { group_id: gid, user_id: uid, is_admin: true }
  });
  if (!membership) throw new Error('Hanya admin grup yang dapat mengedit profil grup');

  const updated = await prisma.chatGroup.update({
    where: { id: gid },
    data: {
      name: name.trim(),
      description: description?.trim() || null,
    }
  });

  // Notify group members via Pusher
  try {
    await pusherServer.trigger(`private-group-${gid}`, 'group:updated', {
      groupId: gid,
      name: updated.name,
      description: updated.description,
    });
  } catch {}

  return JSON.parse(JSON.stringify(updated));
}

export async function addGroupMembers(
  groupId: number | string,
  memberIds: number[]
) {
  const user = await requireAuth();
  const uid = typeof user.id === 'string' ? parseInt(user.id, 10) : Number(user.id);
  const gid = typeof groupId === 'string' ? parseInt(groupId, 10) : Number(groupId);

  // Only admins can add members
  const membership = await prisma.group_members.findFirst({
    where: { group_id: gid, user_id: uid, is_admin: true }
  });
  if (!membership) throw new Error('Hanya admin grup yang dapat menambahkan anggota');

  // Filter out already-existing members
  const existing = await prisma.group_members.findMany({
    where: { group_id: gid, user_id: { in: memberIds } },
    select: { user_id: true }
  });
  const existingIds = new Set(existing.map((e) => e.user_id));
  const newIds = memberIds.filter((id) => !existingIds.has(id));

  if (newIds.length > 0) {
    await prisma.group_members.createMany({
      data: newIds.map((id) => ({
        group_id: gid,
        user_id: id,
        is_admin: false,
        date_joined: new Date(),
      }))
    });

    // Notify new members
    for (const id of newIds) {
      try {
        await pusherServer.trigger(`private-user-${id}`, 'group:created', { groupId: gid });
      } catch {}
    }

    // System message
    try {
      await prisma.groupMessage.create({
        data: {
          group_id: gid,
          sender_id: uid,
          message_content: `${newIds.length} anggota baru telah ditambahkan ke grup.`,
          created_at: new Date(),
        }
      });
    } catch {}
  }

  // Return updated member list
  return await _getGroupMembers(gid);
}

export async function removeGroupMember(
  groupId: number | string,
  targetUserId: number
) {
  const user = await requireAuth();
  const uid = typeof user.id === 'string' ? parseInt(user.id, 10) : Number(user.id);
  const gid = typeof groupId === 'string' ? parseInt(groupId, 10) : Number(groupId);

  // Only admins can remove members (and can't remove themselves)
  const membership = await prisma.group_members.findFirst({
    where: { group_id: gid, user_id: uid, is_admin: true }
  });
  if (!membership) throw new Error('Hanya admin grup yang dapat mengeluarkan anggota');
  if (targetUserId === uid) throw new Error('Anda tidak dapat mengeluarkan diri sendiri');

  await prisma.group_members.deleteMany({
    where: { group_id: gid, user_id: targetUserId }
  });

  // Notify removed user
  try {
    await pusherServer.trigger(`private-user-${targetUserId}`, 'group:removed', { groupId: gid });
  } catch {}

  // System message
  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { firstname: true, lastname: true }
    });
    const targetName = targetUser
      ? `${cleanUserName(targetUser.firstname)} ${cleanUserName(targetUser.lastname)}`.trim()
      : 'Seorang anggota';
    await prisma.groupMessage.create({
      data: {
        group_id: gid,
        sender_id: uid,
        message_content: `${targetName} telah dikeluarkan dari grup.`,
        created_at: new Date(),
      }
    });
  } catch {}

  return await _getGroupMembers(gid);
}

/** Internal helper: fetch formatted member list for a group */
async function _getGroupMembers(gid: number) {
  const rows = await prisma.group_members.findMany({
    where: { group_id: gid },
    include: {
      users: {
        select: {
          id: true,
          firstname: true,
          lastname: true,
          avatar: true,
          role: { select: { name: true } }
        }
      }
    }
  });

  return rows.map((gm) => {
    const { displayName, position } = parseUserInfo(
      gm.users.firstname,
      gm.users.lastname,
      gm.users.role?.name
    );
    return {
      id: gm.users.id,
      name: displayName,
      avatar: gm.users.avatar,
      isAdmin: !!gm.is_admin,
      role: position,
    };
  });
}
