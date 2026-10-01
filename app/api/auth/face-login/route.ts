import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth/auth';
import { createHMAC } from '@better-auth/utils/hmac';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, descriptor } = body;

    let targetUser: any = null;

    if (descriptor && Array.isArray(descriptor)) {
      // Find matching user from all users with registered face_descriptor
      const usersWithFace = await prisma.user.findMany({
        where: {
          face_descriptor: { not: null }
        },
        select: {
          id: true,
          email: true,
          name: true,
          firstname: true,
          lastname: true,
          status: true,
          avatar: true,
          face_descriptor: true
        }
      });

      let minDistance = 0.68; // Optimized threshold for TinyFaceDetector (0.68)
      let bestMatchedDistance = 999;

      for (const user of usersWithFace) {
        if (!user.face_descriptor) continue;
        try {
          const savedDescriptor: number[] = JSON.parse(user.face_descriptor);
          if (!Array.isArray(savedDescriptor) || savedDescriptor.length !== descriptor.length) continue;

          let sum = 0;
          for (let i = 0; i < descriptor.length; i++) {
            const diff = descriptor[i] - savedDescriptor[i];
            sum += diff * diff;
          }
          const distance = Math.sqrt(sum);
          console.log(`[Face Match Check] User: ${user.email} (${user.name}), Distance: ${distance.toFixed(4)} (Threshold: ${minDistance})`);

          if (distance < minDistance && distance < bestMatchedDistance) {
            bestMatchedDistance = distance;
            targetUser = user;
          }
        } catch (e) {
          console.error(`Error parsing face_descriptor for user ${user.id}:`, e);
        }
      }

      if (targetUser) {
        console.log(`[Face Match SUCCESS] Matched user ${targetUser.email} with distance ${bestMatchedDistance.toFixed(4)}`);
      } else {
        console.log(`[Face Match FAILED] No user matched below threshold ${minDistance}`);
        return NextResponse.json({ error: 'Wajah tidak cocok dengan pengguna manapun yang terdaftar.' }, { status: 400 });
      }
    } else if (email) {
      targetUser = await prisma.user.findUnique({ where: { email } });
      if (!targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    } else {
      return NextResponse.json({ error: 'Deskriptor wajah atau email diperlukan.' }, { status: 400 });
    }

    if (targetUser.status === 'resign') {
      return NextResponse.json({ error: 'Anda sudah resign, mohon hubungi admin.' }, { status: 403 });
    }

    // Create session via Better Auth internalAdapter
    const ctx = await (auth as any).$context;
    const session = await ctx.internalAdapter.createSession(targetUser.id);

    // Sign session token using Better Auth HMAC secret
    const secret = ctx.secret;
    const token = session.token;
    const signature = await createHMAC('SHA-256', 'base64urlnopad').sign(secret, token);
    const signedCookieValue = `${token}.${signature}`;

    const cookieStore = await cookies();
    cookieStore.set('better-auth.session_token', signedCookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      expires: session.expiresAt
    });

    return NextResponse.json({ success: true, user: targetUser });
  } catch (error) {
    console.error('Face match error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
