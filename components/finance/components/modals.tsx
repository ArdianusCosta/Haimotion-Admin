import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, Upload, FileText, CheckCircle, ExternalLink, Eye, Loader2, Trash2, Wallet, ArrowUpRight, CheckCircle2, Download, AlertCircle, CreditCard, Calendar } from 'lucide-react'
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
  const [showReceiptPreview, setShowReceiptPreview] = useState(false)

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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-6 md:p-8">
          <DialogHeader className="flex flex-row items-center gap-3.5 space-y-0 border-b pb-4">
            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0">
              <Wallet className="size-6" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                Bayar Pengeluaran / Gaji
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Konfirmasi transaksi kas/bank dan lampirkan bukti transfer untuk arsip keuangan.
              </DialogDescription>
            </div>
          </DialogHeader>

          {/* Ringkasan Biaya (3 Card Summary) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 my-2">
            <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-3.5">
              <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Total Pembayaran</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatCurrency(expense.amount)}
              </p>
            </div>
            <div className="bg-muted/40 border border-border/80 rounded-xl p-3.5">
              <p className="text-[11px] font-medium text-muted-foreground">Kategori & Penerima</p>
              <p className="text-xs font-semibold text-foreground truncate mt-0.5">
                {expense.category} • {expense.vendor || 'Karyawan'}
              </p>
            </div>
            <div className="bg-muted/40 border border-border/80 rounded-xl p-3.5">
              <p className="text-[11px] font-medium text-muted-foreground">Keterangan</p>
              <p className="text-xs font-semibold text-foreground truncate mt-0.5" title={expense.description}>
                {expense.description}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Kolom Kiri: Akun & Tanggal */}
              <div className="space-y-3.5">
                {/* Akun Kas/Bank */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-foreground">Bayar dari Akun Kas/Bank</Label>
                  <Select value={accountId || 'none'} onValueChange={(val: string | null) => setAccountId(!val || val === 'none' ? '' : val)}>
                    <SelectTrigger className="h-10 bg-background">
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
                    Saldo akun akan otomatis berkurang sebesar <span className="font-medium text-foreground">{formatCurrency(expense.amount)}</span>.
                  </p>
                </div>

                {/* Tanggal Transfer */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Calendar className="size-4 text-muted-foreground" />
                    Tanggal Pembayaran / Transfer
                  </Label>
                  <Input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    className="h-10 bg-background"
                  />
                </div>

                {/* Catatan */}
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-foreground">Catatan Transfer (Opsional)</Label>
                  <Input
                    type="text"
                    placeholder="Contoh: Transfer m-BCA ref: 948210"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="h-10 bg-background"
                  />
                </div>
              </div>

              {/* Kolom Kanan: Upload Bukti Transfer */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-foreground">Bukti Transfer / Struk Bank</Label>
                  {receiptUrl && (
                    <button
                      type="button"
                      onClick={() => setReceiptUrl(null)}
                      className="text-xs text-rose-500 hover:text-rose-600 hover:underline flex items-center font-medium"
                    >
                      <Trash2 className="size-3.5 mr-1" /> Hapus
                    </button>
                  )}
                </div>

                {receiptUrl ? (
                  <div className="border border-border/80 rounded-xl p-3.5 bg-card/60 space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="size-14 rounded-lg bg-muted border border-border overflow-hidden shrink-0 flex items-center justify-center">
                        {receiptUrl.toLowerCase().endsWith('.pdf') ? (
                          <FileText className="size-8 text-primary" />
                        ) : (
                          <img 
                            src={receiptUrl} 
                            alt="Preview" 
                            className="size-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                          <p className="text-xs font-semibold text-foreground truncate">Bukti Transfer Terlampir</p>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {receiptUrl.toLowerCase().endsWith('.pdf') ? 'Dokumen PDF' : 'File Gambar Bukti'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-border/60">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowReceiptPreview(true)}
                        className="flex-1 h-8 text-xs font-medium"
                      >
                        <Eye className="size-3.5 mr-1.5 text-primary" /> Lihat Bukti Lengkap
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-8 text-xs text-muted-foreground"
                      >
                        <a href={receiptUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="size-3.5" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="relative border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-6 hover:bg-muted/30 transition-all text-center cursor-pointer min-h-[160px] flex flex-col items-center justify-center">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      disabled={isUploading}
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    {isUploading ? (
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Loader2 className="size-7 animate-spin text-primary" />
                        <p className="text-xs font-medium text-foreground">Mengunggah file ke server...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="size-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <Upload className="size-5" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">Klik untuk upload bukti struk / slip</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">JPG, PNG, WEBP, atau PDF (Maks. 8MB)</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="border-t pt-4 mt-6 gap-2 sm:gap-0">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)} className="h-10 px-5">
                Batal
              </Button>
              <Button type="submit" className="h-10 px-6 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                Konfirmasi & Tandai Lunas
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* In-Dialog Receipt Preview */}
      {showReceiptPreview && receiptUrl && (
        <ReceiptPreviewModal
          open={showReceiptPreview}
          onOpenChange={setShowReceiptPreview}
          receiptUrl={receiptUrl}
          description={`Bukti Pembayaran: ${expense.description} (${formatCurrency(expense.amount)})`}
        />
      )}
    </>
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
  const [imageError, setImageError] = useState(false)
  if (!receiptUrl) return null
  const isPdf = receiptUrl.toLowerCase().endsWith('.pdf')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] flex flex-col p-6 md:p-8 bg-card border-border shadow-2xl">
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4 space-y-0">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <FileText className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">Bukti Pengeluaran / Transfer</DialogTitle>
              {description && <DialogDescription className="text-xs text-muted-foreground mt-0.5">{description}</DialogDescription>}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto my-4 flex items-center justify-center bg-muted/20 dark:bg-zinc-950/40 rounded-2xl border border-border/80 p-4 min-h-[420px] max-h-[62vh]">
          {isPdf ? (
            <iframe src={receiptUrl} className="w-full h-[520px] rounded-xl border border-border" />
          ) : imageError ? (
            <div className="flex flex-col items-center justify-center text-center p-8 space-y-3">
              <AlertCircle className="size-12 text-rose-500/80" />
              <div>
                <p className="text-sm font-semibold text-foreground">Gagal memuat pratinjau gambar</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  Format gambar atau berkas mungkin tidak dapat dibuka langsung di dalam browser.
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href={receiptUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-3.5 mr-1.5" /> Buka Tautan di Tab Baru
                </a>
              </Button>
            </div>
          ) : (
            <img 
              src={receiptUrl} 
              alt="Bukti Transfer" 
              onError={() => setImageError(true)}
              className="max-h-[520px] max-w-full w-auto object-contain rounded-xl shadow-lg border border-border/40" 
            />
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row justify-between items-center w-full gap-2 border-t pt-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" asChild size="sm" className="h-9">
              <a href={receiptUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 size-3.5" /> Buka Tab Baru
              </a>
            </Button>
            <Button variant="outline" asChild size="sm" className="h-9">
              <a href={receiptUrl} download target="_blank" rel="noopener noreferrer">
                <Download className="mr-2 size-3.5" /> Unduh
              </a>
            </Button>
          </div>
          <Button variant="secondary" onClick={() => onOpenChange(false)} size="sm" className="h-9 px-5 w-full sm:w-auto font-medium">
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

