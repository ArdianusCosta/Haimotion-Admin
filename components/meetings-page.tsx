'use client'

import { useState } from 'react'
import { useLanguage } from '@/components/language-provider'
import { useMeetings, useUpdateMeetingStatus } from '@/lib/hooks/use-meetings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Search, Plus, Calendar, Clock, Video, Users, Play, Globe, Lock,
  ShieldCheck, Copy, ExternalLink, MoreHorizontal, ChevronRight
} from 'lucide-react'
import { ScheduleMeetingDialog } from '@/components/schedule-meeting-dialog'
import { MeetingDetailSheet } from '@/components/meeting-detail-sheet'
import { MeetingRoom } from '@/components/meeting-room'
import { toast } from 'sonner'

function getMeetingUrl(meetingCode: string) {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/meet/${meetingCode}`
  }
  return `/meet/${meetingCode}`
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string, variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    SCHEDULED: { label: 'Scheduled', variant: 'default' },
    LIVE: { label: '● Live', variant: 'destructive' },
    ENDED: { label: 'Ended', variant: 'secondary' },
    CANCELLED: { label: 'Cancelled', variant: 'outline' },
  }
  const config = map[status] || { label: status, variant: 'outline' }
  return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>
}

function MeetingCardSkeleton() {
  return (
    <div className="border bg-card rounded-xl p-5 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-7 w-7 rounded-full" />
        <Skeleton className="h-7 w-7 rounded-full" />
      </div>
    </div>
  )
}

function EmptyState({ tab, onSchedule }: { tab: string, onSchedule: () => void }) {
  const messages: Record<string, { title: string, desc: string, showCta: boolean }> = {
    upcoming: { title: 'No upcoming meetings', desc: 'Schedule a meeting to get started.', showCta: true },
    today: { title: 'No meetings today', desc: 'You have a free day — enjoy it!', showCta: false },
    past: { title: 'No past meetings', desc: 'Your meeting history will appear here.', showCta: false },
  }
  const { title, desc, showCta } = messages[tab] || messages.upcoming
  return (
    <div className="col-span-full py-16 text-center border border-dashed rounded-xl">
      <div className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
        <Video className="size-5 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{desc}</p>
      {showCta && (
        <Button size="sm" onClick={onSchedule}>
          <Plus className="size-4 mr-1" /> Schedule Meeting
        </Button>
      )}
    </div>
  )
}

function MeetingCard({
  meeting,
  onJoin,
  onDetail,
  onCopyLink,
}: {
  meeting: any,
  onJoin: () => void,
  onDetail: () => void,
  onCopyLink: () => void,
}) {
  const isLive = meeting.status === 'LIVE'
  const isEnded = meeting.status === 'ENDED' || meeting.status === 'CANCELLED'

  const startTime = new Date(meeting.start_time)
  const dateStr = new Date(meeting.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const timeStr = startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div
      className={`group border bg-card rounded-xl p-5 flex flex-col gap-3 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer ${isLive ? 'border-destructive/30 shadow-destructive/5 shadow-sm' : ''}`}
      onClick={onDetail}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <StatusBadge status={meeting.status} />
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="p-1 rounded hover:bg-muted transition-colors"
            onClick={e => { e.stopPropagation(); onCopyLink() }}
            title="Copy link"
          >
            <Copy className="size-3.5 text-muted-foreground" />
          </button>
          <button
            className="p-1 rounded hover:bg-muted transition-colors"
            onClick={e => { e.stopPropagation(); onDetail() }}
            title="View detail"
          >
            <ChevronRight className="size-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Title */}
      <div>
        <h3 className="font-semibold text-base line-clamp-1">{meeting.title}</h3>
        {meeting.description && (
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{meeting.description}</p>
        )}
      </div>

      {/* Info */}
      <div className="space-y-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="size-3.5 shrink-0" />
          <span>{dateStr}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="size-3.5 shrink-0" />
          <span>{timeStr} · {meeting.duration} min</span>
        </div>
        <div className="flex items-center gap-1.5">
          {meeting.join_policy === 'INVITED_ONLY'
            ? <Lock className="size-3.5 shrink-0" />
            : <Globe className="size-3.5 shrink-0" />
          }
          <span>{meeting.join_policy === 'INVITED_ONLY' ? 'Invited only' : 'Anyone with link'}</span>
          {meeting.waiting_room && <span className="flex items-center gap-1"><ShieldCheck className="size-3" /> Waiting room</span>}
        </div>
        {meeting.meeting_code && (
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded text-foreground">{meeting.meeting_code}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2">
        {/* Participants */}
        <div className="flex -space-x-2">
          {meeting.participants.slice(0, 4).map((p: any, i: number) => (
            <Avatar key={i} className="size-6 border-2 border-background">
              <AvatarImage src={p.user?.avatar || undefined} />
              <AvatarFallback className="text-[9px]">{(p.user?.firstname || p.guest_name || '?')[0]}</AvatarFallback>
            </Avatar>
          ))}
          {meeting.participants.length > 4 && (
            <div className="size-6 rounded-full bg-muted flex items-center justify-center text-[9px] border-2 border-background font-medium">
              +{meeting.participants.length - 4}
            </div>
          )}
          {meeting.participants.length === 0 && (
            <span className="text-xs text-muted-foreground">No participants yet</span>
          )}
        </div>

        {/* Join Button */}
        {!isEnded && (
          <Button
            size="sm"
            variant={isLive ? 'destructive' : 'default'}
            className="h-7 text-xs gap-1"
            onClick={e => { e.stopPropagation(); onJoin() }}
          >
            <Play className="size-3" />
            {isLive ? 'Join Live' : 'Join'}
          </Button>
        )}
      </div>
    </div>
  )
}

export function MeetingsPage() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<'upcoming' | 'today' | 'past'>('upcoming')
  const [searchQuery, setSearchQuery] = useState('')
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [activeMeeting, setActiveMeeting] = useState<any>(null)

  const { data: meetings, isLoading } = useMeetings()
  const { mutate: updateStatus } = useUpdateMeetingStatus()

  const now = new Date()

  const filteredMeetings = (meetings || []).filter((m: any) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      const matchesTitle = m.title.toLowerCase().includes(q)
      const matchesDesc = m.description?.toLowerCase().includes(q)
      const matchesCode = m.meeting_code?.toLowerCase().includes(q)
      if (!matchesTitle && !matchesDesc && !matchesCode) return false
    }

    const meetingDate = new Date(m.date)
    const isToday = meetingDate.toDateString() === now.toDateString()
    const startTime = new Date(m.start_time)
    const isPast = startTime < now || m.status === 'ENDED' || m.status === 'CANCELLED'

    if (activeTab === 'today') return isToday
    if (activeTab === 'upcoming') return startTime > now && !isToday && !isPast
    if (activeTab === 'past') return isPast
    return true
  })

  const handleJoin = (meeting: any) => {
    if (meeting.status === 'SCHEDULED') {
      updateStatus({ id: meeting.id, status: 'LIVE' })
    }
    setActiveMeeting(meeting)
  }

  const handleLeave = () => {
    if (activeMeeting) {
      updateStatus({ id: activeMeeting.id, status: 'ENDED' })
    }
    setActiveMeeting(null)
  }

  const handleCopyLink = (meeting: any) => {
    if (!meeting.meeting_code) return
    const url = getMeetingUrl(meeting.meeting_code)
    navigator.clipboard.writeText(url).then(() => {
      toast.success('Meeting link copied!', { description: url })
    })
  }

  const handleDetail = (meeting: any) => {
    setSelectedMeeting(meeting)
    setIsDetailOpen(true)
  }

  const tabs = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'today', label: 'Today' },
    { key: 'past', label: 'Past' },
  ] as const

  return (
    <>
      {/* Active Meeting Room Overlay */}
      {activeMeeting && (
        <MeetingRoom
          meeting={activeMeeting}
          onLeave={handleLeave}
        />
      )}

      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('Meetings')}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t('Manage your scheduled meetings and video conferences.')}
            </p>
          </div>
          <Button onClick={() => setIsScheduleOpen(true)}>
            <Plus className="size-4 mr-1.5" />
            {t('Schedule Meeting')}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 px-6 py-3 border-b bg-muted/30">
          <div className="flex bg-background border rounded-lg p-1 gap-0.5">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${activeTab === tab.key ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative ml-auto w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search meetings..."
              className="pl-9 h-9 bg-background"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => <MeetingCardSkeleton key={i} />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMeetings.length === 0 ? (
                <EmptyState tab={activeTab} onSchedule={() => setIsScheduleOpen(true)} />
              ) : (
                filteredMeetings.map((meeting: any) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    onJoin={() => handleJoin(meeting)}
                    onDetail={() => handleDetail(meeting)}
                    onCopyLink={() => handleCopyLink(meeting)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <ScheduleMeetingDialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen} />

      {selectedMeeting && (
        <MeetingDetailSheet
          meeting={selectedMeeting}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          onJoin={() => { setIsDetailOpen(false); handleJoin(selectedMeeting) }}
        />
      )}
    </>
  )
}
