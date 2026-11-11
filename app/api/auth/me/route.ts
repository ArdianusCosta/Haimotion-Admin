import { NextRequest, NextResponse } from 'next/server'
import { getUserSession } from '@/lib/auth/authorization'

export async function GET(req: NextRequest) {
  try {
    const user = await getUserSession()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        name: user.name || `${user.firstname} ${user.lastname}`.trim(),
        avatar: user.avatar,
        status: user.status,
        role_id: user.role_id,
        role: user.role,
      }
    })
  } catch (error: any) {
    console.error('Error fetching auth user:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

