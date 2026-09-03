import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { checkAccess } from '@/lib/file-auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');
    const itemType = searchParams.get('itemType'); // 'file' or 'folder'
    const userId = searchParams.get('userId');

    if (!itemId || !itemType || !userId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const hasAccess = await checkAccess(parseInt(userId), parseInt(itemId), itemType as 'file' | 'folder', 'manager');
    // If not manager, but owner, it's fine. checkAccess for manager includes owner.
    
    // Wait, we should allow any user who has access to view who it is shared with?
    // Let's restrict it to editor and manager, or just owner/manager.
    if (!hasAccess) {
       return NextResponse.json({ error: 'Unauthorized to view shares' }, { status: 403 });
    }

    let shares = [];
    if (itemType === 'file') {
      shares = await prisma.fileShare.findMany({
        where: { file_id: parseInt(itemId) },
        include: { shared_with_user: { select: { id: true, firstname: true, lastname: true, email: true, avatar: true } } }
      });
    } else {
      shares = await prisma.folderShare.findMany({
        where: { folder_id: parseInt(itemId) },
        include: { shared_with_user: { select: { id: true, firstname: true, lastname: true, email: true, avatar: true } } }
      });
    }

    return NextResponse.json({ shares });
  } catch (error) {
    console.error('Failed to fetch shares:', error);
    return NextResponse.json({ error: 'Failed to fetch shares' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { itemId, itemType, sharedWithUserId, permission, userId } = body;

    if (!itemId || !itemType || !sharedWithUserId || !permission || !userId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const hasAccess = await checkAccess(parseInt(userId), parseInt(itemId), itemType, 'manager');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized to share' }, { status: 403 });
    }

    let share;
    if (itemType === 'file') {
      share = await prisma.fileShare.upsert({
        where: {
          file_id_shared_with_user_id: {
            file_id: parseInt(itemId),
            shared_with_user_id: parseInt(sharedWithUserId),
          }
        },
        update: { permission },
        create: {
          file_id: parseInt(itemId),
          shared_with_user_id: parseInt(sharedWithUserId),
          permission,
          shared_by_user_id: parseInt(userId),
        }
      });
    } else {
      share = await prisma.folderShare.upsert({
        where: {
          folder_id_shared_with_user_id: {
            folder_id: parseInt(itemId),
            shared_with_user_id: parseInt(sharedWithUserId),
          }
        },
        update: { permission },
        create: {
          folder_id: parseInt(itemId),
          shared_with_user_id: parseInt(sharedWithUserId),
          permission,
          shared_by_user_id: parseInt(userId),
        }
      });
    }

    return NextResponse.json({ share });
  } catch (error) {
    console.error('Failed to update share:', error);
    return NextResponse.json({ error: 'Failed to update share' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');
    const itemType = searchParams.get('itemType');
    const sharedWithUserId = searchParams.get('sharedWithUserId');
    const userId = searchParams.get('userId');

    if (!itemId || !itemType || !sharedWithUserId || !userId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const hasAccess = await checkAccess(parseInt(userId), parseInt(itemId), itemType as 'file'|'folder', 'manager');
    if (!hasAccess) {
      return NextResponse.json({ error: 'Unauthorized to remove share' }, { status: 403 });
    }

    if (itemType === 'file') {
      await prisma.fileShare.delete({
        where: {
          file_id_shared_with_user_id: {
            file_id: parseInt(itemId),
            shared_with_user_id: parseInt(sharedWithUserId),
          }
        }
      });
    } else {
      await prisma.folderShare.delete({
        where: {
          folder_id_shared_with_user_id: {
            folder_id: parseInt(itemId),
            shared_with_user_id: parseInt(sharedWithUserId),
          }
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove share:', error);
    return NextResponse.json({ error: 'Failed to remove share' }, { status: 500 });
  }
}
