import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'

// PATCH /api/notifications/[id]/read — Mark single notification as read
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const userId = Number(session.user.id)
    const notifId = Number(id)

    const notification = await prisma.notification.findFirst({
      where: { id: notifId, user_id: userId },
    })

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    await prisma.notification.update({
      where: { id: notifId },
      data: { is_read: true, read_at: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Mark read error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
