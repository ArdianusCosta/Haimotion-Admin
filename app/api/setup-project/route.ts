import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requirePermission } from '@/lib/auth/authorization'

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    // Allow if they have projects.view OR if they have ANY permission (since they might have custom permissions like "Centang Field")
    if (!user.role || !user.role.permissions || user.role.permissions.length === 0) {
      throw new Error("Forbidden: No permissions");
    }

    // Fetch projects with their steps and fields to calculate progress
    const projects = await prisma.project_list.findMany({
      include: {
        setup_steps: {
          include: {
            fields: {
              include: {
                values: true
              }
            }
          }
        }
      },
      orderBy: { date_created: 'desc' }
    });

    const data = projects.map(p => {
      // Calculate progress
      let totalRequired = 0;
      let totalCompleted = 0;
      let totalSteps = p.setup_steps.length;
      let totalFields = 0;

      p.setup_steps.forEach(step => {
        step.fields.forEach(field => {
          totalFields++;
          if (field.is_required) {
            totalRequired++;
            // Check if any value is completed
            if (field.values.some(v => v.is_completed)) {
              totalCompleted++;
            }
          }
        });
      });

      const progress = totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 0;

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        status: p.status,
        manager_id: p.manager_id,
        date_created: p.date_created,
        total_steps: totalSteps,
        total_fields: totalFields,
        progress: progress
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching setup projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}
