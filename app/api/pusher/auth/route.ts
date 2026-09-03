import { pusherServer } from '@/lib/pusher'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const data = await request.text()
    const params = new URLSearchParams(data)
    const socketId = params.get('socket_id')
    const channelName = params.get('channel_name')
    const url = new URL(request.url)
    const userId = params.get('user_id') || url.searchParams.get('user_id')
    
    console.log("[PUSHER AUTH]", { data, socketId, channelName, userId })

    if (!socketId || !channelName) {
      return new NextResponse('Invalid socket_id or channel_name', { status: 400 })
    }
    
    let authResponse;
    if (channelName.startsWith('presence-')) {
      if (!userId) return new NextResponse('user_id required for presence channels', { status: 400 })
      
      const presenceData = {
        user_id: userId,
        user_info: { id: userId }
      }
      authResponse = pusherServer.authorizeChannel(socketId, channelName, presenceData)
    } else {
      authResponse = pusherServer.authorizeChannel(socketId, channelName)
    }
    
    return NextResponse.json(authResponse)
  } catch (error) {
    console.error('Pusher auth error:', error)
    return new NextResponse('Forbidden', { status: 403 })
  }
}
