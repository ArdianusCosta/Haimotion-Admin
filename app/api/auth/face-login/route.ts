import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email missing' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Create better-auth session manually
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    
    await prisma.session.create({
      data: {
        id: crypto.randomUUID(),
        token: sessionToken,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: user.id
      }
    });

    cookies().set('better-auth.session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: expiresAt
    });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Face match error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
