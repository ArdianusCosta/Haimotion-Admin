'use client'

import { useState } from 'react'
import { useLanguage } from '@/components/language-provider'
import { useMeetings } from '@/lib/hooks/use-meetings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Calendar, Clock, Video, Users, Play, X, ExternalLink } from 'lucide-react'
import { ScheduleMeetingDialog } from '@/components/schedule-meeting-dialog'
import { JitsiMeeting } from '@/components/jitsi-meeting'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUpdateMeetingStatus } from '@/lib/hooks/use-meetings'

export function MeetingsPage() {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState<'upcoming' | 'today' | 'past'>('upcoming')
  const [searchQuery, setSearchQuery] = useState('')
  const [isScheduleOpen, setIsScheduleOpen] = useState(false)
  const [activeMeeting, setActiveMeeting] = useState<any>(null)
  
  const { data: meetings, isLoading } = useMeetings()
  const { mutate: updateStatus } = useUpdateMeetingStatus()

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading meetings...</div>
  }

  const now = new Date()
  
  let filteredMeetings = (meetings || []).filter((m: any) => {
    if (searchQuery && !m.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    const meetingDateTime = new Date(m.start_time)
    const isToday = meetingDateTime.toDateString() === now.toDateString()
    
    if (activeTab === 'today') return isToday;
    if (activeTab === 'upcoming') return meetingDateTime > now && !isToday && m.status !== 'COMPLETED' && m.status !== 'CANCELLED';
    if (activeTab === 'past') return meetingDateTime <= now || m.status === 'COMPLETED' || m.status === 'CANCELLED';
    
    return true;
  })
  
  const handleJoinMeeting = (meeting: any) => {
    if (meeting.status === 'SCHEDULED') {
      updateStatus({ id: meeting.id, status: 'LIVE' })
    }
    setActiveMeeting(meeting)
  }

  const handleLeaveMeeting = () => {
    if (activeMeeting) {
      updateStatus({ id: activeMeeting.id, status: 'COMPLETED' })
    }
    setActiveMeeting(null)
  }

  return (
    <div className="flex h-full flex-col p-8">
      {activeMeeting && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-bold flex items-center gap-2"><Video className="text-primary"/> {activeMeeting.title}</h2>
            <Button variant="destructive" onClick={handleLeaveMeeting}><X className="mr-2 size-4"/> Leave Meeting</Button>
          </div>
          <div className="flex-1">
            <JitsiMeeting roomName={activeMeeting.jitsi_room_name} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('Meetings')}</h1>
          <p className="text-muted-foreground mt-1">{t('Manage your scheduled meetings and video conferences.')}</p>
        </div>
        <Button onClick={() => setIsScheduleOpen(true)}>
          <Plus className="mr-2 size-4" />
          {t('Schedule Meeting')}
        </Button>
      </div>
      
      <div className="flex items-center gap-4 mb-6">
        <div className="flex bg-muted p-1 rounded-lg">
          <button onClick={() => setActiveTab('upcoming')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'upcoming' ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}>Upcoming</button>
          <button onClick={() => setActiveTab('today')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'today' ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}>Today</button>
          <button onClick={() => setActiveTab('past')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'past' ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}>Past</button>
        </div>
        
        <div className="relative ml-auto w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder={t('Search meetings...')} 
            className="pl-9 bg-background" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMeetings.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border rounded-xl border-dashed">
            <Video className="mx-auto size-8 mb-3 opacity-20" />
            <p>No meetings found for this category.</p>
          </div>
        ) : (
          filteredMeetings.map((meeting: any) => (
            <div key={meeting.id} className="border bg-card rounded-xl p-5 shadow-sm flex flex-col hover:border-primary/50 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <Badge variant={meeting.status === 'LIVE' ? 'destructive' : meeting.status === 'COMPLETED' ? 'secondary' : 'default'} className="mb-2">
                  {meeting.status}
                </Badge>
                {meeting.project && <Badge variant="outline" className="text-xs truncate max-w-[120px]">{meeting.project.name}</Badge>}
              </div>
              <h3 className="font-semibold text-lg line-clamp-1">{meeting.title}</h3>
              {meeting.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{meeting.description}</p>}
              
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4" /> {new Date(meeting.date).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-4" /> {new Date(meeting.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ({meeting.duration} min)
                </div>
              </div>
              
              <div className="mt-auto pt-5 flex items-center justify-between">
                <div className="flex -space-x-2">
                   {meeting.participants.slice(0, 3).map((p: any) => (
                     <Avatar key={p.user.id} className="size-7 border-2 border-background">
                       <AvatarImage src={p.user.avatar || undefined} />
                       <AvatarFallback className="text-[10px]">{p.user.firstname?.[0]}</AvatarFallback>
                     </Avatar>
                   ))}
                   {meeting.participants.length > 3 && (
                     <div className="size-7 rounded-full bg-muted flex items-center justify-center text-[10px] border-2 border-background font-medium">
                       +{meeting.participants.length - 3}
                     </div>
                   )}
                </div>
                
                {meeting.status !== 'COMPLETED' && meeting.status !== 'CANCELLED' && (
                  <Button size="sm" onClick={() => handleJoinMeeting(meeting)}>
                    <Play className="mr-1 size-3" /> Join
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <ScheduleMeetingDialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen} />
    </div>
  )
}
