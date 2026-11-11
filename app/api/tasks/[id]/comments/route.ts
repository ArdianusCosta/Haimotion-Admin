import { NextRequest, NextResponse } from 'next/server'
import { getTaskComments, createTaskComment } from '@/app/actions/tasks'
import { getUserSession } from '@/lib/auth/authorization'

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

    const result = await getTaskComments(taskId)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error in GET /api/tasks/[id]/comments:', error)
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

    const body = await req.json()
    const result = await createTaskComment(taskId, body.comment || '', body.parentId)
    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/tasks/[id]/comments:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

