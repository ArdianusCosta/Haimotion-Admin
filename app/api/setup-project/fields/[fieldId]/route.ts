import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requirePermission } from '@/lib/auth/authorization'

export async function PUT(request: Request, { params }: { params: Promise<{ fieldId: string }> }) {
  try {
    const user = await requireAuth();
    requirePermission(user, 'projects.update'); 
    
    const resolvedParams = await params;
    const fieldId = parseInt(resolvedParams.fieldId);
    if (isNaN(fieldId)) return NextResponse.json({ error: 'Invalid field ID' }, { status: 400 });

    const body = await request.json();
    
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.is_required !== undefined) updateData.is_required = body.is_required;
    if (body.field_type !== undefined) updateData.field_type = body.field_type;
    if (body.order !== undefined) updateData.order = body.order;

    const updatedField = await prisma.projectSetupField.update({
      where: { id: fieldId },
      data: updateData
    });

    return NextResponse.json(updatedField);
  } catch (error) {
    console.error('Error updating field:', error);
    return NextResponse.json({ error: 'Failed to update field' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ fieldId: string }> }) {
  try {
    const user = await requireAuth();
    requirePermission(user, 'projects.delete'); 
    
    const resolvedParams = await params;
    const fieldId = parseInt(resolvedParams.fieldId);
    if (isNaN(fieldId)) return NextResponse.json({ error: 'Invalid field ID' }, { status: 400 });

    await prisma.projectSetupField.delete({
      where: { id: fieldId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting field:', error);
    return NextResponse.json({ error: 'Failed to delete field' }, { status: 500 });
  }
}
