import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorization';
import { logActivity } from '@/lib/activity-log';

export async function GET() {
  try {
    const roles = await prisma.role.findMany({
      include: {
        permissions: true,
        _count: {
          select: { users: true }
        }
      },
      orderBy: { id: 'asc' }
    });
    return NextResponse.json({ roles });
  } catch (error: any) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const data = await req.json();
    const { name, description } = data;
    
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const newRole = await prisma.role.create({
      data: { name, description }
    });

    await logActivity({
      userId: user.id,
      activityType: 'create',
      description: `Created role: ${newRole.name}`
    });

    return NextResponse.json({ role: newRole });
  } catch (error: any) {
    console.error('Error creating role:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
