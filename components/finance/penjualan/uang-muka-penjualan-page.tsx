'use client'

import React, { useState, useEffect } from 'react'
import { useLanguage } from '@/components/language-provider'
import { Search, Download, Plus, Trash2, ArrowUp, Coins } from 'lucide-react'
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
import { getContacts } from '@/app/actions/finance'
import { ConfirmDeleteModal } from '@/components/finance/components/modals'
import { toast } from 'sonner'

interface DownPaymentItem {
  id: string | number
  referensi: string
  tanggal: string
  pelanggan: string
  keterangan: string
  status: 'Menunggu' | 'Diterima' | 'Ditolak'
  total: number
}

const initialDownPayments: DownPaymentItem[] = [
  {
    id: 1,
    referensi: 'DP-2026-001',
    tanggal: '2026-10-21',
    pelanggan: 'PT Mega Terang',
    keterangan: 'DP 50% Produksi 3D Commercial Animation',
    status: 'Diterima',
    total: 12500000
  },
  {
    id: 2,
    referensi: 'DP-2026-002',
    tanggal: '2026-10-23',
    pelanggan: 'CV Kreasi Nusantara',
    keterangan: 'DP 30% Revamp Website & Motion Branding',
    status: 'Menunggu',
    total: 5500000
  }
]

export function UangMukaPenjualanPage() {
  const { t } = useLanguage()
  const [data, setData] = useState<DownPaymentItem[]>(initialDownPayments)
  const [customers, setCustomers] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Semua Status')

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<string | number | null>(null)

  const [formData, setFormData] = useState({
    referensi: '',
    customer: '',
    date: new Date().toISOString().slice(0, 10),
    total: '',
    status: 'Menunggu' as 'Menunggu' | 'Diterima' | 'Ditolak',
    description: ''
  })

  useEffect(() => {
    getContacts({ type: 'CUSTOMER' })
      .then((res) => {
        if (res && res.length > 0) {
          setCustomers(res)
        }
      })
      .catch((err) => console.error('Failed to load customers:', err))
  }, [])

  const resetForm = () => {
    const randomNum = Math.floor(100 + Math.random() * 900)
    setFormData({
      referensi: `DP-2026-${randomNum}`,
      customer: '',
      date: new Date().toISOString().slice(0, 10),
      total: '',
      status: 'Menunggu',
      description: ''
    })
  }

  const handleOpenModal = () => {
    resetForm()
    setIsOpen(true)
  }

  const handleSave = () => {
    if (!formData.customer) {
      toast.error('Silakan pilih pelanggan terlebih dahulu')
      return
    }
    if (!formData.total || parseFloat(formData.total) <= 0) {
      toast.error('Silakan masukkan nominal uang muka yang valid')
      return
    }

    const newItem: DownPaymentItem = {
      id: Date.now(),
      referensi: formData.referensi || `DP-2026-${Math.floor(100 + Math.random() * 900)}`,
      tanggal: formData.date,
      pelanggan: formData.customer,
      keterangan: formData.description || 'Penerimaan Uang Muka Penjualan',
      status: formData.status,
      total: parseFloat(formData.total) || 0
    }

    setData([newItem, ...data])
    setIsOpen(false)
    resetForm()
    toast.success('Uang muka penjualan berhasil ditambahkan!')
  }

  const handleDelete = (id: string | number) => {
    setItemToDelete(id)
    setDeleteModalOpen(true)
  }

  const confirmDelete = () => {
    if (itemToDelete !== null) {
      setData(data.filter((d) => d.id !== itemToDelete))
      toast.success('Data uang muka berhasil dihapus')
      setItemToDelete(null)
    }
  }

  const filteredData = data.filter((item) => {
    const matchSearch =
      item.pelanggan.toLowerCase().includes(search.toLowerCase()) ||
      item.keterangan.toLowerCase().includes(search.toLowerCase()) ||
      item.referensi.toLowerCase().includes(search.toLowerCase())
    const matchStatus =
      statusFilter === 'Semua Status' || item.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="flex flex-col gap-6 pb-8 text-foreground">
      {/* Header & Top Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-4 mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">{t('Sales Down Payment')}</h1>
          <p className="text-sm text-muted-foreground">
            Kelola data uang muka (DP) dari pelanggan untuk proyek dan pesanan
          </p>
        </div>

        <div className="flex items-center gap-3">
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
                  <Coins className="w-5 h-5" />
                  Tambah Uang Muka Penjualan
                </DialogTitle>
                <p className="text-xs text-primary-foreground/80 mt-0.5">
                  Isi data penerimaan deposit / down payment pelanggan
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
                    value={formData.customer}
                    onChange={(e) =>
                      setFormData({ ...formData, customer: e.target.value })
                    }
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
                    Nomor Referensi DP <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Contoh: DP-2026-001"
                    value={formData.referensi}
                    onChange={(e) =>
                      setFormData({ ...formData, referensi: e.target.value })
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

                {/* Total field (Full width) */}
                <div className="space-y-1.5 w-full">
                  <Label className="text-sm font-semibold">
                    Nominal Uang Muka (Rp) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    placeholder="Contoh: 5000000"
                    value={formData.total}
                    onChange={(e) =>
                      setFormData({ ...formData, total: e.target.value })
                    }
                    className="w-full bg-background h-10"
                  />
                </div>

                {/* Status field (Full width) */}
                <div className="space-y-1.5 w-full">
                  <Label className="text-sm font-semibold">Status Uang Muka</Label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as any
                      })
                    }
                    className="w-full h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-ring transition-colors"
                  >
                    <option value="Menunggu">Menunggu Konfirmasi</option>
                    <option value="Diterima">Diterima</option>
                    <option value="Ditolak">Ditolak</option>
                  </select>
                </div>

                {/* Description field (Full width) */}
                <div className="space-y-1.5 w-full">
                  <Label className="text-sm font-semibold">Keterangan / Catatan Proyek</Label>
                  <Input
                    placeholder="Tuliskan rincian pembayaran DP atau nama proyek..."
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
                    disabled={!formData.customer || !formData.total}
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
            <option value="Semua Status">Semua Status</option>
            <option value="Diterima">Diterima</option>
            <option value="Menunggu">Menunggu</option>
            <option value="Ditolak">Ditolak</option>
          </select>
        </div>

        <div className="relative w-full md:w-[350px]">
          <input
            type="text"
            placeholder="Cari pelanggan, referensi, keterangan..."
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
                <th className="px-6 py-4 font-semibold text-foreground">No. Referensi</th>
                <th className="px-6 py-4 font-semibold text-foreground">{t('Customer')}</th>
                <th className="px-6 py-4 font-semibold text-foreground">{t('Description')}</th>
                <th className="px-6 py-4 font-semibold text-foreground">{t('Status')}</th>
                <th className="px-6 py-4 font-semibold text-foreground">
                  <div className="flex items-center gap-1 cursor-pointer">
                    Nominal DP
                    <ArrowUp className="w-3 h-3 text-muted-foreground" />
                  </div>
                </th>
                <th className="px-6 py-4 font-semibold text-foreground text-center w-[60px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground italic">
                    Belum ada data uang muka penjualan yang cocok.
                  </td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-muted-foreground">{row.tanggal}</td>
                    <td className="px-6 py-4 text-foreground font-mono font-medium">{row.referensi}</td>
                    <td className="px-6 py-4 text-foreground font-semibold">
                      {row.pelanggan}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground max-w-[280px] truncate">
                      {row.keterangan}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                          row.status === 'Diterima'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                            : row.status === 'Ditolak'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-foreground font-mono font-medium">
                      Rp {Number(row.total).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDelete(row.id)}
                        className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors cursor-pointer"
                        title="Hapus Data DP"
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
        title="Hapus Uang Muka Penjualan"
        description="Apakah Anda yakin ingin menghapus data uang muka ini? Tindakan ini tidak dapat dibatalkan."
      />
    </div>
  )
}
