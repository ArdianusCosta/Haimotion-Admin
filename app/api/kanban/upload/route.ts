import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const originalName = file.name || 'attachment'
    const mimeType = file.type || 'application/octet-stream'

    // Save to local filesystem inside public/uploads/kanban
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'kanban')
    await fs.mkdir(uploadDir, { recursive: true })

    const ext = path.extname(originalName) || ''
    const safeExt = ext.replace(/[^a-zA-Z0-9.]/g, '').toLowerCase() || 
      (mimeType.includes('png') ? '.png' : mimeType.includes('jpeg') ? '.jpg' : mimeType.includes('webp') ? '.webp' : mimeType.includes('gif') ? '.gif' : '.bin')
    const shortId = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`
    const safeBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 35)
    const filename = `${shortId}-${safeBase}${safeExt}`
    const filePath = path.join(uploadDir, filename)

    await fs.writeFile(filePath, buffer)

    const url = `/uploads/kanban/${filename}`

    return NextResponse.json({
      success: true,
      url,
      name: originalName,
      type: mimeType
    }, { status: 201 })
  } catch (error: any) {
    console.error('Kanban upload failed:', error)
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 })
  }
}
