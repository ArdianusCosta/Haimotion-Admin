import fs from 'fs'
import path from 'path'

// Files are stored in public/uploads/ so they are served by Next.js static file serving
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

function ensureUploadDir(subDir?: string) {
  const dir = subDir ? path.join(UPLOAD_DIR, subDir) : UPLOAD_DIR
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return dir
}

export async function uploadFileLocal(
  buffer: Buffer,
  objectName: string,
): Promise<void> {
  // objectName is like "users/1/uuid-filename.pdf"
  // We mirror that structure inside public/uploads/
  const filePath = path.join(UPLOAD_DIR, objectName)
  const dir = path.dirname(filePath)
  ensureUploadDir()
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(filePath, buffer)
}

export async function deleteFileLocal(objectName: string): Promise<void> {
  const filePath = path.join(UPLOAD_DIR, objectName)
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

export function getLocalFileUrl(objectName: string): string {
  // Returns a URL relative to the app root, e.g. /uploads/users/1/uuid-file.pdf
  return `/uploads/${objectName}`
}

export async function getLocalFileStream(objectName: string): Promise<fs.ReadStream> {
  const filePath = path.join(UPLOAD_DIR, objectName)
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${objectName}`)
  }
  return fs.createReadStream(filePath)
}

export async function copyFileLocal(
  sourceObjectName: string,
  destObjectName: string,
): Promise<void> {
  const srcPath = path.join(UPLOAD_DIR, sourceObjectName)
  const destPath = path.join(UPLOAD_DIR, destObjectName)
  const destDir = path.dirname(destPath)
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }
  fs.copyFileSync(srcPath, destPath)
}
