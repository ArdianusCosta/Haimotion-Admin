import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, Upload, FileText, CheckCircle, ExternalLink, Eye, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

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

export function PayExpenseModal({
  open,
  onOpenChange,
  onPay,
  expense,
  accounts = []
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onPay: (data: any) => void
  expense: any
  accounts: any[]
}) {
  const [accountId, setAccountId] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10))
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  React.useEffect(() => {
    if (expense) {
      setAccountId(accounts[0]?.id?.toString() || '')
      setPaymentDate(new Date().toISOString().slice(0, 10))
      setReceiptUrl(expense.receipt_url || null)
      setNotes(expense.notes || '')
    }
  }, [expense, accounts])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 8 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 8MB')
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.url) {
        setReceiptUrl(data.url)
        toast.success('Bukti transfer berhasil diunggah!')
      } else {
        toast.error('Gagal mengunggah bukti transfer.')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan saat upload bukti transfer.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onPay({
      id: expense.id,
      accountId: accountId && accountId !== 'none' ? Number(accountId) : null,
      paymentDate,
      receiptUrl,
      notes
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount)
  }

  if (!expense) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Bayar Pengeluaran / Gaji</DialogTitle>
          <DialogDescription>
            Konfirmasi pembayaran kas/bank dan lampirkan bukti transfer.
          </DialogDescription>
        </DialogHeader>

        {/* Ringkasan Biaya */}
        <div className="bg-muted/40 border rounded-lg p-3.5 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Keterangan:</span>
            <span className="font-medium text-foreground max-w-[280px] text-right truncate">{expense.description}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Penerima / Karyawan:</span>
            <span className="font-medium text-foreground">{expense.vendor || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Kategori:</span>
            <span className="font-medium text-foreground">{expense.category}</span>
          </div>
          <div className="border-t pt-1.5 flex justify-between font-bold text-sm text-foreground">
            <span>Total yang Harus Dibayar:</span>
            <span className="text-emerald-600 dark:text-emerald-400">{formatCurrency(expense.amount)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 py-2">
          {/* Akun Kas/Bank */}
          <div className="grid gap-1.5">
            <Label>Bayar dari Akun Kas/Bank</Label>
            <Select value={accountId || 'none'} onValueChange={(val: string | null) => setAccountId(!val || val === 'none' ? '' : val)}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih akun kas/bank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tidak memotong kas/bank (Catatan saja)</SelectItem>
                {accounts.map(acc => (
                  <SelectItem key={acc.id} value={acc.id.toString()}>
                    {acc.name} ({formatCurrency(acc.balance)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Saldo akun yang dipilih akan otomatis berkurang sebesar {formatCurrency(expense.amount)}.
            </p>
          </div>

          {/* Tanggal Transfer */}
          <div className="grid gap-1.5">
            <Label>Tanggal Pembayaran / Transfer</Label>
            <Input
              type="date"
              required
              value={paymentDate}
              onChange={e => setPaymentDate(e.target.value)}
            />
          </div>

          {/* Upload Bukti Transfer */}
          <div className="grid gap-1.5">
            <Label className="flex items-center justify-between">
              <span>Bukti Transfer / Struk Bank</span>
              {receiptUrl && (
                <button
                  type="button"
                  onClick={() => setReceiptUrl(null)}
                  className="text-xs text-red-500 hover:underline flex items-center"
                >
                  <Trash2 className="w-3 h-3 mr-1" /> Hapus
                </button>
              )}
            </Label>

            {receiptUrl ? (
              <div className="flex items-center space-x-3 p-2.5 rounded-lg border bg-muted/20">
                {receiptUrl.toLowerCase().endsWith('.pdf') ? (
                  <FileText className="w-8 h-8 text-primary shrink-0" />
                ) : (
                  <img src={receiptUrl} alt="Preview" className="w-12 h-12 object-cover rounded border shrink-0" />
                )}
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-medium text-foreground truncate">Bukti Transfer Terlampir</p>
                  <a
                    href={receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-primary hover:underline flex items-center mt-0.5"
                  >
                    <Eye className="w-3 h-3 mr-1" /> Lihat Bukti
                  </a>
                </div>
                <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              </div>
            ) : (
              <div className="relative border-2 border-dashed border-input rounded-lg p-3 hover:bg-muted/30 transition-colors text-center cursor-pointer">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  disabled={isUploading}
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center justify-center space-y-1">
                  {isUploading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <p className="text-xs text-muted-foreground">Mengunggah file...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-muted-foreground" />
                      <p className="text-xs font-medium text-foreground">Klik untuk upload bukti struk / slip transfer</p>
                      <p className="text-[10px] text-muted-foreground">Mendukung JPG, PNG, PDF (Maks. 8MB)</p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Catatan */}
          <div className="grid gap-1.5">
            <Label>Catatan Transfer (Opsional)</Label>
            <Input
              type="text"
              placeholder="Contoh: Transfer m-BCA ref: 948210"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter className="mt-2">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Konfirmasi & Tandai Lunas
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function ReceiptPreviewModal({
  open,
  onOpenChange,
  receiptUrl,
  description
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  receiptUrl: string | null
  description?: string
}) {
  if (!receiptUrl) return null
  const isPdf = receiptUrl.toLowerCase().endsWith('.pdf')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle>Bukti Pengeluaran / Transfer</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="flex-1 overflow-auto my-3 flex items-center justify-center bg-muted/30 rounded-lg p-2 min-h-[280px]">
          {isPdf ? (
            <iframe src={receiptUrl} className="w-full h-[400px] rounded border" />
          ) : (
            <img 
              src={receiptUrl} 
              alt="Bukti Transfer" 
              className="max-h-[400px] w-auto object-contain rounded shadow-sm" 
            />
          )}
        </div>
        <DialogFooter className="flex justify-between items-center w-full sm:justify-between">
          <Button variant="outline" asChild size="sm">
            <a href={receiptUrl} target="_blank" rel="noopener noreferrer" download>
              <ExternalLink className="mr-2 h-4 w-4" /> Buka Tab Baru / Unduh
            </a>
          </Button>
          <Button variant="secondary" onClick={() => onOpenChange(false)} size="sm">
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

