import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requirePermission } from '@/lib/auth/authorization'

export async function PUT(request: Request, { params }: { params: Promise<{ stepId: string }> }) {
  try {
    const user = await requireAuth();
    requirePermission(user, 'projects.update'); 
    
    const resolvedParams = await params;
    const stepId = parseInt(resolvedParams.stepId);
    if (isNaN(stepId)) return NextResponse.json({ error: 'Invalid step ID' }, { status: 400 });

    const body = await request.json();
    
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.order !== undefined) updateData.order = body.order;

    const updatedStep = await prisma.projectSetupStep.update({
      where: { id: stepId },
      data: updateData
    });

    return NextResponse.json(updatedStep);
  } catch (error) {
    console.error('Error updating step:', error);
    return NextResponse.json({ error: 'Failed to update step' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ stepId: string }> }) {
  try {
    const user = await requireAuth();
    requirePermission(user, 'projects.delete'); 
    
    const resolvedParams = await params;
    const stepId = parseInt(resolvedParams.stepId);
    if (isNaN(stepId)) return NextResponse.json({ error: 'Invalid step ID' }, { status: 400 });

    await prisma.projectSetupStep.delete({
      where: { id: stepId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting step:', error);
    return NextResponse.json({ error: 'Failed to delete step' }, { status: 500 });
  }
}
