import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle } from 'lucide-react'

interface ConfirmDeleteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void | Promise<void>
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
}

export function ConfirmDeleteModal({ 
  open, 
  onOpenChange, 
  onConfirm, 
  title = "Apakah Anda yakin?", 
  description = "Tindakan ini tidak dapat dibatalkan. Data akan dihapus secara permanen.",
  confirmText = "Hapus",
  cancelText = "Batal",
  isLoading = false
}: ConfirmDeleteModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[92vw] !max-w-[440px] p-6 rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <DialogTitle className="text-lg font-bold text-foreground">{title}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              {description}
            </DialogDescription>
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 mt-6 pt-4 border-t border-border">
          <Button 
            type="button" 
            variant="outline" 
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
            className="h-10 px-4 cursor-pointer"
          >
            {cancelText}
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            disabled={isLoading}
            onClick={async () => { 
              await onConfirm(); 
              onOpenChange(false); 
            }}
            className="h-10 px-5 font-semibold bg-destructive hover:bg-destructive/90 text-white cursor-pointer"
          >
            {isLoading ? 'Menghapus...' : confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  Operations: 'Operasional',
  Salaries: 'Gaji',
  Marketing: 'Marketing',
  Utilities: 'Utilitas',
  'Office Supplies': 'Perlengkapan Kantor',
  Transportation: 'Transportasi',
  Other: 'Lain-lain'
}

interface ExpenseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: any) => void
  initialData?: any | null
  accounts?: any[]
}
export function ExpenseModal({ open, onOpenChange, onSave, initialData, accounts = [] }: ExpenseModalProps) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState(initialData?.description || '')
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '')
  const [category, setCategory] = useState(initialData?.category || 'Operations')
  const [vendor, setVendor] = useState(initialData?.vendor && initialData.vendor !== '-' ? initialData.vendor : '')
  const [status, setStatus] = useState(initialData?.status || 'Paid')
  const [accountId, setAccountId] = useState('')

  React.useEffect(() => {
    if (open) {
      setDate(initialData?.date ? new Date(initialData.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10))
      setDescription(initialData?.description || '')
      setAmount(initialData?.amount?.toString() || '')
      setCategory(initialData?.category || 'Operations')
      setVendor(initialData?.vendor && initialData.vendor !== '-' ? initialData.vendor : '')
      setStatus(initialData?.status || 'Paid')
      setAccountId('')
    }
  }, [open, initialData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      date,
      description,
      amount: Number(amount),
      category,
      vendor,
      status,
      // Akun hanya dipakai saat membuat data baru agar saldo tidak terpotong dua kali.
      accountId: !initialData && accountId ? Number(accountId) : undefined
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{initialData ? 'Edit Pengeluaran' : 'Catat Pengeluaran'}</DialogTitle>
            <DialogDescription>
              Catat biaya operasional agar laporan laba rugi dan arus kas akurat.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="expDate">Tanggal</Label>
              <Input id="expDate" type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="desc">Keterangan</Label>
              <Input id="desc" value={description} onChange={e => setDescription(e.target.value)} required placeholder="Sewa Kantor" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Kategori</Label>
                <Select value={category} onValueChange={(value: string | null) => setCategory(value || 'Operations')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori">
                      {EXPENSE_CATEGORY_LABELS[category] || category || 'Pilih kategori'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Operations">Operasional</SelectItem>
                    <SelectItem value="Salaries">Gaji</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Utilities">Utilitas</SelectItem>
                    <SelectItem value="Office Supplies">Perlengkapan Kantor</SelectItem>
                    <SelectItem value="Transportation">Transportasi</SelectItem>
                    <SelectItem value="Other">Lain-lain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(value: string | null) => setStatus(value || 'Paid')}>
                  <SelectTrigger>
                    <SelectValue>
                      {status === 'Paid' ? 'Lunas' : 'Belum Dibayar'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Paid">Lunas</SelectItem>
                    <SelectItem value="Pending">Belum Dibayar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="vendor">Pemasok / Vendor</Label>
              <Input id="vendor" value={vendor} onChange={e => setVendor(e.target.value)} placeholder="Opsional" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="amountExp">Jumlah (IDR)</Label>
              <Input id="amountExp" type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="1" />
            </div>
            {!initialData && (
              <div className="grid gap-2">
                <Label>Bayar dari akun</Label>
                <Select value={accountId || 'none'} onValueChange={(value: string | null) => setAccountId(!value || value === 'none' ? '' : value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tidak mengurangi kas/bank">
                      {!accountId || accountId === 'none'
                        ? 'Tidak mengurangi kas/bank'
                        : (accounts.find(acc => acc.id.toString() === accountId)?.name || 'Tidak mengurangi kas/bank')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tidak mengurangi kas/bank</SelectItem>
                    {accounts.map(acc => (
                      <SelectItem key={acc.id} value={acc.id.toString()}>{acc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Pilih akun bila pengeluaran ini sudah benar-benar dibayar, saldo akan otomatis berkurang.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit">Simpan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface TransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (data: any) => void
  accounts: any[]
}
export function TransactionModal({ open, onOpenChange, onSave, accounts = [] }: TransactionModalProps) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('Expense')
  const [accountId, setAccountId] = useState('')

  React.useEffect(() => {
    if (open) {
      setDate(new Date().toISOString().slice(0, 10))
      setDescription('')
      setAmount('')
      setType('Expense')
      setAccountId(accounts.length > 0 ? accounts[0].id.toString() : '')
    }
  }, [open, accounts])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ date, description, amount: Number(amount), type: type as any, accountId: Number(accountId) })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Tambah Transaksi Kas/Bank</DialogTitle>
            <DialogDescription>
              Catat uang masuk atau keluar yang tidak berasal dari faktur.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="txdate">Tanggal</Label>
              <Input id="txdate" type="date" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Jenis</Label>
                <Select value={type} onValueChange={(value: string | null) => setType(value || 'Expense')}>
                  <SelectTrigger>
                    <SelectValue>
                      {type === 'Income' ? 'Uang Masuk' : 'Uang Keluar'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Income">Uang Masuk</SelectItem>
                    <SelectItem value="Expense">Uang Keluar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Akun</Label>
                <Select value={accountId} onValueChange={(value: string | null) => setAccountId(value || '')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih akun">
                      {accounts.find(acc => acc.id.toString() === accountId)?.name || (accountId ? `Akun #${accountId}` : 'Pilih akun')}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(acc => (
                      <SelectItem key={acc.id} value={acc.id.toString()}>{acc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="txdesc">Keterangan</Label>
              <Input id="txdesc" value={description} onChange={e => setDescription(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="txamt">Jumlah (IDR)</Label>
              <Input id="txamt" type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="1" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit">Simpan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

