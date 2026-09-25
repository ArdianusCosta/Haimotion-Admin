import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { History, Search, Filter, CheckCircle2, AlertCircle, PlayCircle, Download, MoreHorizontal, Edit2, Trash2 } from 'lucide-react'

type TimesheetLogProps = {
  entries: any[]
}

export function TimesheetLog({ entries }: TimesheetLogProps) {
  return (
    <Card className="flex-1">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2"><History className="size-5" /> Recent Entries</CardTitle>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search entries..." className="pl-8 w-[200px] h-9" />
          </div>
          <Button variant="outline" size="sm" className="h-9 gap-2"><Filter className="size-4" /> Filter</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-medium rounded-tl-lg">Task Description</th>
                <th className="px-4 py-3 font-medium">Project</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Time Window</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Billable</th>
                <th className="px-4 py-3 font-medium text-right rounded-tr-lg">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No timesheet entries yet. Start the timer to create one!
                  </td>
                </tr>
              ) : (
                entries.map((entry, idx) => (
                  <tr key={entry.id} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${idx === entries.length - 1 ? 'border-b-0' : ''}`}>
                    <td className="px-4 py-4 font-medium">{entry.task}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full bg-primary" />
                        {entry.project}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{entry.date}</td>
                    <td className="px-4 py-4 text-muted-foreground">{entry.startTime} - {entry.endTime}</td>
                    <td className="px-4 py-4 font-semibold">{entry.duration}</td>
                    <td className="px-4 py-4">
                      {entry.billable ? (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 gap-1">
                          <CheckCircle2 className="size-3" /> Yes
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-muted text-muted-foreground gap-1">
                          <AlertCircle className="size-3" /> No
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {entry.videoUrl && (
                          <>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10" title="Preview Recording">
                                  <PlayCircle className="size-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[700px] bg-card p-0 overflow-hidden border-0">
                                <DialogHeader className="p-4 border-b border-border/50 bg-muted/20">
                                  <DialogTitle>Recording: {entry.task}</DialogTitle>
                                </DialogHeader>
                                <video src={entry.videoUrl} controls autoPlay className="w-full max-h-[70vh] object-contain bg-black" />
                              </DialogContent>
                            </Dialog>
                            <a href={entry.videoUrl} download={`recording-${entry.task.replace(/\s+/g, '-').toLowerCase()}.webm`}>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10" title="Download Recording">
                                <Download className="size-4" />
                              </Button>
                            </a>
                          </>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="size-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem><Edit2 className="size-4 mr-2" /> Edit Entry</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-500"><Trash2 className="size-4 mr-2" /> Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
