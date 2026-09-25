import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Play, Square } from 'lucide-react'

type TimerCardProps = {
  isTracking: boolean
  elapsedTime: number
  formatTime: (s: number) => string
  currentTask: string
  setCurrentTask: (v: string) => void
  currentProject: string
  setCurrentProject: (v: string) => void
  dbProjects: any[]
  isLoadingProjects: boolean
  handleStartStop: () => void
}

export function TimerCard({
  isTracking, elapsedTime, formatTime, currentTask, setCurrentTask,
  currentProject, setCurrentProject, dbProjects, isLoadingProjects, handleStartStop
}: TimerCardProps) {
  return (
    <Card className={`border-2 shadow-lg transition-all duration-300 ${isTracking ? 'border-primary/50 shadow-primary/20' : 'border-border'}`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-6">
          <div className="w-full lg:flex-1">
            <Input 
              placeholder="What are you working on?" 
              className="text-lg bg-transparent border-0 border-b-2 border-border focus-visible:ring-0 focus-visible:border-primary rounded-none px-0"
              value={currentTask}
              onChange={(e) => setCurrentTask(e.target.value)}
              disabled={isTracking}
            />
          </div>
          
          <div className="w-full lg:w-64">
            <Select value={currentProject} onValueChange={setCurrentProject} disabled={isTracking || isLoadingProjects}>
              <SelectTrigger className="w-full border-0 border-b-2 border-border focus:ring-0 rounded-none px-0 shadow-none">
                <SelectValue placeholder={isLoadingProjects ? "Loading Projects..." : "Select Project"} />
              </SelectTrigger>
              <SelectContent>
                {dbProjects.map((p: any) => (
                  <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                ))}
                {dbProjects.length === 0 && !isLoadingProjects && (
                  <SelectItem value="none" disabled>No Projects Found</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
            <div className="flex items-center gap-3">
              <Badge variant={isTracking ? 'default' : 'secondary'} className={`px-3 py-1 text-base font-mono tabular-nums transition-colors ${isTracking ? 'animate-pulse bg-primary/20 text-primary hover:bg-primary/30' : ''}`}>
                {formatTime(elapsedTime)}
              </Badge>
            </div>
            <Button 
              size="lg" 
              variant={isTracking ? "destructive" : "default"} 
              className={`gap-2 min-w-[120px] rounded-full transition-all duration-300 ${isTracking ? 'shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'shadow-[0_0_15px_rgba(var(--primary),0.5)] hover:scale-105'}`}
              onClick={handleStartStop}
            >
              {isTracking ? <><Square className="size-5 fill-current" /> Stop</> : <><Play className="size-5 fill-current" /> Start</>}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
