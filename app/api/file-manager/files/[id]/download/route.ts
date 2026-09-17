import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getFileUrl } from '@/lib/storage/minio';
import { requireAuth } from '@/lib/auth/authorization';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    const fileId = parseInt(id);

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        shares: true
      }
    });

    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check permissions
    const uid = Number(user.id);
    const isOwner = file.owner_id === uid;
    const isShared = file.shares.some(s => s.shared_with_user_id === uid);

    if (!isOwner && !isShared) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const url = await getFileUrl(file.storage_key, 3600);

    return NextResponse.json({ url, originalName: file.original_name });
  } catch (error: any) {
    console.error('Failed to generate download url:', error);
    return NextResponse.json({ error: 'Failed to generate download url' }, { status: 500 });
  }
}
