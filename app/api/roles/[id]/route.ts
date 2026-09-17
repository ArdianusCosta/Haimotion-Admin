import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const data = await req.json();
    const { name, description } = data;
    
    const updatedRole = await prisma.role.update({
      where: { id: parseInt(resolvedParams.id) },
      data: { name, description }
    });

    return NextResponse.json({ role: updatedRole });
  } catch (error: any) {
    console.error('Error updating role:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const roleId = parseInt(resolvedParams.id);
    
    // Check if any users are assigned to this role
    const usersCount = await prisma.user.count({
      where: { role_id: roleId }
    });

    if (usersCount > 0) {
      return NextResponse.json({ error: `Cannot delete role. It is currently assigned to ${usersCount} user(s).` }, { status: 400 });
    }

    // RolePermissions cascade delete is set up in schema.prisma (`onDelete: Cascade`), 
    // so deleting the role will also delete its permissions.
    await prisma.role.delete({
      where: { id: roleId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting role:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
