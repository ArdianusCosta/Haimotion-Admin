'use client'

import React, { useState, useEffect } from 'react'
import { useLanguage } from '@/components/language-provider'
import { Search, Plus, MoreVertical, Edit, Trash2, Truck } from 'lucide-react'
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
import { ConfirmDeleteModal } from '@/components/finance/components/modals'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function PemasokPage() {
  const { t } = useLanguage()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getContacts({ type: 'SUPPLIER' })
      setData(res || [])
    } catch (err) {
      console.error(err)
      toast.error('Gagal memuat data pemasok')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateContact(editingId, { ...formData, type: 'SUPPLIER' })
        toast.success('Pemasok berhasil diperbarui')
      } else {
        await createContact({ ...formData, type: 'SUPPLIER' })
        toast.success('Pemasok berhasil ditambahkan')
      }
      setIsOpen(false)
      resetForm()
      fetchData()
    } catch (err) {
      console.error(err)
      toast.error('Gagal menyimpan pemasok')
    }
  }

  const handleDelete = (id: number) => {
    setItemToDelete(id)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (itemToDelete !== null) {
      setIsDeleting(true)
      try {
        await deleteContact(itemToDelete)
        toast.success('Pemasok berhasil dihapus')
        fetchData()
        setItemToDelete(null)
      } catch (err) {
        console.error(err)
        toast.error('Gagal menghapus pemasok')
      } finally {
        setIsDeleting(false)
      }
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
          <h1 className="text-3xl font-bold tracking-tight mb-1">{t('Suppliers')}</h1>
          <p className="text-sm text-muted-foreground">{t('Manage data for')} {t('Suppliers')}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Dialog open={isOpen} onOpenChange={(val) => { setIsOpen(val); if (!val) resetForm(); }}>
            <DialogTrigger render={<Button className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2 cursor-pointer" />}>
              <Plus className="w-4 h-4" />
              <span>{t('Add')}</span>
            </DialogTrigger>
            
            <DialogContent className="!w-[92vw] !max-w-[560px] p-0 overflow-hidden border border-border bg-card shadow-2xl rounded-2xl">
              <div className="bg-primary px-6 py-4">
                <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  {editingId ? 'Edit Data Pemasok' : 'Tambah Pemasok Baru'}
                </DialogTitle>
                <p className="text-xs text-primary-foreground/80 mt-0.5">
                  Lengkapi data profil kontak pemasok / vendor
                </p>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="space-y-1.5 w-full">
                  <Label className="text-sm font-semibold">Nama Pemasok / Vendor <span className="text-red-500">*</span></Label>
                  <Input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="PT / CV / Vendor" 
                    className="w-full bg-background h-10" 
                  />
                </div>
                
                <div className="space-y-1.5 w-full">
                  <Label className="text-sm font-semibold">Nomor Telepon</Label>
                  <Input 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    placeholder="Contoh: 08123456789" 
                    className="w-full bg-background h-10" 
                  />
                </div>
                
                <div className="space-y-1.5 w-full">
                  <Label className="text-sm font-semibold">Email</Label>
                  <Input 
                    value={formData.email} 
                    onChange={e => setFormData({...formData, email: e.target.value})} 
                    type="email" 
                    placeholder="vendor@perusahaan.com" 
                    className="w-full bg-background h-10" 
                  />
                </div>
                
                <div className="space-y-1.5 w-full">
                  <Label className="text-sm font-semibold">Informasi Tambahan / Alamat</Label>
                  <Input 
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                    placeholder="Alamat kantor, PIC vendor, atau catatan khusus..." 
                    className="w-full bg-background h-10" 
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                  <DialogClose render={<Button variant="outline" className="h-10 px-4" />}>
                    Batal
                  </DialogClose>
                  <Button 
                    onClick={handleSave} 
                    disabled={!formData.name} 
                    className="bg-primary hover:bg-primary/90 text-white h-10 px-5 font-semibold cursor-pointer"
                  >
                    {t('Save')}
                  </Button>
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
          <select className="text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground outline-none min-w-[140px]">
            <option>Semua Status</option>
            <option>Aktif</option>
            <option>Non-Aktif</option>
          </select>
        </div>
        
        <div className="relative w-full md:w-[350px]">
          <input 
            type="text" 
            placeholder="Cari pemasok atau email..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-border rounded-lg pl-4 pr-10 py-2 text-sm bg-background text-foreground outline-none focus:border-primary"
          />
          <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Table Card */}
      <Card className="shadow-xs border-border bg-card rounded-2xl overflow-hidden mt-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-6 py-4 font-semibold text-foreground">Nama Pemasok</th>
                <th className="px-6 py-4 font-semibold text-foreground">Nomor Telepon</th>
                <th className="px-6 py-4 font-semibold text-foreground">Email</th>
                <th className="px-6 py-4 font-semibold text-foreground">{t('Status')}</th>
                <th className="px-6 py-4 font-semibold text-foreground w-[50px]">{t('Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">Memuat data pemasok...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground italic">Belum ada data pemasok</td></tr>
              ) : filteredData.map((row) => (
                <tr key={row.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 text-foreground font-medium">{row.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{row.phone || '-'}</td>
                  <td className="px-6 py-4 text-muted-foreground">{row.email || '-'}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
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

      <ConfirmDeleteModal 
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={confirmDelete}
        title="Hapus Pemasok"
        description="Apakah Anda yakin ingin menghapus pemasok ini? Tindakan ini tidak dapat dibatalkan."
        isLoading={isDeleting}
      />
    </div>
  )
}
