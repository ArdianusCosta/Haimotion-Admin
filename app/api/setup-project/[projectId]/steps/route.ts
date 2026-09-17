import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requirePermission } from '@/lib/auth/authorization'

export async function POST(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const user = await requireAuth();
    requirePermission(user, 'projects.create'); // Assuming step creation is tied to project create/admin
    
    const resolvedParams = await params;
    const projectId = parseInt(resolvedParams.projectId);
    
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Determine the next order index
    const lastStep = await prisma.projectSetupStep.findFirst({
      where: { project_id: projectId },
      orderBy: { order: 'desc' }
    });
    const order = lastStep ? lastStep.order + 1 : 0;

    const newStep = await prisma.projectSetupStep.create({
      data: {
        project_id: projectId,
        name,
        description: description || null,
        order
      }
    });

    return NextResponse.json(newStep);
  } catch (error) {
    console.error('Error creating setup step:', error);
    return NextResponse.json({ error: 'Failed to create step' }, { status: 500 });
  }
}
