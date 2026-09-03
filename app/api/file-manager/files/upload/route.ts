import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { uploadFile } from '@/lib/storage/minio';
import crypto from 'crypto';
import { checkAccess } from '@/lib/file-auth';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    const userIdStr = formData.get('userId') as string;
    const folderIdStr = formData.get('folderId') as string | null;

    if (!userIdStr || files.length === 0) {
      return NextResponse.json({ error: 'userId and files are required' }, { status: 400 });
    }

    const userId = parseInt(userIdStr);
    const folderId = folderIdStr ? parseInt(folderIdStr) : null;

    if (folderId) {
      const hasAccess = await checkAccess(userId, folderId, 'folder', 'editor');
      if (!hasAccess) {
         return NextResponse.json({ error: 'Unauthorized to upload to this folder' }, { status: 403 });
      }
    }
    const uploadedFiles = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const originalName = file.name;
      const mimeType = file.type || 'application/octet-stream';
      const size = file.size;
      const extension = originalName.split('.').pop() || '';
      
      const storageKey = `users/${userId}/${crypto.randomUUID()}-${originalName}`;
      
      // Upload to MinIO
      await uploadFile(buffer, storageKey, size, {
        'Content-Type': mimeType,
        'Original-Name': originalName,
      });

      // Save to database
      const newFile = await prisma.file.create({
        data: {
          name: originalName,
          original_name: originalName,
          storage_key: storageKey,
          mime_type: mimeType,
          extension: extension,
          size: size,
          folder_id: folderId,
          owner_id: userId,
        }
      });
      
      uploadedFiles.push({
        ...newFile,
        size: newFile.size.toString()
      });
    }

    return NextResponse.json({ files: uploadedFiles }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to upload files:', error);
    return NextResponse.json({ error: 'Failed to upload files' }, { status: 500 });
  }
}
