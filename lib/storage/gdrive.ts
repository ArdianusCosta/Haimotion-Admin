/**
 * Google Drive REST v3 Storage Adapter for HaiMotion ERP (Hardened Version)
 * 
 * Features:
 * - Zero external package bloat (native Fetch & Node.js Streams)
 * - AES-256-GCM encrypted server-side token persistence (.gdrive-token.enc)
 * - Automatic token refresh with 60s buffer & ADMIN_REAUTH_REQUIRED detection
 * - Dual upload engine: Multipart (<= 5MB) & Resumable Upload (> 5MB)
 * - Google userinfo email verification (strictly contact.haimotion@gmail.com)
 * - Root folder resolution with GOOGLE_DRIVE_ROOT_FOLDER_ID support
 */

import { Readable } from 'stream';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

let cachedToken: TokenCache | null = null;
let cachedFolderId: string | null = null;

// Required corporate Google account
export const REQUIRED_STORAGE_EMAIL = 'contact.haimotion@gmail.com';

const TOKEN_ENC_PATH = path.join(process.cwd(), '.gdrive-token.enc');

/**
 * Derives a 32-byte AES-256 key from server secret
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY ||
    process.env.BETTER_AUTH_SECRET ||
    'haimotion-erp-gdrive-internal-storage-key-2026';
  return crypto.scryptSync(secret, 'haimotion-drive-salt', 32);
}

/**
 * Encrypts and saves the refresh token to local secure file
 */
export function saveEncryptedRefreshToken(token: string): void {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    const payload = JSON.stringify({
      iv: iv.toString('hex'),
      authTag,
      encrypted,
      updatedAt: new Date().toISOString(),
    });
    
    fs.writeFileSync(TOKEN_ENC_PATH, payload, { mode: 0o600 });
  } catch (err) {
    console.error('[GDrive Security] Failed to persist encrypted refresh token:', err);
  }
}

/**
 * Reads and decrypts refresh token from local secure file
 */
export function loadEncryptedRefreshToken(): string | null {
  try {
    if (!fs.existsSync(TOKEN_ENC_PATH)) return null;
    const raw = fs.readFileSync(TOKEN_ENC_PATH, 'utf8');
    const data = JSON.parse(raw);
    
    const key = getEncryptionKey();
    const iv = Buffer.from(data.iv, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(Buffer.from(data.authTag, 'hex'));
    
    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('[GDrive Security] Failed to decrypt refresh token:', err);
    return null;
  }
}

/**
 * Returns credentials with preference to environment variable or local encrypted storage
 */
function getCredentials() {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET || '';
  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI || 'https://dashboardv2.haimotion.com/api/integrations/google-drive/callback';
  
  // Prefer env var, fallback to local encrypted store
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN || loadEncryptedRefreshToken() || '';

  return { clientId, clientSecret, redirectUri, refreshToken };
}

/**
 * Checks if Google Drive integration is fully configured and ready
 */
export function isGoogleDriveConfigured(): boolean {
  const { clientId, clientSecret, refreshToken } = getCredentials();
  return !!(clientId && clientSecret && refreshToken);
}

/**
 * Returns a valid Google OAuth access token, auto-refreshing when needed
 */
export async function getValidAccessToken(): Promise<string> {
  const { clientId, clientSecret, refreshToken } = getCredentials();

  if (!clientId || !clientSecret) {
    throw new Error('Google Drive OAuth Client ID or Client Secret is missing in environment variables.');
  }

  if (!refreshToken) {
    throw new Error('ADMIN_REAUTH_REQUIRED: Google Drive is not connected yet. Please authenticate via /api/integrations/google-drive/auth');
  }

  // Return cached token if valid (with 60-second safety buffer)
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.accessToken;
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    cachedToken = null; // Clear cache on error
    if (errorData.includes('invalid_grant')) {
      console.error('[GDrive Security] Refresh token revoked or invalid (invalid_grant).');
      throw new Error('ADMIN_REAUTH_REQUIRED: Google Drive authorization has expired or was revoked. Re-authentication required.');
    }
    throw new Error(`Google token refresh failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const expiresIn = data.expires_in || 3600;

  cachedToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (expiresIn * 1000),
  };

  return cachedToken.accessToken;
}

/**
 * Resolves or creates the parent folder 'HaiMotion ERP Storage' on Google Drive
 */
export async function getOrCreateDriveRootFolder(accessToken: string): Promise<string | null> {
  if (process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID) {
    return process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  }

  if (cachedFolderId) {
    return cachedFolderId;
  }

  const folderName = 'HaiMotion ERP Storage';

  try {
    const query = encodeURIComponent(`name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&spaces=drive`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.files && searchData.files.length > 0) {
        cachedFolderId = searchData.files[0].id;
        return cachedFolderId;
      }
    }

    // Create the folder if not found
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        description: 'System storage folder for HaiMotion ERP files',
      }),
    });

    if (createRes.ok) {
      const created = await createRes.json();
      cachedFolderId = created.id || null;
      return cachedFolderId;
    }
  } catch (err) {
    console.warn('Could not ensure root folder on Drive, falling back to root:', err);
  }

  return null;
}

/**
 * Resumable upload for large files (> 5MB)
 * Streams data directly without loading the entire multipart body into RAM
 */
async function uploadResumable(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  folderId: string | null,
  accessToken: string,
  metaData?: Record<string, string>
): Promise<string> {
  const fileMetadata: any = {
    name: filename,
    description: metaData?.['Original-Name'] ? `Original: ${metaData['Original-Name']}` : undefined,
  };

  if (folderId) {
    fileMetadata.parents = [folderId];
  }

  const contentType = mimeType || 'application/octet-stream';

  // 1. Initiate Resumable Upload Session
  const initRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': contentType,
      'X-Upload-Content-Length': buffer.length.toString(),
    },
    body: JSON.stringify(fileMetadata),
  });

  if (!initRes.ok) {
    const errorText = await initRes.text();
    throw new Error(`Failed to initiate resumable upload session: ${initRes.status} ${errorText}`);
  }

  const uploadLocation = initRes.headers.get('Location');
  if (!uploadLocation) {
    throw new Error('Google Drive did not return resumable upload Location header.');
  }

  // 2. Upload file content directly
  const uploadRes = await fetch(uploadLocation, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'Content-Length': buffer.length.toString(),
    },
    body: buffer,
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error(`Resumable upload failed: ${uploadRes.status} ${errorText}`);
  }

  const result = await uploadRes.json();
  if (!result.id) {
    throw new Error('Google Drive did not return a valid file ID from resumable upload.');
  }

  return result.id;
}

/**
 * Multipart upload for small files (<= 5MB)
 */
async function uploadMultipart(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  folderId: string | null,
  accessToken: string,
  metaData?: Record<string, string>
): Promise<string> {
  const boundary = `-------HaiMotionBoundary${crypto.randomBytes(16).toString('hex')}`;
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const fileMetadata: any = {
    name: filename,
    description: metaData?.['Original-Name'] ? `Original: ${metaData['Original-Name']}` : undefined,
  };

  if (folderId) {
    fileMetadata.parents = [folderId];
  }

  const contentType = mimeType || 'application/octet-stream';
  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(fileMetadata)}`;
  const mediaHeader = `${delimiter}Content-Type: ${contentType}\r\n\r\n`;

  const multipartBody = Buffer.concat([
    Buffer.from(metadataPart, 'utf-8'),
    Buffer.from(mediaHeader, 'utf-8'),
    buffer,
    Buffer.from(closeDelimiter, 'utf-8'),
  ]);

  const uploadRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,mimeType', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
      'Content-Length': multipartBody.length.toString(),
    },
    body: multipartBody,
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error(`Google Drive upload failed: ${uploadRes.status} ${errorText}`);
  }

  const uploadResult = await uploadRes.json();
  if (!uploadResult.id) {
    throw new Error('Google Drive did not return a valid file ID.');
  }

  return uploadResult.id;
}

/**
 * Uploads a file buffer directly to Google Drive
 * Automatically selects Resumable Upload for files > 5MB to preserve RAM
 */
export async function uploadFileGDrive(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  metaData?: Record<string, string>
): Promise<string> {
  const accessToken = await getValidAccessToken();
  const folderId = await getOrCreateDriveRootFolder(accessToken);

  const FIVE_MB = 5 * 1024 * 1024;
  if (buffer.length > FIVE_MB) {
    return await uploadResumable(buffer, filename, mimeType, folderId, accessToken, metaData);
  } else {
    return await uploadMultipart(buffer, filename, mimeType, folderId, accessToken, metaData);
  }
}

/**
 * Streams file content from Google Drive
 */
export async function getFileStreamGDrive(fileId: string): Promise<NodeJS.ReadableStream> {
  const accessToken = await getValidAccessToken();

  const driveRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!driveRes.ok) {
    if (driveRes.status === 404) {
      throw new Error(`File ${fileId} not found on Google Drive.`);
    }
    throw new Error(`Failed to fetch file from Google Drive: ${driveRes.status} ${driveRes.statusText}`);
  }

  if (!driveRes.body) {
    throw new Error('Google Drive returned an empty body.');
  }

  return Readable.fromWeb(driveRes.body as any);
}

/**
 * Deletes a file on Google Drive
 */
export async function deleteFileGDrive(fileId: string): Promise<void> {
  const accessToken = await getValidAccessToken();

  const deleteRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!deleteRes.ok && deleteRes.status !== 404) {
    const errText = await deleteRes.text();
    console.error(`[GDrive Security] Failed to delete file ${fileId} on Google Drive:`, errText);
    throw new Error(`Google Drive delete failed: ${deleteRes.status}`);
  }
}

/**
 * Generates OAuth Authorization URL with CSRF state protection
 */
export function generateGoogleDriveAuthUrl(state: string): string {
  const { clientId, redirectUri } = getCredentials();

  if (!clientId) {
    throw new Error('GOOGLE_DRIVE_CLIENT_ID or GOOGLE_CLIENT_ID is not configured.');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchanges authorization code for tokens
 */
export async function exchangeGoogleDriveCode(code: string) {
  const { clientId, clientSecret, redirectUri } = getCredentials();

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
  }

  return await response.json();
}

/**
 * Validates the authenticated Google account email via Google UserInfo API
 */
export async function verifyGoogleDriveAccount(accessToken: string): Promise<{ email: string; verified: boolean }> {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to verify Google account profile: ${res.status}`);
  }

  const data = await res.json();
  return {
    email: (data.email || '').toLowerCase().trim(),
    verified: !!(data.verified_email || data.email_verified),
  };
}
