'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// Status Map
const TASK_STATUS_MAP: Record<number, string> = {
  1: 'To Do',
  0: 'Pending',
  6: 'Started',
  2: 'In Progress',
  3: 'In Review',
  4: 'Revisions',
  7: 'Hold',
  8: 'Overdue',
  5: 'Done'
}

function stripHtml(html: string | null) {
  if (!html) return ''
  let text = html;
  let previous = '';
  while (text !== previous) {
    previous = text;
    text = text.replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&quot;/g, '"')
               .replace(/&#039;/g, "'")
               .replace(/&nbsp;/g, ' ');
  }
  text = text.replace(/<[^>]*>?/gm, ' ');
  return text.replace(/\s+/g, ' ').trim();
}

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

export async function getTasksData() {
  try {
    const projects = await prisma.project_list.findMany({
      orderBy: { date_created: 'desc' }
    })
    
    const tasks = await prisma.task_list.findMany({
      orderBy: { date_created: 'desc' }
    })
    
    const users = await prisma.user.findMany({
      select: { id: true, firstname: true, lastname: true, avatar: true }
    })
    
    // Group comments and attachments count for progress and details
    const commentsCount = await prisma.task_comments.groupBy({
      by: ['task_id'],
      _count: { id: true }
    })
    
    const attachmentsCount = await prisma.task_attachments.groupBy({
      by: ['task_id'],
      _count: { id: true }
    })

    const formattedUsers = users.map(u => ({
      id: u.id,
      name: `${u.firstname} ${u.lastname || ''}`.trim(),
      initials: `${u.firstname?.[0] || ''}${u.lastname?.[0] || ''}`.toUpperCase(),
      avatar: u.avatar
    }))

    // Calculate project progress and members
    const formattedProjects = projects.map(project => {
      const projectTasks = tasks.filter(t => t.project_id === project.id)
      const totalTasks = projectTasks.length
      const completedTasks = projectTasks.filter(t => t.status === 5).length
      const inProgressTasks = projectTasks.filter(t => t.status === 2 || t.status === 6).length
      const pendingTasks = projectTasks.filter(t => t.status === 0 || t.status === 1).length
      const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)
      
      const memberIds = project.user_ids ? project.user_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : []
      if (project.manager_id && !memberIds.includes(project.manager_id)) {
        memberIds.push(project.manager_id)
      }
      const members = formattedUsers.filter(u => memberIds.includes(u.id))

      return {
        id: project.id,
        name: project.name,
        description: stripHtml(project.description),
        rawDescription: project.description,
        status: project.status,
        progress,
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        members,
        startDate: project.start_date ? project.start_date.toISOString() : null,
        endDate: project.end_date ? project.end_date.toISOString() : null,
      }
    })

    const formattedTasks = tasks.map(task => {
      const assignedIds = task.user_ids ? task.user_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id)) : []
      const assignees = formattedUsers.filter(u => assignedIds.includes(u.id))
      const comments = commentsCount.find(c => c.task_id === task.id)?._count.id || 0
      const attachments = attachmentsCount.find(c => c.task_id === task.id)?._count.id || 0
      
      return {
        id: task.id.toString(),
        dbId: task.id,
        projectId: task.project_id,
        projectName: projects.find(p => p.id === task.project_id)?.name || 'Unknown Project',
        title: task.task,
        description: stripHtml(task.description),
        rawDescription: task.description,
        status: task.status ?? 1,
        statusName: TASK_STATUS_MAP[task.status ?? 1] || 'Unknown',
        tag: task.content_pillar || task.platform || 'General',
        tagColor: getTagColor(task.content_pillar || task.platform),
        assignees,
        comments,
        attachments,
        date: task.date_created.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: task.date_created.toISOString(),
        dueDate: task.end_date ? task.end_date.toISOString() : null,
      }
    })

    return { success: true, projects: formattedProjects, tasks: formattedTasks, users: formattedUsers }
  } catch (error: any) {
    console.error('Error fetching tasks data:', error)
    return { success: false, error: error.message }
  }
}

export async function createTask(data: { title: string, description: string, status: number, assignees: string, projectId: number, dueDate?: string }) {
  try {
    const task = await prisma.task_list.create({
      data: {
        task: data.title,
        description: data.description || '',
        status: data.status,
        user_ids: data.assignees || null,
        project_id: data.projectId,
        end_date: data.dueDate ? new Date(data.dueDate) : null
      }
    })
    revalidatePath('/kanban')
    return { success: true, data: task }
  } catch (error: any) {
    console.error('Error creating task:', error)
    return { success: false, error: error.message }
  }
}

export async function updateTask(id: number, data: { title: string, description: string, status: number, assignees: string, projectId: number, dueDate?: string }) {
  try {
    const task = await prisma.task_list.update({
      where: { id },
      data: {
        task: data.title,
        description: data.description || '',
        status: data.status,
        user_ids: data.assignees || null,
        project_id: data.projectId,
        end_date: data.dueDate ? new Date(data.dueDate) : null,
        date_updated: new Date()
      }
    })
    revalidatePath('/kanban')
    return { success: true, data: task }
  } catch (error: any) {
    console.error('Error updating task:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteTask(id: number) {
  try {
    // Delete related comments and attachments first (cascade simulation)
    await prisma.task_comments.deleteMany({ where: { task_id: id } })
    await prisma.task_attachments.deleteMany({ where: { task_id: id } })
    await prisma.user_productivity.deleteMany({ where: { task_id: id } })
    
    await prisma.task_list.delete({
      where: { id }
    })
    revalidatePath('/kanban')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting task:', error)
    return { success: false, error: error.message }
  }
}
