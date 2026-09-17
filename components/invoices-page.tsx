import { Receipt, Plus, Search, MoreHorizontal, Download } from 'lucide-react'

const invoices = [
  { id: 'INV-2026-001', client: 'Acme Corp', date: 'Sep 01, 2026', dueDate: 'Sep 15, 2026', amount: '$4,500.00', status: 'Paid' },
  { id: 'INV-2026-002', client: 'Globex Inc', date: 'Sep 03, 2026', dueDate: 'Sep 17, 2026', amount: '$1,200.00', status: 'Pending' },
  { id: 'INV-2026-003', client: 'Soylent Corp', date: 'Aug 28, 2026', dueDate: 'Sep 11, 2026', amount: '$3,400.00', status: 'Overdue' },
  { id: 'INV-2026-004', client: 'Initech', date: 'Aug 25, 2026', dueDate: 'Sep 08, 2026', amount: '$850.00', status: 'Paid' },
]

export function InvoicesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
          <p className="text-sm text-muted-foreground">Manage billing and invoices for your clients.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search invoices..." 
              className="h-9 w-[200px] rounded-md border border-border bg-card pl-9 pr-3 text-sm outline-none focus:border-primary transition-colors"
            />
          </div>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="size-4" /> Create Invoice
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Invoice Number</th>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Issue Date</th>
                <th className="px-5 py-3 font-medium">Due Date</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-4 font-medium flex items-center gap-2">
                    <Receipt className="size-4 text-muted-foreground" />
                    {inv.id}
                  </td>
                  <td className="px-5 py-4 font-medium">{inv.client}</td>
                  <td className="px-5 py-4 text-muted-foreground">{inv.date}</td>
                  <td className="px-5 py-4 text-muted-foreground">{inv.dueDate}</td>
                  <td className="px-5 py-4 font-medium">{inv.amount}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-medium ${
                      inv.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-500' : 
                      inv.status === 'Pending' ? 'bg-amber-500/10 text-amber-500' : 
                      'bg-rose-500/10 text-rose-500'
                    }`}>
                      {inv.status}
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
