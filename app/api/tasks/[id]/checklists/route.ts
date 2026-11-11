import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getUserSession, canAccessTask } from '@/lib/auth/authorization'

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

    const hasAccess = await canAccessTask(user, taskId, 'viewer')
    if (!hasAccess) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const checklists = await prisma.taskChecklist.findMany({
      where: { task_id: taskId },
      orderBy: { order: 'asc' },
    })

    return NextResponse.json({ success: true, checklists })
  } catch (error: any) {
    console.error('Error in GET /api/tasks/[id]/checklists:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const hasAccess = await canAccessTask(user, taskId, 'editor')
    if (!hasAccess) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    if (!body.label?.trim()) {
      return NextResponse.json({ success: false, error: 'Label is required' }, { status: 400 })
    }

    const count = await prisma.taskChecklist.count({ where: { task_id: taskId } })
    const item = await prisma.taskChecklist.create({
      data: {
        task_id: taskId,
        label: body.label.trim(),
        order: count,
      }
    })

    return NextResponse.json({ success: true, checklist: item }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/tasks/[id]/checklists:', error)
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

    const hasAccess = await canAccessTask(user, taskId, 'editor')
    if (!hasAccess) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const checklistId = Number(body.checklistId)
    if (isNaN(checklistId)) {
      return NextResponse.json({ success: false, error: 'checklistId required' }, { status: 400 })
    }

    const updated = await prisma.taskChecklist.update({
      where: { id: checklistId },
      data: {
        is_done: typeof body.is_done === 'boolean' ? body.is_done : undefined,
        label: typeof body.label === 'string' ? body.label.trim() : undefined,
      }
    })

    return NextResponse.json({ success: true, checklist: updated })
  } catch (error: any) {
    console.error('Error in PATCH /api/tasks/[id]/checklists:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

