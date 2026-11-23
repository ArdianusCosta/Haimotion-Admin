import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  try {
    const resolvedParams = await params
    const pathSegments = resolvedParams.path || []
    if (pathSegments.length === 0) {
      return new NextResponse('File not found', { status: 404 })
    }

    const relativePath = pathSegments.join('/')
    const safePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, '')
    const absolutePath = path.join(process.cwd(), 'public', 'uploads', safePath)

    // Security check: ensure path is inside public/uploads
    const uploadsRoot = path.join(process.cwd(), 'public', 'uploads')
    if (!absolutePath.startsWith(uploadsRoot)) {
      return new NextResponse('Access denied', { status: 403 })
    }

    const fileBuffer = await fs.readFile(absolutePath)

    const ext = path.extname(absolutePath).toLowerCase()
    let mimeType = 'application/octet-stream'
    if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg'
    else if (ext === '.png') mimeType = 'image/png'
    else if (ext === '.webp') mimeType = 'image/webp'
    else if (ext === '.gif') mimeType = 'image/gif'
    else if (ext === '.svg') mimeType = 'image/svg+xml'
    else if (ext === '.pdf') mimeType = 'application/pdf'

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      }
    })
  } catch (error) {
    return new NextResponse('File not found', { status: 404 })
  }
}
