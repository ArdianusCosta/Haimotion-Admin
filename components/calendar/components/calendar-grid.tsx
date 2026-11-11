'use client'

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock, CheckSquare, CalendarDays, ExternalLink } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { cleanHtmlText } from '../dialogs/event-detail-dialog'

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
  const [dayModal, setDayModal] = useState<{ dateStr?: string; number: number; events: any[] } | null>(null)

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
    try {
      const d = new Date(dateStr)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  const formatDayTitle = (dateStr?: string, dayNumber?: number) => {
    if (!dateStr) return `Tanggal ${dayNumber || ''}`
    try {
      const parts = dateStr.split('-')
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    } catch {
      return dateStr
    }
  }

  return (
    <>
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs">
        {/* Header Controls */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-xl font-semibold tracking-tight">{headerTitle}</h2>
          <div className="flex items-center gap-2">
            <button onClick={handleToday} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors cursor-pointer">
              Hari Ini
            </button>
            <div className="flex items-center gap-1 rounded-lg border border-border p-1">
              <button onClick={handlePrevious} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer" aria-label="Previous">
                <ChevronLeft className="size-4" />
              </button>
              <button onClick={handleNext} className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer" aria-label="Next">
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Days of Week Header */}
        <div className={`grid border-b border-border bg-muted/30 ${view === 'Day' ? 'grid-cols-1' : 'grid-cols-7'}`}>
          {['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].filter((_, i) => view === 'Day' ? i === currentDate.getDay() : true).map((day) => (
            <div key={day} className="border-r border-border py-2.5 text-center text-xs font-semibold text-muted-foreground last:border-0 select-none">
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day.substring(0, 3)}</span>
            </div>
          ))}
        </div>
        
        {/* Grid Cells */}
        <div 
          className={`grid flex-1 bg-border gap-px ${view === 'Day' ? 'grid-cols-1' : 'grid-cols-7'}`} 
          style={{ gridTemplateRows: `repeat(${displayDays.length / (view === 'Day' ? 1 : 7)}, minmax(0, 1fr))` }}
        >
          {displayDays.map((day) => {
            const totalEvents = day.events?.length || 0
            // In Month view: show at most 2 items if > 3 total so "+X more" fits with zero squishing
            const maxVisible = view === 'Month' ? (totalEvents <= 3 ? 3 : 2) : 10
            const visibleEvents = day.events?.slice(0, maxVisible) || []
            const hiddenCount = totalEvents > maxVisible ? totalEvents - maxVisible : 0

            return (
              <div 
                key={day.id} 
                onDragOver={handleDragOver}
                onDrop={(e) => day.isCurrentMonth && day.dateStr && handleDrop(e, day.dateStr)}
                className={`bg-card p-1.5 sm:p-2 transition-colors group relative flex flex-col ${
                  view === 'Month' ? 'min-h-[110px]' : 'min-h-[400px]'
                } ${!day.isCurrentMonth ? 'bg-muted/20 opacity-60' : 'hover:bg-muted/10'}`}
              >
                {/* Day Header (Number & Add Button) */}
                <div className="flex items-center justify-between mb-1 select-none">
                  <span className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold transition-all
                    ${day.isToday ? 'bg-primary text-primary-foreground shadow-xs' : !day.isCurrentMonth ? 'text-muted-foreground/60' : 'text-foreground'}`}
                  >
                    {day.number}
                  </span>
                  {day.isCurrentMonth && day.dateStr && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); openEventDialog(undefined, day.dateStr!); }}
                      className="opacity-0 transition-opacity hover:text-primary sm:group-hover:opacity-100 p-1 rounded hover:bg-muted cursor-pointer"
                      title="Tambah Event"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  )}
                </div>
                
                {/* Events Container */}
                <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                  {loading && day.isCurrentMonth ? (
                    Array.from({ length: (day.number % 3) }).map((_, i) => (
                      <div key={i} className="h-5 w-full bg-muted animate-pulse rounded-md" />
                    ))
                  ) : (
                    <>
                      {visibleEvents.map((event: any) => (
                        <div 
                          key={event.id}
                          draggable={true}
                          onDragStart={(e) => { e.stopPropagation(); handleDragStart(e, event.id) }} 
                          onClick={(e) => { e.stopPropagation(); openEventDialog(event); }}
                          className={`truncate rounded-md px-1.5 py-0.5 text-[10px] sm:text-[11px] font-medium cursor-pointer transition-all hover:scale-[1.01] active:cursor-grabbing shadow-2xs flex items-center gap-1 ${event.color || 'bg-primary text-primary-foreground'}`}
                          title={`${event.title} (${formatTime(event.start_event)})`}
                        >
                          <span className="shrink-0 font-bold opacity-85 text-[9px] sm:text-[10px]">
                            {formatTime(event.start_event)}
                          </span>
                          <span className="truncate">{event.title}</span>
                        </div>
                      ))}

                      {/* Clickable "+X lainnya" Pill */}
                      {hiddenCount > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDayModal({
                              dateStr: day.dateStr,
                              number: day.number,
                              events: day.events
                            })
                          }}
                          className="w-full rounded-md bg-muted/60 hover:bg-primary/10 hover:text-primary text-muted-foreground px-1.5 py-0.5 text-[10px] sm:text-[11px] font-semibold transition-all text-left flex items-center justify-between cursor-pointer group/more mt-0.5 border border-border/40 hover:border-primary/30"
                          title={`Lihat ${totalEvents} event pada tanggal ini`}
                        >
                          <span>+{hiddenCount} lainnya</span>
                          <span className="opacity-0 group-hover/more:opacity-100 text-[9px] text-primary transition-opacity font-bold">
                            Lihat →
                          </span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Day Events Overview Dialog (Opens when clicking "+X lainnya") */}
      {dayModal && (
        <Dialog open={!!dayModal} onOpenChange={(open) => !open && setDayModal(null)}>
          <DialogContent className="sm:max-w-[500px] p-6 max-h-[85vh] flex flex-col">
            <DialogHeader className="pb-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <CalendarDays className="size-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold tracking-tight">
                    {formatDayTitle(dayModal.dateStr, dayModal.number)}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Terdapat {dayModal.events.length} kegiatan & tugas pada hari ini
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 min-h-0 overflow-y-auto py-3 space-y-2 pr-1">
              {dayModal.events.map((event: any) => {
                const isTask = event.source === 'task' || (event.title || '').toLowerCase().includes('task')
                return (
                  <div
                    key={event.id}
                    onClick={() => {
                      setDayModal(null)
                      openEventDialog(event)
                    }}
                    className="p-3 rounded-xl border border-border/60 hover:border-primary/50 bg-card hover:bg-muted/40 transition-all cursor-pointer group flex items-start gap-3 shadow-2xs"
                  >
                    <div className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5 text-muted-foreground group-hover:text-primary transition-colors">
                      {isTask ? <CheckSquare className="size-4" /> : <Calendar className="size-4" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                          {event.title}
                        </p>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md shrink-0">
                          <Clock className="size-3" />
                          {formatTime(event.start_event)}
                        </span>
                      </div>

                      {event.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                          {cleanHtmlText(event.description)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <DialogFooter className="pt-3 border-t border-border flex flex-row items-center justify-between w-full shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDayModal(null)}
              >
                Tutup
              </Button>
              {dayModal.dateStr && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    const dateStr = dayModal.dateStr
                    setDayModal(null)
                    openEventDialog(undefined, dateStr)
                  }}
                  className="gap-1.5"
                >
                  <Plus className="size-4" />
                  Tambah Event
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
