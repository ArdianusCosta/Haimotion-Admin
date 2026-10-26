import React, { useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Search,
  Calendar,
  CheckSquare,
  FolderKanban,
  Video,
  PhoneCall,
  Palmtree,
  CalendarDays,
  ExternalLink
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { cleanHtmlText } from '../dialogs/event-detail-dialog'

type CalendarSidebarProps = {
  currentDate: Date
  events: any[]
  loading: boolean
  handlePrevious: () => void
  handleNext: () => void
  openEventDialog: (event: any) => void
  calendarDays: any[]
}

export function CalendarSidebar({
  currentDate,
  events,
  loading,
  handlePrevious,
  handleNext,
  openEventDialog,
  calendarDays
}: CalendarSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<string>('all')

  const year = currentDate.getFullYear()
  const monthName = currentDate.toLocaleString('default', { month: 'long' })
  const today = new Date()

  const formatTime = (dateStr: string | Date) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getSourceBadge = (source?: string) => {
    switch (source) {
      case 'task':
        return {
          label: 'Task',
          icon: <CheckSquare className="size-3" />,
          color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
        }
      case 'project':
        return {
          label: 'Project',
          icon: <FolderKanban className="size-3" />,
          color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
        }
      case 'meeting':
        return {
          label: 'Meeting',
          icon: <Video className="size-3" />,
          color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
        }
      case 'crm':
        return {
          label: 'CRM',
          icon: <PhoneCall className="size-3" />,
          color: 'bg-rose-500/15 text-rose-400 border-rose-500/30'
        }
      case 'leave':
        return {
          label: 'Leave',
          icon: <Palmtree className="size-3" />,
          color: 'bg-amber-500/15 text-amber-400 border-amber-500/30'
        }
      default:
        return {
          label: 'Calendar',
          icon: <CalendarDays className="size-3" />,
          color: 'bg-primary/15 text-primary border-primary/30'
        }
    }
  }

  // Filtered events for "All Events" modal
  const filteredEvents = events.filter((ev) => {
    const titleMatch = ev.title.toLowerCase().includes(searchQuery.toLowerCase())
    const descMatch = cleanHtmlText(ev.description).toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSearch = titleMatch || descMatch

    if (selectedFilter === 'all') return matchesSearch
    if (selectedFilter === 'other') {
      return matchesSearch && (ev.source === 'crm' || ev.source === 'leave')
    }
    return matchesSearch && (ev.source || 'calendar') === selectedFilter
  })

  const counts = {
    all: events.length,
    calendar: events.filter(e => (e.source || 'calendar') === 'calendar').length,
    task: events.filter(e => e.source === 'task').length,
    project: events.filter(e => e.source === 'project').length,
    meeting: events.filter(e => e.source === 'meeting').length,
    other: events.filter(e => e.source === 'crm' || e.source === 'leave').length
  }

  return (
    <div className="flex w-full shrink-0 flex-col gap-6 lg:w-72">
      {/* Mini Calendar */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-foreground">{monthName} {year}</h2>
          <div className="flex gap-1">
            <button
              onClick={handlePrevious}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={handleNext}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
            <div key={d} className="py-1">{d}</div>
          ))}
          {calendarDays.slice(0, 35).map((day, i) => (
            <div
              key={i}
              className={`flex aspect-square items-center justify-center rounded-full text-xs transition-colors
                ${!day.isCurrentMonth ? 'text-muted-foreground/30' : ''}
                ${day.isToday ? 'bg-primary font-bold text-primary-foreground' : 'hover:bg-muted text-foreground'}
              `}
            >
              {day.number}
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Events Widget */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">Recent & Upcoming</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
            {events.length}
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="flex flex-col items-center min-w-[36px] gap-1 pt-1">
                  <div className="h-3 w-8 bg-muted rounded" />
                  <div className="h-5 w-6 bg-muted rounded" />
                  <div className="h-2 w-8 bg-muted rounded" />
                </div>
                <div className="flex-1 rounded-xl border border-border p-3 flex flex-col gap-2">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                </div>
              </div>
            ))
          ) : events.length > 0 ? (
            [...events]
              .sort((a, b) => {
                const now = new Date().getTime()
                return (
                  Math.abs(new Date(a.start_event).getTime() - now) -
                  Math.abs(new Date(b.start_event).getTime() - now)
                )
              })
              .slice(0, 4)
              .map((event) => {
                const eventDate = new Date(event.start_event)
                const monthShort = eventDate.toLocaleString('default', { month: 'short' })
                const badge = getSourceBadge(event.source)

                return (
                  <div
                    key={event.id}
                    className="group flex gap-3 cursor-pointer"
                    onClick={() => openEventDialog(event)}
                  >
                    <div className="flex flex-col items-center min-w-[36px]">
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase">{monthShort}</span>
                      <span className={`text-lg font-bold leading-tight ${eventDate.toDateString() === today.toDateString() ? 'text-primary' : 'text-foreground'}`}>
                        {eventDate.getDate()}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{eventDate.getFullYear()}</span>
                    </div>

                    <div className="flex-1 rounded-xl border border-border bg-background/50 p-2.5 transition-all group-hover:border-primary/40 group-hover:bg-muted/40 overflow-hidden">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border ${badge.color}`}>
                          {badge.icon}
                          {badge.label}
                        </span>
                      </div>
                      <h3 className="text-xs font-semibold truncate text-foreground group-hover:text-primary transition-colors" title={event.title}>
                        {event.title}
                      </h3>
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="size-3 shrink-0" />
                        <span className="truncate">{formatTime(event.start_event)}</span>
                      </p>
                    </div>
                  </div>
                )
              })
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">No events found</p>
          )}
        </div>

        {/* Big Spacious "All Events" Modal */}
        <Dialog>
          <DialogTrigger className="mt-5 w-full rounded-xl border border-border py-2.5 text-xs font-semibold text-foreground hover:bg-muted hover:border-primary/40 transition-all flex items-center justify-center gap-1.5">
            <Calendar className="size-3.5 text-primary" />
            View all events ({events.length})
          </DialogTrigger>

          <DialogContent className="max-h-[85vh] sm:max-w-[850px] lg:max-w-[950px] p-6 border-border bg-card shadow-2xl flex flex-col gap-0 overflow-hidden">
            <DialogHeader className="pb-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">
                    All Events & Deadlines
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                    Daftar lengkap seluruh jadwal, tenggat tugas, jadwal meeting, dan project timeline yang terdaftar.
                  </DialogDescription>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-muted/40 text-xs font-medium text-muted-foreground">
                  <span>Total:</span>
                  <span className="font-bold text-foreground">{events.length}</span>
                </div>
              </div>

              {/* Search & Category Filter Toolbar */}
              <div className="mt-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari event, tugas, meeting, atau deskripsi..."
                    className="pl-9 h-9 text-xs bg-background"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
                  {[
                    { id: 'all', label: `Semua (${counts.all})` },
                    { id: 'calendar', label: `Event (${counts.calendar})` },
                    { id: 'task', label: `Task (${counts.task})` },
                    { id: 'project', label: `Project (${counts.project})` },
                    { id: 'meeting', label: `Meeting (${counts.meeting})` },
                    { id: 'other', label: `Lainnya (${counts.other})` }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedFilter(tab.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        selectedFilter === tab.id
                          ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </DialogHeader>

            {/* Scrollable Events Grid */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 pr-1">
              {filteredEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="size-12 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground mb-3">
                    <CalendarDays className="size-6" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Tidak ada event ditemukan</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    {searchQuery
                      ? `Tidak ada hasil yang cocok dengan pencarian "${searchQuery}".`
                      : 'Belum ada data event pada kategori yang dipilih.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {[...filteredEvents]
                    .sort((a, b) => new Date(b.start_event).getTime() - new Date(a.start_event).getTime())
                    .map((event) => {
                      const startDate = new Date(event.start_event)
                      const endDate = new Date(event.end_event)
                      const isSameDay = startDate.toDateString() === endDate.toDateString()
                      const badge = getSourceBadge(event.source)
                      const cleanDesc = cleanHtmlText(event.description)

                      return (
                        <div
                          key={event.id}
                          className="group flex flex-col justify-between rounded-xl border border-border bg-background/50 hover:bg-muted/30 p-4 cursor-pointer hover:border-primary/50 transition-all shadow-sm hover:shadow"
                          onClick={() => openEventDialog(event)}
                        >
                          <div>
                            {/* Card Header: Source Badge & Date Pill */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border ${badge.color}`}>
                                {badge.icon}
                                {badge.label}
                              </span>

                              <span className="text-[11px] text-muted-foreground font-mono flex items-center gap-1">
                                <Calendar className="size-3" />
                                {startDate.toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>

                            {/* Title */}
                            <h4 className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {event.title}
                            </h4>

                            {/* Time & Duration */}
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1.5">
                              <Clock className="size-3.5 text-muted-foreground/70" />
                              <span>{formatTime(startDate)} - {formatTime(endDate)}</span>
                              {!isSameDay && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                                  Hingga {endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                </span>
                              )}
                            </p>

                            {/* Description Preview */}
                            {cleanDesc && (
                              <p className="text-xs text-muted-foreground/90 mt-2 line-clamp-2 bg-muted/20 rounded p-2 border border-border/50">
                                {cleanDesc}
                              </p>
                            )}
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>{event.source && event.source !== 'calendar' ? 'Disinkronkan otomatis' : 'Event kalender internal'}</span>
                            <span className="text-primary font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              Lihat Detail <ExternalLink className="size-3" />
                            </span>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
