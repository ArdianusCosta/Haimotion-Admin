import { Client } from 'minio'

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
})

const BUCKET_NAME = process.env.MINIO_BUCKET || 'haimotion-files'

export async function ensureBucketExists() {
  try {
    const exists = await minioClient.bucketExists()
    if (!exists) {
      await minioClient.makeBucket()
    }
  } catch (error) {
    console.error('Error ensuring MinIO bucket exists:', error)
  }
}

export async function uploadFile(
  fileStream: NodeJS.ReadableStream | Buffer,
  objectName: string,
  size: number,
  metaData?: Record<string, string>
) {
  await ensureBucketExists()
  return new Promise((resolve, reject) => {
    minioClient.putObject(BUCKET_NAME, objectName, fileStream, size, metaData, (err: any, objInfo: any) => {
      if (err) {
        return reject(err)
      }
      resolve(objInfo)
    })
  })
}

export async function deleteFile(objectName: string) {
  return new Promise<void>((resolve, reject) => {
    minioClient.removeObject(BUCKET_NAME, objectName, (err: any) => {
      if (err) {
        return reject(err)
      }
      resolve()
    })
  })
}

import * as Minio from 'minio'

export async function copyFile(sourceObjectName: string, destObjectName: string) {
  return new Promise((resolve, reject) => {
    minioClient.copyObject(BUCKET_NAME, destObjectName, `/${BUCKET_NAME}/${sourceObjectName}`, new Minio.CopyConditions(), (err: any, data: any) => {
      if (err) {
        return reject(err)
      }
      resolve(data)
    })
  })
}

export async function getFileUrl(objectName: string, expirySeconds: number = 3600) {
  return new Promise<string>((resolve, reject) => {
    minioClient.presignedGetObject(BUCKET_NAME, objectName, expirySeconds, (err: any, presignedUrl: any) => {
      if (err) {
        return reject(err)
      }
      resolve(presignedUrl)
    })
  })
}

export async function getFileStream(objectName: string) {
  return new Promise<NodeJS.ReadableStream>((resolve, reject) => {
    minioClient.getObject(BUCKET_NAME, objectName, (err: any, dataStream: any) => {
      if (err) {
        return reject(err)
      }
      resolve(dataStream)
    })
  })
}
