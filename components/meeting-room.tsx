'use client'

import { useState, useEffect } from 'react'
import { LiveKitRoom, RoomAudioRenderer, VideoConference } from '@livekit/components-react'
import { Loader2, PhoneOff, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
    <div className="fixed inset-0 z-[100] bg-background">
      <LiveKitRoom
        video={videoEnabled}
        audio={audioEnabled}
        token={token}
        serverUrl={serverUrl}
        onDisconnected={onLeave}
        data-lk-theme="default"
        style={{ height: '100vh', width: '100vw' }}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  )
}
