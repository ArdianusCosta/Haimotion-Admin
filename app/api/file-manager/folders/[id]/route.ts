import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { deleteFile as deleteMinioFile } from '@/lib/storage/minio';
import { checkAccess } from '@/lib/file-auth';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const folderId = parseInt(id);
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const uid = parseInt(userId);
    const hasAccess = await checkAccess(uid, folderId, 'folder', 'manager');

    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder || !hasAccess) {
      return NextResponse.json({ error: 'Folder not found or unauthorized' }, { status: 404 });
    }

    // We should technically delete all files inside the folder recursively from MinIO.
    // For simplicity and safety in this iteration, we allow deleting if it exists.
    // Ideally, we fetch all files in this folder and its subfolders and delete them from MinIO.
    
    // For now, let's just delete the folder from the DB. Prisma's onDelete: Cascade is NOT set for files.
    // Let's implement a safe deletion: find all files in the folder and delete from MinIO first.
    const files = await prisma.file.findMany({
      where: { folder_id: folderId }
    })

    for (const file of files) {
      try {
        await deleteMinioFile(file.storage_key)
      } catch (err) {
        console.error('Failed to delete file from MinIO', err)
      }
      await prisma.file.delete({ where: { id: file.id } })
    }

    // Delete folder from database
    await prisma.folder.delete({
      where: { id: folderId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete folder:', error);
    return NextResponse.json({ error: 'Failed to delete folder' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const folderId = parseInt(id);
    const body = await req.json();
    const { action, name, parentId, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const uid = parseInt(userId);
    const hasAccess = await checkAccess(uid, folderId, 'folder', 'editor');

    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder || !hasAccess) {
      return NextResponse.json({ error: 'Folder not found or unauthorized' }, { status: 404 });
    }

    let updateData: any = {};

    if (action === 'rename' && name) {
      updateData.name = name;
    } else if (action === 'move') {
      // Avoid circular dependency (can't move folder into itself)
      if (folderId === parseInt(parentId)) {
        return NextResponse.json({ error: 'Cannot move folder into itself' }, { status: 400 });
      }
      updateData.parent_id = parentId === null ? null : parseInt(parentId);
    }

    const updatedFolder = await prisma.folder.update({
      where: { id: folderId },
      data: updateData,
    });

    return NextResponse.json({ folder: updatedFolder });
  } catch (error: any) {
    console.error('Failed to update folder:', error);
    return NextResponse.json({ error: 'Failed to update folder' }, { status: 500 });
  }
}
