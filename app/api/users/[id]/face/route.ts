import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserSession } from '@/lib/auth/authorization';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getUserSession();
    if (!session || String(session.id) !== params.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { faceDescriptor } = await request.json();
    if (!faceDescriptor) {
      return NextResponse.json({ error: 'Missing face descriptor' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: Number(params.id) },
      data: { face_descriptor: JSON.stringify(faceDescriptor) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Face register error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
