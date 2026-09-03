'use client'

import { useMemo, useState } from 'react'
import { Search, ChevronDown, MoreHorizontal, Users, UserPlus, ArrowUpRight, ArrowDownRight, Download, Mail, Activity, Star } from 'lucide-react'

const customers = [
  { id: 'CUS-1029', name: 'Olivia Martin', email: 'olivia.martin@email.com', orders: 12, spent: '$1,420.00', lastOrder: 'Aug 31, 2026', status: 'Active' },
  { id: 'CUS-1028', name: 'Liam Chen', email: 'liam.chen@email.com', orders: 8, spent: '$2,840.00', lastOrder: 'Aug 31, 2026', status: 'Active' },
  { id: 'CUS-1027', name: 'Ava Williams', email: 'ava.williams@email.com', orders: 3, spent: '$286.00', lastOrder: 'Aug 30, 2026', status: 'Active' },
  { id: 'CUS-1026', name: 'Noah Smith', email: 'noah.smith@email.com', orders: 1, spent: '$420.00', lastOrder: 'Aug 30, 2026', status: 'New' },
  { id: 'CUS-1025', name: 'Mia Johnson', email: 'mia.johnson@email.com', orders: 5, spent: '$864.00', lastOrder: 'Aug 14, 2026', status: 'Inactive' },
  { id: 'CUS-1024', name: 'Ethan Brown', email: 'ethan.brown@email.com', orders: 18, spent: '$4,120.00', lastOrder: 'Aug 12, 2026', status: 'VIP' },
  { id: 'CUS-1023', name: 'Sophia Davis', email: 'sophia.davis@email.com', orders: 2, spent: '$142.00', lastOrder: 'Jul 28, 2026', status: 'Inactive' },
]

const statusStyles: Record<string, string> = { 
  'Active': 'bg-primary/10 text-primary', 
  'New': 'bg-chart-2/15 text-foreground', 
  'VIP': 'bg-chart-3/15 text-foreground', 
  'Inactive': 'bg-muted text-muted-foreground' 
}

// Function to generate initials and colors for avatars
function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2)
}

function getAvatarColor(name: string) {
  const colors = ['bg-primary text-primary-foreground', 'bg-chart-1 text-primary-foreground', 'bg-chart-2 text-primary-foreground', 'bg-chart-3 text-primary-foreground', 'bg-chart-4 text-primary-foreground']
  const index = name.length % colors.length
  return colors[index]
}

export function CustomersPage() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All customers')
  
  const filtered = useMemo(() => customers.filter((customer) => 
    (customer.name.toLowerCase().includes(query.toLowerCase()) || customer.email.toLowerCase().includes(query.toLowerCase())) && 
    (filter === 'All customers' || customer.status === filter)
  ), [query, filter])

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Workspace</span><span>/</span><span className="text-foreground">Customers</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Customers</h1>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Manage your client base, view purchase history and contact info.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-muted"><Download className="size-4" />Export</button>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"><UserPlus className="size-4" />Add customer</button>
        </div>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total customers', '2,842', '+128 this month', ArrowUpRight, Users], 
          ['Active users', '1,920', '+84 this month', ArrowUpRight, Activity], 
          ['VIP accounts', '145', '+12 this month', ArrowUpRight, Star], 
          ['Churn rate', '2.4%', '-0.2% from last month', ArrowDownRight, Users]
        ].map(([label, value, detail, Arrow, Icon], i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{label as string}</span>
              <span className="flex size-8 items-center justify-center rounded-lg bg-muted">
                <Icon className="size-4 text-primary" />
              </span>
            </div>
            <p className="mt-4 text-2xl font-semibold tracking-tight">{value as string}</p>
            <p className="mt-2 flex items-center gap-1 text-xs text-primary">
              <Arrow className="size-3" />{detail as string}
            </p>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-col justify-between gap-4 border-b border-border p-5 md:flex-row md:items-center">
          <div>
            <h2 className="font-semibold">Customer directory</h2>
            <p className="mt-1 text-xs text-muted-foreground">All registered users and guest checkout records.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 sm:w-64">
              <Search className="size-4 text-muted-foreground" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customers..." className="w-full bg-transparent text-sm outline-none" />
            </div>
            <div className="relative">
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="h-full min-w-36 appearance-none rounded-lg border border-border bg-background px-3 py-2 pr-8 text-sm outline-none">
                <option>All customers</option>
                <option>Active</option>
                <option>New</option>
                <option>VIP</option>
                <option>Inactive</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-xs">
            <thead className="border-b border-border bg-muted/35 text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Total Orders</th>
                <th className="px-5 py-3 font-medium">Total Spent</th>
                <th className="px-5 py-3 font-medium">Last Order</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => (
                <tr key={customer.id} className="border-b border-border last:border-0 hover:bg-muted/25">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${getAvatarColor(customer.name)}`}>
                        {getInitials(customer.name)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{customer.name}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-muted-foreground">
                          <Mail className="size-3" /> {customer.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${statusStyles[customer.status] || statusStyles['Inactive']}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-medium">
                    {customer.orders}
                  </td>
                  <td className="px-5 py-4 font-medium">
                    {customer.spent}
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{customer.lastOrder}</td>
                  <td className="px-5 py-4 text-right">
                    <button className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`More options for ${customer.name}`}>
                      <MoreHorizontal className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-12 text-center text-sm text-muted-foreground">
              No customers match your search.
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border px-5 py-4 text-xs text-muted-foreground">
          <span>Showing {filtered.length} of 2,842 customers</span>
          <div className="flex items-center gap-2">
            <button className="rounded-lg border border-border px-3 py-2 hover:bg-muted">Previous</button>
            <button className="rounded-lg border border-border px-3 py-2 hover:bg-muted">Next</button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default CustomersPage
