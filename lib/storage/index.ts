/**
 * Storage adapter — automatically selects MinIO or local filesystem
 * depending on environment configuration.
 *
 * Set STORAGE_DRIVER=local  → saves files to public/uploads/ (good for cPanel)
 * Set STORAGE_DRIVER=minio  → uses MinIO (default if MINIO_ENDPOINT != localhost)
 * If neither is set, falls back to local when MINIO_ENDPOINT is localhost/unset.
 */

import {
  uploadFile as minioUpload,
  deleteFile as minioDelete,
  getFileUrl as minioGetUrl,
  getFileStream as minioGetStream,
  copyFile as minioCopy,
} from './minio'

import {
  uploadFileLocal,
  deleteFileLocal,
  getLocalFileUrl,
  getLocalFileStream,
  copyFileLocal,
} from './local'

function useLocal(): boolean {
  const driver = process.env.STORAGE_DRIVER
  if (driver === 'local') return true
  if (driver === 'minio') return false
  // Auto-detect: if MINIO_ENDPOINT is not set or is localhost, use local
  const endpoint = process.env.MINIO_ENDPOINT || 'localhost'
  return endpoint === 'localhost' || endpoint === '127.0.0.1'
}

export async function uploadFile(
  buffer: Buffer,
  objectName: string,
  size: number,
  metaData?: Record<string, string>,
): Promise<void> {
  if (useLocal()) {
    await uploadFileLocal(buffer, objectName)
  } else {
    await minioUpload(buffer, objectName, size, metaData)
  }
}

export async function deleteFile(objectName: string): Promise<void> {
  if (useLocal()) {
    await deleteFileLocal(objectName)
  } else {
    await minioDelete(objectName)
  }
}

export async function getFileUrl(
  objectName: string,
  expirySeconds: number = 3600,
): Promise<string> {
  if (useLocal()) {
    return getLocalFileUrl(objectName)
  }
  return minioGetUrl(objectName, expirySeconds)
}

export async function getFileStream(objectName: string): Promise<NodeJS.ReadableStream> {
  if (useLocal()) {
    return getLocalFileStream(objectName)
  }
  return minioGetStream(objectName)
}

export async function copyFile(
  sourceObjectName: string,
  destObjectName: string,
): Promise<void> {
  if (useLocal()) {
    await copyFileLocal(sourceObjectName, destObjectName)
  } else {
    await minioCopy(sourceObjectName, destObjectName)
  }
}
