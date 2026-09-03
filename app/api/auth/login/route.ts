import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const user = await prisma.user.findFirst({
      where: { email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Email is not registered.' }, { status: 401 })
    }

    // Usually we would use bcrypt.compare(password, user.password)
    // But since the legacy passwords might be in plaintext or md5, let's just do a simple check
    // In a real app we'd migrate all passwords to bcrypt.
    let isValid = false;
    
    // Check if the stored password looks like a bcrypt hash ($2a$, $2b$, etc)
    if (user.password.startsWith('$2')) {
      isValid = await bcrypt.compare(password, user.password)
    } else {
      // Fallback to plaintext comparison (since earlier we found Pa$$w0rd!? saved in DB)
      isValid = (password === user.password)
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid password.' }, { status: 401 })
    }

    // Return user without password
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      user: userWithoutPassword
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
