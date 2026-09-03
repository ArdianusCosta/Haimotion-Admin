import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const threads = await prisma.ai_chat_thread.findMany({
      where: { user_id: parseInt(userId) },
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
    const { userId, title } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const thread = await prisma.ai_chat_thread.create({
      data: {
        user_id: parseInt(userId),
        title: title || 'New Chat'
      }
    });

    return NextResponse.json({ thread });
  } catch (error: any) {
    console.error('Failed to create chat thread:', error);
    return NextResponse.json({ error: 'Failed to create thread: ' + error.message }, { status: 500 });
  }
}
