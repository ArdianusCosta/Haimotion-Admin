import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserSession } from '@/lib/auth/authorization';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const session = await getUserSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Session is null' }, { status: 401 });
    }
    if (String(session.id) !== resolvedParams.id) {
      return NextResponse.json({ error: `Unauthorized: ID mismatch. Session ID: ${session.id}, Params ID: ${resolvedParams.id}` }, { status: 401 });
    }

    const { faceDescriptor } = await request.json();
    if (!faceDescriptor) {
      return NextResponse.json({ error: 'Missing face descriptor' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: Number(resolvedParams.id) },
      data: { face_descriptor: JSON.stringify(faceDescriptor) }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Face register error:', error);
    return NextResponse.json({ error: `Internal Server Error: ${error.message || error}` }, { status: 500 });
  }
}
