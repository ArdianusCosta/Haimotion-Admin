import React from 'react'
import { Plus, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

type CalendarHeaderProps = {
  view: 'Month' | 'Week' | 'Day'
  setView: (v: 'Month' | 'Week' | 'Day') => void
  exportAllEvents: () => void
  openEventDialog: () => void
}

export function CalendarHeader({ view, setView, exportAllEvents, openEventDialog }: CalendarHeaderProps) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Apps</span><span>/</span><span className="text-foreground">Calendar</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Schedule</h1>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">Manage your meetings, events, and important deadlines.</p>
      </div>
      
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center rounded-lg border border-border bg-card p-1">
          {['Month', 'Week', 'Day'].map((v) => (
            <button 
              key={v}
              onClick={() => setView(v as any)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${view === v ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {v}
            </button>
          ))}
        </div>
        
        <Button 
          variant="outline" 
          onClick={exportAllEvents}
          className="flex items-center gap-2"
        >
          <Download className="size-4" /> Export All
        </Button>

        <button 
          onClick={() => openEventDialog()} 
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" /> New event
        </button>
      </div>
    </div>
  )
}
