import React from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'

type CalendarGridProps = {
  view: 'Month' | 'Week' | 'Day'
  currentDate: Date
  displayDays: any[]
  loading: boolean
  handleToday: () => void
  handlePrevious: () => void
  handleNext: () => void
  openEventDialog: (event?: any, dateStr?: string) => void
  handleDragOver: (e: React.DragEvent) => void
  handleDrop: (e: React.DragEvent, dateStr: string) => void
  handleDragStart: (e: React.DragEvent, eventId: number) => void
}

export function CalendarGrid({
  view, currentDate, displayDays, loading, handleToday, handlePrevious, handleNext,
  openEventDialog, handleDragOver, handleDrop, handleDragStart
}: CalendarGridProps) {

  let headerTitle = ''
  const monthName = currentDate.toLocaleString('default', { month: 'long' })
  const year = currentDate.getFullYear()

  if (view === 'Month') {
    headerTitle = `${monthName} ${year}`
  } else if (view === 'Week') {
    const currentDay = currentDate.getDay()
    const startDate = new Date(currentDate)
    startDate.setDate(startDate.getDate() - currentDay)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 6)
    headerTitle = `${startDate.toLocaleString('default', { month: 'short' })} ${startDate.getDate()} - ${endDate.toLocaleString('default', { month: 'short' })} ${endDate.getDate()}, ${endDate.getFullYear()}`
  } else if (view === 'Day') {
    headerTitle = currentDate.toLocaleDateString('default', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 className="text-xl font-semibold">{headerTitle}</h2>
        <div className="flex items-center gap-2">
          <button onClick={handleToday} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">Today</button>
          <div className="flex items-center gap-1 rounded-lg border border-border p-1">
            <button onClick={handlePrevious} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><ChevronLeft className="size-4" /></button>
            <button onClick={handleNext} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><ChevronRight className="size-4" /></button>
          </div>
        </div>
      </div>
      
      <div className={`grid border-b border-border bg-muted/30 ${view === 'Day' ? 'grid-cols-1' : 'grid-cols-7'}`}>
        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].filter((_, i) => view === 'Day' ? i === currentDate.getDay() : true).map((day) => (
          <div key={day} className="border-r border-border py-3 text-center text-xs font-medium text-muted-foreground last:border-0">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day.substring(0, 3)}</span>
          </div>
        ))}
      </div>
      
      <div className={`grid flex-1 bg-border gap-px ${view === 'Day' ? 'grid-cols-1' : 'grid-cols-7'}`} style={{ gridTemplateRows: `repeat(${displayDays.length / (view === 'Day' ? 1 : 7)}, minmax(0, 1fr))` }}>
        {displayDays.map((day) => (
          <div 
            key={day.id} 
            onDragOver={handleDragOver}
            onDrop={(e) => day.isCurrentMonth && day.dateStr && handleDrop(e, day.dateStr)}
            className={`bg-card p-1 sm:p-2 transition-colors group relative hover:bg-muted/10 ${view === 'Month' ? 'min-h-[100px]' : 'min-h-[400px]'} ${!day.isCurrentMonth ? 'bg-muted/20' : ''}`}
          >
            <div className="flex items-center justify-between">
              <span className={`flex size-6 items-center justify-center rounded-full text-xs font-medium
                ${day.isToday ? 'bg-primary text-primary-foreground' : !day.isCurrentMonth ? 'text-muted-foreground/50' : 'text-foreground'}`}
              >
                {day.number}
              </span>
              {day.isCurrentMonth && day.dateStr && (
                <button 
                  onClick={(e) => { e.stopPropagation(); openEventDialog(undefined, day.dateStr!); }}
                  className="opacity-0 transition-opacity hover:text-primary sm:group-hover:opacity-100 p-1"
                >
                  <Plus className="size-3" />
                </button>
              )}
            </div>
            
            <div className="mt-1 flex flex-col gap-1 max-h-[80px] overflow-y-auto no-scrollbar">
              {loading && day.isCurrentMonth ? (
                Array.from({ length: (day.number % 3) }).map((_, i) => (
                  <div key={i} className="h-4 w-full bg-muted animate-pulse rounded mt-0.5" />
                ))
              ) : day.events.map((event: any) => (
                <div 
                  key={event.id}
                  draggable={true}
                  onDragStart={(e) => { e.stopPropagation(); handleDragStart(e, event.id) }} 
                  onClick={(e) => { e.stopPropagation(); openEventDialog(event); }}
                  className={`truncate rounded px-1.5 py-1 text-[10px] sm:text-xs font-medium cursor-pointer transition-opacity hover:opacity-80 active:cursor-grabbing ${event.color || 'bg-primary text-primary-foreground'}`}
                  title={`${event.title} (${formatTime(event.start_event)})`}
                >
                  {formatTime(event.start_event)} {event.title}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
