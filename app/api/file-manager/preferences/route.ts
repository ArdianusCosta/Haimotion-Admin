import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorization';

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const uid = Number(user.id);

    const pref = await prisma.userPreference.findUnique({
      where: { user_id: uid },
    });

    return NextResponse.json({ preference: pref });
  } catch (error: any) {
    console.error('Failed to fetch preference:', error);
    return NextResponse.json({ error: 'Failed to fetch preference' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const uid = Number(user.id);

    const body = await req.json();
    const { file_manager_view_mode } = body;

    const pref = await prisma.userPreference.upsert({
      where: { user_id: uid },
      update: { file_manager_view_mode },
      create: {
        user_id: uid,
        file_manager_view_mode: file_manager_view_mode || 'grid',
      },
    });

    return NextResponse.json({ preference: pref });
  } catch (error: any) {
    console.error('Failed to update preference:', error);
    return NextResponse.json({ error: 'Failed to update preference' }, { status: 500 });
  }
}
