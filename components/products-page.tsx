'use client'

import { useMemo, useState } from 'react'
import { Plus, Search, ChevronDown, MoreHorizontal, Package, Tag, ArrowUpRight, ArrowDownRight, AlertCircle, ImageIcon, Download } from 'lucide-react'

const products = [
  { id: 'PRD-001', name: 'Aurora Headphones', category: 'Electronics', price: '$124.00', stock: 145, status: 'Active' },
  { id: 'PRD-002', name: 'Nimbus Keyboard', category: 'Electronics', price: '$86.00', stock: 42, status: 'Active' },
  { id: 'PRD-003', name: 'Orbit Desk Lamp', category: 'Home', price: '$41.00', stock: 0, status: 'Out of stock' },
  { id: 'PRD-004', name: 'Echo Smart Speaker', category: 'Electronics', price: '$99.00', stock: 12, status: 'Low stock' },
  { id: 'PRD-005', name: 'Zenith Office Chair', category: 'Furniture', price: '$349.00', stock: 85, status: 'Active' },
  { id: 'PRD-006', name: 'Lumina Study Lamp', category: 'Home', price: '$32.00', stock: 214, status: 'Active' },
  { id: 'PRD-007', name: 'Pulse Fitness Tracker', category: 'Wearables', price: '$149.00', stock: 4, status: 'Low stock' },
  { id: 'PRD-008', name: 'Apex Gaming Mouse', category: 'Electronics', price: '$59.00', stock: 0, status: 'Draft' },
]

const statusStyles: Record<string, string> = { 
  'Active': 'bg-primary/10 text-primary', 
  'Low stock': 'bg-chart-4/15 text-foreground', 
  'Out of stock': 'bg-destructive/15 text-destructive', 
  'Draft': 'bg-muted text-muted-foreground' 
}

export function ProductsPage() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All products')
  
  const filtered = useMemo(() => products.filter((product) => 
    product.name.toLowerCase().includes(query.toLowerCase()) && 
    (filter === 'All products' || product.status === filter || product.category === filter)
  ), [query, filter])

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Workspace</span><span>/</span><span className="text-foreground">Products</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Products</h1>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">Manage your inventory, pricing, and product details.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-muted"><Download className="size-4" />Export</button>
          <button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"><Plus className="size-4" />Add product</button>
        </div>
      </div>
      
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Total products', '142', '+12 this week', ArrowUpRight, Package], 
          ['Active items', '118', '+8 this week', ArrowUpRight, Tag], 
          ['Low stock', '14', '-2 from last week', ArrowDownRight, AlertCircle], 
          ['Out of stock', '3', '+1 from yesterday', ArrowUpRight, AlertCircle]
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
            <h2 className="font-semibold">Inventory</h2>
            <p className="mt-1 text-xs text-muted-foreground">View and manage all products in your store.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 sm:w-64">
              <Search className="size-4 text-muted-foreground" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products..." className="w-full bg-transparent text-sm outline-none" />
            </div>
            <div className="relative">
              <select value={filter} onChange={(e) => setFilter(e.target.value)} className="h-full min-w-36 appearance-none rounded-lg border border-border bg-background px-3 py-2 pr-8 text-sm outline-none">
                <option>All products</option>
                <option>Active</option>
                <option>Low stock</option>
                <option>Out of stock</option>
                <option>Draft</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left text-xs">
            <thead className="border-b border-border bg-muted/35 text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Product</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Inventory</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Price</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id} className="border-b border-border last:border-0 hover:bg-muted/25">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                        <ImageIcon className="size-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{product.name}</p>
                        <p className="mt-0.5 text-muted-foreground">{product.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${statusStyles[product.status] || statusStyles['Draft']}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={product.stock === 0 ? 'text-destructive font-medium' : product.stock < 15 ? 'text-chart-4 font-medium' : 'text-muted-foreground'}>
                      {product.stock} in stock
                    </span>
                  </td>
                  <td className="px-5 py-4 text-muted-foreground">{product.category}</td>
                  <td className="px-5 py-4 font-medium">{product.price}</td>
                  <td className="px-5 py-4 text-right">
                    <button className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`More options for ${product.name}`}>
                      <MoreHorizontal className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-12 text-center text-sm text-muted-foreground">
              No products match your search.
            </div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-border px-5 py-4 text-xs text-muted-foreground">
          <span>Showing {filtered.length} of 142 products</span>
          <div className="flex items-center gap-2">
            <button className="rounded-lg border border-border px-3 py-2 hover:bg-muted">Previous</button>
            <button className="rounded-lg border border-border px-3 py-2 hover:bg-muted">Next</button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ProductsPage
