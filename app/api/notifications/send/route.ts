import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth/auth'
import prisma from '@/lib/prisma'
import { sendPushNotification } from '@/lib/firebase/firebase-admin'

// POST /api/notifications/send — Send push notification to specific users
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userIds, title, body, icon, link, type, data } = await req.json()

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'userIds array is required' }, { status: 400 })
    }

    if (!title || !body) {
      return NextResponse.json({ error: 'title and body are required' }, { status: 400 })
    }

    const numericUserIds = userIds.map(Number)

    // 1. Save notifications to database for each user
    await prisma.notification.createMany({
      data: numericUserIds.map((userId: number) => ({
        user_id: userId,
        title,
        body,
        icon: icon || null,
        link: link || null,
        type: type || 'general',
        data: data ? JSON.stringify(data) : null,
      })),
    })

    // 2. Get all FCM tokens for target users
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        user_id: { in: numericUserIds },
      },
      select: {
        token: true,
      },
    })

    const tokens = subscriptions.map((s: { token: string }) => s.token)

    if (tokens.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Notifications saved but no push tokens found',
        pushSent: 0,
      })
    }

    // 3. Send push notifications via FCM
    const result = await sendPushNotification({
      tokens,
      title,
      body,
      icon,
      link,
      data: {
        type: type || 'general',
        ...data,
      },
    })

    // 4. Cleanup invalid tokens
    if (result.invalidTokens.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: {
          token: { in: result.invalidTokens },
        },
      })
    }

    return NextResponse.json({
      success: true,
      pushSent: result.successCount,
      pushFailed: result.failureCount,
      tokensCleanedUp: result.invalidTokens.length,
    })
  } catch (error: any) {
    console.error('Send notification error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
