'use client'

import { useEffect, useRef, useState } from 'react'
import {
  LiveKitRoom,
  VideoTrack,
  RoomAudioRenderer,
  useTracks,
  useParticipants,
  useLocalParticipant,
  TrackToggle,
  DisconnectButton,
  useConnectionState,
} from '@livekit/components-react'
import { Track, ConnectionState } from 'livekit-client'
import { Phone, Video, Mic, MicOff, VideoOff, Camera, PhoneOff, Loader2 } from 'lucide-react'
import '@livekit/components-styles'

interface LiveKitCallUIProps {
  roomName: string
  displayName: string
  email?: string
  isAudioOnly?: boolean
  onClose: () => void
}

export function LiveKitCallUI({ roomName, displayName, email, isAudioOnly, onClose }: LiveKitCallUIProps) {
  const [token, setToken] = useState<string | null>(null)
  const [serverUrl, setServerUrl] = useState<string | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)
  // Guard against double-trigger: onClose should only fire once
  const hasEndedRef = useRef(false)

  const handleClose = () => {
    if (hasEndedRef.current) return
    hasEndedRef.current = true
    onClose()
  }

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
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="bg-card p-6 rounded-xl border border-border shadow-2xl flex flex-col items-center gap-4 text-center">
          <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
            <PhoneOff className="size-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Unable to connect</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
          <button onClick={handleClose} className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg font-medium text-sm transition-colors">
            Close
          </button>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4 text-white">
          <Loader2 className="size-8 animate-spin" />
          <p className="text-sm font-medium">Connecting to secure call...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <LiveKitRoom
        video={!isAudioOnly}
        audio={true}
        token={token}
        serverUrl={serverUrl || process.env.NEXT_PUBLIC_LIVEKIT_URL}
        data-lk-theme="default"
        style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' }}
        onDisconnected={handleClose}
      >
        <CallContent isAudioOnly={!!isAudioOnly} displayName={displayName} email={email} />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  )
}


function CallContent({ isAudioOnly, displayName, email }: { isAudioOnly: boolean, displayName: string, email?: string }) {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  )
  const participants = useParticipants()
  const { localParticipant } = useLocalParticipant()
  const connectionState = useConnectionState()
  const [duration, setDuration] = useState(0)

  const remoteParticipants = participants.filter((p) => p.identity !== localParticipant.identity)
  const remoteParticipant = remoteParticipants[0]

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (connectionState === ConnectionState.Connected) {
      interval = setInterval(() => setDuration(d => d + 1), 1000)
    }
    return () => clearInterval(interval)
  }, [connectionState])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const getInitials = (name?: string) => {
    if (!name) return '?'
    const parts = name.split(' ')
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name[0].toUpperCase()
  }

  // Voice Call UI
  if (isAudioOnly) {
    return (
      <div className="relative w-full max-w-sm bg-card rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center p-8 gap-6 border border-border">
        <div className="relative">
          <div className="size-24 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary">
            {remoteParticipant ? getInitials(remoteParticipant.name) : getInitials(displayName)}
          </div>
          {connectionState === ConnectionState.Connected && (
            <div className="absolute inset-0 rounded-full border-2 border-primary/50 animate-ping opacity-75" />
          )}
        </div>
        
        <div className="text-center">
          <h2 className="text-xl font-bold">{remoteParticipant ? remoteParticipant.name : 'Waiting for others...'}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {connectionState === ConnectionState.Connecting ? 'Connecting...' : 
             connectionState === ConnectionState.Connected ? formatTime(duration) : 
             connectionState === ConnectionState.Disconnected ? 'Call Ended' : connectionState}
          </p>
        </div>

        <div className="flex items-center gap-4 mt-4">
          <TrackToggle source={Track.Source.Microphone} className="!bg-muted hover:!bg-muted/80 !text-foreground !rounded-full !size-12 !flex !items-center !justify-center" />
          <DisconnectButton className="!bg-destructive hover:!bg-destructive/90 !text-destructive-foreground !rounded-full !size-12 !flex !items-center !justify-center">
            <PhoneOff className="size-5" />
          </DisconnectButton>
        </div>
      </div>
    )
  }

  // Video Call UI
  const remoteVideoTrack = tracks.find(t => t.participant.identity === remoteParticipant?.identity && t.source === Track.Source.Camera)
  const localVideoTrack = tracks.find(t => t.participant.identity === localParticipant.identity && t.source === Track.Source.Camera)

  return (
    <div className="relative w-full h-full max-w-6xl max-h-[90vh] bg-black rounded-xl overflow-hidden shadow-2xl flex flex-col border border-white/10">
      <div className="flex-1 relative w-full h-full bg-zinc-950 flex items-center justify-center">
        {remoteParticipant ? (
          remoteVideoTrack?.publication?.isMuted ? (
            <div className="flex flex-col items-center gap-4">
              <div className="size-24 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary">
                {getInitials(remoteParticipant.name)}
              </div>
              <p className="text-white/70">{remoteParticipant.name}</p>
            </div>
          ) : (
             <div className="w-full h-full">
              {remoteVideoTrack && <VideoTrack trackRef={remoteVideoTrack} className="w-full h-full object-cover" />}
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-sm font-medium flex items-center gap-2">
                <span>{remoteParticipant.name}</span>
                {!remoteParticipant.isMicrophoneEnabled && <MicOff className="size-3 text-red-400" />}
              </div>
            </div>
          )
        ) : (
          <div className="text-white/50 text-center">
            <Loader2 className="size-8 animate-spin mx-auto mb-4" />
            <p>Waiting for others to join...</p>
          </div>
        )}

        {/* Local PIP */}
        <div className="absolute top-4 right-4 w-48 aspect-video bg-zinc-800 rounded-lg overflow-hidden border border-white/20 shadow-xl z-10">
          {localVideoTrack?.publication?.isMuted ? (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
               <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                {getInitials(displayName)}
              </div>
            </div>
          ) : (
            localVideoTrack && <VideoTrack trackRef={localVideoTrack} className="w-full h-full object-cover scale-x-[-1]" />
          )}
        </div>
      </div>

      {/* Control Bar */}
      <div className="h-20 bg-zinc-950 border-t border-white/10 flex items-center justify-center gap-4 px-6 relative">
        <div className="absolute left-6 text-white/70 text-sm font-medium">
           {connectionState === ConnectionState.Connected && formatTime(duration)}
        </div>
        
        <TrackToggle source={Track.Source.Microphone} className="!bg-white/10 hover:!bg-white/20 !text-white !rounded-full !size-12 !flex !items-center !justify-center transition-colors" />
        <TrackToggle source={Track.Source.Camera} className="!bg-white/10 hover:!bg-white/20 !text-white !rounded-full !size-12 !flex !items-center !justify-center transition-colors" />
        <DisconnectButton className="!bg-red-500 hover:!bg-red-600 !text-white !rounded-full !w-16 !h-12 !flex !items-center !justify-center transition-colors ml-4 shadow-lg shadow-red-500/20">
          <PhoneOff className="size-5" />
        </DisconnectButton>
      </div>
    </div>
  )
}
