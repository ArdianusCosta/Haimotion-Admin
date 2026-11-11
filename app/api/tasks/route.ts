import { NextRequest, NextResponse } from 'next/server'
import { getTasksData, createTask } from '@/app/actions/tasks'
import { getUserSession } from '@/lib/auth/authorization'

export async function GET(req: NextRequest) {
  try {
    const user = await getUserSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search')?.toLowerCase()
    const status = searchParams.get('status')
    const projectId = searchParams.get('projectId')
    const assigneeId = searchParams.get('assigneeId')

    const data = await getTasksData()
    if (!data.success) {
      return NextResponse.json(data, { status: 400 })
    }

    let filteredTasks = data.tasks || []

    if (search) {
      filteredTasks = filteredTasks.filter(t => 
        t.title.toLowerCase().includes(search) || 
        (t.description && t.description.toLowerCase().includes(search)) ||
        (t.projectName && t.projectName.toLowerCase().includes(search))
      )
    }

    if (status !== null && status !== undefined && status !== '') {
      const statusNum = Number(status)
      filteredTasks = filteredTasks.filter(t => t.status === statusNum)
    }

    if (projectId) {
      const pId = Number(projectId)
      filteredTasks = filteredTasks.filter(t => t.projectId === pId)
    }

    if (assigneeId) {
      const aId = Number(assigneeId)
      filteredTasks = filteredTasks.filter(t => t.assignees?.some(a => a.id === aId))
    }

    return NextResponse.json({
      success: true,
      tasks: filteredTasks,
      projects: data.projects,
      users: data.users,
      currentUserId: data.currentUserId,
    })
  } catch (error: any) {
    console.error('Error in GET /api/tasks:', error)
    const status = error.message?.includes('Forbidden') ? 403 : error.message?.includes('Unauthorized') ? 401 : 500
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const result = await createTask({
      title: body.title,
      description: body.description || '',
      status: Number(body.status ?? 1),
      assignees: Array.isArray(body.assignees) ? body.assignees.map(Number) : [],
      projectId: Number(body.projectId),
      dueDate: body.dueDate,
    })

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/tasks:', error)
    const status = error.message?.includes('Forbidden') ? 403 : error.message?.includes('Unauthorized') ? 401 : 500
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status })
  }
}

