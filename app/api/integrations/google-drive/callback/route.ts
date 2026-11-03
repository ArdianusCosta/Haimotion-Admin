import { NextResponse } from 'next/server';
import {
  exchangeGoogleDriveCode,
  verifyGoogleDriveAccount,
  saveEncryptedRefreshToken,
  loadEncryptedRefreshToken,
  REQUIRED_STORAGE_EMAIL,
} from '@/lib/storage/gdrive';
import { getUserSession } from '@/lib/auth/authorization';
import { logActivity } from '@/lib/activity-log';
import { cookies } from 'next/headers';

// Helper to escape HTML and prevent Reflected XSS
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderErrorPage(title: string, message: string, status: number = 400) {
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);

  return new NextResponse(
    `<!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="utf-8">
      <title>${safeTitle} — HaiMotion ERP</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #09090b; color: #f4f4f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
        .card { background: #18181b; border: 1px solid #ef4444; border-radius: 16px; padding: 32px; max-width: 520px; width: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.6); text-align: center; }
        .icon { width: 48px; height: 48px; margin: 0 auto 16px; color: #ef4444; }
        h1 { font-size: 20px; font-weight: 700; margin-bottom: 8px; color: #fff; }
        p { color: #a1a1aa; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
        .btn { display: inline-block; background: #27272a; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 500; transition: background 0.2s; }
        .btn:hover { background: #3f3f46; }
      </style>
    </head>
    <body>
      <div class="card">
        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="12" stroke-width="2"/><line x1="12" y1="16" x2="12.01" y2="16" stroke-width="2"/></svg>
        <h1>${safeTitle}</h1>
        <p>${safeMessage}</p>
        <a href="/file-manager" class="btn">Kembali ke File Manager</a>
      </div>
    </body>
    </html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status }
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const errorParam = url.searchParams.get('error');
  const stateFromQuery = url.searchParams.get('state');

  // 1. Check for OAuth Error Return
  if (errorParam) {
    const errorMap: Record<string, string> = {
      access_denied: 'Otorisasi Google Drive dibatalkan oleh pengguna.',
      invalid_request: 'Permintaan otorisasi tidak valid dari Google.',
      unauthorized_client: 'OAuth Client tidak memiliki izin yang sesuai.',
    };
    const errorMessage = errorMap[errorParam] || 'Terjadi kesalahan saat memproses otorisasi Google OAuth.';
    return renderErrorPage('Koneksi Google Drive Dibatalkan', errorMessage, 400);
  }

  // 2. Validate CSRF State Parameter
  const cookieStore = await cookies();
  const stateFromCookie = cookieStore.get('gdrive_oauth_state')?.value;

  if (!stateFromQuery || !stateFromCookie || stateFromQuery !== stateFromCookie) {
    console.error('[GDrive Security] OAuth State mismatch or missing (possible CSRF attack)');
    return renderErrorPage(
      'Validasi Keamanan Gagal (CSRF Protection)',
      'Sesi otorisasi tidak valid atau telah kedaluwarsa. Silakan mulai kembali dari menu pengaturan integrasi.',
      403
    );
  }

  // Clear the state cookie after consumption
  cookieStore.delete('gdrive_oauth_state');

  if (!code) {
    return renderErrorPage('Kode Otorisasi Tidak Ditemukan', 'Google tidak mengembalikan authorization code yang valid.', 400);
  }

  try {
    // 3. Exchange Code for Tokens
    const tokens = await exchangeGoogleDriveCode(code);

    if (!tokens || !tokens.access_token) {
      throw new Error('Google did not return an access token.');
    }

    // 4. Verify Connected Google Account Identity
    const accountInfo = await verifyGoogleDriveAccount(tokens.access_token);
    const connectedEmail = accountInfo.email;

    if (connectedEmail !== REQUIRED_STORAGE_EMAIL.toLowerCase()) {
      console.warn(
        `[GDrive Security] Unauthorized Google Account connected: "${connectedEmail}". Required: "${REQUIRED_STORAGE_EMAIL}".`
      );
      return renderErrorPage(
        'Akun Google Tidak Sesuai',
        `Penyimpanan HaiMotion ERP wajib menggunakan akun resmi perusahaan: "${REQUIRED_STORAGE_EMAIL}". Anda saat ini login menggunakan "${connectedEmail}". Kredensial tidak disimpan demi keamanan data perusahaan.`,
        403
      );
    }

    if (!accountInfo.verified) {
      return renderErrorPage(
        'Email Google Belum Terverifikasi',
        'Akun Google yang digunakan belum memiliki status email terverifikasi oleh Google.',
        403
      );
    }

    // 5. Secure Token Storage (Server-Side AES-256-GCM Encryption)
    let tokenPersisted = false;
    if (tokens.refresh_token) {
      saveEncryptedRefreshToken(tokens.refresh_token);
      tokenPersisted = true;
    } else {
      // Check if server already has an existing token
      const existingToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN || loadEncryptedRefreshToken();
      tokenPersisted = !!existingToken;
    }

    // 6. Audit Logging
    const user = await getUserSession();
    if (user?.id) {
      await logActivity({
        userId: user.id,
        activityType: 'integration',
        description: `Google Drive Storage successfully authorized for company account ${REQUIRED_STORAGE_EMAIL}`,
      });
    }

    // 7. Render Sanitized Success Page (NO TOKENS EXPOSED)
    const statusNote = tokenPersisted
      ? 'Kredensial penyimpanan telah dienkripsi dan disimpan secara aman di sisi server (AES-256-GCM).'
      : 'Perhatian: Google tidak mengirimkan refresh token baru. Jika ini setup awal, silakan revoke akses di myaccount.google.com/permissions lalu hubungkan ulang.';

    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="utf-8">
        <title>Google Drive Storage Terhubung — HaiMotion ERP</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #09090b; color: #f4f4f5; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
          .card { background: #18181b; border: 1px solid #27272a; border-radius: 16px; padding: 36px; max-width: 540px; width: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.6); }
          .header { text-align: center; margin-bottom: 24px; }
          .icon { width: 52px; height: 52px; margin: 0 auto 16px; color: #10b981; }
          h1 { font-size: 22px; font-weight: 700; margin: 0 0 8px; color: #fff; }
          p.sub { color: #a1a1aa; font-size: 14px; margin: 0; }
          .box { background: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 20px; margin: 24px 0; font-size: 13px; line-height: 1.8; color: #d4d4d8; }
          .badge { display: inline-block; background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 6px; padding: 2px 10px; font-size: 12px; font-weight: 600; }
          .row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #1f1f23; }
          .row:last-child { border-bottom: none; }
          .note { background: rgba(2, 132, 199, 0.1); border: 1px solid rgba(2, 132, 199, 0.2); border-radius: 8px; padding: 12px; font-size: 12px; color: #38bdf8; margin-top: 16px; line-height: 1.5; }
          .footer { text-align: center; margin-top: 24px; }
          .btn { display: inline-block; background: #0284c7; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; transition: background 0.2s; }
          .btn:hover { background: #0369a1; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            <h1>Google Drive Storage Terhubung!</h1>
            <p class="sub">HaiMotion ERP berhasil mengotentikasi akun Google Drive resmi perusahaan.</p>
          </div>

          <div class="box">
            <div class="row">
              <span style="color: #71717a;">Status Integrasi</span>
              <span class="badge">Aktif & Terverifikasi</span>
            </div>
            <div class="row">
              <span style="color: #71717a;">Akun Terhubung</span>
              <code style="color: #f4f4f5; font-weight: 600;">${escapeHtml(REQUIRED_STORAGE_EMAIL)}</code>
            </div>
            <div class="row">
              <span style="color: #71717a;">OAuth Scope</span>
              <code>https://www.googleapis.com/auth/drive.file</code>
            </div>
            <div class="row">
              <span style="color: #71717a;">Kredensial Server</span>
              <span style="color: #10b981; font-weight: 500;">Tersimpan Aman (Terenkripsi)</span>
            </div>

            <div class="note">
              <strong>Info Keamanan:</strong> ${escapeHtml(statusNote)}
            </div>
          </div>

          <div class="footer">
            <a href="/file-manager" class="btn">Buka File Manager</a>
          </div>
        </div>
      </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  } catch (err: any) {
    console.error('[GDrive Security] OAuth callback error:', err?.message || err);
    return renderErrorPage(
      'Gagal Memproses Otorisasi',
      'Terjadi kesalahan internal saat menukar token dengan Google. Silakan periksa log server.',
      500
    );
  }
}
