import React from 'react'
import { Wallet, TrendingUp, TrendingDown, Receipt, Landmark } from 'lucide-react'
import { FinancePageHeader, FinanceSummaryCard } from './components'
import { useFinanceOverview, useTransactions } from './queries'
import { formatCurrency } from './utils'
import { Skeleton } from '@/components/ui/skeleton'
import { useLanguage } from '@/components/language-provider'

export function FinanceOverviewPage({ user }: { user?: any }) {
  const { t, formatDate } = useLanguage()
  const { data: summary, isLoading: isLoadingSummary } = useFinanceOverview()
  const { data: transactions, isLoading: isLoadingTx } = useTransactions()

  return (
    <div className="flex flex-col gap-6 pb-8">
      <FinancePageHeader 
        title={t('Finance Overview')} 
        description={t('Monitor your key financial metrics and recent activities.')}
      />

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {isLoadingSummary || !summary ? (
          Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)
        ) : (
          <>
            <FinanceSummaryCard 
              title={t('Total Revenue')} 
              amount={formatCurrency(summary.totalRevenue)} 
              icon={<TrendingUp className="size-4" />}
            />
            <FinanceSummaryCard 
              title={t('Total Expenses')} 
              amount={formatCurrency(summary.totalExpenses)} 
              icon={<TrendingDown className="size-4" />} 
              iconBgColor="bg-rose-500/10" 
              iconColor="text-rose-500" 
            />
            <FinanceSummaryCard 
              title={t('Net Profit')} 
              amount={formatCurrency(summary.netProfit)} 
              icon={<Wallet className="size-4" />} 
            />
            <FinanceSummaryCard 
              title={t('Outstanding Invoices')} 
              amount={formatCurrency(summary.outstandingInvoices)} 
              icon={<Receipt className="size-4" />} 
              iconBgColor="bg-amber-500/10" 
              iconColor="text-amber-500" 
            />
            <FinanceSummaryCard 
              title={t('Cash & Bank')} 
              amount={formatCurrency(summary.cashAndBank)} 
              icon={<Landmark className="size-4" />} 
            />
          </>
        )}
      </div>

      {/* Recent Transactions Table */}
      <div className="mt-4 rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-lg">{t('Recent Transactions')}</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium text-xs">{t('Date')}</th>
                <th className="px-5 py-3 font-medium text-xs">{t('Reference')}</th>
                <th className="px-5 py-3 font-medium text-xs">{t('Description')}</th>
                <th className="px-5 py-3 font-medium text-xs">{t('Type')}</th>
                <th className="px-5 py-3 font-medium text-xs text-right">{t('Amount')}</th>
                <th className="px-5 py-3 font-medium text-xs text-right">{t('Account')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingTx ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="px-5 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-24 ml-auto" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-4 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : transactions?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">{t('No data found')}</td>
                </tr>
              ) : (
                transactions?.map((tx: any) => (
                  <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-4 text-muted-foreground whitespace-nowrap">{formatDate(tx.date)}</td>
                    <td className="px-5 py-4 font-medium">{tx.reference || '-'}</td>
                    <td className="px-5 py-4">{tx.description}</td>
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
                    <td className="px-5 py-4 text-right text-muted-foreground">{tx.account?.name || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
