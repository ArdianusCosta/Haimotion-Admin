import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Trash2, Loader2, Calendar as CalendarIcon } from 'lucide-react'

type EventDialogProps = {
  isDialogOpen: boolean
  setIsDialogOpen: (v: boolean) => void
  isDeleteDialogOpen: boolean
  setIsDeleteDialogOpen: (v: boolean) => void
  isSubmitting: boolean
  selectedEventId: number | null
  formData: any
  setFormData: (v: any) => void
  handleSaveEvent: (e: React.FormEvent) => void
  handleDeleteEvent: () => void
  getGoogleCalendarUrl: () => string
}

export function EventDialog({
  isDialogOpen, setIsDialogOpen,
  isDeleteDialogOpen, setIsDeleteDialogOpen,
  isSubmitting, selectedEventId,
  formData, setFormData,
  handleSaveEvent, handleDeleteEvent,
  getGoogleCalendarUrl
}: EventDialogProps) {
  return (
    <>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this event? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteEvent} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Trash2 className="mr-2 size-4" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSaveEvent}>
            <DialogHeader>
              <DialogTitle>{selectedEventId ? 'Edit Event' : 'Create New Event'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Event Title</Label>
                <Input id="title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required placeholder="E.g., Team Sync" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input id="start_date" type="date" value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="start_time">Start Time</Label>
                  <Input id="start_time" type="time" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} required />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input id="end_date" type="date" value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="end_time">End Time</Label>
                  <Input id="end_time" type="time" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} required />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="color">Color Theme</Label>
                <select 
                  id="color" 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.color} 
                  onChange={e => setFormData({...formData, color: e.target.value})}
                >
                  <option value="bg-primary text-primary-foreground">Primary (Default)</option>
                  <option value="bg-blue-500/20 text-blue-700 dark:text-blue-400">Blue</option>
                  <option value="bg-green-500/20 text-green-700 dark:text-green-400">Green</option>
                  <option value="bg-amber-500/20 text-amber-700 dark:text-amber-400">Yellow</option>
                  <option value="bg-red-500/20 text-red-700 dark:text-red-400">Red</option>
                  <option value="bg-slate-500/20 text-slate-700 dark:text-slate-400">Gray</option>
                </select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input id="description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Optional details..." />
              </div>
            </div>
            <DialogFooter className="flex flex-row justify-between w-full items-center">
              <div className="flex gap-2">
                {selectedEventId && (
                  <Button type="button" variant="destructive" size="icon" onClick={() => setIsDeleteDialogOpen(true)} disabled={isSubmitting} title="Delete Event">
                    <Trash2 className="size-4" />
                  </Button>
                )}
                {selectedEventId && (
                  <a 
                    href={getGoogleCalendarUrl()} 
                    target="_blank" 
                    rel="noreferrer"
                    title="Export to Google Calendar"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-sm font-medium hover:bg-muted hover:text-foreground transition-all outline-none"
                  >
                    <CalendarIcon className="size-4 text-blue-500" />
                  </a>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {selectedEventId ? 'Update' : 'Save'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
