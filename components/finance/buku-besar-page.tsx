import React from 'react'
import { useLanguage } from '@/components/language-provider'
import { Search, Download, MoreVertical, ArrowUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const staticData: any[] = []

export function BukuBesarPage() {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col gap-6 pb-8 text-foreground">
      
      {/* Header & Top Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-4 mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">{t('General Ledger')}</h1>
          <p className="text-sm text-muted-foreground">{t('Manage data for')} {t('General Ledger')}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-border text-foreground hover:bg-muted flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span>{t('Save')}</span>
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">{t('From')}</span>
          <select className="text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground outline-none min-w-[120px]">
            <option>1/12/2025</option>
          </select>
          <span className="text-sm font-medium text-muted-foreground">{t('To')}</span>
          <select className="text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground outline-none min-w-[120px]">
            <option>31/12/2025</option>
          </select>
        </div>
        
        <div className="relative w-full md:w-[350px]">
          <input 
            type="text" 
            placeholder="Cari" 
            className="w-full border border-border rounded-md pl-4 pr-10 py-2 text-sm bg-background text-foreground outline-none focus:border-primary"
          />
          <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Table Card */}
      <Card className="shadow-sm border-border bg-card rounded-2xl overflow-hidden mt-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-4 font-semibold text-foreground">
                  <div className="flex items-center gap-1 cursor-pointer">{t('Date')}<ArrowUp className="w-3 h-3 text-muted-foreground" />
                  </div>
                </th>
                <th className="px-6 py-4 font-semibold text-foreground">
                  <div className="flex items-center gap-1 cursor-pointer">{t('Transaction Type')}<ArrowUp className="w-3 h-3 text-muted-foreground" />
                  </div>
                </th>
                <th className="px-6 py-4 font-semibold text-foreground">{t('Description')}</th>
                <th className="px-6 py-4 font-semibold text-foreground text-center">{t('Debit')}</th>
                <th className="px-6 py-4 font-semibold text-foreground text-center">{t('Credit')}</th>
                <th className="px-6 py-4 font-semibold text-foreground text-right">{t('Ending Balance')}</th>
                <th className="px-6 py-4 font-semibold text-foreground w-[50px]"></th>
              </tr>
            </thead>
            <tbody>
              {staticData.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 text-muted-foreground">{row.tanggal}</td>
                  <td className="px-6 py-4 text-muted-foreground">{row.tipe}</td>
                  <td className="px-6 py-4 text-foreground text-wrap min-w-[300px] max-w-[400px]">{row.keterangan}</td>
                  <td className="px-6 py-4 text-foreground font-medium text-center">{row.debit}</td>
                  <td className="px-6 py-4 text-foreground font-medium text-center">{row.kredit}</td>
                  <td className="px-6 py-4 text-foreground font-medium text-right">{row.saldo}</td>
                  <td className="px-6 py-4 text-center">
                    <button className="p-1 hover:bg-muted rounded-full text-muted-foreground">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
