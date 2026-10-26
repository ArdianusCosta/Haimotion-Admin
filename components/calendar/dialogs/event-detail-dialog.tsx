import React from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Clock,
  ExternalLink,
  CheckSquare,
  FolderKanban,
  Video,
  PhoneCall,
  Palmtree,
  CalendarDays,
  FileText
} from 'lucide-react'

export function cleanHtmlText(text?: string | null): string {
  if (!text) return ''
  const decoded = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
  return decoded.replace(/<[^>]*>?/gm, '').trim()
}

type EventDetailDialogProps = {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  event: any | null
}

export function EventDetailDialog({
  isOpen,
  onOpenChange,
  event
}: EventDetailDialogProps) {
  const router = useRouter()

  if (!event) return null

  const source = event.source || 'calendar'
  const startDate = new Date(event.start_event)
  const endDate = new Date(event.end_event)
  const isSameDay = startDate.toDateString() === endDate.toDateString()

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  const formatDate = (d: Date) =>
    d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })

  const getSourceConfig = () => {
    switch (source) {
      case 'task':
        return {
          label: 'Task',
          icon: <CheckSquare className="size-4 text-indigo-400" />,
          badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
          moduleName: 'Tasks',
          actionText: 'Buka di Modul Tasks',
          actionRoute: '/tasks',
          secondaryText: 'Lihat di Kanban',
          secondaryRoute: '/kanban'
        }
      case 'project':
        return {
          label: 'Project Timeline',
          icon: <FolderKanban className="size-4 text-emerald-400" />,
          badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          moduleName: 'Project Management',
          actionText: 'Buka Detail Project',
          actionRoute: event.original_id ? `/project/${event.original_id}` : '/project'
        }
      case 'meeting':
        return {
          label: 'Meeting',
          icon: <Video className="size-4 text-cyan-400" />,
          badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
          moduleName: 'Meetings',
          actionText: 'Buka Jadwal Meetings',
          actionRoute: '/meetings'
        }
      case 'crm':
        return {
          label: 'CRM Follow-up',
          icon: <PhoneCall className="size-4 text-rose-400" />,
          badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
          moduleName: 'CRM',
          actionText: 'Buka Modul CRM',
          actionRoute: '/crm/follow-ups'
        }
      case 'leave':
        return {
          label: 'HR Leave',
          icon: <Palmtree className="size-4 text-amber-400" />,
          badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
          moduleName: 'HR Management',
          actionText: 'Buka HR Leaves',
          actionRoute: '/hr/attendance'
        }
      default:
        return {
          label: 'Calendar Event',
          icon: <CalendarDays className="size-4 text-primary" />,
          badgeColor: 'bg-primary/10 text-primary border-primary/30',
          moduleName: 'Calendar',
          actionText: null,
          actionRoute: null
        }
    }
  }

  const config = getSourceConfig()
  const cleanedDesc = cleanHtmlText(event.description)

  const handleNavigate = (route: string) => {
    onOpenChange(false)
    router.push(route)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] p-6 border-border bg-card shadow-2xl">
        <DialogHeader className="gap-2 pb-2 border-b border-border">
          <div className="flex items-center justify-between">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.badgeColor}`}
            >
              {config.icon}
              {config.label}
            </span>
            {event.original_id && (
              <span className="text-xs text-muted-foreground font-mono">
                ID: #{event.original_id}
              </span>
            )}
          </div>
          <DialogTitle className="text-xl font-bold tracking-tight text-foreground text-left mt-1">
            {event.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground text-left">
            Item ini disinkronkan langsung dari modul {config.moduleName}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Time & Date Card */}
          <div className="rounded-xl border border-border bg-muted/20 p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Calendar className="size-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground">Tanggal</span>
                <span className="text-sm font-semibold text-foreground">
                  {isSameDay
                    ? formatDate(startDate)
                    : `${startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${formatDate(endDate)}`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Clock className="size-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground">Waktu</span>
                <span className="text-sm font-semibold text-foreground">
                  {formatTime(startDate)} - {formatTime(endDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="rounded-xl border border-border bg-background p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <FileText className="size-3.5" />
              Deskripsi & Catatan
            </div>
            {cleanedDesc ? (
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">
                {cleanedDesc}
              </p>
            ) : (
              <p className="text-xs italic text-muted-foreground">
                Tidak ada deskripsi tambahan untuk item ini.
              </p>
            )}
          </div>

          {/* Module Synchronization Info Box */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground flex items-start gap-2.5">
            <span className="text-primary text-base">ℹ️</span>
            <div>
              <p className="font-medium text-foreground">
                Dikelola di Modul {config.moduleName}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Perubahan status, deadline, anggota tim, dan detail item ini diatur langsung melalui modul asalnya agar tetap sinkron ke seluruh sistem.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-2 pt-2 border-t border-border w-full">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Tutup
          </Button>

          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            {config.secondaryRoute && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleNavigate(config.secondaryRoute!)}
                className="w-full sm:w-auto"
              >
                {config.secondaryText}
              </Button>
            )}

            {config.actionRoute && (
              <Button
                type="button"
                onClick={() => handleNavigate(config.actionRoute!)}
                className="w-full sm:w-auto flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                <ExternalLink className="size-4" />
                {config.actionText}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
