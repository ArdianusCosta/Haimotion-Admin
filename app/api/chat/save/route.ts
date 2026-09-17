import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorization';

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const uid = Number(user.id);

    const { threadId, role, content } = await req.json();

    if (!threadId || !role || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await prisma.ai_chat_history.create({
      data: {
        thread_id: threadId,
        user_id: uid,
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
