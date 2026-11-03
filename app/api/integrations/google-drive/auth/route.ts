import { NextResponse } from 'next/server';
import { generateGoogleDriveAuthUrl } from '@/lib/storage/gdrive';
import { requireAuth, hasPermission } from '@/lib/auth/authorization';
import crypto from 'crypto';

export async function GET(req: Request) {
  try {
    // 1. Enforce Authentication & Admin Role
    const user = await requireAuth();
    if (!user) {
      return NextResponse.redirect(new URL('/?error=unauthorized', req.url));
    }

    const isAdmin =
      user.role_id === 1 ||
      user.role?.name?.toLowerCase() === 'admin' ||
      (user as any).type === 1 ||
      hasPermission(user, 'settings_manage');

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden: Only administrators can configure enterprise Google Drive storage' },
        { status: 403 }
      );
    }

    // 2. Generate Cryptographically Secure CSRF State
    const state = crypto.randomBytes(32).toString('hex');

    // 3. Generate OAuth URL with State
    const authUrl = generateGoogleDriveAuthUrl(state);

    // 4. Redirect with HttpOnly Secure Cookie
    const res = NextResponse.redirect(authUrl);
    res.cookies.set('gdrive_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/integrations/google-drive',
      maxAge: 600, // 10 minutes expiry
    });

    return res;
  } catch (error: any) {
    console.error('[GDrive OAuth] Failed to initiate authorization:', error?.message || error);
    return NextResponse.json(
      { error: 'Failed to initiate Google Drive OAuth' },
      { status: 500 }
    );
  }
}
