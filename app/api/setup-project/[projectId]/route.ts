import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requirePermission } from '@/lib/auth/authorization'

export async function GET(request: Request, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const user = await requireAuth();
    // Allow if they have any role permission to view this
    if (!user.role || !user.role.permissions || user.role.permissions.length === 0) {
      throw new Error("Forbidden: No permissions");
    }
    
    const resolvedParams = await params;
    const projectId = parseInt(resolvedParams.projectId);
    
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const project = await prisma.project_list.findUnique({
      where: { id: projectId },
      include: {
        setup_steps: {
          orderBy: { order: 'asc' },
          include: {
            fields: {
              orderBy: { order: 'asc' },
              include: {
                values: true
              }
            }
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Process data to calculate step progress
    const steps = project.setup_steps.map(step => {
      let requiredCount = 0;
      let completedCount = 0;

      step.fields.forEach(field => {
        if (field.is_required) {
          requiredCount++;
          if (field.values.some(v => v.is_completed)) {
            completedCount++;
          }
        }
      });

      const progress = requiredCount > 0 ? Math.round((completedCount / requiredCount) * 100) : 100; // If no required fields, it's 100% complete
      const isCompleted = requiredCount > 0 ? completedCount === requiredCount : true;

      return {
        ...step,
        progress,
        isCompleted
      };
    });

    return NextResponse.json({
      ...project,
      setup_steps: steps
    });

  } catch (error) {
    console.error('Error fetching project setup:', error);
    return NextResponse.json({ error: 'Failed to fetch project setup' }, { status: 500 });
  }
}
