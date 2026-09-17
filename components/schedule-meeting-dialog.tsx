'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/components/language-provider'
import { useCreateMeeting, useMeetingFormData } from '@/lib/hooks/use-meetings'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X, Check } from 'lucide-react'

export function ScheduleMeetingDialog({ 
  open, 
  onOpenChange,
  defaultValues = {}
}: { 
  open: boolean, 
  onOpenChange: (open: boolean) => void,
  defaultValues?: {
    projectId?: number,
    taskId?: number,
    moduleFlowId?: number,
  }
}) {
  const { t } = useLanguage()
  const { mutate: createMeeting, isPending } = useCreateMeeting()
  const { data: formData, isLoading } = useMeetingFormData()
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [duration, setDuration] = useState('60')
  
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([])
  
  const [projectId, setProjectId] = useState<number | undefined>(defaultValues.projectId)
  const [taskId, setTaskId] = useState<number | undefined>(defaultValues.taskId)
  const [moduleFlowId, setModuleFlowId] = useState<number | undefined>(defaultValues.moduleFlowId)

  const defaultProjectId = defaultValues.projectId
  const defaultTaskId = defaultValues.taskId
  const defaultModuleFlowId = defaultValues.moduleFlowId

  // Reset form when opened
  useEffect(() => {
    if (open) {
      setTitle('')
      setDescription('')
      setDate(new Date().toISOString().split('T')[0])
      setStartTime('09:00')
      setDuration('60')
      setSelectedParticipants([])
      setProjectId(defaultProjectId)
      setTaskId(defaultTaskId)
      setModuleFlowId(defaultModuleFlowId)
    }
  }, [open, defaultProjectId, defaultTaskId, defaultModuleFlowId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Create combined local ISO string
    const dateTime = new Date(`${date}T${startTime}`);
    
    createMeeting({
      title,
      description,
      isoDateTime: dateTime.toISOString(),
      duration: parseInt(duration),
      participants: selectedParticipants,
      projectId,
      taskId,
      moduleFlowId
    }, {
      onSuccess: () => {
        onOpenChange(false)
      }
    })
  }

  const toggleParticipant = (id: number) => {
    setSelectedParticipants(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{t('Schedule Meeting')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">{t('Title')} <span className="text-destructive">*</span></Label>
            <Input id="title" required value={title} onChange={e => setTitle(e.target.value)} placeholder="E.g., Product Sync" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('Description')}</Label>
            <Input id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional meeting agenda..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">{t('Date')} <span className="text-destructive">*</span></Label>
              <Input id="date" type="date" required value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="startTime">{t('Start Time')} <span className="text-destructive">*</span></Label>
                <Input id="startTime" type="time" required value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">{t('Duration (min)')} <span className="text-destructive">*</span></Label>
                <select 
                  id="duration" 
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={duration} 
                  onChange={e => setDuration(e.target.value)}
                >
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                  <option value="90">90 min</option>
                  <option value="120">120 min</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>{t('Participants')}</Label>
            <div className="border rounded-md p-2">
              <ScrollArea className="h-[120px]">
                {isLoading ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">Loading users...</div>
                ) : (
                  <div className="space-y-1 pr-4">
                    {formData?.users.map((user: any) => (
                      <div 
                        key={user.id} 
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-muted ${selectedParticipants.includes(user.id) ? 'bg-primary/5' : ''}`}
                        onClick={() => toggleParticipant(user.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="size-6">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="text-[10px]">{user.firstname[0]}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{user.firstname} {user.lastname}</span>
                        </div>
                        {selectedParticipants.includes(user.id) && <Check className="size-4 text-primary" />}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 pt-2 border-t mt-4">
            <div className="space-y-2">
              <Label className="text-xs">{t('Project')}</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm" value={projectId || ''} onChange={e => setProjectId(e.target.value ? parseInt(e.target.value) : undefined)}>
                <option value="">{t('None')}</option>
                {formData?.projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">{t('Task')}</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm" value={taskId || ''} onChange={e => setTaskId(e.target.value ? parseInt(e.target.value) : undefined)}>
                <option value="">{t('None')}</option>
                {formData?.tasks.map((t: any) => <option key={t.id} value={t.id}>{t.task}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">{t('Module')}</Label>
              <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm" value={moduleFlowId || ''} onChange={e => setModuleFlowId(e.target.value ? parseInt(e.target.value) : undefined)}>
                <option value="">{t('None')}</option>
                {formData?.moduleFlows.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('Cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('Scheduling...') : t('Schedule Meeting')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
