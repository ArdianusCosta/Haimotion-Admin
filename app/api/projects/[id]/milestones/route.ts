import { NextRequest, NextResponse } from 'next/server'
import { getProjectMilestones, createProjectMilestone } from '@/app/actions/projects'
import { getUserSession } from '@/lib/auth/authorization'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const projectId = Number(id)
    if (isNaN(projectId)) {
      return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 })
    }

    const milestones = await getProjectMilestones(projectId)
    return NextResponse.json({ success: true, milestones })
  } catch (error: any) {
    console.error('Error in GET /api/projects/[id]/milestones:', error)
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
    const projectId = Number(id)
    if (isNaN(projectId)) {
      return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 })
    }

    const body = await req.json()
    const result = await createProjectMilestone({
      project_id: projectId,
      title: body.title,
      description: body.description,
      due_date: body.due_date,
    })

    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/projects/[id]/milestones:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

