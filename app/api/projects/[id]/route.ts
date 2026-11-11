import { NextRequest, NextResponse } from 'next/server'
import { getProjectById, updateProject, deleteProject, updateProjectStatus } from '@/app/actions/projects'
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

    const result = await getProjectById(projectId)
    if (!result.success) {
      return NextResponse.json(result, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error in GET /api/projects/[id]:', error)
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
    const projectId = Number(id)
    if (isNaN(projectId)) {
      return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 })
    }

    const body = await req.json()
    if (typeof body.status === 'number' && Object.keys(body).length === 1) {
      const result = await updateProjectStatus(projectId, body.status)
      return NextResponse.json(result)
    }

    const result = await updateProject(projectId, body)
    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error in PATCH /api/projects/[id]:', error)
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
    const projectId = Number(id)
    if (isNaN(projectId)) {
      return NextResponse.json({ success: false, error: 'Invalid project ID' }, { status: 400 })
    }

    const result = await deleteProject(projectId)
    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error in DELETE /api/projects/[id]:', error)
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

