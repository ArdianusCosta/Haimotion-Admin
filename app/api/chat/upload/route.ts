import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string | null

    if (!file || !userId) {
      return NextResponse.json({ error: 'File and userId are required' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const originalName = file.name
    const mimeType = file.type || 'application/octet-stream'
    const size = file.size
    
    // Save to local filesystem instead of MinIO since MinIO might not be available locally
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'chat', userId)
    await fs.mkdir(uploadDir, { recursive: true })
    const filePath = path.join(uploadDir, `${crypto.randomUUID()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`)
    await fs.writeFile(filePath, buffer)

    // The public URL
    const url = `/uploads/chat/${userId}/${path.basename(filePath)}?name=${encodeURIComponent(originalName)}&type=${encodeURIComponent(mimeType)}`

    return NextResponse.json({ url, success: true }, { status: 201 })
  } catch (error: any) {
    console.error('Failed to upload chat file:', error)
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
  }
}
