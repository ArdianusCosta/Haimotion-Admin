import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

type AkunDialogProps = {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  editingId: number | null
  formData: any
  setFormData: (data: any) => void
  resetForm: () => void
  handleSave: () => void
  t: (key: string) => string
}

export function AkunDialog({ isOpen, setIsOpen, editingId, formData, setFormData, resetForm, handleSave, t }: AkunDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(val) => { setIsOpen(val); if (!val) resetForm(); }}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span>{t('Add')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none bg-card">
        <div className="bg-primary px-6 py-4">
          <DialogTitle className="text-xl font-medium text-white">{editingId ? t('Edit Data') : t('New Data')}</DialogTitle>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('Code')}<span className="text-red-500">*</span></Label>
              <Input value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="Kode Akun" className="bg-background" />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('Name')}<span className="text-red-500">*</span></Label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nama Akun" className="bg-background" />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Jenis Akun</Label>
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                <option value="Asset">Aset (Asset)</option>
                <option value="Liability">Kewajiban (Liability)</option>
                <option value="Equity">Ekuitas (Equity)</option>
                <option value="Income">Pendapatan (Income)</option>
                <option value="Expense">Pengeluaran (Expense)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Sub Jenis Akun</Label>
              <Input value={formData.subType} onChange={e => setFormData({...formData, subType: e.target.value})} placeholder="Kas, Bank, Beban Operasional..." className="bg-background" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-sm font-medium">Saldo Awal (Balance)</Label>
              <Input type="number" value={formData.balance} onChange={e => setFormData({...formData, balance: parseFloat(e.target.value) || 0})} placeholder="0" className="bg-background" />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <DialogClose asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={!formData.name || !formData.code} className="bg-primary hover:bg-primary/90 text-white">{t('Save')}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
