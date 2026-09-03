'use client'

import { JitsiMeeting } from '@jitsi/react-sdk'
import { X } from 'lucide-react'

interface JitsiCallUIProps {
  roomName: string
  displayName: string
  email?: string
  isAudioOnly?: boolean
  onClose: () => void
}

export function JitsiCallUI({ roomName, displayName, email, isAudioOnly, onClose }: JitsiCallUIProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full h-full max-w-6xl max-h-[90vh] bg-background rounded-xl overflow-hidden shadow-2xl flex flex-col">
        <header className="flex items-center justify-between p-4 border-b border-border bg-card">
          <h2 className="font-semibold">{isAudioOnly ? 'Voice Call' : 'Video Call'} - {roomName}</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="size-5" />
          </button>
        </header>
        
        <div className="flex-1 w-full bg-black">
          <JitsiMeeting
            domain="meet.jit.si"
            roomName={`HaiMotion-${roomName}`}
            configOverwrite={{
              startWithAudioMuted: false,
              startWithVideoMuted: isAudioOnly,
              disableModeratorIndicator: true,
              enableEmailInStats: false
            }}
            interfaceConfigOverwrite={{
              DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            }}
            userInfo={{
              displayName,
              email
            }}
            onApiReady={(externalApi) => {
              externalApi.addListener('videoConferenceLeft', () => {
                onClose()
              })
            }}
            getIFrameRef={(iframeRef) => {
              iframeRef.style.height = '100%';
              iframeRef.style.width = '100%';
            }}
          />
        </div>
      </div>
    </div>
  )
}
