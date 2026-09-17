import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getUserPermission, checkAccess } from '@/lib/file-auth';
import { requireAuth } from '@/lib/auth/authorization';

export async function GET(req: Request) {
  try {
    let user;
    try {
      user = await requireAuth();
    } catch (e: any) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const uid = Number(user.id);
    
    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get('parentId');
    const filter = searchParams.get('filter');
    let folders = [];

    if (filter === 'shared') {
      folders = await prisma.folder.findMany({
        where: {
          shares: { some: { shared_with_user_id: uid } }
        },
        include: {
           shares: { 
             where: { shared_with_user_id: uid },
             include: { shared_with_user: { select: { id: true, firstname: true, lastname: true, avatar: true } } }
           },
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
        include: {
          shares: { include: { shared_with_user: { select: { id: true, firstname: true, lastname: true, avatar: true } } } },
          owner: { select: { firstname: true, lastname: true } }
        }
      });

      // If user is inside a folder, also fetch folders if they have inherited access
      if (!filter && parentId) {
         const folderPerm = await getUserPermission(uid, parseInt(parentId), 'folder');
         
         if (folderPerm && folderPerm !== 'owner') {
             const sharedFolders = await prisma.folder.findMany({
                where: { parent_id: parseInt(parentId) },
                include: { 
                  owner: { select: { firstname: true, lastname: true } },
                  shares: { include: { shared_with_user: { select: { id: true, firstname: true, lastname: true, avatar: true } } } }
                },
                orderBy: { name: 'asc' }
             });
             folders = sharedFolders;
         }
      }
    }

    const serializedFolders = await Promise.all(folders.map(async folder => {
      const perm = await getUserPermission(uid, folder.id, 'folder');
      let sharedBy = null;
      if (filter === 'shared' && (folder as any).shares && (folder as any).shares.length > 0) {
         sharedBy = (folder as any).owner ? `${(folder as any).owner.firstname} ${(folder as any).owner.lastname}` : 'Unknown';
      }
      return {
        ...folder,
        permission: perm,
        sharedBy,
        shares: (folder as any).shares || []
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
    let user;
    try {
      user = await requireAuth();
    } catch (e: any) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const uid = Number(user.id);

    const body = await req.json();
    const { name, parentId } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (parentId) {
      const hasAccess = await checkAccess(uid, parseInt(parentId), 'folder', 'editor');
      if (!hasAccess) {
         return NextResponse.json({ error: 'Unauthorized to create folder here' }, { status: 403 });
      }
    }

    const newFolder = await prisma.folder.create({
      data: {
        name: name.trim(),
        owner_id: uid,
        parent_id: parentId ? parseInt(parentId) : null,
      },
    });

    return NextResponse.json({ folder: newFolder }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create folder:', error);
    return NextResponse.json({ error: 'Failed to create folder' }, { status: 500 });
  }
}
