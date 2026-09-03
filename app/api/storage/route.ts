import { NextResponse } from 'next/server'
import { getFileStream } from '@/lib/storage/minio'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const key = searchParams.get('key')
    const name = searchParams.get('name') || 'file'
    const type = searchParams.get('type') || 'application/octet-stream'

    if (!key) {
      return new NextResponse('Key is required', { status: 400 })
    }

    const stream = await getFileStream(key) as any

    const headers = new Headers()
    headers.set('Content-Type', type)
    headers.set('Content-Disposition', `inline; filename="${name}"`)

    return new NextResponse(stream, { headers })
  } catch (error) {
    console.error('Error serving storage file:', error)
    return new NextResponse('File not found', { status: 404 })
  }
}
