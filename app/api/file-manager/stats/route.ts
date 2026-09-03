import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const uid = parseInt(userId);

    // Get total storage used by this user (sum of file sizes)
    const files = await prisma.file.findMany({
      where: { owner_id: uid },
      select: { size: true }
    });

    let storageUsedBytes = 0;
    for (const f of files) {
      storageUsedBytes += Number(f.size || 0);
    }
    
    // Convert to GB (1 GB = 1024^3 bytes)
    const storageUsedGB = (storageUsedBytes / (1024 * 1024 * 1024)).toFixed(1);

    // Get number of files shared with this user
    const sharedFilesCount = await prisma.fileShare.count({
      where: { shared_with_user_id: uid }
    });

    // Get recent activity (files updated in the last 7 days by this user)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentActivityCount = await prisma.file.count({
      where: { 
        owner_id: uid,
        updated_at: {
          gte: sevenDaysAgo
        }
      }
    });

    return NextResponse.json({
      storageUsedGB: parseFloat(storageUsedGB),
      sharedFilesCount,
      recentActivityCount,
      maxStorageGB: 100 // Hardcoded max storage for now, this could be from user tier
    });

  } catch (error: any) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
