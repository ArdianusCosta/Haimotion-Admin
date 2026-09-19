import { useState } from 'react'
import { financeData, formatRupiah, formatDate } from '@/lib/finance-data'
import { TrendingUp, Search, Download, Filter, Plus, PieChart as PieChartIcon } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

export function IncomePage() {
  const { t } = useLanguage()
  const [searchTerm, setSearchTerm] = useState('')

  const incomes = financeData.recentTransactions.filter(tx => tx.type === 'Income')
  
  const filteredIncomes = incomes.filter(tx => 
    tx.entity.toLowerCase().includes(searchTerm.toLowerCase()) || 
    tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalIncome = financeData.summary.totalRevenue
  const averageMonthly = totalIncome / 8 // Assuming 8 months of data so far

  // Find top category
  const topCategory = financeData.chartData.revenueBreakdown.reduce((prev, current) => 
    (prev.value > current.value) ? prev : current
  )

  return (
    <div className="flex flex-col gap-6 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Income</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track and analyze your company revenue streams.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted transition-colors">
            <Download className="size-4" /> Export
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
            <Plus className="size-4" /> Record Income
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Total Income YTD</span>
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <TrendingUp className="size-4 text-emerald-500" />
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold tracking-tight">{formatRupiah(totalIncome)}</p>
          <p className="mt-1 text-xs text-emerald-500 font-medium">
            {financeData.summary.revenueChange > 0 ? '+' : ''}{financeData.summary.revenueChange}% vs last year
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Top Category</span>
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <PieChartIcon className="size-4 text-primary" />
            </span>
          </div>
          <p className="mt-4 text-xl font-bold tracking-tight truncate">{topCategory.name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{formatRupiah(topCategory.value)} this year</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Avg. Monthly Income</span>
            <span className="flex size-8 items-center justify-center rounded-lg bg-muted">
              <TrendingUp className="size-4 text-muted-foreground" />
            </span>
          </div>
          <p className="mt-4 text-2xl font-bold tracking-tight">{formatRupiah(averageMonthly)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Based on YTD data</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="col-span-1 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-semibold mb-6">Income Breakdown</h2>
          <div className="flex flex-col h-[300px] items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={financeData.chartData.revenueBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {financeData.chartData.revenueBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatRupiah(value)}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {financeData.chartData.revenueBreakdown.map(item => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-medium">{formatRupiah(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-1 lg:col-span-2 rounded-xl border border-border bg-card shadow-sm flex flex-col">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between border-b border-border">
            <h2 className="font-semibold">Recent Income</h2>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search income..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-9 w-full sm:w-[220px] rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none hover:border-border focus:border-primary transition-colors"
                />
              </div>
              <button className="flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium hover:bg-muted transition-colors">
                <Filter className="size-4 text-muted-foreground" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium text-xs">Date</th>
                  <th className="px-5 py-3 font-medium text-xs">Description</th>
                  <th className="px-5 py-3 font-medium text-xs">Customer/Source</th>
                  <th className="px-5 py-3 font-medium text-xs">Category</th>
                  <th className="px-5 py-3 font-medium text-xs text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredIncomes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">No income records found.</td>
                  </tr>
                ) : (
                  filteredIncomes.map((tx) => (
                    <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap text-muted-foreground">{formatDate(tx.date)}</td>
                      <td className="px-5 py-4 font-medium">{tx.description}</td>
                      <td className="px-5 py-4">{tx.entity}</td>
                      <td className="px-5 py-4">
                        <span className="inline-flex rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
                          {tx.category}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-emerald-500">
                        {formatRupiah(tx.amount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
