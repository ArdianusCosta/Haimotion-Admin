import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'
import { getUserSession } from '@/lib/auth/authorization'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    let userId = formData.get('userId') as string | null

    if (!userId) {
      try {
        const sessionUser = await getUserSession()
        if (sessionUser?.id) userId = String(sessionUser.id)
      } catch (_) {}
    }

    if (!file || !userId) {
      return NextResponse.json({ error: 'File and userId are required' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const originalName = file.name || 'file'
    const mimeType = file.type || 'application/octet-stream'

    // Save to local filesystem
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'chat', userId)
    await fs.mkdir(uploadDir, { recursive: true })

    const ext = path.extname(originalName) || ''
    const safeExt = ext.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase() || 
      (mimeType.includes('png') ? '.png' : mimeType.includes('jpeg') ? '.jpg' : mimeType.includes('webp') ? '.webp' : mimeType.includes('gif') ? '.gif' : '.bin')
    const shortId = crypto.randomBytes(8).toString('hex')
    const safeBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 30)
    const filename = `${shortId}-${safeBase}${safeExt}`
    const filePath = path.join(uploadDir, filename)

    await fs.writeFile(filePath, buffer)

    // Clean, short URL that will never exceed DB VARCHAR(255)
    const url = `/uploads/chat/${userId}/${filename}`

    return NextResponse.json({
      url,
      name: originalName,
      type: mimeType,
      success: true
    }, { status: 201 })
  } catch (error: any) {
    console.error('Failed to upload chat file:', error)
    return NextResponse.json({ error: error?.message || 'Failed to upload file' }, { status: 500 })
  }
}
