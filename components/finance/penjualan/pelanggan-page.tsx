import React, { useState, useEffect } from 'react'
import { useLanguage } from '@/components/language-provider'
import { Search, Download, Plus, MoreVertical, ArrowUp, Edit, Trash2 } from 'lucide-react'
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
import { getContacts, createContact, updateContact, deleteContact } from '@/app/actions/finance'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function PelangganPage() {
  const { t } = useLanguage()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getContacts({ type: 'CUSTOMER' })
      setData(res)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateContact(editingId, { ...formData, type: 'CUSTOMER' })
      } else {
        await createContact({ ...formData, type: 'CUSTOMER' })
      }
      setIsOpen(false)
      resetForm()
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      await deleteContact(id)
      fetchData()
    }
  }

  const handleEdit = (item: any) => {
    setEditingId(item.id)
    setFormData({
      name: item.name || '',
      email: item.email || '',
      phone: item.phone || '',
      address: item.address || ''
    })
    setIsOpen(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({ name: '', email: '', phone: '', address: '' })
  }

  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    (item.email && item.email.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="flex flex-col gap-6 pb-8 text-foreground">
      
      {/* Header & Top Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-4 mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">{t('Customers')}</h1>
          <p className="text-sm text-muted-foreground">{t('Manage data for')} {t('Customers')}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Dialog open={isOpen} onOpenChange={(val) => { setIsOpen(val); if (!val) resetForm(); }}>
            <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2" />}>
              <Plus className="w-4 h-4" />
              <span>{t('Add')}</span>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none bg-card">
              <div className="bg-primary px-6 py-4">
                <DialogTitle className="text-xl font-medium text-white">{editingId ? t('Edit Data') : t('New Data')}</DialogTitle>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Nama Pelanggan<span className="text-red-500">*</span></Label>
                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="PT / Nama" className="bg-background" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Nomor Telepon</Label>
                    <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="08..." className="bg-background" />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-medium">Email</Label>
                    <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} type="email" placeholder="email@contoh.com" className="bg-background" />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-sm font-medium">Informasi Tambahan / Alamat</Label>
                    <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="Tuliskan keterangan..." className="bg-background" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <DialogClose render={<Button variant="outline" />}>
                    Batal
                  </DialogClose>
                  <Button onClick={handleSave} disabled={!formData.name} className="bg-primary hover:bg-primary/90 text-white">{t('Save')}</Button>
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
            <option>Aktif</option>
            <option>Non-Aktif</option>
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
              <tr className="border-b border-border">
                <th className="px-6 py-4 font-semibold text-foreground">Nama Pelanggan</th>
                <th className="px-6 py-4 font-semibold text-foreground">Nomor Telepon</th>
                <th className="px-6 py-4 font-semibold text-foreground">Email</th>
                <th className="px-6 py-4 font-semibold text-foreground">{t('Status')}</th>
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
                  <td className="px-6 py-4 text-foreground font-medium">{row.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{row.phone || '-'}</td>
                  <td className="px-6 py-4 text-muted-foreground">{row.email || '-'}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                      Aktif
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<button className="p-1 hover:bg-muted rounded-full text-muted-foreground" />}>
                        <MoreVertical className="w-4 h-4" />
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
