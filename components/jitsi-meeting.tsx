'use client'

import { JitsiMeeting as JitsiMeetingReact } from '@jitsi/react-sdk'
import { authClient } from '@/lib/auth/client'
import { useLanguage } from '@/components/language-provider'

export function JitsiMeeting({ roomName }: { roomName: string }) {
  const { data: session } = authClient.useSession()
  const { t } = useLanguage()

  const user = session?.user

  if (!user) return <div className="p-8 text-center">{t('Loading meeting...')}</div>

  return (
    <div className="w-full h-full bg-black">
      <JitsiMeetingReact
        domain="meet.jit.si"
        roomName={roomName}
        configOverwrite={{
          startWithAudioMuted: true,
          disableModeratorIndicator: true,
          enableEmailInStats: false
        }}
        interfaceConfigOverwrite={{
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true
        }}
        userInfo={{
          displayName: user.name || 'Guest',
          email: user.email || ''
        }}
        getIFrameRef={(iframeRef) => {
          iframeRef.style.height = '100%'
          iframeRef.style.width = '100%'
        }}
        spinner={() => (
          <div className="flex h-full items-center justify-center bg-black">
            <div className="text-white text-sm animate-pulse">{t('Connecting to meeting...')}</div>
          </div>
        )}
      />
    </div>
  )
}
