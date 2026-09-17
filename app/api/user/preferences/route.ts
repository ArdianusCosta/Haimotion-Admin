import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAuth } from '@/lib/auth/authorization';

export const dynamic = 'force-dynamic';

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
    console.error('Failed to fetch user preferences:', error);
    return NextResponse.json({ error: 'Failed to fetch user preferences' }, { status: 500 });
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
    const { 
      file_manager_view_mode,
      layout_style,
      theme_color,
      theme_radius,
      theme_mode,
      content_width,
      header_style,
      sidebar_style,
      font_family
    } = body;

    const updateData: any = {};
    if (file_manager_view_mode !== undefined) updateData.file_manager_view_mode = file_manager_view_mode;
    if (layout_style !== undefined) updateData.layout_style = layout_style;
    if (theme_color !== undefined) updateData.theme_color = theme_color;
    if (theme_radius !== undefined) updateData.theme_radius = theme_radius;
    if (theme_mode !== undefined) updateData.theme_mode = theme_mode;
    if (content_width !== undefined) updateData.content_width = content_width;
    if (header_style !== undefined) updateData.header_style = header_style;
    if (sidebar_style !== undefined) updateData.sidebar_style = sidebar_style;
    if (font_family !== undefined) updateData.font_family = font_family;

    const pref = await prisma.userPreference.upsert({
      where: { user_id: uid },
      update: updateData,
      create: {
        user_id: uid,
        ...updateData,
      },
    });

    return NextResponse.json({ preference: pref });
  } catch (error: any) {
    console.error('Failed to update user preferences:', error);
    return NextResponse.json({ error: 'Failed to update user preferences' }, { status: 500 });
  }
}
