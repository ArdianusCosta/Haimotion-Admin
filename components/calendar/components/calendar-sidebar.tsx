import React from 'react'
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

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
  currentDate, events, loading, handlePrevious, handleNext, openEventDialog, calendarDays
}: CalendarSidebarProps) {
  
  const year = currentDate.getFullYear()
  const monthName = currentDate.toLocaleString('default', { month: 'long' })
  const today = new Date()

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex w-full shrink-0 flex-col gap-6 lg:w-72">
      {/* Mini Calendar (Mocked visual representation) */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold">{monthName} {year}</h2>
          <div className="flex gap-1">
            <button onClick={handlePrevious} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><ChevronLeft className="size-4" /></button>
            <button onClick={handleNext} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><ChevronRight className="size-4" /></button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className="py-1">{d}</div>)}
          {calendarDays.slice(0, 35).map((day, i) => (
            <div 
              key={i} 
              className={`flex aspect-square items-center justify-center rounded-full text-xs 
                ${!day.isCurrentMonth ? 'text-muted-foreground/30' : ''}
                ${day.isToday ? 'bg-primary font-bold text-primary-foreground' : 'hover:bg-muted'}
              `}
            >
              {day.number}
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">Recent & Upcoming events</h2>
        <div className="mt-5 flex flex-col gap-4">
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
            // Sort by date (closest to today first)
            [...events].sort((a, b) => {
              const now = new Date().getTime()
              return Math.abs(new Date(a.start_event).getTime() - now) - Math.abs(new Date(b.start_event).getTime() - now)
            }).slice(0, 4).map((event) => {
              const eventDate = new Date(event.start_event)
              const monthShort = eventDate.toLocaleString('default', { month: 'short' })
              return (
                <div 
                  key={event.id} 
                  className="group flex gap-3 cursor-pointer"
                  onClick={() => openEventDialog(event)}
                >
                  <div className="flex flex-col items-center min-w-[36px]">
                    <span className="text-xs font-semibold text-muted-foreground">{monthShort}</span>
                    <span className={`text-lg font-bold ${eventDate.toDateString() === today.toDateString() ? 'text-primary' : 'text-foreground'}`}>{eventDate.getDate()}</span>
                    <span className="text-[10px] text-muted-foreground">{eventDate.getFullYear()}</span>
                  </div>
                  <div className="flex-1 rounded-xl border border-border bg-background p-3 transition-colors group-hover:border-primary/30 group-hover:bg-muted/30 overflow-hidden">
                    <h3 className="text-sm font-medium truncate" title={event.title}>{event.title}</h3>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3 shrink-0" /> <span className="truncate">{formatTime(event.start_event)}</span>
                    </p>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">No events found</p>
          )}
        </div>
        <Dialog>
          <DialogTrigger className="mt-5 w-full rounded-lg border border-border py-2 text-xs font-medium hover:bg-muted">
            View all events
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>All Events</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3 py-4">
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">No events found.</p>
              ) : (
                [...events].sort((a, b) => new Date(b.start_event).getTime() - new Date(a.start_event).getTime()).map(event => (
                  <div 
                    key={event.id} 
                    className="flex flex-col gap-1 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => openEventDialog(event)}
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-semibold text-sm">{event.title}</h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] ${event.color || 'bg-primary text-primary-foreground'}`}>
                        {new Date(event.start_event).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="size-3" /> {formatTime(event.start_event)} - {formatTime(event.end_event)}
                    </p>
                    {event.description && (
                      <p className="text-xs text-muted-foreground mt-2">{event.description}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
