import { NextResponse } from 'next/server'
import { getFileStream } from '@/lib/storage'
import { getUserSession } from '@/lib/auth/authorization'
import { checkAccess } from '@/lib/file-auth'
import prisma from '@/lib/prisma'
import { Readable } from 'stream'

export async function GET(req: Request) {
  try {
    // 1. Enforce Authentication
    const user = await getUserSession()
    if (!user || !user.id) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required to access storage' }, { status: 401 })
    }
    const uid = Number(user.id)

    // 2. Extract and Validate Key
    const { searchParams } = new URL(req.url)
    const key = searchParams.get('key')
    const nameParam = searchParams.get('name')
    const typeParam = searchParams.get('type')

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    // Path Traversal Mitigation: Reject dangerous directory traversal characters
    if (key.includes('..') || key.includes('\0') || key.startsWith('/') || key.startsWith('\\')) {
      console.warn(`[Storage Security] Path traversal attempt blocked for user ${uid}: ${key}`)
      return NextResponse.json({ error: 'Invalid storage key' }, { status: 400 })
    }

    // 3. Database Metadata & RBAC / ACL Verification
    let authorized = false
    let resolvedFilename = nameParam || 'file'
    let resolvedMimeType = typeParam || 'application/octet-stream'

    // Check File Manager records
    const fileRecord = await prisma.file.findFirst({
      where: {
        storage_key: key,
        deleted_at: null,
      },
    })

    if (fileRecord) {
      // Enforce granular RBAC / ACL (owner, shared user, or folder access)
      const hasPermission = await checkAccess(uid, fileRecord.id, 'file', 'viewer')
      if (!hasPermission) {
        console.warn(`[Storage Security] Forbidden access attempt by user ${uid} to file ID ${fileRecord.id}`)
        return NextResponse.json({ error: 'Forbidden: You do not have permission to access this file' }, { status: 403 })
      }
      authorized = true
      resolvedFilename = fileRecord.original_name || fileRecord.name || resolvedFilename
      resolvedMimeType = fileRecord.mime_type || resolvedMimeType
    } else {
      // Check if key is associated with task attachments
      const taskAttachment = await prisma.task_attachments.findFirst({
        where: {
          file_url: { contains: key },
        },
      })

      if (taskAttachment) {
        authorized = true
        resolvedFilename = taskAttachment.file_name || resolvedFilename
      }
    }

    if (!authorized) {
      // File not found in active records or unauthorized
      return NextResponse.json({ error: 'File not found or access denied' }, { status: 404 })
    }

    // 4. Stream File Safely
    const stream = (await getFileStream(key)) as any
    const responseBody = stream && typeof stream.read === 'function' ? Readable.toWeb(stream) : stream

    // Sanitize filename for Content-Disposition header
    const sanitizedFilename = encodeURIComponent(resolvedFilename.replace(/[\r\n"']/g, '_'))

    const headers = new Headers()
    headers.set('Content-Type', resolvedMimeType)
    headers.set('Content-Disposition', `inline; filename*=UTF-8''${sanitizedFilename}`)
    headers.set('X-Content-Type-Options', 'nosniff')
    headers.set('Cache-Control', 'private, max-age=1800, stale-while-revalidate=3600')

    return new NextResponse(responseBody as any, { headers })
  } catch (error: any) {
    console.error('[Storage Error] Error serving file:', error?.message || error)
    return NextResponse.json({ error: 'Failed to retrieve storage file' }, { status: 500 })
  }
}
