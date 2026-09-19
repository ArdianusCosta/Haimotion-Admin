import React from 'react'
import { useLanguage } from '@/components/language-provider'
import { Search, Download, Plus, MoreVertical, ArrowUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const staticData: any[] = []

export function FakturPenjualanPage() {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col gap-6 pb-8 text-foreground">
      
      {/* Header & Top Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-4 mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">{t('Sales Invoice')}</h1>
          <p className="text-sm text-muted-foreground">{t('Manage data for')} {t('Sales Invoice')}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-border text-foreground hover:bg-muted flex items-center gap-2">
            <Download className="w-4 h-4" />
            <span>{t('Save')}</span>
          </Button>
          
          <Dialog>
            <DialogTrigger className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2 h-9 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" />
              <span>{t('Add')}</span>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none bg-card">
              <div className="bg-primary px-6 py-4">
                <DialogTitle className="text-xl font-medium text-white">{t('New Data')}</DialogTitle>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-medium">{t('Customer')}<span className="text-red-500">*</span></Label>
                    <Select>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Pilih Pelanggan" />
                      </SelectTrigger>
                      <SelectContent>
                        
                        
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('Date')}<span className="text-red-500">*</span></Label>
                    <Input type="date" className="bg-background" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('Total')}<span className="text-red-500">*</span></Label>
                    <Input placeholder="Rp 0" className="bg-background" />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-medium">Keterangan Tambahan</Label>
                    <Input placeholder="Tuliskan keterangan..." className="bg-background" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <DialogClose className="h-9 px-4 py-2 border border-border text-foreground hover:bg-muted rounded-md text-sm font-medium transition-colors">
                    Batal
                  </DialogClose>
                  <Button className="bg-primary hover:bg-primary/90 text-white">{t('Save')}</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">{t('Filter')}</span>
          <select className="text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground outline-none min-w-[120px]">
            <option>Semua Status</option>
            <option>Lunas</option>
            <option>Belum Dibayar</option>
          </select>
        </div>
        
        <div className="relative w-full md:w-[350px]">
          <input 
            type="text" 
            placeholder="Search Task" 
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
                <th className="px-6 py-4 font-semibold text-foreground">{t('Customer')}</th>
                <th className="px-6 py-4 font-semibold text-foreground">{t('Description')}</th>
                <th className="px-6 py-4 font-semibold text-foreground">{t('Status')}</th>
                <th className="px-6 py-4 font-semibold text-foreground">
                  <div className="flex items-center gap-1 cursor-pointer">{t('Total')}<ArrowUp className="w-3 h-3 text-muted-foreground" />
                  </div>
                </th>
                <th className="px-6 py-4 font-semibold text-foreground w-[50px]"></th>
              </tr>
            </thead>
            <tbody>
              {staticData.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 text-muted-foreground">{row.tanggal}</td>
                  <td className="px-6 py-4 text-foreground font-medium">{row.pelanggan}</td>
                  <td className="px-6 py-4 text-muted-foreground">{row.keterangan}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                      {row.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground font-medium">{row.total}</td>
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
