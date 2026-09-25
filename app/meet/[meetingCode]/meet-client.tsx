'use client'

import { useState } from 'react'
import { MeetingRoom } from '@/components/meetings/meeting-room'
import { MeetingPrejoin } from '@/components/meetings/meeting-prejoin'

export default function MeetPageClient({ meetingCode, meeting }: { meetingCode: string, meeting: any }) {
  const [joinParams, setJoinParams] = useState<any>(null)

  if (joinParams) {
    return (
      <MeetingRoom 
        meeting={meeting} 
        joinParams={joinParams}
        onLeave={() => setJoinParams(null)} 
      />
    )
  }

  return (
    <MeetingPrejoin 
      meeting={meeting} 
      onJoin={(params) => setJoinParams(params)} 
    />
  )
}
