import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { requireAuth, requirePermission } from '@/lib/auth/authorization'
import { canAccessProject } from '@/lib/auth/authorization'

export async function PUT(request: Request, { params }: { params: Promise<{ fieldId: string }> }) {
  try {
    const user = await requireAuth();

    const resolvedParams = await params;
    const fieldId = parseInt(resolvedParams.fieldId);
    if (isNaN(fieldId)) return NextResponse.json({ error: 'Invalid field ID' }, { status: 400 });

    const body = await request.json();
    const { value, is_completed } = body;

    // To verify access, we need to find which project this field belongs to
    const field = await prisma.projectSetupField.findUnique({
      where: { id: fieldId },
      include: {
        step: true
      }
    });

    if (!field) {
      return NextResponse.json({ error: 'Field not found' }, { status: 404 });
    }

    // Check project access
    // Admins (projects.update) or users with step-specific permission (setup_step.[step_id]) can update fields
    const hasGlobalAccess = user.role && user.role.permissions && user.role.permissions.some((p: any) => 
      p.permission === 'projects.update' || p.permission === `setup_step.${field.step_id}`
    );

    if (!hasGlobalAccess) {
      // If no global or step-specific permission, check if they are a member of the project (viewer access)
      const hasAccess = await canAccessProject(user, field.step.project_id, 'viewer');
      if (!hasAccess) {
        return NextResponse.json({ error: 'Not a member' }, { status: 403 });
      }
    }

    // Check if a value record already exists for this field
    let fieldValue = await prisma.projectSetupFieldValue.findFirst({
      where: { field_id: fieldId }
    });

    if (fieldValue) {
      // Update existing
      fieldValue = await prisma.projectSetupFieldValue.update({
        where: { id: fieldValue.id },
        data: {
          value: value !== undefined ? value : fieldValue.value,
          is_completed: is_completed !== undefined ? is_completed : fieldValue.is_completed,
          completed_at: is_completed ? new Date() : null,
          user_id: Number(user.id)
        }
      });
    } else {
      // Create new
      fieldValue = await prisma.projectSetupFieldValue.create({
        data: {
          field_id: fieldId,
          value: value || null,
          is_completed: is_completed || false,
          completed_at: is_completed ? new Date() : null,
          user_id: Number(user.id)
        }
      });
    }

    return NextResponse.json(fieldValue);
  } catch (error: any) {
    console.error('Error updating field value:', error);
    require('fs').writeFileSync('/tmp/field_update_error.log', String(error) + '\n' + (error.stack || ''));
    return NextResponse.json({ error: 'Failed to update field value', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
