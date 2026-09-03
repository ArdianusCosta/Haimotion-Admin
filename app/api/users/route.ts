import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET(request: Request) {
  try {
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
      whereClause.type = parseInt(role)
    }
    
    const [users, totalFiltered, totalAll, admins, employees] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        take: limit,
        skip: skip,
        orderBy: {
          date_created: 'desc'
        }
      }),
      prisma.user.count({ where: whereClause }),
      prisma.user.count(),
      prisma.user.count({ where: { type: 1 } }),
      prisma.user.count({ where: { type: { not: 1 } } })
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
        type: parseInt(data.type) || 2,
        avatar: avatar,
        nik: data.nik || null,
        address: data.address || null
      }
    })
    
    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
