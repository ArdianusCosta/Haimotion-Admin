import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { requireAuth, requirePermission } from '@/lib/auth/authorization'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

    if (user.id !== id) {
      requirePermission(user, 'users.update');
    }

    const data = await request.json()
    
    const updateData: any = {}
    if (data.firstname !== undefined) updateData.firstname = data.firstname
    if (data.lastname !== undefined) updateData.lastname = data.lastname
    if (data.email !== undefined) updateData.email = data.email
    if (data.notification_email !== undefined) updateData.notification_email = data.notification_email
    if (data.type !== undefined) updateData.type = parseInt(data.type)
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10)
    }
    if (data.nik !== undefined) updateData.nik = data.nik || null
    if (data.address !== undefined) updateData.address = data.address || null
    if (data.avatar !== undefined) updateData.avatar = data.avatar || ''
    if (data.role_id !== undefined) updateData.role_id = data.role_id === null ? null : parseInt(data.role_id)

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    })
    
    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireAuth();
    requirePermission(user, 'users.delete');
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

    await prisma.user.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
