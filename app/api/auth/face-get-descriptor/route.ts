import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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
    
    return NextResponse.json({ 
      success: true, 
      faceDescriptor: user.face_descriptor ? JSON.parse(user.face_descriptor) : null
    });
  } catch (error) {
    console.error('Face match error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
