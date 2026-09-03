import fs from 'fs'

let code = fs.readFileSync('./app/actions/projects.ts', 'utf-8')

// 1. Update getProjects query
code = code.replace(
  "const projects = await prisma.project_list.findMany({",
  `const projects = await prisma.project_list.findMany({
      where: { is_archived: false },`
)

// 2. Update stats and delivery confidence
code = code.replace(
  `const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0`,
  `const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      
      let deliveryConfidence = 'On Track'
      if (pendingTasks > 0 && progress < 30) deliveryConfidence = 'At Risk'
      if (pendingTasks > 0 && projectTasks.some(t => t.status === 0)) deliveryConfidence = 'Blocked'
      `
)

code = code.replace(
  `pendingTasks,
          progress
        }`,
  `pendingTasks,
          progress,
          deliveryConfidence
        }`
)

// 3. Update createProject args and data
code = code.replace(
  `manager_id: number
  user_ids: string
}) {`,
  `manager_id: number
  user_ids: string
  client_name?: string
}) {`
)

code = code.replace(
  `manager_id: data.manager_id,
        user_ids: data.user_ids
      }`,
  `manager_id: data.manager_id,
        user_ids: data.user_ids,
        client_name: data.client_name
      }`
)

// 4. Update updateProject args and data
code = code.replace(
  `manager_id: number
  user_ids: string
}) {`,
  `manager_id: number
  user_ids: string
  client_name?: string
}) {`
)

code = code.replace(
  `manager_id: data.manager_id,
        user_ids: data.user_ids
      }`,
  `manager_id: data.manager_id,
        user_ids: data.user_ids,
        client_name: data.client_name
      }`
)

// 5. Add new functions at the end
const newFns = `
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
    return { success: true, data: payload, filename: \`project-\${id}-export.json\` }
  } catch (error) {
    return { success: false, error: 'Failed to export' }
  }
}
`

code += newFns
fs.writeFileSync('./app/actions/projects.ts', code)
