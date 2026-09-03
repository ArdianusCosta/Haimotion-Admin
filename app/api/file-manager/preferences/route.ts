import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const pref = await prisma.userPreference.findUnique({
      where: { user_id: parseInt(userId) },
    });

    return NextResponse.json({ preference: pref });
  } catch (error: any) {
    console.error('Failed to fetch preference:', error);
    return NextResponse.json({ error: 'Failed to fetch preference' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { userId, file_manager_view_mode } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const pref = await prisma.userPreference.upsert({
      where: { user_id: parseInt(userId) },
      update: { file_manager_view_mode },
      create: {
        user_id: parseInt(userId),
        file_manager_view_mode: file_manager_view_mode || 'grid',
      },
    });

    return NextResponse.json({ preference: pref });
  } catch (error: any) {
    console.error('Failed to update preference:', error);
    return NextResponse.json({ error: 'Failed to update preference' }, { status: 500 });
  }
}
