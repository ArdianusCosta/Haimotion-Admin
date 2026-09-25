import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { requireAuth, requirePermission } from '@/lib/auth/authorization'
import { logActivity } from '@/lib/activity-log'

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    requirePermission(user, 'users.view');
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || 'all'

    const whereClause: any = {}
    if (search) {
      whereClause.OR = [
        { firstname: { contains: search } },
        { lastname: { contains: search } },
        { email: { contains: search } }
      ]
    }
    if (role !== 'all') {
      whereClause.role_id = parseInt(role)
    }
    
    // Cari role id yang merupakan admin
    const adminRoles = await prisma.role.findMany({ where: { name: { contains: 'Admin' } }, select: { id: true } })
    const adminRoleIds = adminRoles.map(r => r.id)

    const [users, totalFiltered, totalAll, admins, employees] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        take: limit,
        skip: skip,
        orderBy: {
          date_created: 'desc'
        },
        include: { role: true }
      }),
      prisma.user.count({ where: whereClause }),
      prisma.user.count(),
      prisma.user.count({ where: { role_id: { in: adminRoleIds.length ? adminRoleIds : [-1] } } }),
      prisma.user.count({ where: { role_id: { notIn: adminRoleIds.length ? adminRoleIds : [-1] } } })
    ])
    
    return NextResponse.json({
      data: users,
      pagination: {
        total: totalFiltered,
        page,
        limit,
        totalPages: Math.ceil(totalFiltered / limit)
      },
      counts: {
        total: totalAll,
        admins,
        employees
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    requirePermission(user, 'users.create');
    
    const data = await request.json()
    
    // Default password if not provided
    const password = data.password || 'password123'
    const hashedPassword = await bcrypt.hash(password, 10)
    // Default avatar if not provided
    const avatar = data.avatar || ''
    
    const newUser = await prisma.user.create({
      data: {
        firstname: data.firstname,
        lastname: data.lastname || '',
        email: data.email,
        notification_email: data.notification_email || null,
        password: hashedPassword,
        role_id: data.role_id ? parseInt(data.role_id) : null,
        avatar: avatar,
        nik: data.nik || null,
        address: data.address || null
      }
    })
    
    // Create better-auth account so the user can login
    await prisma.account.create({
      data: {
        id: crypto.randomUUID(),
        accountId: newUser.id.toString(),
        providerId: 'credential',
        userId: newUser.id,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    await logActivity({
      userId: user.id,
      activityType: 'create',
      description: `Created user: ${newUser.firstname} ${newUser.lastname}`
    });

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
