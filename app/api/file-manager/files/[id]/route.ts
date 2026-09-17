import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { deleteFile as deleteMinioFile } from '@/lib/storage/minio';
import { checkAccess } from '@/lib/file-auth';
import { requireAuth } from '@/lib/auth/authorization';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const uid = Number(user.id);
    
    const { id } = await params;
    const fileId = parseInt(id);

    const hasAccess = await checkAccess(uid, fileId, 'file', 'manager');

    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file || !hasAccess) {
      return NextResponse.json({ error: 'File not found or unauthorized' }, { status: 404 });
    }

    // Delete from MinIO
    await deleteMinioFile(file.storage_key);

    // Delete from database
    await prisma.file.delete({
      where: { id: fileId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete file:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const uid = Number(user.id);

    const { id } = await params;
    const fileId = parseInt(id);
    const body = await req.json();
    const { action, name, folderId, is_starred } = body;

    // For rename and move, require 'editor'
    // For star, require 'viewer' since it's personal preference, BUT wait, is_starred is a global column in `file` table.
    // If it's a global column, only editor can change it. Let's require editor for all PATCH for now.
    const hasAccess = await checkAccess(uid, fileId, 'file', 'editor');

    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file || !hasAccess) {
      return NextResponse.json({ error: 'File not found or unauthorized' }, { status: 404 });
    }

    let updateData: any = {};

    if (action === 'rename' && name) {
      updateData.name = name;
    } else if (action === 'move') {
      updateData.folder_id = folderId === null ? null : parseInt(folderId);
    } else if (action === 'star') {
      updateData.is_starred = is_starred;
    }

    const updatedFile = await prisma.file.update({
      where: { id: fileId },
      data: updateData,
    });

    return NextResponse.json({ 
      file: {
        ...updatedFile,
        size: updatedFile.size.toString()
      } 
    });
  } catch (error: any) {
    console.error('Failed to update file:', error);
    return NextResponse.json({ error: 'Failed to update file' }, { status: 500 });
  }
}
