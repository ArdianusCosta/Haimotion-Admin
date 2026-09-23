import { getMeetingByCode } from '@/app/actions/meetings'
import MeetPageClient from './meet-client'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function MeetPage({ params }: { params: Promise<{ meetingCode: string }> }) {
  const { meetingCode } = await params
  const res = await getMeetingByCode(meetingCode)
  
  if (!res.success || !res.data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="size-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mb-6">
          <AlertCircle className="size-8" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Meeting Not Found</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          We couldn't find a meeting with code "{meetingCode}". Please check the link and try again.
        </p>
        <Button asChild>
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    )
  }

  const meeting = res.data

  if (meeting.status === 'CANCELLED' || meeting.status === 'ENDED') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="size-16 rounded-full bg-muted text-muted-foreground flex items-center justify-center mb-6">
          <AlertCircle className="size-8" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Meeting {meeting.status === 'ENDED' ? 'Ended' : 'Cancelled'}</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          This meeting has been {meeting.status.toLowerCase()} and is no longer accessible.
        </p>
        <Button asChild>
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    )
  }

  return <MeetPageClient meetingCode={meetingCode} meeting={meeting} />
}
