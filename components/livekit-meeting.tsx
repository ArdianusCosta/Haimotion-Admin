'use client'

import { useEffect, useState } from 'react'
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react'
import { Loader2, AlertCircle } from 'lucide-react'
import '@livekit/components-styles'

interface LiveKitMeetingProps {
  roomName: string
  onLeave?: () => void
}

export function LiveKitMeeting({ roomName, onLeave }: LiveKitMeetingProps) {
  const [token, setToken] = useState<string | null>(null)
  const [serverUrl, setServerUrl] = useState<string | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    
    async function getToken() {
      try {
        const res = await fetch('/api/livekit/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomName }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to get token')
        if (mounted) {
          setToken(data.token)
          setServerUrl(data.serverUrl)
        }
      } catch (err: any) {
        if (mounted) setError(err.message)
      }
    }
    
    getToken()
    return () => { mounted = false }
  }, [roomName])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-background p-8">
        <AlertCircle className="size-12 text-destructive mb-4" />
        <h3 className="text-xl font-bold mb-2">Unable to connect to meeting</h3>
        <p className="text-muted-foreground">{error}</p>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-background">
        <Loader2 className="size-8 animate-spin mb-4" />
        <p className="text-muted-foreground">Joining meeting room...</p>
      </div>
    )
  }

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={serverUrl || process.env.NEXT_PUBLIC_LIVEKIT_URL}
      data-lk-theme="default"
      style={{ height: '100%', width: '100%' }}
      onDisconnected={onLeave}
    >
      <VideoConference />
      <RoomAudioRenderer />
    </LiveKitRoom>
  )
}
