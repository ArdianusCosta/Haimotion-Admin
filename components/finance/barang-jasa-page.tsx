import React, { useState, useEffect } from 'react'
import { useLanguage } from '@/components/language-provider'
import { Search, Download, Plus, MoreVertical, Edit, Trash2 } from 'lucide-react'
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
import { getProductsServices, createProductService, updateProductService, deleteProductService } from '@/app/actions/finance'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function BarangJasaPage() {
  const { t } = useLanguage()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  
  const [formData, setFormData] = useState({
    code: '', name: '', type: 'Barang', unit: 'Pcs', brand: '', price: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getProductsServices()
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
        await updateProductService(editingId, formData)
      } else {
        await createProductService(formData)
      }
      setIsOpen(false)
      resetForm()
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await deleteProductService(id)
      fetchData()
    }
  }

  const handleEdit = (item: any) => {
    setEditingId(item.id)
    setFormData({
      code: item.code || '',
      name: item.name || '',
      type: item.type || 'Barang',
      unit: item.unit || 'Pcs',
      brand: item.brand || '',
      price: item.price || 0
    })
    setIsOpen(true)
  }

  const resetForm = () => {
    setEditingId(null)
    setFormData({ code: '', name: '', type: 'Barang', unit: 'Pcs', brand: '', price: 0 })
  }

  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6 pb-8 text-foreground">
      
      {/* Header & Top Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-4 mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">{t('Products & Services')}</h1>
          <p className="text-sm text-muted-foreground">{t('Manage data for')} {t('Products & Services')}</p>
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
                    <Label className="text-sm font-medium">{t('Name')}<span className="text-red-500">*</span></Label>
                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nama Barang / Jasa" className="bg-background" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('Code')}<span className="text-red-500">*</span></Label>
                    <Input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="Kode unik" className="bg-background" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('Type')}</Label>
                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                      <option value="Barang">Barang (Product)</option>
                      <option value="Jasa">Jasa (Service)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('Unit')}</Label>
                    <Input value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} placeholder="Pcs, Kg, Jam..." className="bg-background" />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Harga</Label>
                    <Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})} placeholder="0" className="bg-background" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">{t('Brand')}</Label>
                    <Input value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} placeholder="Merek (Opsional)" className="bg-background" />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <DialogClose render={<Button variant="outline" />}>
                    Batal
                  </DialogClose>
                  <Button onClick={handleSave} disabled={!formData.name || !formData.code} className="bg-primary hover:bg-primary/90 text-white">{t('Save')}</Button>
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
            <option value="All">Semua Jenis</option>
            <option value="Barang">Barang</option>
            <option value="Jasa">Jasa</option>
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
                <th className="px-6 py-4 font-semibold text-foreground">{t('Name')}</th>
                <th className="px-6 py-4 font-semibold text-foreground">{t('Code')}</th>
                <th className="px-6 py-4 font-semibold text-foreground">{t('Type')}</th>
                <th className="px-6 py-4 font-semibold text-foreground">{t('Unit')}</th>
                <th className="px-6 py-4 font-semibold text-foreground">Harga</th>
                <th className="px-6 py-4 font-semibold text-foreground w-[50px]">{t('Action')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center">Loading...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center">Belum ada data</td></tr>
              ) : filteredData.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 text-foreground font-medium">{row.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{row.code}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${row.type === 'Jasa' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                      {row.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{row.unit}</td>
                  <td className="px-6 py-4 text-muted-foreground">Rp {row.price.toLocaleString('id-ID')}</td>
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
