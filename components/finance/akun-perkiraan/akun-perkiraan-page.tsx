import React, { useState } from 'react'
import { useLanguage } from '@/components/language-provider'
import { Search, MoreVertical, Edit, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAkunPerkiraan } from './hooks/use-akun-perkiraan'
import { AkunDialog } from './dialogs/akun-dialogs'

export function AkunPerkiraanPage() {
  const { t } = useLanguage()
  const { data, loading, saveAccount, removeAccount } = useAkunPerkiraan()
  
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  
  const [formData, setFormData] = useState({
    code: '', name: '', type: 'Asset', subType: '', balance: 0
  })

  const handleSave = async () => {
    await saveAccount(editingId, formData)
    setIsOpen(false)
    resetForm()
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this account?')) {
      await removeAccount(id)
    }
  }

  const handleEdit = (item: any) => {
    setEditingId(item.id)
    setFormData({
      code: item.code || '',
      name: item.name || '',
      type: item.type || 'Asset',
      subType: item.sub_type || '',
      balance: item.balance || 0
    })
    setIsOpen(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({ code: '', name: '', type: 'Asset', subType: '', balance: 0 })
  }

  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    (item.code && item.code.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="flex flex-col gap-6 pb-8 text-foreground">
      
      {/* Header & Top Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-4 mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">{t('Chart of Accounts')}</h1>
          <p className="text-sm text-muted-foreground">{t('Manage data for')} {t('Chart of Accounts')}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <AkunDialog 
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            editingId={editingId}
            formData={formData}
            setFormData={setFormData}
            resetForm={resetForm}
            handleSave={handleSave}
            t={t}
          />
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">{t('Filter')}</span>
          <select className="text-sm border border-border rounded-md px-3 py-2 bg-background text-foreground outline-none min-w-[120px]">
            <option value="All">Semua Jenis</option>
            <option value="Asset">Aset</option>
            <option value="Liability">Kewajiban</option>
            <option value="Equity">Ekuitas</option>
            <option value="Income">Pendapatan</option>
            <option value="Expense">Pengeluaran</option>
          </select>
        </div>
        
        <div className="relative w-full md:w-[350px]">
          <input 
            type="text" 
            placeholder="Cari..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
              <tr className="border-b border-border bg-muted/40">
                <th className="px-6 py-4 font-semibold text-foreground">{t('Code')}</th>
                <th className="px-6 py-4 font-semibold text-foreground">{t('Name')}</th>
                <th className="px-6 py-4 font-semibold text-foreground">Jenis</th>
                <th className="px-6 py-4 font-semibold text-foreground">Saldo</th>
                <th className="px-6 py-4 font-semibold text-foreground w-[50px]">{t('Action')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center">Loading...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-4 text-center">Belum ada data</td></tr>
              ) : filteredData.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 text-foreground font-medium">{row.code || '-'}</td>
                  <td className="px-6 py-4 text-foreground font-medium">{row.name}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-muted text-foreground border-border">
                      {row.type} {row.sub_type ? `(${row.sub_type})` : ''}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">Rp {row.balance.toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 hover:bg-muted rounded-full text-muted-foreground">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(row)} className="flex items-center gap-2 cursor-pointer">
                          <Edit className="w-4 h-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(row.id)} className="flex items-center gap-2 cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
                          <Trash2 className="w-4 h-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
