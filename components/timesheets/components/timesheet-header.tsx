import React from 'react'
import { Calendar, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function TimesheetHeader() {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Timesheets</h1>
        <p className="text-muted-foreground mt-1">Track your time, analyze productivity, and manage billable hours.</p>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="outline" className="gap-2"><Calendar className="size-4" /> This Week</Button>
        <Button className="gap-2"><Plus className="size-4" /> Manual Entry</Button>
      </div>
    </div>
  )
}
