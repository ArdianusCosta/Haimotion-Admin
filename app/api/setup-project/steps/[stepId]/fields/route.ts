import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requirePermission } from '@/lib/auth/authorization'

export async function POST(request: Request, { params }: { params: Promise<{ stepId: string }> }) {
  try {
    const user = await requireAuth();
    requirePermission(user, 'projects.create'); 
    
    const resolvedParams = await params;
    const stepId = parseInt(resolvedParams.stepId);
    
    if (isNaN(stepId)) {
      return NextResponse.json({ error: 'Invalid step ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, description, is_required, field_type } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Determine the next order index
    const lastField = await prisma.projectSetupField.findFirst({
      where: { step_id: stepId },
      orderBy: { order: 'desc' }
    });
    const order = lastField ? lastField.order + 1 : 0;

    const newField = await prisma.projectSetupField.create({
      data: {
        step_id: stepId,
        name,
        description: description || null,
        is_required: is_required !== undefined ? is_required : true,
        field_type: field_type || 'checkbox',
        order
      }
    });

    return NextResponse.json(newField);
  } catch (error) {
    console.error('Error creating setup field:', error);
    return NextResponse.json({ error: 'Failed to create field' }, { status: 500 });
  }
}
