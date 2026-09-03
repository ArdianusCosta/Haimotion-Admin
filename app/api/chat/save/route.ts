import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { userId, threadId, role, content } = await req.json();

    if (!userId || !threadId || !role || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await prisma.ai_chat_history.create({
      data: {
        thread_id: threadId,
        user_id: parseInt(userId),
        role,
        content
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to save chat message:', error);
    return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });
  }
}
