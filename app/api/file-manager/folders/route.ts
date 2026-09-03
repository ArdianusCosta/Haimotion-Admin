import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserPermission, checkAccess } from '@/lib/file-auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const parentId = searchParams.get('parentId');
    const filter = searchParams.get('filter');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const uid = parseInt(userId);
    let folders = [];

    if (filter === 'shared') {
      folders = await prisma.folder.findMany({
        where: {
          shares: { some: { shared_with_user_id: uid } }
        },
        include: {
           shares: { where: { shared_with_user_id: uid } },
           owner: { select: { firstname: true, lastname: true } }
        }
      });
    } else {
      folders = await prisma.folder.findMany({
        where: {
          owner_id: uid,
          parent_id: parentId ? parseInt(parentId) : null,
        },
        orderBy: { name: 'asc' },
      });

      // If user is inside a folder, also fetch folders if they have inherited access
      if (!filter && parentId) {
         const folderPerm = await getUserPermission(uid, parseInt(parentId), 'folder');
         
         if (folderPerm && folderPerm !== 'owner') {
             const sharedFolders = await prisma.folder.findMany({
                where: { parent_id: parseInt(parentId) },
                include: { owner: { select: { firstname: true, lastname: true } } },
                orderBy: { name: 'asc' }
             });
             folders = sharedFolders;
         }
      }
    }

    const serializedFolders = await Promise.all(folders.map(async folder => {
      const perm = await getUserPermission(uid, folder.id, 'folder');
      let sharedBy = null;
      if ((folder as any).shares && (folder as any).shares.length > 0) {
         sharedBy = (folder as any).owner ? `${(folder as any).owner.firstname} ${(folder as any).owner.lastname}` : 'Unknown';
      }
      return {
        ...folder,
        permission: perm,
        sharedBy
      };
    }));

    return NextResponse.json({ folders: serializedFolders });
  } catch (error: any) {
    console.error('Failed to fetch folders:', error);
    return NextResponse.json({ error: 'Failed to fetch folders' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, parentId, userId } = body;

    if (!name || !userId) {
      return NextResponse.json({ error: 'Name and userId are required' }, { status: 400 });
    }

    if (parentId) {
      const hasAccess = await checkAccess(parseInt(userId), parseInt(parentId), 'folder', 'editor');
      if (!hasAccess) {
         return NextResponse.json({ error: 'Unauthorized to create folder here' }, { status: 403 });
      }
    }

    const newFolder = await prisma.folder.create({
      data: {
        name: name.trim(),
        owner_id: parseInt(userId),
        parent_id: parentId ? parseInt(parentId) : null,
      },
    });

    return NextResponse.json({ folder: newFolder }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create folder:', error);
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
  }
}
