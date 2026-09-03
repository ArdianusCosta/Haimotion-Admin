import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getFileUrl } from '@/lib/storage/minio';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const fileId = parseInt(id);
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

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
    const uid = parseInt(userId);
    const isOwner = file.owner_id === uid;
    const isShared = file.shares.some(s => s.user_id === uid);

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
