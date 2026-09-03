import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const excludeId = searchParams.get('excludeId');

    if (!query) {
      return NextResponse.json({ users: [] });
    }

    const whereClause: any = {
      OR: [
        { firstname: { contains: query } },
        { lastname: { contains: query } },
        { email: { contains: query } },
      ],
    };

    if (excludeId) {
      whereClause.id = { not: parseInt(excludeId) };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstname: true,
        lastname: true,
        email: true,
        avatar: true,
        role: {
          select: { name: true }
        }
      },
      take: 10,
    });

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Failed to search users:', error);
    return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
  }
}
