import { NextRequest, NextResponse } from 'next/server'
import { getDashboardData } from '@/app/actions/dashboard'
import { getUserSession } from '@/lib/auth/authorization'

export async function GET(req: NextRequest) {
  try {
    const user = await getUserSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const range = searchParams.get('range') || 'Last 30 days'
    const project = searchParams.get('project') || undefined

    const data = await getDashboardData(range, project)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error in /api/dashboard:', error)
    const status = error.message?.includes('Forbidden') ? 403 : error.message?.includes('Unauthorized') ? 401 : 500
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status })
  }
}

