import { NextRequest, NextResponse } from 'next/server'
import { getProjects, createProject } from '@/app/actions/projects'
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

    const projects = await getProjects()
    let filtered = projects

    if (search) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(search) || 
        (p.description && p.description.toLowerCase().includes(search)) ||
        (p.client_name && p.client_name.toLowerCase().includes(search))
      )
    }

    if (status !== null && status !== undefined && status !== '') {
      const statusNum = Number(status)
      filtered = filtered.filter(p => p.status === statusNum)
    }

    return NextResponse.json({ success: true, projects: filtered })
  } catch (error: any) {
    console.error('Error in GET /api/projects:', error)
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
    const result = await createProject(body)
    if (!result.success) {
      return NextResponse.json(result, { status: 400 })
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/projects:', error)
    const status = error.message?.includes('Forbidden') ? 403 : error.message?.includes('Unauthorized') ? 401 : 500
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status })
  }
}

