'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Calendar, Clock, Copy, ExternalLink, Globe, Lock, Play,
  Share2, ShieldCheck, Users, X, AlertCircle, CheckCircle2, Trash2, Ban,
  Check, X as XIcon
} from 'lucide-react'
import { useCancelMeeting, useDeleteMeeting, useAdmitParticipant, useRejectParticipant } from '@/lib/hooks/use-meetings'
import { toast } from 'sonner'
import { authClient } from '@/lib/auth/client'

interface MeetingDetailSheetProps {
  meeting: any
  open: boolean
  onOpenChange: (open: boolean) => void
  onJoin: () => void
}

function getRoleColor(role: string) {
  if (role === 'HOST') return 'bg-primary/10 text-primary'
  if (role === 'CO_HOST') return 'bg-blue-500/10 text-blue-600'
  if (role === 'GUEST') return 'bg-orange-500/10 text-orange-600'
  return 'bg-muted text-muted-foreground'
}

function getStatusIcon(status: string) {
  if (status === 'ADMITTED' || status === 'JOINED') return <CheckCircle2 className="size-3 text-green-500" />
  if (status === 'WAITING') return <Clock className="size-3 text-yellow-500" />
  if (status === 'REJECTED') return <AlertCircle className="size-3 text-destructive" />
  return null
}

export function MeetingDetailSheet({ meeting, open, onOpenChange, onJoin }: MeetingDetailSheetProps) {
  const { data: session } = authClient.useSession()
  const [showConfirmCancel, setShowConfirmCancel] = useState(false)
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  const { mutate: cancelMeeting, isPending: isCancelling } = useCancelMeeting()
  const { mutate: deleteMeeting, isPending: isDeleting } = useDeleteMeeting()
  const { mutate: admitParticipant } = useAdmitParticipant(meeting?.meeting_code)
  const { mutate: rejectParticipant } = useRejectParticipant(meeting?.meeting_code)

  if (!open || !meeting) return null

  const isHost = session?.user?.id === String(meeting.organizer_id) || session?.user?.id === meeting.organizer_id


  const meetingUrl = typeof window !== 'undefined' ? `${window.location.origin}/meet/${meeting.meeting_code}` : `/meet/${meeting.meeting_code}`

  const startTime = new Date(meeting.start_time)
  const dateStr = new Date(meeting.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const timeStr = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const isEnded = meeting.status === 'ENDED' || meeting.status === 'CANCELLED'
  const isLive = meeting.status === 'LIVE'

  const handleCopyLink = () => {
    navigator.clipboard.writeText(meetingUrl)
    toast.success('Link copied to clipboard!')
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: meeting.title, url: meetingUrl })
      } catch {
        handleCopyLink()
      }
    } else {
      handleCopyLink()
    }
  }

  const handleCancel = () => {
    cancelMeeting(meeting.id, {
      onSuccess: () => { onOpenChange(false); setShowConfirmCancel(false) }
    })
  }

  const handleDelete = () => {
    deleteMeeting(meeting.id, {
      onSuccess: () => { onOpenChange(false); setShowConfirmDelete(false) }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex" onClick={() => onOpenChange(false)}>
      <div className="flex-1" />
      <div
        className="relative w-full max-w-sm bg-background border-l shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <span className="font-semibold text-sm">Meeting Details</span>
          <button onClick={() => onOpenChange(false)} className="p-1 hover:bg-muted rounded-md transition-colors">
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          <div className="px-5 py-4 space-y-5">
            {/* Status + Title */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {isLive && <Badge variant="destructive" className="text-xs">● Live Now</Badge>}
                {meeting.status === 'SCHEDULED' && <Badge variant="default" className="text-xs">Scheduled</Badge>}
                {meeting.status === 'ENDED' && <Badge variant="secondary" className="text-xs">Ended</Badge>}
                {meeting.status === 'CANCELLED' && <Badge variant="outline" className="text-xs">Cancelled</Badge>}
              </div>
              <h2 className="text-lg font-bold leading-tight">{meeting.title}</h2>
              {meeting.description && <p className="text-sm text-muted-foreground">{meeting.description}</p>}
            </div>

            <Separator />

            {/* Details */}
            <div className="space-y-3 text-sm">
              <div className="flex gap-3">
                <Calendar className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">{dateStr}</div>
                  <div className="text-muted-foreground">{timeStr} · {meeting.duration} min</div>
                </div>
              </div>
              <div className="flex gap-3">
                <Users className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">Organizer</div>
                  <div className="text-muted-foreground">
                    {meeting.organizer?.firstname} {meeting.organizer?.lastname}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                {meeting.join_policy === 'INVITED_ONLY'
                  ? <Lock className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                  : <Globe className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                }
                <div>
                  <div className="font-medium">Access</div>
                  <div className="text-muted-foreground capitalize">
                    {meeting.join_policy === 'INVITED_ONLY' ? 'Invited members only' : 'Anyone with the link'}
                  </div>
                </div>
              </div>
              {meeting.waiting_room && (
                <div className="flex gap-3">
                  <ShieldCheck className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium">Waiting Room</div>
                    <div className="text-muted-foreground">Enabled — host must admit participants</div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Meeting Link */}
            {meeting.meeting_code && (
              <div className="space-y-2">
                <div className="text-sm font-medium">Meeting Link</div>
                <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                  <code className="text-xs flex-1 truncate text-foreground">{meetingUrl}</code>
                  <button onClick={handleCopyLink} className="p-1 hover:bg-background rounded transition-colors shrink-0">
                    <Copy className="size-3.5" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={handleCopyLink}>
                    <Copy className="size-3 mr-1" /> Copy Link
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 h-8 text-xs" onClick={handleShare}>
                    <Share2 className="size-3 mr-1" /> Share
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 w-8 p-0" asChild>
                    <a href={meetingUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="size-3" />
                    </a>
                  </Button>
                </div>
              </div>
            )}

            <Separator />

            {/* Participants */}
            <div className="space-y-2">
              <div className="text-sm font-medium">Participants ({meeting.participants.length})</div>
              {meeting.participants.length === 0 ? (
                <p className="text-xs text-muted-foreground">No participants yet</p>
              ) : (
                <div className="space-y-2">
                  {meeting.participants.map((p: any) => (
                    <div key={p.id} className="flex items-center gap-2.5">
                      <Avatar className="size-7">
                        <AvatarImage src={p.user?.avatar || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {(p.user?.firstname || p.guest_name || '?')[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {p.user ? `${p.user.firstname} ${p.user.lastname}` : p.guest_name || 'Guest'}
                        </div>
                        {p.guest_email && <div className="text-xs text-muted-foreground truncate">{p.guest_email}</div>}
                      </div>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(p.status)}
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${getRoleColor(p.role)}`}>
                          {p.role}
                        </span>
                      </div>
                      
                      {isHost && p.status === 'WAITING' && (
                        <div className="flex items-center gap-1 ml-2">
                          <button 
                            onClick={() => admitParticipant(p.id)}
                            className="p-1 rounded bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
                            title="Admit"
                          >
                            <Check className="size-3" />
                          </button>
                          <button 
                            onClick={() => rejectParticipant(p.id)}
                            className="p-1 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                            title="Reject"
                          >
                            <XIcon className="size-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Danger Zone */}
            {!isEnded && (
              <>
                <Separator />
                <div className="space-y-2">
                  {!showConfirmCancel && !showConfirmDelete ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => setShowConfirmCancel(true)}>
                        <Ban className="size-3 mr-1" /> Cancel Meeting
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => setShowConfirmDelete(true)}>
                        <Trash2 className="size-3 mr-1" /> Delete
                      </Button>
                    </div>
                  ) : showConfirmCancel ? (
                    <div className="bg-destructive/10 rounded-lg p-3 space-y-2">
                      <p className="text-sm font-medium text-destructive">Cancel this meeting?</p>
                      <p className="text-xs text-muted-foreground">Participants will no longer be able to join.</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive" className="flex-1 h-7 text-xs" onClick={handleCancel} disabled={isCancelling}>
                          {isCancelling ? 'Cancelling...' : 'Confirm'}
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => setShowConfirmCancel(false)}>Back</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-destructive/10 rounded-lg p-3 space-y-2">
                      <p className="text-sm font-medium text-destructive">Delete this meeting?</p>
                      <p className="text-xs text-muted-foreground">This action cannot be undone.</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="destructive" className="flex-1 h-7 text-xs" onClick={handleDelete} disabled={isDeleting}>
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => setShowConfirmDelete(false)}>Back</Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        {!isEnded && (
          <div className="border-t px-5 py-4">
            <Button className="w-full" onClick={onJoin}>
              <Play className="size-4 mr-2" />
              {isLive ? 'Join Live Meeting' : 'Start Meeting'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
