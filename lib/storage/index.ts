/**
 * Storage adapter — automatically selects Google Drive, MinIO, or local filesystem
 * depending on environment configuration and file storage key prefix.
 *
 * Multi-Storage Architecture:
 * - Key starting with 'gdrive:' → delegates to Google Drive REST v3 adapter
 * - Other keys → delegates to MinIO or local filesystem (backward compatibility)
 * - New files: if STORAGE_DRIVER=gdrive → saved to Google Drive
 */

import {
  uploadFile as minioUpload,
  deleteFile as minioDelete,
  getFileUrl as minioGetUrl,
  getFileStream as minioGetStream,
  copyFile as minioCopy,
} from './minio';

import {
  uploadFileLocal,
  deleteFileLocal,
  getLocalFileUrl,
  getLocalFileStream,
  copyFileLocal,
} from './local';

import {
  uploadFileGDrive,
  getFileStreamGDrive,
  deleteFileGDrive,
  isGoogleDriveConfigured,
} from './gdrive';

export function isGDriveKey(key: string): boolean {
  return typeof key === 'string' && key.startsWith('gdrive:');
}

export function isGDriveEnabled(): boolean {
  return process.env.STORAGE_DRIVER === 'gdrive';
}

function useLocal(): boolean {
  const driver = process.env.STORAGE_DRIVER;
  if (driver === 'local') return true;
  if (driver === 'minio') return false;
  if (driver === 'gdrive') return false;
  // Auto-detect: if MINIO_ENDPOINT is not set or is localhost, use local
  const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
  return endpoint === 'localhost' || endpoint === '127.0.0.1';
}

/**
 * Uploads a file and returns the effective storage_key
 * If Google Drive is enabled and configured, uploads to Drive and returns 'gdrive:<fileId>'
 * Otherwise uploads to MinIO/Local and returns the provided objectName
 */
export async function uploadFile(
  buffer: Buffer,
  objectName: string,
  size: number,
  metaData?: Record<string, string>,
): Promise<string> {
  if (isGDriveEnabled()) {
    if (!isGoogleDriveConfigured()) {
      throw new Error('ADMIN_REAUTH_REQUIRED: Google Drive storage is selected but not authenticated yet. Please authorize at /api/integrations/google-drive/auth');
    }
    const originalName = metaData?.['Original-Name'] || objectName.split('-').pop() || objectName;
    const mimeType = metaData?.['Content-Type'] || 'application/octet-stream';
    const driveFileId = await uploadFileGDrive(buffer, originalName, mimeType, metaData);
    return `gdrive:${driveFileId}`;
  }

  if (useLocal()) {
    await uploadFileLocal(buffer, objectName);
  } else {
    await minioUpload(buffer, objectName, size, metaData);
  }
  return objectName;
}

/**
 * Deletes a file by its storage key
 * Intelligently routes to Google Drive if prefixed with 'gdrive:', otherwise MinIO/Local
 */
export async function deleteFile(objectName: string): Promise<void> {
  if (isGDriveKey(objectName)) {
    const fileId = objectName.replace('gdrive:', '');
    await deleteFileGDrive(fileId);
    return;
  }

  if (useLocal()) {
    await deleteFileLocal(objectName);
  } else {
    await minioDelete(objectName);
  }
}

/**
 * Generates an access/stream URL for a file
 */
export async function getFileUrl(
  objectName: string,
  expirySeconds: number = 3600,
): Promise<string> {
  if (isGDriveKey(objectName)) {
    // Stream through secure internal API endpoint protected by user authentication/RBAC
    return `/api/storage?key=${encodeURIComponent(objectName)}`;
  }

  if (useLocal()) {
    return getLocalFileUrl(objectName);
  }
  return minioGetUrl(objectName, expirySeconds);
}

/**
 * Gets a readable stream for a file
 */
export async function getFileStream(objectName: string): Promise<NodeJS.ReadableStream> {
  if (isGDriveKey(objectName)) {
    const fileId = objectName.replace('gdrive:', '');
    return getFileStreamGDrive(fileId);
  }

  if (useLocal()) {
    return getLocalFileStream(objectName);
  }
  return minioGetStream(objectName);
}

/**
 * Copies a file from source key to destination key
 */
export async function copyFile(
  sourceObjectName: string,
  destObjectName: string,
): Promise<void> {
  if (isGDriveKey(sourceObjectName)) {
    console.warn('Copying Google Drive files directly is handled virtually in ERP metadata.');
    return;
  }

  if (useLocal()) {
    await copyFileLocal(sourceObjectName, destObjectName);
  } else {
    await minioCopy(sourceObjectName, destObjectName);
  }
}
