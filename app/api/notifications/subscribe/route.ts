import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'

// POST /api/notifications/subscribe — Save FCM token for current user
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { token, device, browser } = await req.json()

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const userId = Number(session.user.id)

    // Upsert: update if same user+token exists, create otherwise
    await prisma.pushSubscription.upsert({
      where: {
        user_id_token: {
          user_id: userId,
          token: token,
        },
      },
      update: {
        device: device || null,
        browser: browser || null,
        updated_at: new Date(),
      },
      create: {
        user_id: userId,
        token,
        device: device || null,
        browser: browser || null,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Subscribe error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/notifications/subscribe — Remove FCM token (unsubscribe)
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { token } = await req.json()

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const userId = Number(session.user.id)

    await prisma.pushSubscription.deleteMany({
      where: {
        user_id: userId,
        token,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Unsubscribe error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
