import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const roleId = parseInt(resolvedParams.id);
    const data = await req.json();
    const { permissions } = data; // Array of permission ID strings
    
    if (!Array.isArray(permissions)) {
      return NextResponse.json({ error: 'Permissions must be an array of strings' }, { status: 400 });
    }

    // 1. Delete all existing permissions for this role
    await prisma.rolePermission.deleteMany({
      where: { role_id: roleId }
    });

    // 2. Insert new permissions if any
    if (permissions.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissions.map((permId: string) => ({
          role_id: roleId,
          permission: permId
        }))
      });
    }

    // Fetch the updated permissions to return
    const updatedPermissions = await prisma.rolePermission.findMany({
      where: { role_id: roleId }
    });

    return NextResponse.json({ permissions: updatedPermissions });
  } catch (error: any) {
    console.error('Error updating role permissions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
