import React from 'react'
import { useLanguage } from '@/components/language-provider'
import { Wallet, Receipt, CreditCard, ChevronRight, Bell } from 'lucide-react'
import { formatCurrency } from '../utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

// Static Mockup Data
const staticMonthlyData = [
  { name: 'Jan', income: 45000000, expenses: 15000000 },
  { name: 'Feb', income: 52000000, expenses: 18000000 },
  { name: 'Mar', income: 48000000, expenses: 22000000 },
  { name: 'Apr', income: 61000000, expenses: 19000000 },
  { name: 'May', income: 59000000, expenses: 25000000 },
  { name: 'Jun', income: 75000000, expenses: 21000000 },
]

const staticTransactions = [
  { id: 1, name: 'PT Global Makmur', date: 'Sep 18, 2026', amount: 15000000, isExpense: false },
  { id: 2, name: 'Sewa Kantor', date: 'Sep 15, 2026', amount: 5000000, isExpense: true },
  { id: 3, name: 'PT Sejahtera Abadi', date: 'Sep 10, 2026', amount: 8500000, isExpense: false },
  { id: 4, name: 'Pembelian Laptop', date: 'Sep 05, 2026', amount: 12000000, isExpense: true },
  { id: 5, name: 'Klien CV Maju', date: 'Sep 01, 2026', amount: 21000000, isExpense: false },
]

export function FinanceOverviewPage({ user }: { user?: any }) {
  const { t } = useLanguage()
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-primary text-white px-3 py-2 rounded-md shadow-md text-xs flex flex-col items-center">
          <span className="font-medium">{t('Income')}</span>
          <span className="font-bold text-sm">{payload[0].value.toLocaleString('id-ID')}</span>
        </div>
      )
    }
    return null
  }

  const invoiceData = [
    { name: 'Lunas', value: 75 },
    { name: 'Belum Dibayar', value: 25 },
  ]
  const COLORS = ['var(--muted)', 'var(--primary)']

  return (
    <div className="flex flex-col gap-6 pb-8 text-foreground">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-4 mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">{t('Finance Overview')}</h1>
          <p className="text-sm text-muted-foreground">{t('Monitor your financial health in real-time')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Left Column (Charts and Tables) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Main Line Chart */}
          <Card className="shadow-sm border-border bg-card rounded-2xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border p-6">
              <CardTitle className="text-lg font-bold text-foreground">{t('Income & Expenses')}</CardTitle>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-muted-foreground">{t('Income')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#7ca1b4]"></div>
                    <span className="text-muted-foreground">{t('Expenses')}</span>
                  </div>
                </div>
                <select className="text-xs border border-border rounded-md px-2 py-1 bg-background text-foreground outline-none">
                  <option>{t('This month')}</option>
                  <option>{t('This year')}</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-6">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={staticMonthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} dx={-10} tickFormatter={(value) => (value === 0 ? '0' : value.toLocaleString('id-ID'))} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '3 3' }} />
                    <Line type="monotone" dataKey="income" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="expenses" stroke="#7ca1b4" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Transactions List */}
          <Card className="shadow-sm border-border bg-card rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between p-6 pb-4">
              <CardTitle className="text-lg font-bold text-foreground">{t('Transactions')}</CardTitle>
              <button className="text-xs font-semibold text-primary hover:underline">{t('View all')}</button>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              <div className="flex flex-col">
                {staticTransactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between py-3.5 border-b border-border last:border-0 text-sm">
                    <span className={`font-medium w-1/3 ${tx.isExpense ? 'text-primary' : 'text-foreground'}`}>{tx.name}</span>
                    <span className={`w-1/3 text-center ${tx.isExpense ? 'text-primary' : 'text-muted-foreground'}`}>{tx.date}</span>
                    <span className={`font-semibold w-1/3 text-right ${tx.isExpense ? 'text-primary' : 'text-foreground'}`}>
                      Rp{tx.amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Cards and Doughnut) */}
        <div className="flex flex-col gap-6">
          
          {/* Metrics Cards */}
          <div className="flex flex-col gap-4">
            <Card className="bg-primary border-none text-primary-foreground shadow-sm rounded-2xl">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white/90">{t('Total Balance')}</p>
                  <p className="text-2xl font-bold mt-1">Rp41,293,000</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm rounded-2xl bg-card">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="bg-primary/20 p-3 rounded-xl">
                  <Receipt className="w-6 h-6 text-primary" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">{t('Unpaid Invoices')}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">7</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border shadow-sm rounded-2xl bg-card">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="bg-primary/20 p-3 rounded-xl">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-muted-foreground">{t('Total Transactions')}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">25</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoice Chart */}
          <Card className="shadow-sm border-border bg-card rounded-2xl flex-1 flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between p-6 pb-0">
              <CardTitle className="text-lg font-bold text-foreground">{t('Invoices')}</CardTitle>
              <select className="text-xs border border-border rounded-md px-2 py-1 bg-background text-foreground outline-none">
                <option>{t('This month')}</option>
              </select>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col justify-between">
              
              <div className="h-[180px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={invoiceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                      startAngle={180}
                      endAngle={0}
                    >
                      {invoiceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-[40%] left-4 text-xs font-bold text-foreground">66%</div>
                <div className="absolute top-[40%] right-4 text-xs font-bold text-foreground">34%</div>
              </div>
              
              <div className="flex justify-between items-end mt-4 mb-6">
                <div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-primary/30"></div>
                    <span className="text-xs font-semibold text-muted-foreground">{t('Paid')}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground mt-1 pl-3">3</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-xs font-semibold text-muted-foreground">{t('Unpaid')}</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground mt-1 pr-1">1</p>
                </div>
              </div>

              <Button variant="outline" className="w-full justify-between mt-auto border-border text-foreground hover:bg-muted">
                Lihat Semua Invoice
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Button>

            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
