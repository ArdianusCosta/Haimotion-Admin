'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth/authorization'
import { logActivity } from '@/lib/activity-log'
import { pusherServer } from '@/lib/pusher'

function getTagColor(tag: string | null) {
  if (!tag) return 'bg-muted text-muted-foreground'
  const t = tag.toLowerCase()
  if (t.includes('design') || t.includes('ui')) return 'bg-chart-1/15 text-chart-1'
  if (t.includes('engineer') || t.includes('web')) return 'bg-chart-2/15 text-chart-2'
  if (t.includes('product') || t.includes('app')) return 'bg-chart-3/15 text-chart-3'
  if (t.includes('market') || t.includes('sale')) return 'bg-chart-4/15 text-chart-4'
  if (t.includes('bug') || t.includes('error')) return 'bg-destructive/15 text-destructive'
  return 'bg-primary/15 text-primary'
}

function stripHtml(html: string | null) {
  if (!html) return ''
  let text = html;
  let previous = '';
  // Loop to decode heavily encoded entities like &amp;amp;lt;
  while (text !== previous) {
    previous = text;
    text = text.replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&quot;/g, '"')
               .replace(/&#039;/g, "'")
               .replace(/&nbsp;/g, ' ');
  }
  // Strip HTML tags
  text = text.replace(/<[^>]*>?/gm, ' ');
  return text.replace(/\s+/g, ' ').trim();
}

export async function getKanbanTasks() {
  try {
    const tasks = await prisma.task_list.findMany({
      orderBy: { date_created: 'desc' },
      include: { assignees: true }
    })
    
    const users = await prisma.user.findMany({
      select: { id: true, firstname: true, lastname: true, avatar: true }
    })
    
    const commentsCount = await prisma.task_comments.groupBy({
      by: ['task_id'],
      _count: { id: true }
    })
    
    const attachmentsCount = await prisma.task_attachments.groupBy({
      by: ['task_id'],
      _count: { id: true }
    })
    
    const formattedTasks = tasks.map(task => {
      const assignedIds = task.assignees.map(a => a.user_id)
      const assignees = users.filter(u => assignedIds.includes(u.id))
      
      const comments = commentsCount.find(c => c.task_id === task.id)?._count.id || 0
      const attachments = attachmentsCount.find(c => c.task_id === task.id)?._count.id || 0
      
      return {
        id: task.id.toString(),
        dbId: task.id,
        title: task.task,
        description: stripHtml(task.description),
        status: task.status ?? 1,
        tag: task.content_pillar || task.platform || 'General',
        tagColor: getTagColor(task.content_pillar || task.platform),
        assignees: assignees.map(a => ({
          name: `${a.firstname} ${a.lastname}`,
          initials: `${a.firstname[0] || ''}${a.lastname[0] || ''}`.toUpperCase(),
          id: a.id,
          avatar: a.avatar
        })),
        comments,
        attachments,
        date: task.date_created.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: task.date_created
      }
    })
    
    const columns = [
      {
        id: '1',
        title: 'To Do',
        color: 'bg-muted-foreground',
        tasks: formattedTasks.filter(t => t.status === 1)
      },
      {
        id: '0',
        title: 'Pending',
        color: 'bg-muted',
        tasks: formattedTasks.filter(t => t.status === 0)
      },
      {
        id: '6',
        title: 'Started',
        color: 'bg-chart-1',
        tasks: formattedTasks.filter(t => t.status === 6)
      },
      {
        id: '2',
        title: 'In Progress',
        color: 'bg-chart-2',
        tasks: formattedTasks.filter(t => t.status === 2)
      },
      {
        id: '3',
        title: 'In Review',
        color: 'bg-chart-4',
        tasks: formattedTasks.filter(t => t.status === 3)
      },
      {
        id: '4',
        title: 'Revisions',
        color: 'bg-destructive/60',
        tasks: formattedTasks.filter(t => t.status === 4)
      },
      {
        id: '7',
        title: 'Hold',
        color: 'bg-orange-500',
        tasks: formattedTasks.filter(t => t.status === 7)
      },
      {
        id: '8',
        title: 'Overdue',
        color: 'bg-destructive',
        tasks: formattedTasks.filter(t => t.status === 8)
      },
      {
        id: '5',
        title: 'Done',
        color: 'bg-primary',
        tasks: formattedTasks.filter(t => t.status === 5)
      }
    ]
    
    return { success: true, data: columns, users }
  } catch (error: any) {
    console.error('Error fetching kanban tasks:', error)
    return { success: false, error: error.message }
  }
}

export async function updateTaskStatus(id: number, newStatus: number) {
  try {
    const user = await requireAuth();
    await prisma.task_list.update({
      where: { id },
      data: { status: newStatus }
    })
    
    await logActivity({
      userId: user.id,
      activityType: 'update',
      description: `Updated task status in Kanban to ${newStatus}`
    })
    
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createTask(data: { title: string; description: string; status: number; assignees: number[] }) {
  try {
    const user = await requireAuth();
    // Need a default project_id for this table since it's required
    const firstProject = await prisma.project_list.findFirst()
    const projectId = firstProject?.id || 1 // Fallback to 1 if no projects exist

    const task = await prisma.task_list.create({
      data: {
        task: data.title,
        description: data.description,
        status: data.status,
        project_id: projectId,
        assignees: {
          create: data.assignees.map(uid => ({ user_id: Number(uid) }))
        }
      }
    })
    
    await logActivity({
      userId: user.id,
      activityType: 'create',
      description: `Created task in Kanban: ${data.title}`
    })
    
    return { success: true, data: task }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateTask(id: number, data: { title: string; description: string; status: number; assignees: number[] }) {
  try {
    const task = await prisma.$transaction(async (tx) => {
      await tx.taskAssignee.deleteMany({ where: { task_id: id } });
      
      return tx.task_list.update({
        where: { id },
        data: {
          task: data.title,
          description: data.description,
          status: data.status,
          assignees: {
            create: data.assignees.map(uid => ({ user_id: Number(uid) }))
          }
        }
      });
    });
    
    const user = await requireAuth();
    await logActivity({
      userId: user.id,
      activityType: 'update',
      description: `Updated task in Kanban: ${data.title}`
    })
    
    return { success: true, data: task }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteTask(id: number) {
  try {
    // Delete associated comments and attachments first (cascade might not be set up)
    await prisma.task_comments.deleteMany({ where: { task_id: id } })
    await prisma.task_attachments.deleteMany({ where: { task_id: id } })
    
    const task = await prisma.task_list.delete({
      where: { id }
    })
    
    const user = await requireAuth();
    await logActivity({
      userId: user.id,
      activityType: 'delete',
      description: `Deleted task ID in Kanban: ${id}`
    })
    
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getTaskDetails(id: number) {
  try {
    const commentsRaw = await prisma.task_comments.findMany({
      where: { task_id: id },
      orderBy: { created_at: 'asc' }
    })
    
    const userIds = Array.from(new Set(commentsRaw.map(c => Number(c.user_id)).filter(Boolean)))
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstname: true, lastname: true, name: true, avatar: true }
    })
    
    const comments = commentsRaw.map(c => {
      const u = users.find(user => Number(user.id) === Number(c.user_id))
      const name = u ? (u.name || `${u.firstname || ''} ${u.lastname || ''}`.trim() || `User ${c.user_id}`) : `User ${c.user_id}`
      
      let initials = `U${c.user_id}`
      if (u) {
        const cleanFirst = u.firstname?.replace(/[^a-zA-Z0-9]/g, '').trim() || ''
        const cleanLast = u.lastname?.replace(/[^a-zA-Z0-9]/g, '').trim() || ''
        if (cleanFirst && cleanLast) {
          initials = `${cleanFirst[0]}${cleanLast[0]}`.toUpperCase()
        } else {
          const cleanName = (u.name || cleanFirst || cleanLast).replace(/[^a-zA-Z0-9\s]/g, '').trim()
          const parts = cleanName.split(/\s+/).filter(Boolean)
          if (parts.length >= 2) {
            initials = `${parts[0][0]}${parts[1][0]}`.toUpperCase()
          } else if (cleanName) {
            initials = cleanName.slice(0, 2).toUpperCase()
          }
        }
      }

      return {
        ...c,
        user: {
          name,
          initials,
          avatar: u?.avatar
        }
      }
    })
    
    const attachments = await prisma.task_attachments.findMany({
      where: { task_id: id },
      orderBy: { uploaded_at: 'desc' }
    })
    
    return { success: true, data: { comments, attachments } }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function addComment(taskId: number, textOrUserId: string | number, text?: string) {
  try {
    let commentText = ''
    let fallbackUserId: number | undefined

    if (typeof textOrUserId === 'string') {
      commentText = textOrUserId
    } else {
      fallbackUserId = textOrUserId
      commentText = text || ''
    }

    if (!commentText.trim()) {
      return { success: false, error: 'Comment cannot be empty' }
    }

    let userId: number
    try {
      const user = await requireAuth()
      userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id
    } catch {
      if (fallbackUserId) {
        userId = fallbackUserId
      } else {
        throw new Error('Unauthorized')
      }
    }

    // Parallelize comment creation and user profile fetch for lightning-fast response
    const [newComment, u] = await Promise.all([
      prisma.task_comments.create({
        data: {
          task_id: taskId,
          user_id: userId,
          comment: commentText.trim()
        }
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, firstname: true, lastname: true, name: true, avatar: true }
      })
    ])

    const name = u ? (u.name || `${u.firstname || ''} ${u.lastname || ''}`.trim() || `User ${userId}`) : `User ${userId}`
    let initials = `U${userId}`
    if (u) {
      const cleanFirst = u.firstname?.replace(/[^a-zA-Z0-9]/g, '').trim() || ''
      const cleanLast = u.lastname?.replace(/[^a-zA-Z0-9]/g, '').trim() || ''
      if (cleanFirst && cleanLast) {
        initials = `${cleanFirst[0]}${cleanLast[0]}`.toUpperCase()
      } else {
        const cleanName = (u.name || cleanFirst || cleanLast).replace(/[^a-zA-Z0-9\s]/g, '').trim()
        const parts = cleanName.split(/\s+/).filter(Boolean)
        if (parts.length >= 2) {
          initials = `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        } else if (cleanName) {
          initials = cleanName.slice(0, 2).toUpperCase()
        }
      }
    }

    const commentData = {
      ...newComment,
      user: {
        name,
        initials,
        avatar: u?.avatar
      }
    }

    // Broadcast to Pusher in real-time (non-blocking)
    pusherServer.trigger(`private-task-${taskId}`, 'comment:created', commentData).catch((err) => {
      console.error('Pusher comment trigger error:', err)
    })

    // Log activity in background (non-blocking)
    logActivity({
      userId,
      activityType: 'create',
      description: `Added comment on task ID ${taskId} in Kanban`
    }).catch(() => {})
    
    return { success: true, data: commentData }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function uploadAttachment(taskId: number, fileUrl: string, fileName: string) {
  try {
    const attachment = await prisma.task_attachments.create({
      data: {
        task_id: taskId,
        file_url: fileUrl,
        file_name: fileName
      }
    })
    
    return { success: true, data: attachment }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
