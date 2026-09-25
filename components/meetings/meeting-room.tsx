'use client'

import { useState, useEffect } from 'react'
import { LiveKitRoom, RoomAudioRenderer, VideoConference, useRoomContext, useLocalParticipant } from '@livekit/components-react'
import { Loader2, PhoneOff, ShieldCheck, Copy, Maximize, Minimize, Users, Info, Settings, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import '@livekit/components-styles'

interface MeetingRoomProps {
  meeting: any
  joinParams?: any
  onLeave: () => void
}

export function MeetingRoom({ meeting, joinParams, onLeave }: MeetingRoomProps) {
  const [token, setToken] = useState<string | null>(null)
  const [serverUrl, setServerUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [requiresWaitingRoom, setRequiresWaitingRoom] = useState(false)
  const [participantId, setParticipantId] = useState<number | null>(null)
  const [isAdmitted, setIsAdmitted] = useState(false)
  const [isJoining, setIsJoining] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Initial Join Request
  useEffect(() => {
    let mounted = true
    setIsJoining(true)

    async function joinMeeting() {
      try {
        const res = await fetch(`/api/meetings/${meeting.meeting_code}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(joinParams || {}) 
        })
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Failed to join meeting')
        }

        if (mounted) {
          if (data.requiresWaitingRoom) {
            setRequiresWaitingRoom(true)
            setParticipantId(data.participantId)
          } else {
            setToken(data.token)
            setServerUrl(data.serverUrl)
            setIsAdmitted(true)
          }
          setIsJoining(false)
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message)
          setIsJoining(false)
        }
      }
    }

    joinMeeting()
    return () => { mounted = false }
  }, [meeting.meeting_code])

  // Polling for Waiting Room
  useEffect(() => {
    let intervalId: NodeJS.Timeout
    let mounted = true

    async function checkStatus() {
      if (!requiresWaitingRoom || isAdmitted || !participantId) return

      try {
        const res = await fetch(`/api/meetings/${meeting.meeting_code}/status?participantId=${participantId}`)
        const data = await res.json()
        
        if (data.status === 'REJECTED') {
          if (mounted) {
            setError('The host declined your request to join.')
            setRequiresWaitingRoom(false)
          }
        } else if (data.status === 'ADMITTED' || data.status === 'JOINED') {
          if (mounted) {
            setToken(data.token)
            setServerUrl(data.serverUrl)
            setIsAdmitted(true)
            setRequiresWaitingRoom(false)
          }
        }
      } catch (err) {
        console.error('Polling error', err)
      }
    }

    if (requiresWaitingRoom && !isAdmitted) {
      intervalId = setInterval(checkStatus, 3000)
    }

    return () => {
      mounted = false
      if (intervalId) clearInterval(intervalId)
    }
  }, [requiresWaitingRoom, isAdmitted, participantId, meeting.meeting_code])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        toast.error('Error attempting to enable full-screen mode')
      })
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const handleCopyLink = () => {
    const url = `${window.location.origin}/meet/${meeting.meeting_code}`
    navigator.clipboard.writeText(url)
    toast.success('Meeting link copied to clipboard')
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
        <div className="bg-card p-6 rounded-xl max-w-sm w-full text-center space-y-4">
          <div className="size-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <PhoneOff className="size-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Unable to join</h3>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
          <Button onClick={onLeave} className="w-full mt-2">Close</Button>
        </div>
      </div>
    )
  }

  if (isJoining) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4 text-white">
          <Loader2 className="size-8 animate-spin" />
          <p className="font-medium text-sm">Connecting to meeting...</p>
        </div>
      </div>
    )
  }

  if (requiresWaitingRoom && !isAdmitted) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
        <div className="bg-card p-6 rounded-xl max-w-sm w-full text-center space-y-4">
          <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <ShieldCheck className="size-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Waiting Room</h3>
            <p className="text-sm text-muted-foreground mt-1">
              You are in the waiting room. The host will let you in shortly.
            </p>
          </div>
          <Button onClick={onLeave} variant="outline" className="w-full mt-2">Leave</Button>
        </div>
      </div>
    )
  }

  if (!token || !serverUrl) return null

  const audioEnabled = joinParams?.audioEnabled ?? true
  const videoEnabled = joinParams?.videoEnabled ?? true

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col h-[100dvh]">
      <header className="h-14 border-b bg-card flex items-center justify-between px-4 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="font-bold text-lg hidden sm:block">HaiMotion</div>
          <div className="hidden sm:block text-muted-foreground">|</div>
          <div className="font-medium truncate max-w-[150px] sm:max-w-xs">{meeting.title}</div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-md text-xs font-medium">
            <div className="size-2 rounded-full bg-green-500 animate-pulse" />
            Connected
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleCopyLink} title="Copy Link">
            <Copy className="size-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize className="size-4 mr-2" /> : <Maximize className="size-4 mr-2" />}
                {isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleCopyLink}>
                <Copy className="size-4 mr-2" />
                Copy Meeting Link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="flex-1 min-h-0 relative">
        <LiveKitRoom
          video={videoEnabled}
          audio={audioEnabled}
          token={token}
          serverUrl={serverUrl}
          onDisconnected={onLeave}
          data-lk-theme="default"
          style={{ height: '100%', width: '100%' }}
        >
          <VideoConference />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    </div>
  )
}
