import { DollarSign, ArrowUpRight, ArrowDownRight, MoreHorizontal, Download, Filter } from 'lucide-react'

const transactions = [
  { id: 'TX-9871', date: 'Sep 07, 2026', description: 'Software Subscription', amount: '-$120.00', status: 'Completed', type: 'Expense' },
  { id: 'TX-9872', date: 'Sep 06, 2026', description: 'Client Payment - ACME Corp', amount: '+$4,500.00', status: 'Completed', type: 'Income' },
  { id: 'TX-9873', date: 'Sep 05, 2026', description: 'Office Supplies', amount: '-$45.50', status: 'Completed', type: 'Expense' },
  { id: 'TX-9874', date: 'Sep 04, 2026', description: 'Server Hosting (AWS)', amount: '-$340.00', status: 'Pending', type: 'Expense' },
  { id: 'TX-9875', date: 'Sep 02, 2026', description: 'Consulting Fee - TechCorp', amount: '+$2,100.00', status: 'Completed', type: 'Income' },
]

export function TransactionsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground">Manage and view your recent financial transactions.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted transition-colors">
            <Filter className="size-4" /> Filter
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Download className="size-4" /> Export CSV
          </button>
        </div>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Income</span>
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <ArrowUpRight className="size-4 text-emerald-500" />
            </span>
          </div>
          <p className="mt-4 text-2xl font-semibold tracking-tight">$6,600.00</p>
          <p className="mt-1 text-xs text-muted-foreground">+12% from last month</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Expenses</span>
            <span className="flex size-8 items-center justify-center rounded-lg bg-rose-500/10">
              <ArrowDownRight className="size-4 text-rose-500" />
            </span>
          </div>
          <p className="mt-4 text-2xl font-semibold tracking-tight">$505.50</p>
          <p className="mt-1 text-xs text-muted-foreground">-2% from last month</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Net Profit</span>
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <DollarSign className="size-4 text-primary" />
            </span>
          </div>
          <p className="mt-4 text-2xl font-semibold tracking-tight">$6,094.50</p>
          <p className="mt-1 text-xs text-muted-foreground">+8% from last month</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Transaction ID</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4 font-medium">{tx.id}</td>
                  <td className="px-5 py-4 text-muted-foreground">{tx.date}</td>
                  <td className="px-5 py-4">{tx.description}</td>
                  <td className={`px-5 py-4 font-medium ${tx.type === 'Income' ? 'text-emerald-500' : ''}`}>{tx.amount}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-medium ${tx.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
