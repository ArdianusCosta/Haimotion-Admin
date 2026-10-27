'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/components/language-provider'
import { useMeetings, useUpdateMeetingStatus } from '@/hooks/use-meetings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Search, Plus, Calendar, Clock, Video, Users, Play, Globe, Lock,
  ShieldCheck, Copy, ExternalLink, MoreHorizontal, ChevronRight,
  Construction, Sparkles, CheckCircle2, Eye
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { ScheduleMeetingDialog } from '@/components/meetings/dialogs/schedule-meeting-dialog'
import { MeetingDetailSheet } from '@/components/meetings/dialogs/meeting-detail-sheet'
import { MeetingRoom } from '@/components/meetings/meeting-room'
import { CreateMeetingPage } from '@/components/meetings/create-meeting-page'
import { toast } from 'sonner'

function getMeetingUrl(meetingCode: string) {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/meet/${meetingCode}`
  }
  return `/meet/${meetingCode}`
}

function StatusBadge({ status }: { status: string }) {
  const { language } = useLanguage()
  const isId = language === 'id'
  const map: Record<string, { label: string, variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    SCHEDULED: { label: isId ? 'Terjadwal' : 'Scheduled', variant: 'default' },
    LIVE: { label: isId ? '● Live' : '● Live', variant: 'destructive' },
    ENDED: { label: isId ? 'Selesai' : 'Ended', variant: 'secondary' },
    CANCELLED: { label: isId ? 'Dibatalkan' : 'Cancelled', variant: 'outline' },
  }
  const config = map[status] || { label: status, variant: 'outline' }
  return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>
}

function MeetingCardSkeleton() {
  return (
    <div className="border bg-card rounded-xl p-5 space-y-3 animate-in fade-in duration-500">
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
  const { language, t } = useLanguage()
  const isId = language === 'id'
  const messages: Record<string, { title: string, desc: string, showCta: boolean }> = {
    upcoming: {
      title: isId ? 'Tidak ada rapat mendatang' : 'No upcoming meetings',
      desc: isId ? 'Jadwalkan rapat untuk memulai kolaborasi.' : 'Schedule a meeting to get started.',
      showCta: true
    },
    today: {
      title: isId ? 'Tidak ada rapat hari ini' : 'No meetings today',
      desc: isId ? 'Jadwal Anda kosong hari ini — nikmati harimu!' : 'You have a free day — enjoy it!',
      showCta: false
    },
    past: {
      title: isId ? 'Tidak ada riwayat rapat' : 'No past meetings',
      desc: isId ? 'Riwayat rapat Anda akan muncul di sini.' : 'Your meeting history will appear here.',
      showCta: false
    },
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
          <Plus className="size-4 mr-1" /> {t('Schedule Meeting')}
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
  const { formatDate, formatTime, language } = useLanguage()
  const isId = language === 'id'
  const isLive = meeting.status === 'LIVE'
  const isEnded = meeting.status === 'ENDED' || meeting.status === 'CANCELLED'

  const dateStr = formatDate(meeting.date)
  const timeStr = formatTime(meeting.start_time)

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
            title={isId ? 'Salin tautan' : 'Copy link'}
          >
            <Copy className="size-3.5 text-muted-foreground" />
          </button>
          <button
            className="p-1 rounded hover:bg-muted transition-colors"
            onClick={e => { e.stopPropagation(); onDetail() }}
            title={isId ? 'Lihat detail' : 'View detail'}
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
          <span>{timeStr} · {meeting.duration} {isId ? 'menit' : 'min'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {meeting.join_policy === 'INVITED_ONLY'
            ? <Lock className="size-3.5 shrink-0" />
            : <Globe className="size-3.5 shrink-0" />
          }
          <span>
            {meeting.join_policy === 'INVITED_ONLY'
              ? (isId ? 'Hanya yang diundang' : 'Invited only')
              : (isId ? 'Siapa pun dengan tautan' : 'Anyone with link')}
          </span>
          {meeting.waiting_room && (
            <span className="flex items-center gap-1">
              <ShieldCheck className="size-3" /> {isId ? 'Ruang tunggu' : 'Waiting room'}
            </span>
          )}
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
            <span className="text-xs text-muted-foreground">{isId ? 'Belum ada peserta' : 'No participants yet'}</span>
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
            {isLive ? (isId ? 'Gabung Live' : 'Join Live') : (isId ? 'Gabung' : 'Join')}
          </Button>
        )}
      </div>
    </div>
  )
}

export function MeetingsPage({ slug }: { slug?: string[] }) {
  const router = useRouter()
  const { t, language } = useLanguage()
  const isId = language === 'id'

  const [activeTab, setActiveTab] = useState<'upcoming' | 'today' | 'past'>('upcoming')
  const [searchQuery, setSearchQuery] = useState('')
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [activeMeeting, setActiveMeeting] = useState<any>(null)
  const [showDevModal, setShowDevModal] = useState(true)

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
      toast.success(isId ? 'Tautan rapat berhasil disalin!' : 'Meeting link copied!', { description: url })
    })
  }

  const handleDetail = (meeting: any) => {
    setSelectedMeeting(meeting)
    setIsDetailOpen(true)
  }

  const tabs = [
    { key: 'upcoming', label: isId ? 'Mendatang' : 'Upcoming' },
    { key: 'today', label: isId ? 'Hari Ini' : 'Today' },
    { key: 'past', label: isId ? 'Selesai' : 'Past' },
  ] as const

  const isCreating = slug && slug[1] === 'create'

  if (isCreating) {
    return (
      <CreateMeetingPage onBack={() => router.push('/meetings')} />
    )
  }

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
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{t('Meetings')}</h1>
              <Badge
                variant="outline"
                onClick={() => setShowDevModal(true)}
                className="cursor-pointer bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-xs font-semibold gap-1.5 hover:bg-amber-500/20 transition-all select-none shadow-2xs"
              >
                <Construction className="size-3.5" />
                <span>{isId ? 'Tahap Pengembangan (Preview UI)' : 'Under Development (UI Preview)'}</span>
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t('Manage your scheduled meetings and video conferences.')}
            </p>
          </div>
          <Button onClick={() => router.push('/meetings/create')}>
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
              placeholder={isId ? 'Cari jadwal rapat...' : 'Search meetings...'}
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
                <EmptyState tab={activeTab} onSchedule={() => router.push('/meetings/create')} />
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

      {selectedMeeting && (
        <MeetingDetailSheet
          meeting={selectedMeeting}
          open={isDetailOpen}
          onOpenChange={setIsDetailOpen}
          onJoin={() => { setIsDetailOpen(false); handleJoin(selectedMeeting) }}
        />
      )}

      {/* ─── MODAL TAHAP PENGEMBANGAN (Development Notice Modal) ─── */}
      <Dialog open={showDevModal} onOpenChange={setShowDevModal}>
        <DialogContent className="w-[95vw] sm:max-w-lg md:max-w-xl p-0 rounded-2xl border border-border shadow-2xl bg-card overflow-hidden">
          {/* Header Banner */}
          <div className="bg-linear-to-r from-amber-500/20 via-orange-500/15 to-primary/10 border-b border-border/70 p-6 flex items-start gap-4">
            <div className="size-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-xs">
              <Construction className="size-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <DialogTitle className="font-extrabold text-base sm:text-lg text-foreground tracking-tight">
                  {isId ? 'Fitur Dalam Tahap Pengembangan' : 'Feature Under Active Development'}
                </DialogTitle>
                <Badge variant="outline" className="text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30 uppercase tracking-wider">
                  {isId ? 'Sedang Dikerjakan' : 'Work in Progress'}
                </Badge>
              </div>
              <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                {isId
                  ? <>Modul <b>Meetings & Video Conference</b> saat ini sedang dalam proses pengembangan dan integrasi server WebRTC.</>
                  : <>The <b>Meetings & Video Conference</b> module is currently in active development and WebRTC server integration.</>}
              </DialogDescription>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Informational Callout */}
            <div className="rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground space-y-2 leading-relaxed">
              <p className="text-foreground font-semibold flex items-center gap-2">
                <Sparkles className="size-4 text-amber-500" />
                {isId ? 'Seluruh Tampilan Tetap Dapat Anda Jelajahi' : 'Full UI Preview Available'}
              </p>
              <p>
                {isId
                  ? 'Semua menu, tata letak antarmuka (UI), filter jadwal rapat, dan desain ruang meeting tetap ditampilkan secara utuh agar Anda dapat melihat dan mencoba pengalaman alur pengguna yang sedang dibangun.'
                  : 'All menus, UI layouts, scheduling filters, and meeting room designs remain fully rendered so you can preview the user experience while live video calling is configured.'}
              </p>
            </div>

            {/* Checklist Roadmap */}
            <div className="space-y-2.5 text-xs">
              <p className="font-bold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
                {isId ? 'Status Integrasi Modul' : 'Module Integration Status'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  <span className="font-medium text-foreground">
                    {isId ? 'Desain Ruang & Antarmuka' : 'Room & UI Layout'}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                  <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                  <span className="font-medium text-foreground">
                    {isId ? 'Manajemen Jadwal Rapat' : 'Meeting Scheduling'}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5">
                  <Clock className="size-4 text-amber-500 shrink-0 animate-spin" />
                  <span className="font-medium text-foreground">
                    {isId ? 'Server WebRTC Video Call' : 'WebRTC Video Server'}
                  </span>
                </div>
                <div className="flex items-center gap-2.5 p-2.5 rounded-lg border border-amber-500/20 bg-amber-500/5">
                  <Clock className="size-4 text-amber-500 shrink-0" />
                  <span className="font-medium text-foreground">
                    {isId ? 'Screen Share & Rekaman Rapat' : 'Screen Share & Recording'}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2.5 border-t border-border/60">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="w-full sm:w-auto text-xs text-muted-foreground hover:text-foreground"
              >
                {isId ? 'Kembali ke Dashboard' : 'Back to Dashboard'}
              </Button>
              <Button
                size="sm"
                onClick={() => setShowDevModal(false)}
                className="w-full sm:w-auto text-xs font-semibold gap-1.5 shadow-xs"
              >
                <Eye className="size-3.5" />
                <span>{isId ? 'Lihat Tampilan (UI Preview)' : 'View Interface (UI Preview)'}</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
