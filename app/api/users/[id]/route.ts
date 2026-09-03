import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const id = parseInt(resolvedParams.id)
    if (isNaN(id)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })

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
