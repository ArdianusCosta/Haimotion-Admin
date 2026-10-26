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
        <DialogContent className="sm:max-w-[620px] p-6 border-border bg-card shadow-2xl">
          <form onSubmit={handleSaveEvent}>
            <DialogHeader className="pb-3 border-b border-border">
              <DialogTitle className="text-xl font-bold tracking-tight">
                {selectedEventId ? 'Edit Event' : 'Create New Event'}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {selectedEventId ? 'Perbarui detail jadwal event kalender.' : 'Tambahkan jadwal kegiatan atau event baru ke kalender.'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-5 py-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 grid gap-2">
                  <Label htmlFor="title" className="text-xs font-semibold">Nama Event / Judul</Label>
                  <Input 
                    id="title" 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    required 
                    placeholder="Contoh: Meeting Evaluasi Mingguan" 
                    className="h-10"
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="color" className="text-xs font-semibold">Warna Label</Label>
                  <select 
                    id="color" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.color} 
                    onChange={e => setFormData({...formData, color: e.target.value})}
                  >
                    <option value="bg-primary text-primary-foreground">Primary (Biru Gelap)</option>
                    <option value="bg-blue-500/20 text-blue-700 dark:text-blue-400">Blue (Biru Terang)</option>
                    <option value="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">Green (Hijau)</option>
                    <option value="bg-amber-500/20 text-amber-700 dark:text-amber-400">Amber (Kuning/Oranye)</option>
                    <option value="bg-rose-500/20 text-rose-700 dark:text-rose-400">Rose (Merah)</option>
                    <option value="bg-purple-500/20 text-purple-700 dark:text-purple-400">Purple (Ungu)</option>
                    <option value="bg-slate-500/20 text-slate-700 dark:text-slate-400">Slate (Abu-abu)</option>
                  </select>
                </div>
              </div>
              
              <div className="rounded-xl border border-border bg-muted/20 p-4 grid gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="start_date" className="text-xs font-medium text-muted-foreground">Tanggal Mulai</Label>
                    <Input 
                      id="start_date" 
                      type="date" 
                      value={formData.start_date} 
                      onChange={e => setFormData({...formData, start_date: e.target.value})} 
                      required 
                      className="bg-background h-10"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="start_time" className="text-xs font-medium text-muted-foreground">Waktu Mulai</Label>
                    <Input 
                      id="start_time" 
                      type="time" 
                      value={formData.start_time} 
                      onChange={e => setFormData({...formData, start_time: e.target.value})} 
                      required 
                      className="bg-background h-10"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="end_date" className="text-xs font-medium text-muted-foreground">Tanggal Selesai</Label>
                    <Input 
                      id="end_date" 
                      type="date" 
                      value={formData.end_date} 
                      onChange={e => setFormData({...formData, end_date: e.target.value})} 
                      required 
                      className="bg-background h-10"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="end_time" className="text-xs font-medium text-muted-foreground">Waktu Selesai</Label>
                    <Input 
                      id="end_time" 
                      type="time" 
                      value={formData.end_time} 
                      onChange={e => setFormData({...formData, end_time: e.target.value})} 
                      required 
                      className="bg-background h-10"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description" className="text-xs font-semibold">Deskripsi / Catatan Tambahan</Label>
                <textarea 
                  id="description" 
                  rows={3}
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="Detail kegiatan, link meeting, atau catatan persiapan..." 
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                />
              </div>
            </div>

            <DialogFooter className="flex flex-row justify-between w-full items-center pt-3 border-t border-border">
              <div className="flex gap-2">
                {selectedEventId && (
                  <Button type="button" variant="destructive" size="sm" onClick={() => setIsDeleteDialogOpen(true)} disabled={isSubmitting} title="Hapus Event" className="flex items-center gap-1.5">
                    <Trash2 className="size-4" />
                    <span className="hidden sm:inline">Hapus</span>
                  </Button>
                )}
                {selectedEventId && (
                  <a 
                    href={getGoogleCalendarUrl()} 
                    target="_blank" 
                    rel="noreferrer"
                    title="Export ke Google Calendar"
                    className="inline-flex h-9 px-3 items-center gap-1.5 rounded-lg border border-border bg-background text-xs font-medium hover:bg-muted hover:text-foreground transition-all outline-none"
                  >
                    <CalendarIcon className="size-4 text-blue-500" />
                    <span className="hidden sm:inline">Google Calendar</span>
                  </a>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
                <Button type="submit" disabled={isSubmitting} className="font-semibold">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {selectedEventId ? 'Perbarui Event' : 'Simpan Event'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
