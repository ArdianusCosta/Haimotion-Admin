'use client'

import React, { useState, useEffect } from 'react'
import { useLanguage } from '@/components/language-provider'
import { Search, Download, Plus, Trash2, ArrowUp, FileText, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getInvoices, createInvoice, deleteInvoice, getContacts, exportInvoicesCsv } from '@/app/actions/finance'
import { ConfirmDeleteModal } from '@/components/finance/components/modals'
import { toast } from 'sonner'

export function FakturPenjualanPage() {
  const { t } = useLanguage()
  const [data, setData] = useState<any[]>([])
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    reference: '',
    date: new Date().toISOString().slice(0, 10),
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    amount: '',
    status: 'Sent',
    description: ''
  })

  useEffect(() => {
    loadData()
    loadCustomers()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getInvoices()
      setData(res || [])
    } catch (err) {
      console.error('Failed to load invoices:', err)
      toast.error('Gagal memuat data faktur penjualan')
    } finally {
      setLoading(false)
    }
  }

  const loadCustomers = async () => {
    try {
      const res = await getContacts({ type: 'CUSTOMER' })
      if (res && res.length > 0) {
        setCustomers(res)
      }
    } catch (err) {
      console.error('Failed to load customers:', err)
    }
  }

  const resetForm = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    setFormData({
      customerName: '',
      customerEmail: '',
      reference: `INV-2026-${randomNum}`,
      date: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      amount: '',
      status: 'Sent',
      description: ''
    })
  }

  const handleOpenModal = () => {
    resetForm()
    setIsOpen(true)
  }

  const handleSelectCustomer = (custName: string) => {
    const matched = customers.find(c => c.name === custName)
    setFormData(prev => ({
      ...prev,
      customerName: custName,
      customerEmail: matched?.email || ''
    }))
  }

  const handleSave = async () => {
    if (!formData.customerName) {
      toast.error('Silakan pilih pelanggan terlebih dahulu')
      return
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Silakan masukkan total faktur yang valid')
      return
    }

    try {
      await createInvoice({
        reference: formData.reference,
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        date: formData.date,
        dueDate: formData.dueDate,
        amount: parseFloat(formData.amount),
        status: formData.status,
        items: formData.description ? [
          { description: formData.description, quantity: 1, price: parseFloat(formData.amount) }
        ] : []
      })

      toast.success('Faktur penjualan berhasil dibuat!')
      setIsOpen(false)
      resetForm()
      loadData()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Gagal menyimpan faktur penjualan')
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
        await deleteInvoice(itemToDelete)
        toast.success('Faktur penjualan berhasil dihapus')
        loadData()
        setItemToDelete(null)
      } catch (err) {
        console.error(err)
        toast.error('Gagal menghapus faktur penjualan')
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const handleExport = async () => {
    try {
      const csv = await exportInvoicesCsv()
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.setAttribute('download', `Faktur_Penjualan_${new Date().toISOString().slice(0,10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Data faktur berhasil diekspor ke CSV')
    } catch (err) {
      console.error(err)
      toast.error('Gagal mengekspor data faktur')
    }
  }

  const filteredData = data.filter((item) => {
    const cust = item.customer_name || ''
    const ref = item.reference || ''
    const matchSearch =
      cust.toLowerCase().includes(search.toLowerCase()) ||
      ref.toLowerCase().includes(search.toLowerCase())
    const matchStatus =
      statusFilter === 'All' || item.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="flex flex-col gap-6 pb-8 text-foreground">
      {/* Header & Top Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-4 mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">{t('Sales Invoice')}</h1>
          <p className="text-sm text-muted-foreground">
            Kelola faktur penjualan, tagihan pelanggan, dan status pembayaran
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleExport}
            className="border-border text-foreground hover:bg-muted flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </Button>

          <Dialog
            open={isOpen}
            onOpenChange={(val) => {
              setIsOpen(val)
              if (!val) resetForm()
            }}
          >
            <DialogTrigger
              render={
                <Button
                  onClick={handleOpenModal}
                  className="bg-primary hover:bg-primary/90 text-white flex items-center gap-2 cursor-pointer"
                />
              }
            >
              <Plus className="w-4 h-4" />
              <span>{t('Add')}</span>
            </DialogTrigger>

            <DialogContent className="!w-[92vw] !max-w-[560px] p-0 overflow-hidden border border-border bg-card shadow-2xl rounded-2xl">
              <div className="bg-primary px-6 py-4">
                <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Tambah Faktur Penjualan Baru
                </DialogTitle>
                <p className="text-xs text-primary-foreground/80 mt-0.5">
                  Isi rincian faktur penjualan untuk pelanggan
                </p>
              </div>

              {/* Form with all fields spanning 100% full width (columnspan full) */}
              <div className="p-6 space-y-4">
                {/* Customer field (Full width) */}
                <div className="space-y-1.5 w-full">
                  <Label className="text-sm font-semibold">
                    {t('Customer')} <span className="text-red-500">*</span>
                  </Label>
                  <select
                    value={formData.customerName}
                    onChange={(e) => handleSelectCustomer(e.target.value)}
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-ring transition-colors"
                  >
                    <option value="">Pilih Pelanggan...</option>
                    {customers.length > 0 ? (
                      customers.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name} {c.email ? `(${c.email})` : ''}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="PT Mega Terang">PT Mega Terang</option>
                        <option value="CV Kreasi Nusantara">CV Kreasi Nusantara</option>
                        <option value="PT Digital Solusindo">PT Digital Solusindo</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Reference field (Full width) */}
                <div className="space-y-1.5 w-full">
                  <Label className="text-sm font-semibold">
                    Nomor Faktur / Referensi <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Contoh: INV-2026-0001"
                    value={formData.reference}
                    onChange={(e) =>
                      setFormData({ ...formData, reference: e.target.value })
                    }
                    className="w-full bg-background h-10"
                  />
                </div>

                {/* Date field (Full width) */}
                <div className="space-y-1.5 w-full">
                  <Label className="text-sm font-semibold">
                    {t('Date')} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full bg-background h-10"
                  />
                </div>

                {/* Due Date field (Full width) */}
                <div className="space-y-1.5 w-full">
                  <Label className="text-sm font-semibold">
                    Jatuh Tempo <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                    className="w-full bg-background h-10"
                  />
                </div>

                {/* Amount field (Full width) */}
                <div className="space-y-1.5 w-full">
                  <Label className="text-sm font-semibold">
                    Total Faktur (Rp) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    placeholder="Contoh: 15000000"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="w-full bg-background h-10"
                  />
                </div>

                {/* Status field (Full width) */}
                <div className="space-y-1.5 w-full">
                  <Label className="text-sm font-semibold">Status Faktur</Label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-ring transition-colors"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Terkirim (Sent)</option>
                    <option value="Paid">Lunas (Paid)</option>
                    <option value="Overdue">Jatuh Tempo (Overdue)</option>
                  </select>
                </div>

                {/* Description field (Full width) */}
                <div className="space-y-1.5 w-full">
                  <Label className="text-sm font-semibold">Keterangan / Rincian Faktur</Label>
                  <Input
                    placeholder="Tuliskan keterangan pekerjaan atau catatan faktur..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full bg-background h-10"
                  />
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
                  <DialogClose
                    render={<Button variant="outline" className="h-10 px-4" />}
                  >
                    Batal
                  </DialogClose>
                  <Button
                    onClick={handleSave}
                    disabled={!formData.customerName || !formData.amount}
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
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground outline-none min-w-[140px]"
          >
            <option value="All">Semua Status</option>
            <option value="Paid">Lunas (Paid)</option>
            <option value="Sent">Terkirim (Sent)</option>
            <option value="Draft">Draft</option>
            <option value="Overdue">Jatuh Tempo (Overdue)</option>
          </select>
        </div>

        <div className="relative w-full md:w-[350px]">
          <input
            type="text"
            placeholder="Cari pelanggan atau nomor faktur..."
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
                <th className="px-6 py-4 font-semibold text-foreground">
                  <div className="flex items-center gap-1 cursor-pointer">
                    {t('Date')}
                    <ArrowUp className="w-3 h-3 text-muted-foreground" />
                  </div>
                </th>
                <th className="px-6 py-4 font-semibold text-foreground">No. Faktur</th>
                <th className="px-6 py-4 font-semibold text-foreground">{t('Customer')}</th>
                <th className="px-6 py-4 font-semibold text-foreground">Jatuh Tempo</th>
                <th className="px-6 py-4 font-semibold text-foreground">{t('Status')}</th>
                <th className="px-6 py-4 font-semibold text-foreground">
                  <div className="flex items-center gap-1 cursor-pointer">
                    {t('Total')}
                    <ArrowUp className="w-3 h-3 text-muted-foreground" />
                  </div>
                </th>
                <th className="px-6 py-4 font-semibold text-foreground text-center w-[60px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                    Memuat data faktur...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground italic">
                    Belum ada data faktur penjualan yang cocok.
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-muted-foreground">
                      {row.date ? new Date(row.date).toISOString().slice(0, 10) : '-'}
                    </td>
                    <td className="px-6 py-4 text-foreground font-mono font-medium">
                      {row.reference}
                    </td>
                    <td className="px-6 py-4 text-foreground font-semibold">
                      {row.customer_name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {row.due_date ? new Date(row.due_date).toISOString().slice(0, 10) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          row.status === 'Paid'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : row.status === 'Sent'
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                            : row.status === 'Overdue'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {row.status === 'Paid' ? 'Lunas' : row.status === 'Sent' ? 'Terkirim' : row.status === 'Overdue' ? 'Jatuh Tempo' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-foreground font-mono font-medium">
                      Rp {Number(row.amount).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors cursor-pointer"
                        title="Hapus Faktur"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ConfirmDeleteModal 
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onConfirm={confirmDelete}
        title="Hapus Faktur Penjualan"
        description="Apakah Anda yakin ingin menghapus data faktur penjualan ini? Tindakan ini tidak dapat dibatalkan."
        isLoading={isDeleting}
      />
    </div>
  )
}
