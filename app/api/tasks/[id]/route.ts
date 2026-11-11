import { NextRequest, NextResponse } from 'next/server'
import { getTaskForEdit, updateTask, deleteTask } from '@/app/actions/tasks'
import { getTaskDetails, updateTaskStatus } from '@/app/actions/kanban'
import { getUserSession } from '@/lib/auth/authorization'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const taskId = Number(id)
    if (isNaN(taskId)) {
      return NextResponse.json({ success: false, error: 'Invalid task ID' }, { status: 400 })
    }

    const taskResult = await getTaskForEdit(taskId)
    if (!taskResult.success || !taskResult.task) {
      return NextResponse.json({ success: false, error: taskResult.error || 'Task not found' }, { status: 404 })
    }

    const [detailsResult, checklists, fullTask] = await Promise.all([
      getTaskDetails(taskId),
      prisma.taskChecklist.findMany({
        where: { task_id: taskId },
        orderBy: { order: 'asc' },
      }),
      prisma.task_list.findUnique({
        where: { id: taskId },
        include: {
          project: { select: { id: true, name: true } },
          assignees: {
            include: {
              user: {
                select: { id: true, firstname: true, lastname: true, avatar: true, email: true }
              }
            }
          }
        }
      })
    ])

    return NextResponse.json({
      success: true,
      task: {
        ...taskResult.task,
        projectName: fullTask?.project?.name || '',
        contentPillar: fullTask?.content_pillar || null,
        platform: fullTask?.platform || null,
        referenceLinks: fullTask?.reference_links || null,
        dateCreated: fullTask?.date_created?.toISOString() || null,
        assigneeDetails: fullTask?.assignees?.map(a => a.user) || [],
        comments: detailsResult.success ? detailsResult.data?.comments || [] : [],
        attachments: detailsResult.success ? detailsResult.data?.attachments || [] : [],
        checklists: checklists || [],
      }
    })
  } catch (error: any) {
    console.error('Error in GET /api/tasks/[id]:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const taskId = Number(id)
    if (isNaN(taskId)) {
      return NextResponse.json({ success: false, error: 'Invalid task ID' }, { status: 400 })
    }

    const body = await req.json()
    if (typeof body.status === 'number' && Object.keys(body).length === 1) {
      const result = await updateTaskStatus(taskId, body.status)
      return NextResponse.json(result)
    }

    const result = await updateTask(taskId, {
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

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error in PATCH /api/tasks/[id]:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const taskId = Number(id)
    if (isNaN(taskId)) {
      return NextResponse.json({ success: false, error: 'Invalid task ID' }, { status: 400 })
    }

    const result = await deleteTask(taskId)
    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error in DELETE /api/tasks/[id]:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

