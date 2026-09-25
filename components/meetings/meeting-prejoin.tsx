'use client'

import { useState } from 'react'
import { PreJoin, usePreviewTracks } from '@livekit/components-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { authClient } from '@/lib/auth/client'
import { ShieldCheck, Video } from 'lucide-react'
import { toast } from 'sonner'

interface MeetingPrejoinProps {
  meeting: any
  onJoin: () => void
}

export function MeetingPrejoin({ meeting, onJoin }: MeetingPrejoinProps) {
  const { data: session, isPending: isAuthPending } = authClient.useSession()
  
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [passcode, setPasscode] = useState('')
  const [step, setStep] = useState(1) // 1: Details (if needed), 2: AV Setup & Join

  const isInternalUser = !!session?.user
  const requiresPasscode = !!meeting.passcode

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate guest name if not logged in
    if (!isInternalUser && !guestName.trim()) {
      toast.error('Please enter your name to join')
      return
    }

    setStep(2)
  }

  // We intercept the LiveKit PreJoin submit to perform our own join API call
  // Note: The actual API call is done inside MeetingRoom, so PreJoin just transitions state.
  const handlePreJoinSubmit = (values: any) => {
    // If we were passing these preferences down, we would store them in context.
    // For now, we just tell the parent to mount the MeetingRoom.
    // We need to pass the guest info to the API. 
    // Since MeetingRoom doesn't take these props right now, I need to update MeetingRoom!
    
    // Wait, let's just use localStorage or pass a callback.
    // Better: let's do the API call here to get the token, THEN pass the token to MeetingRoom.
    // Ah, the user wanted Phase 5, Phase 6 structure. MeetingRoom does the API call right now.
    // Let's modify MeetingRoom to accept the guestName and passcode.
    onJoin()
  }

  if (isAuthPending) return null

  // If internal user and no passcode, skip step 1
  if (isInternalUser && !requiresPasscode && step === 1) {
    setStep(2)
    return null
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-muted/20">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        
        {/* Left side: Meeting Info */}
        <div className="space-y-4">
          <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
            <Video className="size-6" />
          </div>
          <h1 className="text-3xl font-bold">{meeting.title}</h1>
          <p className="text-lg text-muted-foreground">
            {meeting.organizer?.firstname} {meeting.organizer?.lastname} has invited you to this meeting.
          </p>
          
          <div className="space-y-2 pt-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Date:</span>
              <span className="text-muted-foreground">{new Date(meeting.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">Time:</span>
              <span className="text-muted-foreground">
                {new Date(meeting.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                ({meeting.duration} min)
              </span>
            </div>
            {meeting.waiting_room && (
              <div className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-500 bg-yellow-500/10 w-fit px-2 py-1 rounded-md mt-2">
                <ShieldCheck className="size-4" />
                Waiting room enabled
              </div>
            )}
          </div>
        </div>

        {/* Right side: Form or PreJoin */}
        <div>
          {step === 1 ? (
            <Card className="p-6">
              <form onSubmit={handleDetailsSubmit} className="space-y-5">
                <h2 className="text-xl font-semibold mb-4">Join Meeting</h2>
                
                {!isInternalUser && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="guestName">Your Name <span className="text-destructive">*</span></Label>
                      <Input 
                        id="guestName" 
                        value={guestName} 
                        onChange={e => setGuestName(e.target.value)} 
                        placeholder="e.g. Jane Doe"
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guestEmail">Email (Optional)</Label>
                      <Input 
                        id="guestEmail" 
                        type="email"
                        value={guestEmail} 
                        onChange={e => setGuestEmail(e.target.value)} 
                        placeholder="jane@example.com"
                      />
                    </div>
                  </>
                )}

                {requiresPasscode && (
                  <div className="space-y-2">
                    <Label htmlFor="passcode">Meeting Passcode <span className="text-destructive">*</span></Label>
                    <Input 
                      id="passcode" 
                      type="password"
                      value={passcode} 
                      onChange={e => setPasscode(e.target.value)} 
                      placeholder="Enter meeting passcode"
                      required 
                    />
                  </div>
                )}

                <Button type="submit" className="w-full">Continue to A/V Setup</Button>
              </form>
            </Card>
          ) : (
            <div className="rounded-xl overflow-hidden shadow-xl border bg-card">
              {/* Using LiveKit's built-in PreJoin. We will use a callback to actually trigger our app's join logic. */}
              <PreJoin
                onSubmit={(values) => {
                  // Values contains { audioEnabled: boolean, videoEnabled: boolean }
                  // Pass the gathered guest data and passcode to the join handler
                  onJoin({
                    guestName,
                    guestEmail,
                    passcode,
                    ...values
                  })
                }}
                submitLabel="Join Meeting"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
