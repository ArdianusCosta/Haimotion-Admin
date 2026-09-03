'use server'

import prisma from '@/lib/prisma'

export async function getProjects() {
  try {
    const projects = await prisma.project_list.findMany({
      where: { is_archived: false },
      orderBy: { date_created: 'desc' }
    })
    
    // Fetch all users to map manager and members
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstname: true,
        lastname: true,
        avatar: true,
        email: true
      }
    })
    
    // Fetch all tasks to calculate progress
    const allTasks = await prisma.task_list.findMany({
      select: {
        id: true,
        project_id: true,
        status: true,
      }
    })
    
    const usersMap = new Map(users.map(u => [u.id, u]))
    
    const formattedProjects = projects.map(project => {
      const manager = usersMap.get(project.manager_id) || null
      
      const memberIds = project.user_ids 
        ? project.user_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
        : []
      
      const members = memberIds.map(id => usersMap.get(id)).filter(Boolean)
      
      const projectTasks = allTasks.filter(t => t.project_id === project.id)
      const totalTasks = projectTasks.length
      const completedTasks = projectTasks.filter(t => t.status === 5).length
      const inProgressTasks = projectTasks.filter(t => t.status === 2 || t.status === 6).length
      const pendingTasks = projectTasks.filter(t => t.status === 0 || t.status === 1).length
      
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      
      let deliveryConfidence = 'On Track'
      if (pendingTasks > 0 && progress < 30) deliveryConfidence = 'At Risk'
      if (pendingTasks > 0 && projectTasks.some(t => t.status === 0)) deliveryConfidence = 'Blocked'
      
      
      return {
        ...project,
        manager,
        members,
        tasks: projectTasks,
        stats: {
          totalTasks,
          completedTasks,
          inProgressTasks,
          pendingTasks,
          progress,
          deliveryConfidence
        }
      }
    })
    
    return { success: true, data: formattedProjects, users: users }
  } catch (error) {
    console.error('Error fetching projects:', error)
    return { success: false, error: 'Failed to fetch projects' }
  }
}

export async function getProjectById(id: number) {
  try {
    const project = await prisma.project_list.findUnique({
      where: { id }
    })
    
    if (!project) return { success: false, error: 'Project not found' }
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstname: true,
        lastname: true,
        avatar: true,
        email: true
      }
    })
    
    const tasks = await prisma.task_list.findMany({
      where: { project_id: id },
      orderBy: { date_created: 'desc' }
    })
    
    const usersMap = new Map(users.map(u => [u.id, u]))
    const manager = usersMap.get(project.manager_id) || null
    
    const memberIds = project.user_ids 
      ? project.user_ids.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id))
      : []
    const members = memberIds.map(id => usersMap.get(id)).filter(Boolean)
    
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(t => t.status === 5).length
    const inProgressTasks = tasks.filter(t => t.status === 2 || t.status === 6).length
    const pendingTasks = tasks.filter(t => t.status === 0 || t.status === 1).length
    
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    
    let deliveryConfidence = 'On Track'
    if (pendingTasks > 0 && progress < 30) deliveryConfidence = 'At Risk'
    if (pendingTasks > 0 && tasks.some(t => t.status === 0)) deliveryConfidence = 'Blocked'
    
    const formattedProject = {
      ...project,
      manager,
      members,
      tasks,
      stats: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        progress,
        deliveryConfidence
      }
    }
    
    return { success: true, data: formattedProject }
  } catch (error) {
    console.error('Error fetching project:', error)
    return { success: false, error: 'Failed to fetch project' }
  }
}

export async function createProject(data: {
  name: string
  description: string
  status: number
  start_date: string
  end_date: string
  manager_id: number
  user_ids: string
  client_name?: string
}) {
  try {
    const project = await prisma.project_list.create({
      data: {
        name: data.name,
        description: data.description,
        status: data.status,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        manager_id: data.manager_id,
        user_ids: data.user_ids,
        client_name: data.client_name
      }
    })
    return { success: true, data: project }
  } catch (error) {
    console.error('Error creating project:', error)
    return { success: false, error: 'Failed to create project' }
  }
}

export async function updateProject(id: number, data: {
  name: string
  description: string
  status: number
  start_date: string
  end_date: string
  manager_id: number
  user_ids: string
  client_name?: string
}) {
  try {
    const project = await prisma.project_list.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        status: data.status,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        manager_id: data.manager_id,
        user_ids: data.user_ids,
        client_name: data.client_name
      }
    })
    return { success: true, data: project }
  } catch (error) {
    console.error('Error updating project:', error)
    return { success: false, error: 'Failed to update project' }
  }
}

export async function deleteProject(id: number) {
  try {
    await prisma.project_list.delete({
      where: { id }
    })
    // Note: We might want to cascade delete tasks here if needed, but for now we follow the user instruction to be careful.
    return { success: true }
  } catch (error) {
    console.error('Error deleting project:', error)
    return { success: false, error: 'Failed to delete project' }
  }
}

export async function updateProjectStatus(id: number, status: number) {
  try {
    const project = await prisma.project_list.update({
      where: { id },
      data: { status }
    })
    return { success: true, data: project }
  } catch (error) {
    console.error('Error updating project status:', error)
    return { success: false, error: 'Failed to update project status' }
  }
}

export async function toggleFavoriteProject(id: number) {
  try {
    const project = await prisma.project_list.findUnique({ where: { id } })
    if (!project) return { success: false, error: 'Not found' }
    
    const updated = await prisma.project_list.update({
      where: { id },
      data: { is_favorite: !project.is_favorite }
    })
    return { success: true, data: updated }
  } catch (error) {
    return { success: false, error: 'Failed to toggle favorite' }
  }
}

export async function archiveProject(id: number) {
  try {
    await prisma.project_list.update({
      where: { id },
      data: { is_archived: true }
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to archive project' }
  }
}

export async function duplicateProject(id: number) {
  try {
    const project = await prisma.project_list.findUnique({ where: { id } })
    if (!project) return { success: false, error: 'Not found' }
    
    const duplicate = await prisma.project_list.create({
      data: {
        name: project.name + ' (Copy)',
        description: project.description,
        status: project.status,
        start_date: project.start_date,
        end_date: project.end_date,
        manager_id: project.manager_id,
        user_ids: project.user_ids,
        client_name: project.client_name
      }
    })
    return { success: true, data: duplicate }
  } catch (error) {
    return { success: false, error: 'Failed to duplicate project' }
  }
}

export async function exportProjectData(id: number) {
  try {
    const project = await prisma.project_list.findUnique({ where: { id } })
    if (!project) return { success: false, error: 'Not found' }
    
    const tasks = await prisma.task_list.findMany({ where: { project_id: id } })
    
    const payload = JSON.stringify({ project, tasks }, null, 2)
    return { success: true, data: payload, filename: `project-${id}-export.json` }
  } catch (error) {
    return { success: false, error: 'Failed to export' }
  }
}

export async function updateProjectMembers(id: number, user_ids: string) {
  try {
    const project = await prisma.project_list.update({
      where: { id },
      data: { user_ids }
    })
    return { success: true, data: project }
  } catch (error) {
    return { success: false, error: 'Failed to update members' }
  }
}
