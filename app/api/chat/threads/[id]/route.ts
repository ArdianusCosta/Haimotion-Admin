import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: Request, context: any) {
  try {
    const params = await context.params;
    const { title, is_pinned } = await req.json();

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
    const params = await context.params;
    await prisma.ai_chat_thread.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete thread:', error);
    return NextResponse.json({ error: 'Failed to delete thread: ' + error.message }, { status: 500 });
  }
}
