import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const filePathParam = url.searchParams.get('file')

    if (!filePathParam) {
      return new NextResponse('File parameter is required', { status: 400 })
    }

    // Ensure we only read from the public/uploads directory to prevent directory traversal
    const safePath = path.normalize(filePathParam).replace(/^(\.\.[\/\\])+/, '')
    const absolutePath = path.join(process.cwd(), 'public', safePath)

    if (!absolutePath.startsWith(path.join(process.cwd(), 'public', 'uploads'))) {
      return new NextResponse('Access denied', { status: 403 })
    }

    const fileBuffer = await fs.readFile(absolutePath)
    
    // Determine MIME type based on extension
    const ext = path.extname(absolutePath).toLowerCase()
    let mimeType = 'text/plain' // default to text/plain so it renders in browser instead of downloading
    
    if (ext === '.pdf') mimeType = 'application/pdf'
    if (ext === '.json') mimeType = 'application/json'
    if (ext === '.csv') mimeType = 'text/csv'
    if (ext === '.html') mimeType = 'text/html'
    if (ext === '.png') mimeType = 'image/png'
    if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg'
    if (ext === '.gif') mimeType = 'image/gif'
    if (ext === '.svg') mimeType = 'image/svg+xml'

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': 'inline', // This forces the browser to display it in a new tab!
      }
    })
  } catch (error) {
    console.error('Failed to serve file inline:', error)
    return new NextResponse('File not found', { status: 404 })
  }
}
