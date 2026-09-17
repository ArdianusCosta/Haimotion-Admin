import React, { useState } from 'react'
import { Plus, Search, Filter, Wallet, Landmark, Banknote } from 'lucide-react'
import { FinancePageHeader } from './components'
import { TransactionModal } from './components/modals'
import { useBankAccounts, useTransactions, useCreateTransaction } from './queries'
import { formatCurrency } from './utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useLanguage } from '@/components/language-provider'

export function CashBankPage() {
  const { t, formatDate } = useLanguage()
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: bankAccounts, isLoading: isAccountsLoading } = useBankAccounts()
  const { data: transactions, isLoading: isTxLoading } = useTransactions({ search })
  const createTransaction = useCreateTransaction()

  const handleSave = (data: any) => {
    createTransaction.mutate(data, {
      onSuccess: () => {
        setIsModalOpen(false)
      }
    })
  }

  const totalBank = bankAccounts?.filter(a => a.type === 'Bank').reduce((acc, curr) => acc + curr.balance, 0) || 0
  const totalCash = bankAccounts?.filter(a => a.type === 'Cash').reduce((acc, curr) => acc + curr.balance, 0) || 0
  const totalBalance = totalBank + totalCash

  return (
    <div className="flex flex-col gap-6 pb-8">
      <FinancePageHeader 
        title={t('Cash & Bank')} 
        description={t('Manage your bank and cash accounts.')}
        actions={
          <Button size="sm" className="gap-2" onClick={() => setIsModalOpen(true)}>
            <Plus className="size-4" /> {t('Add Transaction')}
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">{t('Cash Balance')}</span>
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <Banknote className="size-4 text-emerald-500" />
            </span>
          </div>
          <div className="mt-4 text-2xl font-bold tracking-tight">
            {isAccountsLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(totalCash)}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">{t('Bank Balance')}</span>
            <span className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10">
              <Landmark className="size-4 text-blue-500" />
            </span>
          </div>
          <div className="mt-4 text-2xl font-bold tracking-tight">
            {isAccountsLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(totalBank)}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">{t('Total Liquid Assets')}</span>
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <Wallet className="size-4 text-primary" />
            </span>
          </div>
          <div className="mt-4 text-2xl font-bold tracking-tight">
            {isAccountsLoading ? <Skeleton className="h-8 w-32" /> : formatCurrency(totalBalance)}
          </div>
        </div>
      </div>

      <h2 className="text-lg font-semibold tracking-tight mt-2">{t('Accounts')}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isAccountsLoading ? Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />) : bankAccounts?.map(account => (
          <div key={account.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className={`flex size-10 items-center justify-center rounded-lg ${account.type === 'Cash' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                {account.type === 'Cash' ? <Banknote className="size-5" /> : <Landmark className="size-5" />}
              </div>
              <div>
                <h3 className="font-medium text-sm">{account.name}</h3>
                <p className="text-xs text-muted-foreground">{account.accountNumber || 'Physical Cash'}</p>
              </div>
            </div>
            <p className="text-xl font-bold tracking-tight">{formatCurrency(account.balance)}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm mt-4">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between border-b border-border">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search transactions..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full sm:w-[280px] rounded-md border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2 h-9">
              <Filter className="size-4" /> Filter
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium text-xs">{t('Date')}</th>
                <th className="px-5 py-3 font-medium text-xs">{t('Description')}</th>
                <th className="px-5 py-3 font-medium text-xs">{t('Reference')}</th>
                <th className="px-5 py-3 font-medium text-xs">{t('Account')}</th>
                <th className="px-5 py-3 font-medium text-xs">{t('Type')}</th>
                <th className="px-5 py-3 font-medium text-xs text-right">{t('Amount')}</th>
              </tr>
            </thead>
            <tbody>
              {isTxLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-24 ml-auto" /></td>
                  </tr>
                ))
              ) : transactions?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    {t('No data found')}
                  </td>
                </tr>
              ) : (
                transactions?.map((tx: any) => (
                  <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">{formatDate(tx.date)}</td>
                    <td className="px-5 py-4 font-medium">{tx.description}</td>
                    <td className="px-5 py-4 text-muted-foreground">{tx.reference || '-'}</td>
                    <td className="px-5 py-4 font-medium">{tx.account?.name || '-'}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-2 py-1 text-[10px] font-medium ${
                        tx.type === 'Income' ? 'bg-emerald-500/10 text-emerald-500' :
                        tx.type === 'Expense' ? 'bg-rose-500/10 text-rose-500' :
                        'bg-blue-500/10 text-blue-500'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className={`px-5 py-4 text-right font-medium ${tx.type === 'Income' ? 'text-emerald-500' : ''}`}>
                      {tx.type === 'Expense' ? '-' : tx.type === 'Income' ? '+' : ''}{formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        onSave={handleSave} 
      />
    </div>
  )
}
