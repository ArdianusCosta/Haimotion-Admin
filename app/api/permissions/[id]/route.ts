import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const data = await req.json();
    const { category, name, description } = data;
    
    const updatedPermission = await prisma.systemPermission.update({
      where: { id: resolvedParams.id },
      data: { category, name, description }
    });

    return NextResponse.json({ permission: updatedPermission });
  } catch (error: any) {
    console.error('Error updating permission:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    // Delete the permission from system permissions
    // Note: RolePermissions that reference this permission might become orphaned
    // if we don't clean them up, but since `permission` in `role_permissions` is just a string
    // it won't violate foreign key constraints (as there is no DB-level FK constraint to SystemPermission).
    // However, it's good practice to delete them.
    await prisma.$transaction([
      prisma.rolePermission.deleteMany({
        where: { permission: resolvedParams.id }
      }),
      prisma.systemPermission.delete({
        where: { id: resolvedParams.id }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting permission:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
