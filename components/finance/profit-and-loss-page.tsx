import { useState } from 'react'
import { financeData, formatRupiah } from '@/lib/finance-data'
import { Download, Printer, Filter, Calendar as CalendarIcon, ChevronDown, ChevronRight } from 'lucide-react'

export function ProfitAndLossPage() {
  const [dateRange, setDateRange] = useState('This Year')
  
  // States for expandable rows
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    'Revenue': true,
    'Expenses': true,
  })

  const toggleRow = (row: string) => setExpanded(prev => ({ ...prev, [row]: !prev[row] }))

  // Dummy P&L Data structure
  const revenueTotal = financeData.summary.totalRevenue
  const cogsTotal = 150000000 // Dummy
  const grossProfit = revenueTotal - cogsTotal
  const expensesTotal = financeData.summary.totalExpenses
  const operatingProfit = grossProfit - expensesTotal
  const taxExpense = 45000000 // Dummy
  const netProfit = operatingProfit - taxExpense

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Profit & Loss</h1>
          <p className="mt-1 text-sm text-muted-foreground">Income statement summary.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted transition-colors">
            <Printer className="size-4" /> Print
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted transition-colors">
            <Download className="size-4" /> Export CSV
          </button>
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="h-9 w-[180px] appearance-none rounded-lg border border-border bg-card pl-9 pr-8 text-sm outline-none hover:bg-muted focus:border-primary transition-colors font-medium"
            >
              <option>This Month</option>
              <option>This Quarter</option>
              <option>This Year</option>
              <option>Last Year</option>
            </select>
            <CalendarIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between bg-muted/40 p-5 border-b border-border">
          <h2 className="font-semibold text-lg">Income Statement</h2>
          <span className="text-sm font-medium text-muted-foreground">For the period: Jan 1, 2026 - Sep 7, 2026</span>
        </div>
        
        <div className="p-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-5 py-3 font-medium">Account</th>
                <th className="px-5 py-3 font-medium text-right w-1/3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {/* REVENUE */}
              <tr className="border-b border-border hover:bg-muted/20 cursor-pointer" onClick={() => toggleRow('Revenue')}>
                <td className="px-5 py-4 font-semibold flex items-center gap-2">
                  {expanded['Revenue'] ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                  Revenue
                </td>
                <td className="px-5 py-4 font-semibold text-right">{formatRupiah(revenueTotal)}</td>
              </tr>
              {expanded['Revenue'] && financeData.chartData.revenueBreakdown.map((item, idx) => (
                <tr key={idx} className="border-b border-border/50 hover:bg-muted/10">
                  <td className="px-5 py-3 pl-12 text-muted-foreground">{item.name}</td>
                  <td className="px-5 py-3 text-right">{formatRupiah(item.value)}</td>
                </tr>
              ))}

              {/* COGS */}
              <tr className="border-b border-border hover:bg-muted/20">
                <td className="px-5 py-4 font-semibold pl-12">Cost of Goods Sold</td>
                <td className="px-5 py-4 text-right">{formatRupiah(cogsTotal)}</td>
              </tr>
              
              {/* GROSS PROFIT */}
              <tr className="border-b-2 border-border bg-muted/10">
                <td className="px-5 py-4 font-bold">Gross Profit</td>
                <td className="px-5 py-4 font-bold text-right text-emerald-500">{formatRupiah(grossProfit)}</td>
              </tr>

              {/* EXPENSES */}
              <tr className="border-b border-border hover:bg-muted/20 cursor-pointer" onClick={() => toggleRow('Expenses')}>
                <td className="px-5 py-4 font-semibold flex items-center gap-2">
                  {expanded['Expenses'] ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                  Operating Expenses
                </td>
                <td className="px-5 py-4 font-semibold text-right">{formatRupiah(expensesTotal)}</td>
              </tr>
              {expanded['Expenses'] && financeData.chartData.expenseBreakdown.map((item, idx) => (
                <tr key={idx} className="border-b border-border/50 hover:bg-muted/10">
                  <td className="px-5 py-3 pl-12 text-muted-foreground">{item.name}</td>
                  <td className="px-5 py-3 text-right">{formatRupiah(item.value)}</td>
                </tr>
              ))}

              {/* OPERATING PROFIT */}
              <tr className="border-b-2 border-border bg-muted/10">
                <td className="px-5 py-4 font-bold">Operating Profit</td>
                <td className="px-5 py-4 font-bold text-right text-emerald-500">{formatRupiah(operatingProfit)}</td>
              </tr>

              {/* TAXES */}
              <tr className="border-b border-border hover:bg-muted/20">
                <td className="px-5 py-4 font-semibold pl-12">Income Tax Expense</td>
                <td className="px-5 py-4 text-right">{formatRupiah(taxExpense)}</td>
              </tr>

              {/* NET PROFIT */}
              <tr className="bg-primary/5 text-primary">
                <td className="px-5 py-5 text-lg font-bold">Net Profit</td>
                <td className="px-5 py-5 text-lg font-bold text-right">{formatRupiah(netProfit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
