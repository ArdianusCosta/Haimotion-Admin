import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Clock, Briefcase, Timer } from 'lucide-react'

type StatsWidgetsProps = {
  totalWeeklyHours: string
  totalBillable: string
}

export function StatsWidgets({ totalWeeklyHours, totalBillable }: StatsWidgetsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><Clock className="size-6" /></div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Time (This Week)</p>
            <h3 className="text-2xl font-bold">{totalWeeklyHours}</h3>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 bg-green-500/10 text-green-500 rounded-xl"><Briefcase className="size-6" /></div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Billable Amount</p>
            <h3 className="text-2xl font-bold">{totalBillable}</h3>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardContent className="p-6 flex items-center gap-4">
          <div className="p-3 bg-orange-500/10 text-orange-500 rounded-xl"><Timer className="size-6" /></div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Productivity Score</p>
            <h3 className="text-2xl font-bold">100%</h3>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
