import React, { useState } from 'react'
import { FileText, TrendingUp, Scale, Clock, Activity, Download, ChevronRight, FileSpreadsheet } from 'lucide-react'
import { FinancePageHeader } from './components'
import { useFinanceOverview } from './queries'
import { Skeleton } from '@/components/ui/skeleton'

export function ReportsPage() {
  const { t } = useLanguage()
  const { isLoading } = useFinanceOverview()

  const reports = [
    {
      group: 'Financial Statements',
      items: [
        { name: 'Profit & Loss (Income Statement)', description: 'Summary of revenues, costs, and expenses', icon: TrendingUp, route: 'Profit & Loss' },
        { name: 'Balance Sheet', description: 'Snapshot of assets, liabilities, and equity', icon: Scale, route: 'Balance Sheet' },
        { name: 'Cash Flow Statement', description: 'Inflow and outflow of cash', icon: Activity, route: 'Cash Flow' },
      ]
    },
    {
      group: 'Detailed Reports',
      items: [
        { name: 'General Ledger', description: 'Detailed account transaction history', icon: FileSpreadsheet, route: 'General Ledger' },
        { name: 'Expense Report', description: 'Breakdown of all company expenses', icon: FileText, route: 'Expense Report' },
        { name: 'Revenue Report', description: 'Detailed view of income streams', icon: FileText, route: 'Revenue Report' },
      ]
    }
  ]

  return (
    <div className="flex flex-col gap-6 pb-8">
      <FinancePageHeader 
        title="Reports" 
        description="Generate and export financial reports."
      />

      <div className="grid gap-8">
        {reports.map((group, idx) => (
          <div key={idx}>
            <h2 className="text-lg font-semibold tracking-tight mb-4">{group.group}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((report, rIdx) => (
                <div key={rIdx} className="rounded-xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between h-full cursor-pointer">
                  {isLoading ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-10 rounded-lg" />
                        <Skeleton className="h-5 w-32" />
                      </div>
                      <Skeleton className="h-4 w-48 mt-2" />
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <report.icon className="size-5" />
                          </div>
                          <h3 className="font-semibold">{report.name}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground mb-4">{report.description}</p>
                      </div>
                      <div className="flex items-center justify-between border-t border-border pt-4 mt-auto">
                        <button className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors" onClick={(e) => { e.stopPropagation(); alert('PDF Download Mock'); }}>
                          <Download className="size-3" /> Export PDF
                        </button>
                        <button className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
                          View Report <ChevronRight className="size-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
