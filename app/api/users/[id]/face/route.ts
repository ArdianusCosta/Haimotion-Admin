import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserSession } from '@/lib/auth/authorization';

import { auth } from '@/lib/auth/auth';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    
    // Use request.headers directly to avoid Next.js headers() context issues
    const authSession = await auth.api.getSession({
      headers: request.headers,
    });

    if (!authSession || !authSession.user) {
      return NextResponse.json({ error: 'Unauthorized: Session is null' }, { status: 401 });
    }
    
    const sessionUserId = String(authSession.user.id);
    if (sessionUserId !== resolvedParams.id) {
      return NextResponse.json({ error: `Unauthorized: ID mismatch. Session ID: ${sessionUserId}, Params ID: ${resolvedParams.id}` }, { status: 401 });
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
