'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Search, Download, Plus, Trash2, Pencil, Wallet, FileText, ArrowUp } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  useInvoices,
  useContacts,
  useBankAccounts,
  useCreateInvoice,
  useUpdateInvoice,
  useDeleteInvoice,
  useRecordInvoicePayment,
  useExportInvoices
} from '@/components/finance/queries'
import { ConfirmDeleteModal } from '@/components/finance/components/modals'
import { toast } from 'sonner'
import type { InvoiceType } from '@/types/finance'

type ItemRow = { description: string; quantity: number; price: number }

type InvoiceForm = {
  id: number | null
  reference: string
  contactId: string
  partyName: string
  partyEmail: string
  date: string
  dueDate: string
  status: string
  notes: string
  items: ItemRow[]
}

const STATUS_LABEL: Record<string, string> = {
  Draft: 'Draft',
  Sent: 'Terkirim',
  Partial: 'Dibayar Sebagian',
  Paid: 'Lunas',
  Overdue: 'Jatuh Tempo',
  Cancelled: 'Dibatalkan'
}

const STATUS_STYLE: Record<string, string> = {
  Paid: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  Sent: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  Partial: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  Overdue: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  Cancelled: 'bg-muted text-muted-foreground border-border',
  Draft: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
}

const PAYMENT_METHODS = ['Transfer', 'Tunai', 'Cek', 'Lainnya']

const today = () => new Date().toISOString().slice(0, 10)
const plusDays = (days: number) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
const formatDate = (value?: string | Date | null) =>
  value ? new Date(value).toISOString().slice(0, 10) : '-'
const formatRupiah = (value?: number | null) => `Rp ${Number(value || 0).toLocaleString('id-ID')}`

const emptyForm = (): InvoiceForm => ({
  id: null,
  reference: '',
  contactId: '',
  partyName: '',
  partyEmail: '',
  date: today(),
  dueDate: plusDays(14),
  status: 'Sent',
  notes: '',
  items: [{ description: '', quantity: 1, price: 0 }]
})

const formTotal = (items: ItemRow[]) =>
  items.reduce((total, item) => total + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0)

export function InvoicePage({ type }: { type: InvoiceType }) {
  const isPurchase = type === 'PURCHASE'
  const partyType = isPurchase ? 'SUPPLIER' : 'CUSTOMER'
  const partyLabel = isPurchase ? 'Pemasok' : 'Pelanggan'
  const title = isPurchase ? 'Faktur Pembelian' : 'Faktur Penjualan'
  const description = isPurchase
    ? 'Kelola tagihan dari pemasok beserta status pembayarannya'
    : 'Kelola faktur penjualan, tagihan pelanggan, dan status pembayaran'

  const { data: rows = [], isLoading: loading } = useInvoices({ type })
  const { data: contacts = [] } = useContacts({ type: partyType })
  const { data: accounts = [] } = useBankAccounts()

  const createInvoiceMutation = useCreateInvoice()
  const updateInvoiceMutation = useUpdateInvoice()
  const deleteInvoiceMutation = useDeleteInvoice()
  const recordPaymentMutation = useRecordInvoicePayment()
  const exportInvoicesMutation = useExportInvoices()

  const saving = createInvoiceMutation.isPending || updateInvoiceMutation.isPending
  const savingPayment = recordPaymentMutation.isPending
  const deleting = deleteInvoiceMutation.isPending

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<InvoiceForm>(emptyForm())

  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentInvoice, setPaymentInvoice] = useState<any | null>(null)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentDate: today(),
    method: 'Transfer',
    accountId: '',
    notes: ''
  })

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  const filtered = useMemo(() => {
    const query = search.toLowerCase()
    return rows.filter(row => {
      const matchesSearch =
        !query ||
        String(row.customer_name || '').toLowerCase().includes(query) ||
        String(row.reference || '').toLowerCase().includes(query)
      const matchesStatus = statusFilter === 'All' || row.display_status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [rows, search, statusFilter])

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, row) => {
        acc.amount += Number(row.amount) || 0
        acc.paid += Number(row.paid_amount) || 0
        acc.outstanding += Number(row.outstanding) || 0
        return acc
      },
      { amount: 0, paid: 0, outstanding: 0 }
    )
  }, [filtered])

  function openCreate() {
    setForm(emptyForm())
    setFormOpen(true)
  }

  function openEdit(row: any) {
    setForm({
      id: row.id,
      reference: row.reference || '',
      contactId: row.contact_id ? String(row.contact_id) : '',
      partyName: row.customer_name || '',
      partyEmail: row.customer_email || '',
      date: formatDate(row.date),
      dueDate: formatDate(row.due_date),
      status: row.status || 'Sent',
      notes: row.notes || '',
      items:
        row.items && row.items.length > 0
          ? row.items.map((item: any) => ({
              description: item.description,
              quantity: item.quantity,
              price: item.price
            }))
          : [{ description: '', quantity: 1, price: 0 }]
    })
    setFormOpen(true)
  }

  function selectContact(contactId: string) {
    const contact = contacts.find(c => String(c.id) === contactId)
    setForm(prev => ({
      ...prev,
      contactId,
      partyName: contact?.name || prev.partyName,
      partyEmail: contact?.email || prev.partyEmail
    }))
  }

  function updateItem(index: number, patch: Partial<ItemRow>) {
    setForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => (i === index ? { ...item, ...patch } : item))
    }))
  }

  function addItem() {
    setForm(prev => ({ ...prev, items: [...prev.items, { description: '', quantity: 1, price: 0 }] }))
  }

  function removeItem(index: number) {
    setForm(prev => ({
      ...prev,
      items: prev.items.length > 1 ? prev.items.filter((_, i) => i !== index) : prev.items
    }))
  }

  async function handleSave() {
    const items = form.items.filter(item => item.description.trim() !== '')

    if (!form.partyName.trim()) return toast.error(`Silakan pilih ${partyLabel.toLowerCase()} terlebih dahulu`)
    if (items.length === 0) return toast.error('Minimal satu baris rincian harus diisi')
    if (items.some(item => Number(item.price) <= 0)) return toast.error('Harga pada setiap baris harus lebih besar dari 0')
    if (new Date(form.dueDate) < new Date(form.date)) return toast.error('Jatuh tempo tidak boleh lebih awal dari tanggal faktur')

    try {
      const payload = {
        type,
        reference: form.reference.trim() || undefined,
        contactId: form.contactId ? Number(form.contactId) : undefined,
        customerName: form.partyName,
        customerEmail: form.partyEmail,
        date: form.date,
        dueDate: form.dueDate,
        status: form.status,
        notes: form.notes,
        items
      }

      if (form.id) {
        await updateInvoiceMutation.mutateAsync({ id: form.id, data: payload })
      } else {
        await createInvoiceMutation.mutateAsync(payload)
      }

      setFormOpen(false)
      setForm(emptyForm())
    } catch (err: any) {
      console.error(err)
    }
  }

  function openPayment(row: any) {
    if (Number(row.outstanding) <= 0) {
      toast.info('Faktur ini sudah lunas')
      return
    }
    setPaymentInvoice(row)
    setPaymentForm({
      amount: String(row.outstanding),
      paymentDate: today(),
      method: 'Transfer',
      accountId: accounts[0] ? String(accounts[0].id) : '',
      notes: ''
    })
    setPaymentOpen(true)
  }

  async function handlePayment() {
    if (!paymentInvoice) return
    const amount = Number(paymentForm.amount)
    if (!amount || amount <= 0) return toast.error('Jumlah pembayaran harus lebih besar dari 0')
    if (amount > Number(paymentInvoice.outstanding) + 0.005) {
      return toast.error(`Jumlah melebihi sisa tagihan (${formatRupiah(paymentInvoice.outstanding)})`)
    }

    try {
      await recordPaymentMutation.mutateAsync({
        invoiceId: paymentInvoice.id,
        amount,
        paymentDate: paymentForm.paymentDate,
        method: paymentForm.method,
        accountId: paymentForm.accountId ? Number(paymentForm.accountId) : null,
        notes: paymentForm.notes
      })
      setPaymentOpen(false)
      setPaymentInvoice(null)
    } catch (err: any) {
      console.error(err)
    }
  }

  async function confirmDelete() {
    if (deleteTarget === null) return
    try {
      await deleteInvoiceMutation.mutateAsync(deleteTarget)
      setDeleteOpen(false)
      setDeleteTarget(null)
    } catch (err: any) {
      console.error(err)
    }
  }

  function handleExport() {
    exportInvoicesMutation.mutate(type)
  }

  const formTotalValue = formTotal(form.items)
  const outstandingValue = Number(paymentInvoice?.outstanding || 0)

  return (
    <div className="flex flex-col gap-6 pb-8 text-foreground">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-4 mb-2 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExport} className="border-border text-foreground hover:bg-muted flex items-center gap-2 cursor-pointer">
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </Button>
          <Button onClick={openCreate} className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2 cursor-pointer">
            <Plus className="w-4 h-4" />
            <span>Tambah</span>
          </Button>
        </div>
      </div>

      {/* Ringkasan */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4 border-border bg-card">
          <p className="text-xs text-muted-foreground">Total {title}</p>
          <p className="text-xl font-bold">{formatRupiah(totals.amount)}</p>
        </Card>
        <Card className="p-4 border-border bg-card">
          <p className="text-xs text-muted-foreground">{isPurchase ? 'Sudah Dibayar' : 'Sudah Diterima'}</p>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatRupiah(totals.paid)}</p>
        </Card>
        <Card className="p-4 border-border bg-card">
          <p className="text-xs text-muted-foreground">{isPurchase ? 'Sisa Utang' : 'Sisa Piutang'}</p>
          <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{formatRupiah(totals.outstanding)}</p>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Filter</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground outline-none min-w-[160px]"
          >
            <option value="All">Semua Status</option>
            <option value="Draft">Draft</option>
            <option value="Sent">Terkirim</option>
            <option value="Partial">Dibayar Sebagian</option>
            <option value="Paid">Lunas</option>
            <option value="Overdue">Jatuh Tempo</option>
            <option value="Cancelled">Dibatalkan</option>
          </select>
        </div>

        <div className="relative w-full md:w-[350px]">
          <input
            type="text"
            placeholder={`Cari ${partyLabel.toLowerCase()} atau nomor faktur...`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-border rounded-lg pl-4 pr-10 py-2 text-sm bg-background text-foreground outline-none focus:border-primary"
          />
          <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Tabel */}
      <Card className="shadow-xs border-border bg-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-6 py-4 font-semibold">
                  <div className="flex items-center gap-1">
                    Tanggal <ArrowUp className="w-3 h-3 text-muted-foreground" />
                  </div>
                </th>
                <th className="px-6 py-4 font-semibold">No. Faktur</th>
                <th className="px-6 py-4 font-semibold">{partyLabel}</th>
                <th className="px-6 py-4 font-semibold">Jatuh Tempo</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold text-right">Total</th>
                <th className="px-6 py-4 font-semibold text-right">Sisa</th>
                <th className="px-6 py-4 font-semibold text-center w-[120px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                    Memuat data...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground italic">
                    Belum ada data. Klik "Tambah" untuk membuat {title.toLowerCase()} baru.
                  </td>
                </tr>
              ) : (
                filtered.map(row => (
                  <tr key={row.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-muted-foreground">{formatDate(row.date)}</td>
                    <td className="px-6 py-4 font-mono font-medium">{row.reference}</td>
                    <td className="px-6 py-4 font-semibold">{row.customer_name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{formatDate(row.due_date)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          STATUS_STYLE[row.display_status] || STATUS_STYLE.Draft
                        }`}
                      >
                        {STATUS_LABEL[row.display_status] || row.display_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-right">{formatRupiah(row.amount)}</td>
                    <td className="px-6 py-4 font-mono font-medium text-right">
                      {Number(row.outstanding) > 0 ? formatRupiah(row.outstanding) : <span className="text-emerald-600 dark:text-emerald-400">Lunas</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openPayment(row)}
                          disabled={Number(row.outstanding) <= 0}
                          className="p-1.5 hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Catat Pembayaran"
                        >
                          <Wallet className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(row)}
                          className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
                          title="Edit Faktur"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteTarget(row.id)
                            setDeleteOpen(true)
                          }}
                          className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors cursor-pointer"
                          title="Hapus Faktur"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Form faktur */}
      <Dialog
        open={formOpen}
        onOpenChange={open => {
          setFormOpen(open)
          if (!open) setForm(emptyForm())
        }}
      >
        <DialogContent className="!w-[94vw] !max-w-[720px] p-0 overflow-hidden border border-border bg-card shadow-2xl rounded-2xl">
          <div className="bg-primary px-6 py-4">
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {form.id ? `Edit ${title}` : `Tambah ${title} Baru`}
            </DialogTitle>
            <p className="text-xs text-primary-foreground/80 mt-0.5">
              Total faktur dihitung otomatis dari rincian di bawah
            </p>
          </div>

          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">
                  {partyLabel} <span className="text-red-500">*</span>
                </Label>
                <select
                  value={form.contactId}
                  onChange={e => selectContact(e.target.value)}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                >
                  <option value="">Pilih {partyLabel}...</option>
                  {contacts.map(contact => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name}
                      {contact.email ? ` (${contact.email})` : ''}
                    </option>
                  ))}
                </select>
                {contacts.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Belum ada {partyLabel.toLowerCase()}. Tambahkan dulu di menu {partyLabel}.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Nomor Faktur</Label>
                <Input
                  placeholder="Kosongkan untuk nomor otomatis"
                  value={form.reference}
                  onChange={e => setForm({ ...form, reference: e.target.value })}
                  className="w-full bg-background h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">
                  Tanggal <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-background h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">
                  Jatuh Tempo <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={e => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full bg-background h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Status</Label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                >
                  <option value="Draft">Draft</option>
                  <option value="Sent">Terkirim</option>
                  <option value="Cancelled">Dibatalkan</option>
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Status Lunas / Dibayar Sebagian otomatis mengikuti pembayaran yang dicatat.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold">Email {partyLabel}</Label>
                <Input
                  value={form.partyEmail}
                  onChange={e => setForm({ ...form, partyEmail: e.target.value })}
                  className="w-full bg-background h-10"
                />
              </div>
            </div>

            {/* Rincian */}
            <div className="space-y-2 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Rincian Faktur</Label>
                <Button variant="outline" onClick={addItem} className="h-8 px-3 text-xs flex items-center gap-1 cursor-pointer">
                  <Plus className="w-3.5 h-3.5" /> Tambah Baris
                </Button>
              </div>

              <div className="space-y-2">
                {form.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center">
                    <Input
                      placeholder="Deskripsi pekerjaan / barang"
                      value={item.description}
                      onChange={e => updateItem(index, { description: e.target.value })}
                      className="col-span-6 bg-background h-10"
                    />
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={e => updateItem(index, { quantity: parseInt(e.target.value, 10) || 1 })}
                      className="col-span-2 bg-background h-10"
                      title="Qty"
                    />
                    <Input
                      type="number"
                      min={0}
                      value={item.price}
                      onChange={e => updateItem(index, { price: Number(e.target.value) || 0 })}
                      className="col-span-3 bg-background h-10"
                      title="Harga satuan"
                    />
                    <button
                      onClick={() => removeItem(index)}
                      disabled={form.items.length === 1}
                      className="col-span-1 p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Hapus baris"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3 mt-2">
                <span className="text-sm font-medium text-muted-foreground">Total Faktur</span>
                <span className="text-lg font-bold">{formatRupiah(formTotalValue)}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Catatan</Label>
              <Input
                placeholder="Catatan tambahan (opsional)"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                className="w-full bg-background h-10"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <DialogClose render={<Button variant="outline" className="h-10 px-4" />}>Batal</DialogClose>
              <Button
                onClick={handleSave}
                disabled={saving || !form.partyName || formTotalValue <= 0}
                className="bg-primary hover:bg-primary/90 text-white h-10 px-5 font-semibold cursor-pointer"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Form pembayaran */}
      <Dialog
        open={paymentOpen}
        onOpenChange={open => {
          setPaymentOpen(open)
          if (!open) setPaymentInvoice(null)
        }}
      >
        <DialogContent className="!w-[92vw] !max-w-[460px] p-0 overflow-hidden border border-border bg-card shadow-2xl rounded-2xl">
          <div className="bg-primary px-6 py-4">
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Catat Pembayaran
            </DialogTitle>
            <p className="text-xs text-primary-foreground/80 mt-0.5">
              {paymentInvoice?.reference} · sisa {formatRupiah(outstandingValue)}
            </p>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">
                Jumlah (Rp) <span className="text-red-500">*</span>
              </Label>
              <Input
                type="number"
                min={0}
                max={outstandingValue}
                value={paymentForm.amount}
                onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                className="w-full bg-background h-10"
              />
              <p className="text-xs text-muted-foreground">
                Maksimal {formatRupiah(outstandingValue)}
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Tanggal Bayar</Label>
              <Input
                type="date"
                value={paymentForm.paymentDate}
                onChange={e => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                className="w-full bg-background h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Metode</Label>
              <select
                value={paymentForm.method}
                onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value })}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              >
                {PAYMENT_METHODS.map(method => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-semibold">Masuk ke Akun Kas/Bank</Label>
              <select
                value={paymentForm.accountId}
                onChange={e => setPaymentForm({ ...paymentForm, accountId: e.target.value })}
                className="w-full h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              >
                <option value="">Tidak dicatat ke kas</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({formatRupiah(account.balance)})
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Pilih akun agar saldo kas/bank dan laporan arus kas ikut diperbarui.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <DialogClose render={<Button variant="outline" className="h-10 px-4" />}>Batal</DialogClose>
              <Button
                onClick={handlePayment}
                disabled={savingPayment || !paymentForm.amount}
                className="bg-primary hover:bg-primary/90 text-white h-10 px-5 font-semibold cursor-pointer"
              >
                {savingPayment ? 'Menyimpan...' : 'Simpan Pembayaran'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteModal
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        title={`Hapus ${title}`}
        description="Data faktur beserta pembayarannya akan dihapus permanen. Tindakan ini tidak dapat dibatalkan."
        isLoading={deleting}
      />
    </div>
  )
}

export function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
