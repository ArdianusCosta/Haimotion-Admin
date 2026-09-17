import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorization';

export async function PUT(req: Request, context: any) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const uid = Number(user.id);

    const params = await context.params;
    const { title, is_pinned } = await req.json();

    const existingThread = await prisma.ai_chat_thread.findUnique({
      where: { id: params.id }
    });

    if (!existingThread || existingThread.user_id !== uid) {
      return NextResponse.json({ error: 'Thread not found or unauthorized' }, { status: 404 });
    }

    const dataToUpdate: any = {};
    if (title !== undefined) dataToUpdate.title = title;
    if (is_pinned !== undefined) dataToUpdate.is_pinned = is_pinned;

    const thread = await prisma.ai_chat_thread.update({
      where: { id: params.id },
      data: dataToUpdate
    });

    return NextResponse.json({ thread });
  } catch (error: any) {
    console.error('Failed to update thread:', error);
    return NextResponse.json({ error: 'Failed to update thread: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: any) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const uid = Number(user.id);

    const params = await context.params;

    const existingThread = await prisma.ai_chat_thread.findUnique({
      where: { id: params.id }
    });

    if (!existingThread || existingThread.user_id !== uid) {
      return NextResponse.json({ error: 'Thread not found or unauthorized' }, { status: 404 });
    }

    await prisma.ai_chat_thread.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete thread:', error);
    return NextResponse.json({ error: 'Failed to delete thread: ' + error.message }, { status: 500 });
  }
}
