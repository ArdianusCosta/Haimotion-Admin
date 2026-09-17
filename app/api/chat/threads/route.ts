import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorization';

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const uid = Number(user.id);

    const threads = await prisma.ai_chat_thread.findMany({
      where: { user_id: uid },
      orderBy: [
        { is_pinned: 'desc' },
        { updated_at: 'desc' }
      ],
      select: {
        id: true,
        title: true,
        is_pinned: true,
        created_at: true,
        updated_at: true
      }
    });

    return NextResponse.json({ threads });
  } catch (error: any) {
    console.error('Failed to fetch chat threads:', error);
    return NextResponse.json({ error: 'Failed to fetch threads: ' + error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const uid = Number(user.id);

    const { title } = await req.json();

    const thread = await prisma.ai_chat_thread.create({
      data: {
        user_id: uid,
        title: title || 'New Chat'
      }
    });

    return NextResponse.json({ thread });
  } catch (error: any) {
    console.error('Failed to create chat thread:', error);
    return NextResponse.json({ error: 'Failed to create thread: ' + error.message }, { status: 500 });
  }
}
