'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useLanguage } from '@/components/language-provider'
import { useCreateMeeting, useMeetingFormData } from '@/hooks/use-meetings'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { X, Check, Globe, Lock, Clock, Users } from 'lucide-react'

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
  const [joinPolicy, setJoinPolicy] = useState<'PUBLIC_LINK' | 'INVITED_ONLY'>('PUBLIC_LINK')
  const [waitingRoom, setWaitingRoom] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [showPasscode, setShowPasscode] = useState(false)
  const [projectId, setProjectId] = useState<number | undefined>(defaultValues.projectId)
  const [taskId, setTaskId] = useState<number | undefined>(defaultValues.taskId)
  const [moduleFlowId, setModuleFlowId] = useState<number | undefined>(defaultValues.moduleFlowId)

  useEffect(() => {
    if (open) {
      setTitle('')
      setDescription('')
      setDate(new Date().toISOString().split('T')[0])
      setStartTime('09:00')
      setDuration('60')
      setSelectedParticipants([])
      setJoinPolicy('PUBLIC_LINK')
      setWaitingRoom(false)
      setPasscode('')
      setShowPasscode(false)
      setProjectId(defaultValues.projectId)
      setTaskId(defaultValues.taskId)
      setModuleFlowId(defaultValues.moduleFlowId)
    }
  }, [open, defaultValues.projectId, defaultValues.taskId, defaultValues.moduleFlowId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const dateTime = new Date(`${date}T${startTime}`)
    createMeeting({
      title,
      description,
      isoDateTime: dateTime.toISOString(),
      duration: parseInt(duration),
      participants: selectedParticipants,
      joinPolicy,
      waitingRoom,
      passcode: showPasscode && passcode ? passcode : undefined,
      projectId,
      taskId,
      moduleFlowId
    }, {
      onSuccess: () => onOpenChange(false)
    })
  }

  const toggleParticipant = (id: number) => {
    setSelectedParticipants(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">{t('Schedule Meeting')}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Create a new meeting and invite participants
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0">
          <form id="meeting-form" onSubmit={handleSubmit} className="px-6 py-4 space-y-5">
            {/* Title & Description */}
            <div className="space-y-2">
              <Label htmlFor="mtg-title">{t('Title')} <span className="text-destructive">*</span></Label>
              <Input id="mtg-title" required value={title} onChange={e => setTitle(e.target.value)} placeholder="E.g., Weekly Sync" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mtg-description">{t('Description')}</Label>
              <Textarea id="mtg-description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional agenda or notes..." rows={2} className="resize-none" />
            </div>

            {/* Date, Time, Duration */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="mtg-date">{t('Date')} <span className="text-destructive">*</span></Label>
                <Input id="mtg-date" type="date" required value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mtg-time">{t('Start Time')} <span className="text-destructive">*</span></Label>
                <Input id="mtg-time" type="time" required value={startTime} onChange={e => setStartTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mtg-duration">
                  <span className="flex items-center gap-1"><Clock className="size-3" />{t('Duration')}</span>
                </Label>
                <select id="mtg-duration" className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus:outline-none focus:ring-2 focus:ring-ring" value={duration} onChange={e => setDuration(e.target.value)}>
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                  <option value="90">90 min</option>
                  <option value="120">2 hours</option>
                  <option value="180">3 hours</option>
                </select>
              </div>
            </div>

            <Separator />

            {/* Security Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">Meeting Security</h3>

              {/* Join Policy */}
              <div className="space-y-2">
                <Label>Join Policy</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setJoinPolicy('PUBLIC_LINK')}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors text-left ${joinPolicy === 'PUBLIC_LINK' ? 'border-primary bg-primary/5 text-primary' : 'border-input hover:bg-muted/50'}`}
                  >
                    <Globe className="size-4 shrink-0" />
                    <div>
                      <div className="font-medium">Anyone with link</div>
                      <div className="text-xs text-muted-foreground">Anyone can join</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setJoinPolicy('INVITED_ONLY')}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors text-left ${joinPolicy === 'INVITED_ONLY' ? 'border-primary bg-primary/5 text-primary' : 'border-input hover:bg-muted/50'}`}
                  >
                    <Lock className="size-4 shrink-0" />
                    <div>
                      <div className="font-medium">Invited only</div>
                      <div className="text-xs text-muted-foreground">Only invited members</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Waiting Room */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Waiting Room</div>
                  <div className="text-xs text-muted-foreground">Admit participants one by one</div>
                </div>
                <Switch checked={waitingRoom} onCheckedChange={setWaitingRoom} id="waiting-room" />
              </div>

              {/* Passcode */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Meeting Passcode</div>
                  <div className="text-xs text-muted-foreground">Require a code to join</div>
                </div>
                <Switch checked={showPasscode} onCheckedChange={setShowPasscode} id="passcode-toggle" />
              </div>
              {showPasscode && (
                <Input
                  value={passcode}
                  onChange={e => setPasscode(e.target.value)}
                  placeholder="Enter passcode..."
                  className="mt-1"
                />
              )}
            </div>

            <Separator />

            {/* Participants */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Users className="size-3" />
                {t('Participants')}
                {selectedParticipants.length > 0 && (
                  <span className="ml-1 bg-primary text-primary-foreground text-xs rounded-full px-1.5 py-0.5">{selectedParticipants.length}</span>
                )}
              </Label>
              <div className="border rounded-lg overflow-hidden">
                <ScrollArea className="h-[130px]">
                  {isLoading ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">Loading users...</div>
                  ) : (
                    <div className="divide-y">
                      {formData?.users.map((user: any) => {
                        // Extract a better fallback if name starts with [
                        const cleanName = user.firstname?.replace(/^\[.*?\]\s*/, '') || user.firstname;
                        const fallbackChar = cleanName ? cleanName[0] : '?';
                        return (
                          <div
                            key={user.id}
                            className={`flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors ${selectedParticipants.includes(user.id) ? 'bg-primary/5' : ''}`}
                            onClick={() => toggleParticipant(user.id)}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="size-7">
                                <AvatarImage src={user.avatar} />
                                <AvatarFallback className="text-[10px]">{fallbackChar}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-sm font-medium">{user.firstname} {user.lastname}</div>
                                <div className="text-xs text-muted-foreground">{user.email}</div>
                              </div>
                            </div>
                            {selectedParticipants.includes(user.id)
                              ? <div className="size-5 rounded-full bg-primary flex items-center justify-center"><Check className="size-3 text-primary-foreground" /></div>
                              : <div className="size-5 rounded-full border border-input" />
                            }
                          </div>
                        )
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>

            {/* Optional context */}
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t('Project')}</Label>
                <select className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-xs focus:outline-none" value={projectId || ''} onChange={e => setProjectId(e.target.value ? parseInt(e.target.value) : undefined)}>
                  <option value="">{t('None')}</option>
                  {formData?.projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t('Task')}</Label>
                <select className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-xs focus:outline-none" value={taskId || ''} onChange={e => setTaskId(e.target.value ? parseInt(e.target.value) : undefined)}>
                  <option value="">{t('None')}</option>
                  {formData?.tasks.map((t: any) => <option key={t.id} value={t.id}>{t.task}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">{t('Module')}</Label>
                <select className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 py-1 text-xs shadow-xs focus:outline-none" value={moduleFlowId || ''} onChange={e => setModuleFlowId(e.target.value ? parseInt(e.target.value) : undefined)}>
                  <option value="">{t('None')}</option>
                  {formData?.moduleFlows.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>
          </form>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-muted/30">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t('Cancel')}
          </Button>
          <Button type="submit" form="meeting-form" disabled={isPending}>
            {isPending ? 'Scheduling...' : t('Schedule Meeting')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
