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
      <div className="relative w-full max-w-lg bg-card rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center p-8 gap-6 border border-border">
        {remoteParticipants.length <= 1 ? (
          <div className="relative">
            <div className="size-24 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary">
              {remoteParticipant ? getInitials(remoteParticipant.name) : getInitials(displayName)}
            </div>
            {connectionState === ConnectionState.Connected && (
              <div className="absolute inset-0 rounded-full border-2 border-primary/50 animate-ping opacity-75" />
            )}
          </div>
        ) : (
          <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[320px] overflow-y-auto p-1">
            {participants.map((p) => (
              <div key={p.identity} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted/40 border border-border/60">
                <div className="relative">
                  <div className="size-14 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary">
                    {getInitials(p.name)}
                  </div>
                  {!p.isMicrophoneEnabled && (
                    <span className="absolute -bottom-1 -right-1 size-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                      <MicOff className="size-3" />
                    </span>
                  )}
                </div>
                <span className="text-xs font-medium truncate max-w-full">
                  {p.identity === localParticipant.identity ? `${p.name || displayName} (You)` : (p.name || 'User')}
                </span>
              </div>
            ))}
          </div>
        )}
        
        <div className="text-center">
          <h2 className="text-xl font-bold">
            {remoteParticipants.length > 1
              ? `Group Call (${participants.length} participants)`
              : remoteParticipant
                ? remoteParticipant.name
                : 'Waiting for others...'}
          </h2>
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
  const localVideoTrack = tracks.find(t => t.participant.identity === localParticipant.identity && t.source === Track.Source.Camera)
  const gridColsClass =
    remoteParticipants.length <= 1
      ? 'grid-cols-1'
      : remoteParticipants.length <= 4
        ? 'grid-cols-1 sm:grid-cols-2'
        : 'grid-cols-2 md:grid-cols-3'

  return (
    <div className="relative w-full h-full max-w-6xl max-h-[90vh] bg-black rounded-xl overflow-hidden shadow-2xl flex flex-col border border-white/10">
      <div className="flex-1 relative w-full h-full bg-zinc-950 p-2 overflow-hidden">
        {remoteParticipants.length > 0 ? (
          <div className={`w-full h-full grid ${gridColsClass} gap-2 auto-rows-fr`}>
            {remoteParticipants.map((participant) => {
              const videoTrack = tracks.find(
                t => t.participant.identity === participant.identity && t.source === Track.Source.Camera
              )
              const hasVideo = videoTrack && videoTrack.publication && !videoTrack.publication.isMuted
              return (
                <div key={participant.identity} className="relative w-full h-full min-h-[180px] bg-zinc-900 rounded-lg overflow-hidden flex items-center justify-center border border-white/10">
                  {hasVideo ? (
                    <VideoTrack trackRef={videoTrack} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="size-20 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                        {getInitials(participant.name)}
                      </div>
                      <p className="text-white/70 text-sm">{participant.name || 'User'}</p>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-xs font-medium flex items-center gap-2">
                    <span>{participant.name || 'User'}</span>
                    {!participant.isMicrophoneEnabled && <MicOff className="size-3 text-red-400" />}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/50 text-center">
            <div>
              <Loader2 className="size-8 animate-spin mx-auto mb-4" />
              <p>Waiting for others to join...</p>
            </div>
          </div>
        )}

        {/* Local PIP */}
        <div className="absolute top-4 right-4 w-44 sm:w-48 aspect-video bg-zinc-800 rounded-lg overflow-hidden border border-white/20 shadow-xl z-10">
          {localVideoTrack?.publication?.isMuted || !localVideoTrack?.publication ? (
            <div className="w-full h-full flex items-center justify-center bg-zinc-900">
               <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                {getInitials(displayName)}
              </div>
            </div>
          ) : (
            <VideoTrack trackRef={localVideoTrack} className="w-full h-full object-cover scale-x-[-1]" />
          )}
        </div>
      </div>

      {/* Control Bar */}
      <div className="h-20 bg-zinc-950 border-t border-white/10 flex items-center justify-center gap-4 px-6 relative">
        <div className="absolute left-6 text-white/70 text-sm font-medium flex items-center gap-3">
          <span>{connectionState === ConnectionState.Connected && formatTime(duration)}</span>
          <span className="text-xs text-white/50 hidden sm:inline">• {participants.length} in call</span>
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
