'use server'

import prisma from '@/lib/prisma'
import { requireAuth, requirePermission } from '@/lib/auth/authorization'
import { logActivity } from '@/lib/activity-log'
import type { FinanceReportKind } from '@/types/finance'
import { PostingEngine, COA_CODES } from '@/lib/finance-posting-engine'

/**
 * Modul Finance.
 *
 * Satu tabel (`finance_invoices`) dipakai untuk faktur penjualan maupun faktur
 * pembelian, dibedakan lewat kolom `type`. Ini menghindari duplikasi model,
 * aksi, dan UI untuk dokumen yang strukturnya sama.
 */

export type InvoiceType = 'SALES' | 'PURCHASE'

const EPSILON = 0.005
const round2 = (value: number) => Math.round((Number(value) || 0) * 100) / 100

/** Status yang dianggap final sehingga tidak boleh berubah sendiri jadi "Overdue". */
const CLOSED_STATUSES = ['Paid', 'Cancelled', 'Draft']

async function currentUserId(): Promise<number> {
  const auth = await requireAuth()
  return typeof auth.id === 'string' ? parseInt(auth.id, 10) : auth.id
}

function normalizeType(type?: string | null): InvoiceType {
  return type === 'PURCHASE' ? 'PURCHASE' : 'SALES'
}

function startOfToday() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

/**
 * Status efektif sebuah faktur. Faktur yang sudah jatuh tempo tapi belum lunas
 * ditampilkan sebagai "Overdue" tanpa perlu mengubah data di database.
 */
function deriveStatus(invoice: { status: string; due_date: Date | string }): string {
  if (CLOSED_STATUSES.includes(invoice.status)) return invoice.status
  const due = new Date(invoice.due_date)
  if (due.getTime() < startOfToday().getTime()) return 'Overdue'
  return invoice.status
}

/** Nomor dokumen berurutan per jenis per tahun, mis. INV-2026-0001 / PIB-2026-0001. */
async function generateInvoiceReference(type: InvoiceType): Promise<string> {
  const prefix = type === 'PURCHASE' ? 'PIB' : 'INV'
  const year = new Date().getFullYear()
  const base = `${prefix}-${year}-`
  const last = await prisma.financeInvoice.findFirst({
    where: { reference: { startsWith: base } },
    orderBy: { reference: 'desc' },
    select: { reference: true }
  })
  const parsed = last ? parseInt(last.reference.slice(base.length), 10) : 0
  return `${base}${String((Number.isNaN(parsed) ? 0 : parsed) + 1).padStart(4, '0')}`
}

function toCSV(records: any[]) {
  if (records.length === 0) return ''
  const headers = Object.keys(records[0])
  const rows = [headers.join(',')]
  for (const row of records) {
    const values = headers.map(h => {
      let val = row[h]
      if (val === null || val === undefined) val = ''
      const str = String(val)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    })
    rows.push(values.join(','))
  }
  return rows.join('\n')
}

function fromCSV(csv: string) {
  const lines = csv.split('\n').filter(l => l.trim() !== '')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const records = []
  for (let i = 1; i < lines.length; i++) {
    // Parser sederhana: cukup untuk CSV tanpa koma di dalam tanda kutip.
    const values = lines[i].split(',')
    const record: any = {}
    headers.forEach((h, idx) => {
      let val = values[idx]?.trim() || ''
      val = val.replace(/^"|"$/g, '')
      record[h] = val
    })
    records.push(record)
  }
  return records
}

/** Hitung total faktur dari rincian item. Mengembalikan null jika tidak ada item. */
function sumItems(items?: Array<{ quantity?: number | string; price?: number | string }> | null): number | null {
  if (!items || items.length === 0) return null
  return round2(
    items.reduce((total, item) => {
      const qty = Number(item.quantity) || 0
      const price = Number(item.price) || 0
      return total + qty * price
    }, 0)
  )
}

/** Status faktur baru tidak boleh langsung "Paid" sebelum ada pembayaran tercatat. */
function initialStatus(status?: string | null): string {
  const value = (status || 'Draft').trim()
  if (value === 'Paid') return 'Sent'
  return value
}

/** Cari id master kategori berdasarkan nama. Null bila belum terdaftar. */
async function resolveCategoryId(name: string): Promise<number | null> {
  const category = await prisma.financeCategory.findFirst({ where: { name } })
  return category?.id ?? null
}

// -----------------------------------------------------------------------------
// OVERVIEW & SUMMARY
// -----------------------------------------------------------------------------
export async function getFinanceSummary() {
  const user = await requireAuth()
  requirePermission(user, 'finance.view')

  const today = startOfToday()
  const year = new Date().getFullYear()
  const yearStart = new Date(year, 0, 1)
  const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999)

  const [
    salesInvoices,
    purchaseInvoices,
    paidExpenses,
    accounts,
    unpaidInvoices,
    paidInvoicesCount,
    payments,
    recentTransactions,
    totalTransactionsCount,
    yearExpenses
  ] = await Promise.all([
    prisma.financeInvoice.findMany({
      where: { type: 'SALES', status: { not: 'Cancelled' } },
      select: { amount: true, status: true, date: true, due_date: true, payments: { select: { amount: true } } }
    }),
    prisma.financeInvoice.findMany({
      where: { type: 'PURCHASE', status: { not: 'Cancelled' } },
      select: { amount: true, status: true, date: true, due_date: true, payments: { select: { amount: true } } }
    }),
    prisma.financeExpense.aggregate({ _sum: { amount: true }, where: { status: 'Paid' } }),
    prisma.financeAccount.aggregate({ _sum: { balance: true }, where: { type: { in: ['Cash', 'Bank'] } } }),
    // Faktur penjualan yang belum lunas (termasuk yang sudah lewat jatuh tempo)
    prisma.financeInvoice.findMany({
      where: { type: 'SALES', status: { notIn: ['Paid', 'Cancelled'] } },
      select: { amount: true, status: true, due_date: true, payments: { select: { amount: true } } }
    }),
    prisma.financeInvoice.count({ where: { type: 'SALES', status: 'Paid' } }),
    prisma.financePayment.findMany({
      where: { payment_date: { gte: yearStart, lte: yearEnd } },
      select: { amount: true, payment_date: true, invoice: { select: { type: true } } }
    }),
    prisma.financeTransaction.findMany({
      orderBy: { date: 'desc' },
      take: 15,
      include: { account: { select: { name: true } } }
    }),
    prisma.financeTransaction.count(),
    prisma.financeExpense.findMany({
      where: { status: 'Paid', date: { gte: yearStart, lte: yearEnd } },
      select: { amount: true, date: true }
    })
  ])

  const paidOf = (invoice: { payments: Array<{ amount: number }> }) =>
    (invoice.payments || []).reduce((sum, p) => sum + p.amount, 0)

  /**
   * Nilai yang diakui = total pembayaran yang tercatat; untuk data lama yang
   * statusnya sudah "Paid" tetapi belum punya baris pembayaran, pakai nilai faktur.
   */
  const recognizedOf = (invoice: { amount: number; status: string; payments: Array<{ amount: number }> }) => {
    const paid = paidOf(invoice)
    if (paid > 0) return paid
    return invoice.status === 'Paid' ? invoice.amount : 0
  }

  // Pendapatan diakui dari pembayaran faktur penjualan, biaya dari faktur pembelian.
  const totalRevenue = round2(salesInvoices.reduce((sum, i) => sum + recognizedOf(i), 0))
  const purchaseCost = round2(purchaseInvoices.reduce((sum, i) => sum + recognizedOf(i), 0))
  const operatingExpenses = round2(paidExpenses._sum.amount || 0)
  const totalExpenses = round2(purchaseCost + operatingExpenses)

  // Piutang Usaha (Outstanding Receivables / Faktur Penjualan belum lunas)
  const outstandingInvoices = round2(
    unpaidInvoices.reduce((sum, i) => sum + Math.max(0, i.amount - paidOf(i)), 0)
  )
  const overdueInvoicesCount = unpaidInvoices.filter(i => deriveStatus(i) === 'Overdue').length

  // Utang Usaha (Outstanding Payables / Faktur Pembelian belum lunas)
  const unpaidPurchases = purchaseInvoices.filter(i => !['Paid', 'Cancelled'].includes(i.status))
  const outstandingPayables = round2(
    unpaidPurchases.reduce((sum, i) => sum + Math.max(0, i.amount - paidOf(i)), 0)
  )
  const outstandingPayablesCount = unpaidPurchases.length

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(year, i).toLocaleString('id-ID', { month: 'short' })
    return {
      name: month,
      income: 0,
      expenses: 0,
      profit: 0,
      cashFlow: 0,
      receivables: 0,
      payables: 0
    }
  })

  // Arus kas per bulan diambil dari transaksi pembayaran kas/bank
  payments.forEach(payment => {
    const monthIndex = new Date(payment.payment_date).getMonth()
    if (monthIndex < 0 || monthIndex > 11) return
    if (payment.invoice?.type === 'PURCHASE') {
      monthlyData[monthIndex].expenses += payment.amount
    } else {
      monthlyData[monthIndex].income += payment.amount
    }
  })

  // Tambahkan beban operasional yang lunas ke pengeluaran bulanan
  yearExpenses.forEach(exp => {
    const monthIndex = new Date(exp.date).getMonth()
    if (monthIndex >= 0 && monthIndex < 12) {
      monthlyData[monthIndex].expenses += exp.amount
    }
  })

  // Akumulasi tren tagihan piutang dan utang per bulan
  salesInvoices.forEach(inv => {
    if (inv.date) {
      const monthIndex = new Date(inv.date).getMonth()
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyData[monthIndex].receivables += inv.amount
      }
    }
  })

  purchaseInvoices.forEach(inv => {
    if (inv.date) {
      const monthIndex = new Date(inv.date).getMonth()
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyData[monthIndex].payables += inv.amount
      }
    }
  })

  // Finalisasi nilai per bulan
  monthlyData.forEach(m => {
    m.income = round2(m.income)
    m.expenses = round2(m.expenses)
    m.profit = round2(m.income - m.expenses)
    m.cashFlow = round2(m.income - m.expenses)
    m.receivables = round2(m.receivables)
    m.payables = round2(m.payables)
  })

  return {
    totalRevenue,
    totalExpenses,
    purchaseCost,
    operatingExpenses,
    netProfit: round2(totalRevenue - totalExpenses),
    outstandingInvoices,
    outstandingInvoicesCount: unpaidInvoices.length,
    outstandingPayables,
    outstandingPayablesCount,
    overdueInvoicesCount,
    paidInvoicesCount,
    totalTransactionsCount,
    cashAndBank: round2(accounts._sum.balance || 0),
    monthlyData,
    recentTransactions: recentTransactions.map(tx => {
      const isSales = tx.reference?.startsWith('INV')
      const isPurchase = tx.reference?.startsWith('PIB')
      const isExpense = tx.reference?.startsWith('EXP')
      let category = 'Umum'
      if (isSales) category = 'Penjualan'
      else if (isPurchase) category = 'Pembelian'
      else if (isExpense) category = 'Beban Operasional'
      else if (tx.type === 'Income') category = 'Pemasukan'
      else if (tx.type === 'Expense') category = 'Pengeluaran'
      else if (tx.type === 'Transfer') category = 'Transfer Kas'

      return {
        id: tx.id,
        date: tx.date,
        description: tx.description,
        type: tx.type,
        amount: tx.amount,
        reference: tx.reference,
        account: tx.account?.name || 'Kas/Bank',
        category,
        status: 'Completed'
      }
    }),
    today
  }
}

// -----------------------------------------------------------------------------
// INVOICES (faktur penjualan & pembelian)
// -----------------------------------------------------------------------------
export async function getInvoices(filters?: { type?: InvoiceType | string; status?: string; search?: string }) {
  const user = await requireAuth()
  requirePermission(user, 'finance.view')

  const conditions: any[] = [{ type: normalizeType(filters?.type) }]

  if (filters?.status && filters.status !== 'All') {
    if (filters.status === 'Overdue') {
      conditions.push({
        OR: [
          { status: 'Overdue' },
          {
            AND: [
              { status: { in: ['Sent', 'Unpaid', 'Partial'] } },
              { due_date: { lt: startOfToday() } }
            ]
          }
        ]
      })
    } else {
      conditions.push({ status: filters.status })
    }
  }

  if (filters?.search) {
    conditions.push({
      OR: [
        { customer_name: { contains: filters.search } },
        { reference: { contains: filters.search } }
      ]
    })
  }

  const invoices = await prisma.financeInvoice.findMany({
    where: { AND: conditions },
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
    include: {
      items: true,
      payments: { orderBy: { payment_date: 'desc' } },
      contact: { select: { id: true, name: true, email: true, phone: true } }
    }
  })

  return invoices.map(invoice => {
    const paid = round2((invoice.payments || []).reduce((sum, p) => sum + p.amount, 0))
    return {
      ...invoice,
      paid_amount: paid,
      outstanding: round2(Math.max(0, invoice.amount - paid)),
      display_status: deriveStatus(invoice)
    }
  })
}

export async function createInvoice(data: any) {
  const _u = await requireAuth(); requirePermission(_u, 'finance.create')
  const uid = await currentUserId()
  const type = normalizeType(data.type)

  const partyName = (data.customerName || data.partyName || '').trim()
  if (!partyName) {
    throw new Error(type === 'PURCHASE' ? 'Pemasok wajib dipilih.' : 'Pelanggan wajib dipilih.')
  }

  if (!data.date) throw new Error('Tanggal faktur wajib diisi.')
  const date = new Date(data.date)
  const dueDate = data.dueDate ? new Date(data.dueDate) : new Date(date.getTime() + 14 * 24 * 60 * 60 * 1000)
  if (Number.isNaN(date.getTime())) throw new Error('Tanggal faktur tidak valid.')
  if (Number.isNaN(dueDate.getTime())) throw new Error('Tanggal jatuh tempo tidak valid.')
  if (dueDate < date) throw new Error('Jatuh tempo tidak boleh lebih awal dari tanggal faktur.')

  const items = Array.isArray(data.items)
    ? data.items
        .filter((item: any) => item && (item.description || '').trim() !== '')
        .map((item: any) => ({
          description: String(item.description).trim(),
          quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
          price: Math.max(0, Number(item.price) || 0)
        }))
    : []

  // Total selalu dihitung ulang dari rincian item bila item tersedia,
  // supaya angka header tidak pernah berbeda dari barisnya.
  const itemsTotal = sumItems(items)
  const amount = itemsTotal !== null ? itemsTotal : round2(Number(data.amount))
  if (!amount || amount <= 0) throw new Error('Total faktur harus lebih besar dari 0.')

  let contactId: number | null = null
  if (data.contactId) {
    const contact = await prisma.financeContact.findUnique({ where: { id: Number(data.contactId) } })
    if (contact) {
      const expectedType = type === 'PURCHASE' ? 'SUPPLIER' : 'CUSTOMER'
      if (contact.type && contact.type !== expectedType) {
        throw new Error(`Kontak "${contact.name}" bukan ${expectedType === 'SUPPLIER' ? 'pemasok' : 'pelanggan'}.`)
      }
      contactId = contact.id
    }
  }

  let reference = (data.reference || '').trim()
  if (!reference) reference = await generateInvoiceReference(type)

  // Nomor dokumen harus unik; bila bentrok, ambil nomor berikutnya.
  for (let attempt = 0; attempt < 3; attempt++) {
    const existing = await prisma.financeInvoice.findUnique({ where: { reference } })
    if (!existing) break
    if (attempt === 2) throw new Error(`Nomor faktur "${reference}" sudah dipakai.`)
    reference = await generateInvoiceReference(type)
  }

  const invoice = await prisma.financeInvoice.create({
    data: {
      reference,
      type,
      contact_id: contactId,
      customer_name: partyName,
      customer_email: data.customerEmail || null,
      date,
      due_date: dueDate,
      amount,
      status: initialStatus(data.status),
      notes: data.notes || data.description || null,
      created_by: uid,
      items: {
        create: items.length > 0 ? items : [{ description: data.description || 'Faktur', quantity: 1, price: amount }]
      }
    },
    include: { items: true, payments: true }
  })

  await logActivity({
    userId: uid,
    activityType: 'create',
    description: `Created ${type === 'PURCHASE' ? 'purchase' : 'sales'} invoice: ${invoice.reference}`
  })

  return invoice
}

export async function updateInvoice(id: number, data: any) {
  const _u = await requireAuth(); requirePermission(_u, 'finance.update')
  const uid = await currentUserId()
  const existing = await prisma.financeInvoice.findUnique({
    where: { id },
    select: { id: true, type: true, amount: true, reference: true, payments: { select: { amount: true } } }
  })
  if (!existing) throw new Error('Faktur tidak ditemukan.')

  const paid = round2((existing.payments || []).reduce((sum, p) => sum + p.amount, 0))

  const updateData: any = {}

  if (data.reference !== undefined) {
    const reference = String(data.reference).trim()
    if (!reference) throw new Error('Nomor faktur wajib diisi.')
    if (reference !== existing.reference) {
      const duplicate = await prisma.financeInvoice.findUnique({ where: { reference } })
      if (duplicate) throw new Error(`Nomor faktur "${reference}" sudah dipakai.`)
      updateData.reference = reference
    }
  }

  if (data.customerName !== undefined || data.partyName !== undefined) {
    const partyName = String(data.customerName ?? data.partyName ?? '').trim()
    if (!partyName) throw new Error('Nama pelanggan/pemasok wajib diisi.')
    updateData.customer_name = partyName
  }

  if (data.customerEmail !== undefined) updateData.customer_email = data.customerEmail || null
  if (data.notes !== undefined) updateData.notes = data.notes || null
  if (data.contactId !== undefined) updateData.contact_id = data.contactId ? Number(data.contactId) : null

  if (data.date) {
    const date = new Date(data.date)
    if (Number.isNaN(date.getTime())) throw new Error('Tanggal faktur tidak valid.')
    updateData.date = date
  }
  if (data.dueDate) {
    const dueDate = new Date(data.dueDate)
    if (Number.isNaN(dueDate.getTime())) throw new Error('Tanggal jatuh tempo tidak valid.')
    updateData.due_date = dueDate
  }
  if (updateData.date && updateData.due_date && updateData.due_date < updateData.date) {
    throw new Error('Jatuh tempo tidak boleh lebih awal dari tanggal faktur.')
  }

  const items: Array<{ description: string; quantity: number; price: number }> | null = Array.isArray(data.items)
    ? data.items
        .filter((item: any) => item && (item.description || '').trim() !== '')
        .map((item: any) => ({
          description: String(item.description).trim(),
          quantity: Math.max(1, parseInt(item.quantity, 10) || 1),
          price: Math.max(0, Number(item.price) || 0)
        }))
    : null

  const itemsTotal = sumItems(items)
  if (itemsTotal !== null) {
    updateData.amount = itemsTotal
  } else if (data.amount !== undefined) {
    updateData.amount = round2(Number(data.amount))
  }

  if (updateData.amount !== undefined) {
    if (!updateData.amount || updateData.amount <= 0) throw new Error('Total faktur harus lebih besar dari 0.')
    if (updateData.amount + EPSILON < paid) {
      throw new Error(`Total faktur tidak boleh lebih kecil dari pembayaran yang sudah masuk (Rp ${paid.toLocaleString('id-ID')}).`)
    }
  }

  if (data.status !== undefined) updateData.status = initialStatus(data.status)

  // Status otomatis mengikuti jumlah pembayaran bila total berubah.
  if (updateData.amount !== undefined && data.status === undefined && existing.type) {
    if (paid >= updateData.amount - EPSILON) updateData.status = 'Paid'
    else if (paid > 0) updateData.status = 'Partial'
  }

  const invoice = await prisma.$transaction(async tx => {
    if (items && items.length > 0) {
      await tx.financeInvoiceItem.deleteMany({ where: { invoice_id: id } })
      await tx.financeInvoiceItem.createMany({
        data: items.map(item => ({ ...item, invoice_id: id }))
      })
    }
    return tx.financeInvoice.update({
      where: { id },
      data: updateData,
      include: { items: true, payments: true }
    })
  })

  await logActivity({
    userId: uid,
    activityType: 'update',
    description: `Updated invoice: ${invoice.reference}`
  })

  return invoice
}

export async function deleteInvoice(id: number) {
  const _u = await requireAuth(); requirePermission(_u, 'finance.delete')
  const uid = await currentUserId()

  const invoice = await prisma.financeInvoice.findUnique({ where: { id } })
  if (!invoice) throw new Error('Faktur tidak ditemukan.')

  if (invoice.status !== 'Draft') {
    throw new Error(
      `Faktur berstatus "${invoice.status}" tidak boleh dihapus secara permanen. Gunakan fitur Batalkan Faktur agar riwayat audit akuntansi tetap terjaga.`
    )
  }

  await prisma.$transaction(async tx => {
    await tx.financeInvoiceItem.deleteMany({ where: { invoice_id: id } })
    await tx.financeInvoice.delete({ where: { id } })
  })

  await logActivity({
    userId: uid,
    activityType: 'delete',
    description: `Deleted invoice: ${invoice.reference}`
  })

  return invoice
}

/**
 * Batalkan faktur secara akuntansi tanpa menghapus jejak audit.
 * Jika invoice sudah pernah dibayar, lakukan transaksi pembalik (reversal)
 * pada rekening kas/bank terkait.
 */
export async function cancelInvoice(data: { invoiceId: number; reason: string }) {
  const _u = await requireAuth(); requirePermission(_u, 'finance.update')
  const uid = await currentUserId()
  const reason = (data.reason || '').trim()
  if (!reason) throw new Error('Alasan pembatalan wajib diisi.')

  const invoice = await prisma.financeInvoice.findUnique({
    where: { id: Number(data.invoiceId) },
    include: { payments: true }
  })
  if (!invoice) throw new Error('Faktur tidak ditemukan.')
  if (invoice.status === 'Cancelled') throw new Error('Faktur ini sudah dibatalkan.')

  const isSales = invoice.type !== 'PURCHASE'
  const paidPayments = invoice.payments || []

  const result = await prisma.$transaction(async (tx) => {
    // Jika ada pembayaran yang sudah masuk ke rekening kas/bank, balikkan saldo rekening
    // dengan mencatat transaksi reversal (tanpa menghapus riwayat pembayaran)
    for (const payment of paidPayments) {
      const linkedTxs = await tx.financeTransaction.findMany({
        where: {
          reference: invoice.reference,
          amount: payment.amount
        }
      })

      for (const linkedTx of linkedTxs) {
        if (linkedTx.account_id) {
          const reversalType = linkedTx.type === 'Income' ? 'Expense' : 'Income'
          const reversalDelta = linkedTx.type === 'Income' ? -linkedTx.amount : linkedTx.amount

          await tx.financeTransaction.create({
            data: {
              date: new Date(),
              description: `[REVERSAL PEMBATALAN] ${isSales ? 'Pengembalian' : 'Koreksi'} faktur ${invoice.reference} (${invoice.customer_name}) - Alasan: ${reason}`,
              type: reversalType,
              amount: linkedTx.amount,
              reference: `REV-${invoice.reference}`,
              account_id: linkedTx.account_id,
              created_by: uid
            }
          })

          await tx.financeAccount.update({
            where: { id: linkedTx.account_id },
            data: { balance: { increment: reversalDelta } }
          })
        }
      }
    }

    const updated = await tx.financeInvoice.update({
      where: { id: invoice.id },
      data: {
        status: 'Cancelled',
        notes: invoice.notes
          ? `${invoice.notes}\n[Dibatalkan oleh User #${uid} pada ${new Date().toISOString()}: ${reason}]`
          : `[Dibatalkan oleh User #${uid} pada ${new Date().toISOString()}: ${reason}]`
      }
    })

    return updated
  })

  await logActivity({
    userId: uid,
    activityType: 'update',
    description: `Cancelled ${invoice.type === 'PURCHASE' ? 'purchase' : 'sales'} invoice: ${invoice.reference} - Alasan: ${reason}`
  })

  return result
}

export async function exportInvoicesCsv(type?: InvoiceType | string) {
  const user = await requireAuth()
  requirePermission(user, 'finance.export')
  const invoiceType = normalizeType(type)
  const invoices = await prisma.financeInvoice.findMany({
    where: { type: invoiceType },
    orderBy: { created_at: 'desc' },
    include: { payments: { select: { amount: true } } }
  })

  const records = invoices.map(i => {
    const paid = (i.payments || []).reduce((sum, p) => sum + p.amount, 0)
    return {
      Reference: i.reference,
      [invoiceType === 'PURCHASE' ? 'Supplier' : 'Customer']: i.customer_name,
      Email: i.customer_email || '',
      Date: i.date.toISOString().split('T')[0],
      DueDate: i.due_date.toISOString().split('T')[0],
      Amount: i.amount,
      Paid: round2(paid),
      Outstanding: round2(Math.max(0, i.amount - paid)),
      Status: deriveStatus(i)
    }
  })

  return toCSV(records)
}

// -----------------------------------------------------------------------------
// INVOICE PAYMENTS
// -----------------------------------------------------------------------------
/**
 * Catat pembayaran faktur. Sekaligus:
 *  - memperbarui status faktur (Lunas / Sebagian),
 *  - mencatat transaksi kas/bank bila `accountId` dipilih, sehingga saldo
 *    akun dan laporan arus kas ikut benar.
 */
export async function recordInvoicePayment(data: {
  invoiceId: number
  amount: number
  paymentDate?: string
  method?: string
  reference?: string
  notes?: string
  accountId?: number | null
}) {
  const _u = await requireAuth(); requirePermission(_u, 'finance.update')
  const uid = await currentUserId()
  const amount = round2(Number(data.amount))

  if (!data.invoiceId) throw new Error('Faktur tidak dipilih.')
  if (!amount || amount <= 0) throw new Error('Jumlah pembayaran harus lebih besar dari 0.')

  const invoice = await prisma.financeInvoice.findUnique({
    where: { id: Number(data.invoiceId) },
    include: { payments: { select: { amount: true } } }
  })
  if (!invoice) throw new Error('Faktur tidak ditemukan.')

  const paidBefore = round2((invoice.payments || []).reduce((sum, p) => sum + p.amount, 0))
  const outstanding = round2(invoice.amount - paidBefore)
  if (outstanding <= EPSILON) throw new Error('Faktur ini sudah lunas.')
  if (amount > outstanding + EPSILON) {
    throw new Error(`Jumlah pembayaran melebihi sisa tagihan (Rp ${outstanding.toLocaleString('id-ID')}).`)
  }

  const paymentDate = data.paymentDate ? new Date(data.paymentDate) : new Date()
  if (Number.isNaN(paymentDate.getTime())) throw new Error('Tanggal pembayaran tidak valid.')

  if (!data.accountId) {
    throw new Error('Rekening kas/bank tujuan pembayaran wajib dipilih.')
  }
  const account = await prisma.financeAccount.findUnique({ where: { id: Number(data.accountId) } })
  if (!account) throw new Error('Akun kas/bank tidak ditemukan.')
  const accountId = account.id

  const paidAfter = round2(paidBefore + amount)
  const isFullyPaid = paidAfter >= invoice.amount - EPSILON
  const nextStatus = isFullyPaid ? 'Paid' : 'Partial'

  const result = await prisma.$transaction(async tx => {
    const payment = await tx.financePayment.create({
      data: {
        invoice_id: invoice.id,
        account_id: accountId,
        amount,
        payment_date: paymentDate,
        payment_method: data.method || 'Transfer',
        reference: data.reference || invoice.reference,
        notes: data.notes || null
      }
    })

    const updatedInvoice = await tx.financeInvoice.update({
      where: { id: invoice.id },
      data: { status: nextStatus }
    })

    // Dampak kas hanya dicatat bila pengguna memilih akun.
    if (accountId) {
      const isIncome = invoice.type !== 'PURCHASE'
      await tx.financeTransaction.create({
        data: {
          date: paymentDate,
          description: `${isIncome ? 'Penerimaan' : 'Pembayaran'} faktur ${invoice.reference} (${invoice.customer_name})`,
          type: isIncome ? 'Income' : 'Expense',
          amount,
          reference: invoice.reference,
          account_id: accountId,
          created_by: uid
        }
      })
      await tx.financeAccount.update({
        where: { id: accountId },
        data: { balance: { increment: isIncome ? amount : -amount } }
      })

      // Posting Double-Entry General Ledger
      try {
        const bankCoaId = account.coa_id || (await PostingEngine.resolveCOAId(tx, account.type === 'Cash' ? COA_CODES.KAS_UTAMA : COA_CODES.BANK_BCA))
        if (isIncome) {
          const piutangCoaId = await PostingEngine.resolveCOAId(tx, COA_CODES.PIUTANG_USAHA)
          await PostingEngine.postJournal(tx, {
            entryDate: paymentDate,
            sourceType: 'SALES_PAYMENT',
            sourceId: payment.id,
            postingType: 'ORIGINAL',
            eventId: `PAY-${payment.id}`,
            referenceNo: invoice.reference,
            description: `Penerimaan Pembayaran Faktur ${invoice.reference} (${invoice.customer_name})`,
            lines: [
              { coa_id: bankCoaId, debit: amount, credit: 0, line_memo: `Kas masuk ${account.name}` },
              { coa_id: piutangCoaId, debit: 0, credit: amount, line_memo: `Pelunasan piutang ${invoice.customer_name}` }
            ],
            createdBy: uid
          })
        } else {
          const utangCoaId = await PostingEngine.resolveCOAId(tx, COA_CODES.UTANG_USAHA)
          await PostingEngine.postJournal(tx, {
            entryDate: paymentDate,
            sourceType: 'PURCHASE_PAYMENT',
            sourceId: payment.id,
            postingType: 'ORIGINAL',
            eventId: `PAY-${payment.id}`,
            referenceNo: invoice.reference,
            description: `Pembayaran Tagihan Pemasok ${invoice.reference} (${invoice.customer_name})`,
            lines: [
              { coa_id: utangCoaId, debit: amount, credit: 0, line_memo: `Pengurangan utang ${invoice.customer_name}` },
              { coa_id: bankCoaId, debit: 0, credit: amount, line_memo: `Kas keluar ${account.name}` }
            ],
            createdBy: uid
          })
        }
      } catch (postErr) {
        console.error('Error posting double-entry journal for invoice payment:', postErr)
      }
    }

    return { payment, updatedInvoice }
  })

  await logActivity({
    userId: uid,
    activityType: 'update',
    description: `Recorded payment Rp ${amount.toLocaleString('id-ID')} for invoice ${invoice.reference}`
  })

  return {
    success: true,
    data: {
      payment: result.payment,
      invoice: result.updatedInvoice,
      paid_amount: paidAfter,
      outstanding: round2(Math.max(0, invoice.amount - paidAfter)),
      status: nextStatus
    }
  }
}

// -----------------------------------------------------------------------------
// EXPENSES
// -----------------------------------------------------------------------------
export async function getExpenses(filters?: { category?: string; search?: string }) {
  const user = await requireAuth()
  requirePermission(user, 'finance.view')

  // Auto-sync any existing HR payrolls to Finance Expenses if not yet queued
  try {
    const payrolls = await prisma.hrPayroll.findMany({
      include: { employee: true }
    })
    for (const p of payrolls) {
      if (p.net_pay > 0) {
        const existingExp = await prisma.financeExpense.findFirst({
          where: {
            OR: [
              { payroll_id: p.id },
              { description: { contains: `Periode ${p.period}` }, vendor: p.employee?.name || '' }
            ]
          }
        })
        if (!existingExp) {
          const category = await prisma.financeCategory.findFirst({
            where: { name: { contains: 'Gaji' } }
          })
          await prisma.financeExpense.create({
            data: {
              date: p.payment_date || p.created_at || new Date(),
              description: `Gaji Karyawan: ${p.employee?.name || 'Karyawan'} (Periode ${p.period})`,
              category: 'Salaries',
              category_id: category?.id || null,
              amount: p.net_pay,
              vendor: p.employee?.name || 'Karyawan',
              status: p.status || 'Pending',
              payroll_id: p.id,
              receipt_url: p.payment_proof || null,
              notes: p.notes || null
            }
          })
        }
      }
    }
  } catch (err) {
    console.error('Error auto-syncing payrolls into expenses:', err)
  }

  const where: any = {}
  if (filters?.category && filters.category !== 'All') {
    where.category = filters.category
  }
  if (filters?.search) {
    where.OR = [
      { vendor: { contains: filters.search } },
      { description: { contains: filters.search } }
    ]
  }

  return prisma.financeExpense.findMany({
    where,
    orderBy: { date: 'desc' }
  })
}

export async function createExpense(data: any) {
  const _u = await requireAuth(); requirePermission(_u, 'finance.create')
  const uid = await currentUserId()
  const amount = round2(Number(data.amount))
  if (!amount || amount <= 0) throw new Error('Jumlah pengeluaran harus lebih besar dari 0.')
  if (!data.description || !String(data.description).trim()) throw new Error('Keterangan pengeluaran wajib diisi.')

  const categoryName = data.category || 'Lain-lain'

  // Hubungkan ke master kategori bila namanya cocok, agar laporan per kategori akurat.
  const categoryId = await resolveCategoryId(categoryName)

  let accountId: number | null = data.accountId ? Number(data.accountId) : null
  if (accountId) {
    const account = await prisma.financeAccount.findUnique({ where: { id: accountId } })
    if (!account) throw new Error('Akun kas/bank tidak ditemukan.')
  }

  const expense = await prisma.$transaction(async tx => {
    const created = await tx.financeExpense.create({
      data: {
        date: data.date ? new Date(data.date) : new Date(),
        description: String(data.description).trim(),
        category: categoryName,
        amount,
        vendor: (data.vendor || '').trim() || '-',
        status: data.status || 'Paid',
        category_id: categoryId,
        account_id: accountId,
        created_by: uid
      }
    })

    // Bila akun dipilih, pengeluaran langsung mengurangi saldo kas/bank.
    if (accountId) {
      await tx.financeTransaction.create({
        data: {
          date: created.date,
          description: created.description,
          type: 'Expense',
          amount,
          reference: `EXP-${created.id}`,
          account_id: accountId,
          created_by: uid
        }
      })
      await tx.financeAccount.update({
        where: { id: accountId },
        data: { balance: { increment: -amount } }
      })

      // Posting Double-Entry General Ledger
      if ((data.status || 'Paid') === 'Paid') {
        try {
          const account = await tx.financeAccount.findUnique({ where: { id: accountId } })
          const bankCoaId = account?.coa_id || (await PostingEngine.resolveCOAId(tx, account?.type === 'Cash' ? COA_CODES.KAS_UTAMA : COA_CODES.BANK_BCA))
          const isSalary = categoryName.toLowerCase().includes('gaji') || categoryName.toLowerCase().includes('salary')
          const isFreelance = categoryName.toLowerCase().includes('freelance') || categoryName.toLowerCase().includes('project')
          const expenseCoaId = isSalary
            ? await PostingEngine.resolveCOAId(tx, COA_CODES.BEBAN_GAJI)
            : isFreelance
            ? await PostingEngine.resolveCOAId(tx, COA_CODES.HPP_FREELANCER)
            : await PostingEngine.resolveCOAId(tx, COA_CODES.BEBAN_OPERASIONAL)

          const projectId = data.projectId || data.project_id ? Number(data.projectId || data.project_id) : null

          await PostingEngine.postJournal(tx, {
            entryDate: created.date,
            sourceType: 'OPERATIONAL_EXPENSE',
            sourceId: created.id,
            postingType: 'ORIGINAL',
            eventId: `EXP-${created.id}`,
            referenceNo: `EXP-${created.id}`,
            description: `Pengeluaran: ${created.description} (${categoryName})`,
            lines: [
              { coa_id: expenseCoaId, debit: amount, credit: 0, project_id: projectId, line_memo: created.description },
              { coa_id: bankCoaId, debit: 0, credit: amount, line_memo: `Pembayaran via ${account?.name || 'Kas/Bank'}` }
            ],
            createdBy: uid
          })
        } catch (postErr) {
          console.error('Error posting double-entry journal for expense:', postErr)
        }
      }
    }

    return created
  })

  await logActivity({
    userId: uid,
    activityType: 'create',
    description: `Created expense: ${expense.description}`
  })

  return expense
}

export async function updateExpense(id: number, data: any) {
  const _u = await requireAuth(); requirePermission(_u, 'finance.update')
  const uid = await currentUserId()

  const existing = await prisma.financeExpense.findUnique({ where: { id } })
  if (!existing) throw new Error('Pengeluaran tidak ditemukan.')

  const updateData: any = {}
  if (data.date !== undefined) updateData.date = data.date ? new Date(data.date) : existing.date
  if (data.description !== undefined) updateData.description = String(data.description).trim()
  if (data.category !== undefined) {
    const categoryName = data.category || 'Lain-lain'
    updateData.category = categoryName
    updateData.category_id = await resolveCategoryId(categoryName)
  }
  if (data.vendor !== undefined) updateData.vendor = (data.vendor || '').trim() || '-'
  if (data.status !== undefined) updateData.status = data.status
  if (data.amount !== undefined) {
    const amount = round2(Number(data.amount))
    if (!amount || amount <= 0) throw new Error('Jumlah pengeluaran harus lebih besar dari 0.')
    updateData.amount = amount
  }

  const updated = await prisma.financeExpense.update({ where: { id }, data: updateData })

  // Sinkronkan transaksi kas yang lahir dari pengeluaran ini.
  const linked = await prisma.financeTransaction.findFirst({ where: { reference: `EXP-${id}` } })
  if (linked) {
    const nextAmount = updateData.amount ?? existing.amount
    const nextDate = updateData.date ?? existing.date
    const delta = round2(linked.amount - nextAmount)
    await prisma.$transaction(async tx => {
      await tx.financeTransaction.update({
        where: { id: linked.id },
        data: {
          date: nextDate,
          amount: nextAmount,
          description: updateData.description ?? existing.description
        }
      })
      if (linked.account_id && delta !== 0) {
        await tx.financeAccount.update({
          where: { id: linked.account_id },
          data: { balance: { increment: delta } }
        })
      }
    })
  }

  await logActivity({
    userId: uid,
    activityType: 'update',
    description: `Updated expense: ${updated.description}`
  })

  return updated
}

export async function deleteExpense(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const _u = await requireAuth(); requirePermission(_u, 'finance.delete')
    const uid = await currentUserId()
    const expenseId = Number(id)
    if (!Number.isFinite(expenseId) || expenseId <= 0) {
      return { success: false, error: 'ID pengeluaran tidak valid.' }
    }

    const existing = await prisma.financeExpense.findUnique({ where: { id: expenseId } })
    if (!existing) {
      return { success: false, error: 'Pengeluaran tidak ditemukan.' }
    }

    await prisma.$transaction(async tx => {
      // Batalkan transaksi kas yang terkait lalu kembalikan saldo akun.
      const linkedTransactions = await tx.financeTransaction.findMany({
        where: { reference: `EXP-${expenseId}` }
      })
      for (const linked of linkedTransactions) {
        if (linked.account_id) {
          const account = await tx.financeAccount.findUnique({ where: { id: linked.account_id } })
          if (account) {
            await tx.financeAccount.update({
              where: { id: linked.account_id },
              data: { balance: { increment: linked.amount } }
            })
          }
        }
        await tx.financeTransaction.delete({ where: { id: linked.id } })
      }
      await tx.financeExpense.delete({ where: { id: expenseId } })
    })

    await logActivity({
      userId: uid,
      activityType: 'delete',
      description: `Deleted expense #${expenseId}`
    })

    return { success: true }
  } catch (err: any) {
    console.error('deleteExpense error:', err)
    return { success: false, error: err?.message || 'Gagal menghapus pengeluaran.' }
  }
}

export async function payExpense(data: {
  id: number
  accountId?: number | null
  paymentDate?: string
  receiptUrl?: string | null
  notes?: string | null
}) {
  const _u = await requireAuth(); requirePermission(_u, 'finance.update')
  const uid = await currentUserId()
  const expense = await prisma.financeExpense.findUnique({ where: { id: data.id } })
  if (!expense) throw new Error('Pengeluaran tidak ditemukan.')

  const paymentDate = data.paymentDate ? new Date(data.paymentDate) : new Date()
  const accountId = data.accountId ? Number(data.accountId) : null

  const updated = await prisma.$transaction(async (tx) => {
    // 1. Update status to Paid and record proof/date/account
    const exp = await tx.financeExpense.update({
      where: { id: data.id },
      data: {
        status: 'Paid',
        date: paymentDate,
        receipt_url: data.receiptUrl !== undefined ? data.receiptUrl : expense.receipt_url,
        account_id: accountId,
        notes: data.notes !== undefined ? data.notes : expense.notes
      }
    })

    // 2. If accountId selected, record transaction and deduct account balance
    if (accountId) {
      await tx.financeTransaction.create({
        data: {
          date: paymentDate,
          description: `Pembayaran: ${expense.description}`,
          type: 'Expense',
          amount: expense.amount,
          reference: `EXP-${expense.id}`,
          account_id: accountId,
          created_by: uid
        }
      })

      await tx.financeAccount.update({
        where: { id: accountId },
        data: { balance: { increment: -expense.amount } }
      })
    }

    // 3. If linked to hr_payrolls, update hr_payrolls as Paid with proof and date!
    if (expense.payroll_id) {
      await tx.hrPayroll.update({
        where: { id: expense.payroll_id },
        data: {
          status: 'Paid',
          payment_date: paymentDate,
          payment_proof: data.receiptUrl || undefined,
          notes: data.notes || undefined
        }
      }).catch(err => console.warn('Could not update linked payroll:', err))
    }

    return exp
  })

  await logActivity({
    userId: uid,
    activityType: 'update',
    description: `Paid expense: ${expense.description} (Rp ${expense.amount.toLocaleString('id-ID')})`
  })

  return updated
}

export async function exportExpensesCsv() {
  const user = await requireAuth()
  requirePermission(user, 'finance.export')
  const expenses = await prisma.financeExpense.findMany({ orderBy: { date: 'desc' } })

  const records = expenses.map(e => ({
    Date: e.date.toISOString().split('T')[0],
    Vendor: e.vendor,
    Description: e.description,
    Category: e.category,
    Amount: e.amount,
    Status: e.status
  }))

  return toCSV(records)
}

export async function importExpensesCsv(csvContent: string) {
  const _u = await requireAuth(); requirePermission(_u, 'finance.create')
  const uid = await currentUserId()
  const records = fromCSV(csvContent)

  let count = 0
  for (const record of records) {
    try {
      const categoryName = record.Category || 'Lain-lain'
      await prisma.financeExpense.create({
        data: {
          date: record.Date ? new Date(record.Date) : new Date(),
          vendor: record.Vendor || 'Unknown',
          description: record.Description || 'Imported Expense',
          category: categoryName,
          category_id: await resolveCategoryId(categoryName),
          amount: round2(parseFloat(record.Amount) || 0),
          status: record.Status || 'Paid',
          created_by: uid
        }
      })
      count++
    } catch (err) {
      console.error('Failed to import expense record', err)
    }
  }
  return count
}

// -----------------------------------------------------------------------------
// CASH & BANK
// -----------------------------------------------------------------------------
export async function getBankAccounts() {
  const user = await requireAuth()
  requirePermission(user, 'finance.view')

  let accounts = await prisma.financeAccount.findMany({
    where: { type: { in: ['Cash', 'Bank'] } },
    orderBy: { name: 'asc' }
  })

  // Seed sekali pakai agar instalasi baru punya akun kas/bank dasar.
  if (accounts.length === 0) {
    await prisma.financeAccount.createMany({
      data: [
        { name: 'Kas Utama', type: 'Cash', balance: 0, currency: 'IDR' },
        { name: 'Bank Utama', type: 'Bank', balance: 0, currency: 'IDR' }
      ]
    })
    accounts = await prisma.financeAccount.findMany({
      where: { type: { in: ['Cash', 'Bank'] } },
      orderBy: { name: 'asc' }
    })
  }

  return accounts
}

export async function getTransactions(filters?: { search?: string; accountId?: number }) {
  const user = await requireAuth()
  requirePermission(user, 'finance.view')

  const where: any = {}
  if (filters?.search) {
    where.OR = [
      { description: { contains: filters.search } },
      { reference: { contains: filters.search } }
    ]
  }
  if (filters?.accountId) where.account_id = filters.accountId

  return prisma.financeTransaction.findMany({
    where,
    orderBy: [{ date: 'desc' }, { id: 'desc' }],
    include: { account: true }
  })
}

export async function createTransaction(data: any) {
  const _u = await requireAuth(); requirePermission(_u, 'finance.create')
  const uid = await currentUserId()
  const amount = round2(Number(data.amount))
  if (!amount || amount <= 0) throw new Error('Jumlah transaksi harus lebih besar dari 0.')

  let accountId = data.accountId ? Number(data.accountId) : null
  if (!accountId && data.account) {
    const account = await prisma.financeAccount.findFirst({ where: { name: data.account } })
    accountId = account?.id ?? null
  }
  if (!accountId) {
    // Jangan lagi menebak account_id 1 — itu bisa menempel ke akun yang salah.
    const firstAccount = await prisma.financeAccount.findFirst({ orderBy: { id: 'asc' } })
    accountId = firstAccount?.id ?? null
  }
  if (!accountId) throw new Error('Belum ada akun kas/bank. Tambahkan akun terlebih dahulu.')

  const account = await prisma.financeAccount.findUnique({ where: { id: accountId } })
  if (!account) throw new Error('Akun kas/bank tidak ditemukan.')

  const type = data.type === 'Income' ? 'Income' : 'Expense'
  const delta = type === 'Income' ? amount : -amount

  return prisma.$transaction(async tx => {
    const transaction = await tx.financeTransaction.create({
      data: {
        date: data.date ? new Date(data.date) : new Date(),
        description: (data.description || '').trim() || (type === 'Income' ? 'Pemasukan' : 'Pengeluaran'),
        type,
        amount,
        reference: data.reference || null,
        account_id: accountId as number,
        created_by: uid
      }
    })

    await tx.financeAccount.update({
      where: { id: accountId as number },
      data: { balance: { increment: delta } }
    })

    return transaction
  })
}

/**
 * Hapus transaksi manual. Transaksi otomatis (hasil pembayaran faktur atau
 * pencatatan pengeluaran) harus dihapus dari dokumen sumbernya agar saldo tetap konsisten.
 */
export async function deleteTransaction(id: number) {
  const _u = await requireAuth(); requirePermission(_u, 'finance.delete')
  const uid = await currentUserId()

  const transaction = await prisma.financeTransaction.findUnique({ where: { id } })
  if (!transaction) throw new Error('Transaksi tidak ditemukan.')

  if (transaction.reference) {
    const sourceInvoice = await prisma.financeInvoice.findUnique({ where: { reference: transaction.reference } })
    if (sourceInvoice || transaction.reference.startsWith('EXP-')) {
      throw new Error('Transaksi ini berasal dari faktur/pengeluaran. Hapus dokumen sumbernya agar saldo tetap konsisten.')
    }
  }

  await prisma.$transaction(async tx => {
    if (transaction.account_id) {
      await tx.financeAccount.update({
        where: { id: transaction.account_id },
        data: { balance: { increment: transaction.type === 'Income' ? -transaction.amount : transaction.amount } }
      })
    }
    await tx.financeTransaction.delete({ where: { id } })
  })

  await logActivity({
    userId: uid,
    activityType: 'delete',
    description: `Deleted cash transaction: ${transaction.description}`
  })

  return { success: true }
}

/**
 * Transfer antar rekening kas/bank secara atomik menggunakan Prisma Transaction.
 * Rekening sumber didebit (dikurangi saldo), rekening tujuan dikredit (ditambah saldo).
 * Tidak dihitung sebagai pemasukan atau pengeluaran pada laporan laba rugi.
 */
export async function transferAccount(data: {
  fromAccountId: number
  toAccountId: number
  amount: number
  date?: string
  notes?: string
}) {
  const _u = await requireAuth(); requirePermission(_u, 'finance.create')
  const uid = await currentUserId()
  const amount = round2(Number(data.amount))

  const fromId = Number(data.fromAccountId)
  const toId = Number(data.toAccountId)

  if (!fromId || !toId) {
    throw new Error('Rekening sumber dan rekening tujuan wajib dipilih.')
  }
  if (fromId === toId) {
    throw new Error('Rekening sumber dan tujuan tidak boleh sama.')
  }
  if (!amount || amount <= 0) {
    throw new Error('Nominal transfer harus lebih besar dari 0.')
  }

  const [fromAccount, toAccount] = await Promise.all([
    prisma.financeAccount.findUnique({ where: { id: fromId } }),
    prisma.financeAccount.findUnique({ where: { id: toId } })
  ])

  if (!fromAccount) throw new Error('Rekening sumber tidak ditemukan.')
  if (!toAccount) throw new Error('Rekening tujuan tidak ditemukan.')

  if (fromAccount.balance < amount - EPSILON) {
    throw new Error(
      `Saldo rekening sumber (${fromAccount.name}: Rp ${fromAccount.balance.toLocaleString('id-ID')}) tidak mencukupi untuk transfer Rp ${amount.toLocaleString('id-ID')}.`
    )
  }

  const transferDate = data.date ? new Date(data.date) : new Date()
  const timestamp = Date.now().toString().slice(-4)
  const refCode = `TRF-${transferDate.getFullYear()}${String(transferDate.getMonth() + 1).padStart(2, '0')}${String(transferDate.getDate()).padStart(2, '0')}-${timestamp}`

  const result = await prisma.$transaction(async (tx) => {
    // 1. Mutasi keluar dari rekening sumber
    const txOut = await tx.financeTransaction.create({
      data: {
        date: transferDate,
        description: `Transfer keluar ke ${toAccount.name}${data.notes ? ` (${data.notes})` : ''}`,
        type: 'Transfer',
        amount,
        reference: refCode,
        account_id: fromAccount.id,
        created_by: uid
      }
    })

    // 2. Mutasi masuk ke rekening tujuan
    const txIn = await tx.financeTransaction.create({
      data: {
        date: transferDate,
        description: `Transfer masuk dari ${fromAccount.name}${data.notes ? ` (${data.notes})` : ''}`,
        type: 'Transfer',
        amount,
        reference: refCode,
        account_id: toAccount.id,
        created_by: uid
      }
    })

    // 3. Update saldo rekening sumber (decrement)
    await tx.financeAccount.update({
      where: { id: fromAccount.id },
      data: { balance: { increment: -amount } }
    })

    // 4. Update saldo rekening tujuan (increment)
    await tx.financeAccount.update({
      where: { id: toAccount.id },
      data: { balance: { increment: amount } }
    })

    // 5. Posting Double-Entry General Ledger
    try {
      const fromCoaId = fromAccount.coa_id || (await PostingEngine.resolveCOAId(tx, fromAccount.type === 'Cash' ? COA_CODES.KAS_UTAMA : COA_CODES.BANK_BCA))
      const toCoaId = toAccount.coa_id || (await PostingEngine.resolveCOAId(tx, toAccount.type === 'Cash' ? COA_CODES.KAS_UTAMA : COA_CODES.BANK_BCA))

      await PostingEngine.postJournal(tx, {
        entryDate: transferDate,
        sourceType: 'BANK_TRANSFER',
        sourceId: null,
        postingType: 'ORIGINAL',
        eventId: refCode,
        referenceNo: refCode,
        description: `Transfer saldo dari ${fromAccount.name} ke ${toAccount.name}${data.notes ? ` (${data.notes})` : ''}`,
        lines: [
          { coa_id: toCoaId, debit: amount, credit: 0, line_memo: `Penerimaan transfer dari ${fromAccount.name}` },
          { coa_id: fromCoaId, debit: 0, credit: amount, line_memo: `Pengeluaran transfer ke ${toAccount.name}` }
        ],
        createdBy: uid
      })
    } catch (postErr) {
      console.error('Error posting double-entry journal for bank transfer:', postErr)
    }

    return { txOut, txIn, reference: refCode }
  })

  await logActivity({
    userId: uid,
    activityType: 'create',
    description: `Transfer saldo Rp ${amount.toLocaleString('id-ID')} dari ${fromAccount.name} ke ${toAccount.name} (${refCode})`
  })

  return result
}

export async function createBankAccount(data: {
  name: string
  type?: 'Cash' | 'Bank'
  accountNumber?: string
  openingBalance?: number
  currency?: string
}) {
  const user = await requireAuth()
  requirePermission(user, 'finance.create')
  const uid = await currentUserId()

  const name = (data.name || '').trim()
  if (!name) throw new Error('Nama rekening / kas wajib diisi.')

  const initialBalance = round2(Number(data.openingBalance) || 0)
  const type = data.type === 'Cash' ? 'Cash' : 'Bank'

  const account = await prisma.$transaction(async (tx) => {
    const acc = await tx.financeAccount.create({
      data: {
        name,
        type,
        account_number: data.accountNumber?.trim() || null,
        balance: initialBalance,
        currency: data.currency || 'IDR'
      }
    })

    // Jika ada saldo awal, catat sebagai mutasi transaksi saldo awal
    if (initialBalance > 0) {
      await tx.financeTransaction.create({
        data: {
          date: new Date(),
          description: `Saldo Awal Akun: ${name}`,
          type: 'Income',
          amount: initialBalance,
          reference: `INIT-${acc.id}`,
          account_id: acc.id,
          created_by: uid
        }
      })
    }

    return acc
  })

  await logActivity({
    userId: uid,
    activityType: 'create',
    description: `Created bank account: ${account.name} (Saldo Awal: Rp ${initialBalance.toLocaleString('id-ID')})`
  })

  return account
}

export async function updateBankAccount(id: number, data: {
  name?: string
  type?: 'Cash' | 'Bank'
  accountNumber?: string
}) {
  const user = await requireAuth()
  requirePermission(user, 'finance.update')
  const uid = await currentUserId()

  const updateData: any = {}
  if (data.name !== undefined) {
    const name = data.name.trim()
    if (!name) throw new Error('Nama rekening tidak boleh kosong.')
    updateData.name = name
  }
  if (data.type !== undefined) updateData.type = data.type
  if (data.accountNumber !== undefined) updateData.account_number = data.accountNumber?.trim() || null

  const account = await prisma.financeAccount.update({
    where: { id },
    data: updateData
  })

  await logActivity({
    userId: uid,
    activityType: 'update',
    description: `Updated bank account: ${account.name}`
  })

  return account
}

// -----------------------------------------------------------------------------
// CONTACTS (pelanggan & pemasok)
// -----------------------------------------------------------------------------
export async function getContacts(filters?: { type?: string; search?: string }) {
  const user = await requireAuth()
  requirePermission(user, 'finance.view')
  const where: any = {}
  if (filters?.type && filters.type !== 'All') {
    where.type = filters.type
  }
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { email: { contains: filters.search } }
    ]
  }
  return prisma.financeContact.findMany({ where, orderBy: { name: 'asc' } })
}

export async function createContact(data: any) {
  const user = await requireAuth()
  requirePermission(user, 'finance.create')
  const name = (data.name || '').trim()
  if (!name) throw new Error('Nama wajib diisi.')

  return prisma.financeContact.create({
    data: {
      type: data.type || 'CUSTOMER',
      name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null
    }
  })
}

export async function updateContact(id: number, data: any) {
  const user = await requireAuth()
  requirePermission(user, 'finance.update')
  const name = (data.name || '').trim()
  if (!name) throw new Error('Nama wajib diisi.')

  return prisma.financeContact.update({
    where: { id },
    data: {
      type: data.type,
      name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null
    }
  })
}

export async function deleteContact(id: number) {
  const user = await requireAuth()
  requirePermission(user, 'finance.delete')
  return prisma.financeContact.delete({ where: { id } })
}

// -----------------------------------------------------------------------------
// PRODUCTS & SERVICES
// -----------------------------------------------------------------------------
export async function getProductsServices(filters?: { type?: string; search?: string }) {
  const user = await requireAuth()
  requirePermission(user, 'finance.view')
  const where: any = {}
  if (filters?.type && filters.type !== 'All') {
    where.type = filters.type
  }
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { code: { contains: filters.search } }
    ]
  }
  return prisma.financeProductService.findMany({ where, orderBy: { name: 'asc' } })
}

export async function createProductService(data: any) {
  const user = await requireAuth()
  requirePermission(user, 'finance.create')
  try {
    return await prisma.financeProductService.create({
      data: {
        code: data.code,
        name: data.name,
        type: data.type || 'Barang',
        unit: data.unit || 'Pcs',
        brand: data.brand || null,
        price: parseFloat(data.price) || 0
      }
    })
  } catch (err: any) {
    if (err.code === 'P2002') {
      throw new Error(`Item with code ${data.code} already exists.`)
    }
    throw err
  }
}

export async function updateProductService(id: number, data: any) {
  const user = await requireAuth()
  requirePermission(user, 'finance.update')
  try {
    return await prisma.financeProductService.update({
      where: { id },
      data: {
        code: data.code,
        name: data.name,
        type: data.type,
        unit: data.unit,
        brand: data.brand,
        price: parseFloat(data.price) || 0
      }
    })
  } catch (err: any) {
    if (err.code === 'P2002') {
      throw new Error(`Item with code ${data.code} already exists.`)
    }
    throw err
  }
}

export async function deleteProductService(id: number) {
  const user = await requireAuth()
  requirePermission(user, 'finance.delete')
  return prisma.financeProductService.delete({ where: { id } })
}

// -----------------------------------------------------------------------------
// CHART OF ACCOUNTS
// -----------------------------------------------------------------------------
export async function getChartOfAccounts(filters?: { search?: string }) {
  const user = await requireAuth()
  requirePermission(user, 'finance.view')
  const where: any = {}
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search } },
      { code: { contains: filters.search } }
    ]
  }
  return prisma.financeAccount.findMany({ where, orderBy: { code: 'asc' } })
}

export async function createAccount(data: any) {
  const user = await requireAuth()
  requirePermission(user, 'finance.create')
  const name = (data.name || '').trim()
  if (!name) throw new Error('Nama akun wajib diisi.')

  return prisma.financeAccount.create({
    data: {
      code: data.code || null,
      name,
      type: data.type || 'Asset',
      sub_type: data.subType || null,
      balance: parseFloat(data.balance) || 0,
      currency: data.currency || 'IDR'
    }
  })
}

export async function updateAccount(id: number, data: any) {
  const user = await requireAuth()
  requirePermission(user, 'finance.update')
  const name = (data.name || '').trim()
  if (!name) throw new Error('Nama akun wajib diisi.')

  return prisma.financeAccount.update({
    where: { id },
    data: {
      code: data.code || null,
      name,
      type: data.type,
      sub_type: data.subType || null,
      balance: parseFloat(data.balance) || 0
    }
  })
}

export async function deleteAccount(id: number) {
  const user = await requireAuth()
  requirePermission(user, 'finance.delete')
  const used = await prisma.financeTransaction.count({ where: { account_id: id } })
  if (used > 0) {
    throw new Error(`Akun tidak bisa dihapus karena sudah dipakai pada ${used} transaksi.`)
  }
  return prisma.financeAccount.delete({ where: { id } })
}

// -----------------------------------------------------------------------------
// CATEGORIES & BUDGETS
// -----------------------------------------------------------------------------
const DEFAULT_CATEGORIES = ['Operations', 'Salaries', 'Marketing', 'Utilities', 'Office Supplies', 'Transportation', 'Other']

/** Kategori pengeluaran dasar dibuat sekali bila tabel master masih kosong. */
async function ensureDefaultCategories() {
  const count = await prisma.financeCategory.count()
  if (count > 0) return
  await prisma.financeCategory.createMany({
    data: DEFAULT_CATEGORIES.map(name => ({ name, type: 'EXPENSE' }))
  })
}

export async function getFinanceCategories() {
  const user = await requireAuth()
  requirePermission(user, 'finance.view')
  try {
    await ensureDefaultCategories()
    const categories = await prisma.financeCategory.findMany({ orderBy: { name: 'asc' } })
    return { success: true, data: categories }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getFinanceBudgets(projectId?: number) {
  const user = await requireAuth()
  requirePermission(user, 'finance.view')
  try {
    const where = projectId ? { project_id: projectId } : {}
    const budgets = await prisma.financeBudget.findMany({
      where,
      include: { category: true, project: { select: { name: true } } },
      orderBy: { start_date: 'desc' }
    })

    if (projectId && budgets.length > 0) {
      const actualProjectSpent = await PostingEngine.calculateProjectRealization(prisma, projectId)
      const enriched = budgets.map(b => ({
        ...b,
        spent: actualProjectSpent > 0 ? actualProjectSpent : b.spent
      }))
      return { success: true, data: enriched }
    }

    return { success: true, data: budgets }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function createFinanceBudget(data: { name: string; amount: number; start_date: string; end_date: string; category_id?: number; project_id?: number }) {
  const user = await requireAuth()
  requirePermission(user, 'finance.create')
  try {
    const budget = await prisma.financeBudget.create({
      data: {
        name: data.name,
        amount: data.amount,
        spent: 0,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date),
        category_id: data.category_id,
        project_id: data.project_id
      }
    })
    return { success: true, data: budget }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// -----------------------------------------------------------------------------
// REPORTS
// -----------------------------------------------------------------------------
export type { FinanceReportKind } from '@/types/finance'


function resolveRange(from?: string, to?: string) {
  const now = new Date()
  const start = from ? new Date(from) : new Date(now.getFullYear(), 0, 1)
  const end = to ? new Date(to) : now
  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('Rentang tanggal tidak valid.')
  }
  return { start, end }
}

export async function getFinanceReport(params: {
  report: FinanceReportKind | string
  from?: string
  to?: string
}) {
  const user = await requireAuth()
  requirePermission(user, 'finance.view')
  const { start, end } = resolveRange(params.from, params.to)
  const report = params.report as FinanceReportKind

  const empty = {
    report,
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
    summary: [] as Array<{ label: string; value: number | string }>,
    columns: [] as string[],
    rows: [] as any[]
  }

  if (report === 'profit-loss') {
    // Periode berjalan
    const [salesPayments, purchasePayments, paidExpenses] = await Promise.all([
      prisma.financePayment.findMany({
        where: { payment_date: { gte: start, lte: end }, invoice: { type: 'SALES', status: { not: 'Cancelled' } } },
        select: { amount: true }
      }),
      prisma.financePayment.findMany({
        where: { payment_date: { gte: start, lte: end }, invoice: { type: 'PURCHASE', status: { not: 'Cancelled' } } },
        select: { amount: true }
      }),
      prisma.financeExpense.findMany({
        where: { status: 'Paid', date: { gte: start, lte: end } },
        select: { amount: true, category: true }
      })
    ])

    // Periode pembanding (durasi yang sama sebelum periode berjalan)
    const durationMs = end.getTime() - start.getTime()
    const prevStart = new Date(start.getTime() - durationMs)
    const prevEnd = new Date(start.getTime() - 1)

    const [prevSales, prevPurchases, prevExpenses] = await Promise.all([
      prisma.financePayment.findMany({
        where: { payment_date: { gte: prevStart, lte: prevEnd }, invoice: { type: 'SALES', status: { not: 'Cancelled' } } },
        select: { amount: true }
      }),
      prisma.financePayment.findMany({
        where: { payment_date: { gte: prevStart, lte: prevEnd }, invoice: { type: 'PURCHASE', status: { not: 'Cancelled' } } },
        select: { amount: true }
      }),
      prisma.financeExpense.findMany({
        where: { status: 'Paid', date: { gte: prevStart, lte: prevEnd } },
        select: { amount: true }
      })
    ])

    const revenue = round2(salesPayments.reduce((s, p) => s + p.amount, 0))
    const purchaseCost = round2(purchasePayments.reduce((s, p) => s + p.amount, 0))
    const operatingExpenses = round2(paidExpenses.reduce((s, e) => s + e.amount, 0))
    const grossProfit = round2(revenue - purchaseCost)
    const netProfit = round2(grossProfit - operatingExpenses)

    const prevRev = round2(prevSales.reduce((s, p) => s + p.amount, 0))
    const prevPur = round2(prevPurchases.reduce((s, p) => s + p.amount, 0))
    const prevExp = round2(prevExpenses.reduce((s, e) => s + e.amount, 0))
    const prevGross = round2(prevRev - prevPur)
    const prevNet = round2(prevGross - prevExp)

    const calcGrowth = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? '+100%' : '0%'
      const pct = round2(((curr - prev) / Math.abs(prev)) * 100)
      return `${pct >= 0 ? '+' : ''}${pct}%`
    }

    return {
      ...empty,
      summary: [
        { label: 'Pendapatan Penjualan', value: revenue },
        { label: 'Beban Pokok Pembelian', value: purchaseCost },
        { label: 'Laba Kotor', value: grossProfit },
        { label: 'Beban Operasional', value: operatingExpenses },
        { label: 'Laba Bersih Periode Ini', value: netProfit },
        { label: 'Laba Bersih Periode Lalu', value: prevNet },
        { label: 'Pertumbuhan Laba Bersih', value: calcGrowth(netProfit, prevNet) }
      ],
      columns: ['Komponen Keuangan', 'Periode Berjalan', 'Periode Sebelumnya', 'Pertumbuhan'],
      rows: [
        { komponen_keuangan: 'Pendapatan Penjualan', periode_berjalan: revenue, periode_sebelumnya: prevRev, pertumbuhan: calcGrowth(revenue, prevRev) },
        { komponen_keuangan: 'Beban Pokok Pembelian', periode_berjalan: purchaseCost, periode_sebelumnya: prevPur, pertumbuhan: calcGrowth(purchaseCost, prevPur) },
        { komponen_keuangan: 'Laba Kotor', periode_berjalan: grossProfit, periode_sebelumnya: prevGross, pertumbuhan: calcGrowth(grossProfit, prevGross) },
        { komponen_keuangan: 'Beban Operasional', periode_berjalan: operatingExpenses, periode_sebelumnya: prevExp, pertumbuhan: calcGrowth(operatingExpenses, prevExp) },
        { komponen_keuangan: 'Laba Bersih', periode_berjalan: netProfit, periode_sebelumnya: prevNet, pertumbuhan: calcGrowth(netProfit, prevNet) }
      ]
    }
  }

  if (report === 'balance-sheet') {
    const asOfDate = end

    const [liquidAccounts, unpaidSalesInvoices, unpaidPurchaseInvoices, pendingExpenses, coaAccounts] = await Promise.all([
      // Aset Lancar: Kas & Bank
      prisma.financeAccount.findMany({
        where: { type: { in: ['Cash', 'Bank'] } },
        select: { id: true, name: true, type: true, balance: true, account_number: true }
      }),
      // Aset Lancar: Piutang Usaha (Sales Invoice belum lunas, exclude Cancelled)
      prisma.financeInvoice.findMany({
        where: { type: 'SALES', status: { notIn: ['Paid', 'Cancelled'] }, date: { lte: asOfDate } },
        select: { amount: true, payments: { select: { amount: true } } }
      }),
      // Liabilitas Lancar: Utang Usaha (Purchase Invoice belum lunas, exclude Cancelled)
      prisma.financeInvoice.findMany({
        where: { type: 'PURCHASE', status: { notIn: ['Paid', 'Cancelled'] }, date: { lte: asOfDate } },
        select: { amount: true, payments: { select: { amount: true } } }
      }),
      // Liabilitas Lancar: Beban Operasional Pending
      prisma.financeExpense.findMany({
        where: { status: 'Pending', date: { lte: asOfDate } },
        select: { amount: true }
      }),
      // Akun COA lainnya (Aset Tetap, Liabilitas Jangka Panjang, Ekuitas)
      prisma.financeAccount.findMany({
        where: { type: { notIn: ['Cash', 'Bank'] } },
        select: { id: true, name: true, type: true, balance: true, code: true }
      })
    ])

    const totalCashBank = round2(liquidAccounts.reduce((sum, a) => sum + (a.balance || 0), 0))
    const totalPiutang = round2(
      unpaidSalesInvoices.reduce((sum, inv) => {
        const paid = (inv.payments || []).reduce((pSum, p) => pSum + p.amount, 0)
        return sum + Math.max(0, inv.amount - paid)
      }, 0)
    )
    const currentAssets = round2(totalCashBank + totalPiutang)

    // Non-current assets from COA
    const nonCurrentAssetsAccounts = coaAccounts.filter(a => a.type === 'Asset')
    const totalNonCurrentAssets = round2(nonCurrentAssetsAccounts.reduce((sum, a) => sum + (a.balance || 0), 0))
    const totalAssets = round2(currentAssets + totalNonCurrentAssets)

    // Current Liabilities
    const totalUtangUsaha = round2(
      unpaidPurchaseInvoices.reduce((sum, inv) => {
        const paid = (inv.payments || []).reduce((pSum, p) => pSum + p.amount, 0)
        return sum + Math.max(0, inv.amount - paid)
      }, 0)
    )
    const totalPendingExpenses = round2(pendingExpenses.reduce((sum, e) => sum + e.amount, 0))
    const currentLiabilities = round2(totalUtangUsaha + totalPendingExpenses)

    // Non-current Liabilities from COA
    const nonCurrentLiabAccounts = coaAccounts.filter(a => a.type === 'Liability')
    const totalNonCurrentLiab = round2(nonCurrentLiabAccounts.reduce((sum, a) => sum + (a.balance || 0), 0))
    const totalLiabilities = round2(currentLiabilities + totalNonCurrentLiab)

    // Equity from COA (Equity accounts)
    const equityAccounts = coaAccounts.filter(a => a.type === 'Equity')
    const totalRecordedEquity = round2(equityAccounts.reduce((sum, a) => sum + (a.balance || 0), 0))

    // Retained Earnings (Laba Ditahan) = Total Aset - Total Liabilitas - Ekuitas Tercatat
    const retainedEarnings = round2(totalAssets - totalLiabilities - totalRecordedEquity)
    const totalEquity = round2(totalRecordedEquity + retainedEarnings)

    // Validasi keseimbangan neraca
    const isBalanced = Math.abs(totalAssets - (totalLiabilities + totalEquity)) <= EPSILON

    return {
      ...empty,
      summary: [
        { label: 'Total Aset', value: totalAssets },
        { label: 'Total Liabilitas', value: totalLiabilities },
        { label: 'Total Ekuitas', value: totalEquity },
        { label: 'Status Persamaan Neraca', value: isBalanced ? 'Seimbang (Aset = Kewajiban + Modal)' : 'Selisih' }
      ],
      columns: ['Klasifikasi Akuntansi', 'Komponen Neraca', 'Saldo (IDR)'],
      rows: [
        { klasifikasi_akuntansi: 'Aset Lancar', komponen_neraca: 'Kas & Rekening Bank', saldo_idr: totalCashBank },
        { klasifikasi_akuntansi: 'Aset Lancar', komponen_neraca: 'Piutang Usaha (Tagihan Penjualan Aktif)', saldo_idr: totalPiutang },
        { klasifikasi_akuntansi: 'Subtotal Aset Lancar', komponen_neraca: 'Jumlah Aset Lancar', saldo_idr: currentAssets },
        { klasifikasi_akuntansi: 'Aset Tidak Lancar', komponen_neraca: 'Aset Tetap & Investasi', saldo_idr: totalNonCurrentAssets },
        { klasifikasi_akuntansi: 'TOTAL ASET', komponen_neraca: 'Total Keseluruhan Aset', saldo_idr: totalAssets },
        { klasifikasi_akuntansi: 'Liabilitas Lancar', komponen_neraca: 'Utang Usaha (Tagihan Pemasok Belum Lunas)', saldo_idr: totalUtangUsaha },
        { klasifikasi_akuntansi: 'Liabilitas Lancar', komponen_neraca: 'Beban Operasional Belum Dibayar', saldo_idr: totalPendingExpenses },
        { klasifikasi_akuntansi: 'Subtotal Liabilitas Lancar', komponen_neraca: 'Jumlah Liabilitas Lancar', saldo_idr: currentLiabilities },
        { klasifikasi_akuntansi: 'Liabilitas Jangka Panjang', komponen_neraca: 'Kewajiban Jangka Panjang', saldo_idr: totalNonCurrentLiab },
        { klasifikasi_akuntansi: 'TOTAL LIABILITAS', komponen_neraca: 'Total Keseluruhan Liabilitas', saldo_idr: totalLiabilities },
        { klasifikasi_akuntansi: 'Ekuitas', komponen_neraca: 'Modal Disetor & Ekuitas Awal', saldo_idr: totalRecordedEquity },
        { klasifikasi_akuntansi: 'Ekuitas', komponen_neraca: 'Laba Ditahan & Berjalan (Retained Earnings)', saldo_idr: retainedEarnings },
        { klasifikasi_akuntansi: 'TOTAL EKUITAS', komponen_neraca: 'Total Keseluruhan Ekuitas', saldo_idr: totalEquity },
        { klasifikasi_akuntansi: 'TOTAL PASIVA', komponen_neraca: 'Liabilitas + Ekuitas (Keseimbangan)', saldo_idr: round2(totalLiabilities + totalEquity) }
      ]
    }
  }

  if (report === 'general-ledger') {
    const journalLines = await prisma.journalEntryLine.findMany({
      where: {
        journal: {
          entry_date: { gte: start, lte: end },
          status: 'POSTED'
        }
      },
      include: {
        journal: true,
        account: true,
        project: { select: { name: true } }
      },
      orderBy: [
        { journal: { entry_date: 'asc' } },
        { journal_id: 'asc' },
        { id: 'asc' }
      ]
    })

    if (journalLines.length > 0) {
      let runningBalance = 0
      const rows = journalLines.map(line => {
        const debit = Number(line.debit)
        const credit = Number(line.credit)
        const isDebitNormal = line.account.normal_balance === 'DEBIT'
        runningBalance = round2(runningBalance + (isDebitNormal ? debit - credit : credit - debit))

        return {
          tanggal: line.journal.entry_date.toISOString().slice(0, 10),
          akun: line.account.account_name,
          kode_akun: line.account.account_code,
          referensi: line.journal.entry_number,
          keterangan: line.line_memo || line.journal.description,
          debit,
          kredit: credit,
          saldo_berjalan: runningBalance
        }
      })

      const totalDebit = round2(rows.reduce((sum, r) => sum + r.debit, 0))
      const totalCredit = round2(rows.reduce((sum, r) => sum + r.kredit, 0))

      return {
        ...empty,
        summary: [
          { label: 'Total Baris Jurnal Double-Entry', value: rows.length },
          { label: 'Total Debit', value: totalDebit },
          { label: 'Total Kredit', value: totalCredit },
          { label: 'Status Keseimbangan', value: Math.abs(totalDebit - totalCredit) <= EPSILON ? 'Seimbang (Zero Variance)' : 'Selisih' }
        ],
        columns: ['Tanggal', 'Akun', 'Kode Akun', 'Referensi', 'Keterangan', 'Debit', 'Kredit', 'Saldo Berjalan'],
        rows
      }
    }

    const transactions = await prisma.financeTransaction.findMany({
      where: { date: { gte: start, lte: end } },
      orderBy: [{ date: 'asc' }, { id: 'asc' }],
      include: { account: true }
    })

    let runningBalance = 0
    const rows = transactions.map(tx => {
      const isDebit = tx.type === 'Income' || (tx.type === 'Transfer' && tx.description.includes('masuk'))
      const debit = isDebit ? tx.amount : 0
      const credit = !isDebit ? tx.amount : 0
      runningBalance = round2(runningBalance + debit - credit)

      return {
        tanggal: tx.date.toISOString().slice(0, 10),
        akun: tx.account?.name || 'Kas/Bank',
        kode_akun: tx.account?.code || tx.account?.account_number || `ACC-${tx.account_id}`,
        referensi: tx.reference || `TX-${tx.id}`,
        keterangan: tx.description,
        debit,
        kredit: credit,
        saldo_berjalan: runningBalance
      }
    })

    const totalDebit = round2(rows.reduce((sum, r) => sum + r.debit, 0))
    const totalCredit = round2(rows.reduce((sum, r) => sum + r.kredit, 0))

    return {
      ...empty,
      summary: [
        { label: 'Total Baris Jurnal Transaksi', value: rows.length },
        { label: 'Total Debit', value: totalDebit },
        { label: 'Total Kredit', value: totalCredit },
        { label: 'Saldo Berjalan Akhir', value: runningBalance }
      ],
      columns: ['Tanggal', 'Akun', 'Kode Akun', 'Referensi', 'Keterangan', 'Debit', 'Kredit', 'Saldo Berjalan'],
      rows
    }
  }

  if (report === 'cash-flow') {
    const transactions = await prisma.financeTransaction.findMany({
      where: { date: { gte: start, lte: end }, type: { in: ['Income', 'Expense'] } },
      select: { date: true, type: true, amount: true }
    })

    const buckets = new Map<string, { period: string; income: number; expense: number }>()
    transactions.forEach(tx => {
      const date = new Date(tx.date)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const bucket = buckets.get(key) || { period: key, income: 0, expense: 0 }
      if (tx.type === 'Income') bucket.income += tx.amount
      else bucket.expense += tx.amount
      buckets.set(key, bucket)
    })

    const rows = Array.from(buckets.values())
      .sort((a, b) => a.period.localeCompare(b.period))
      .map(b => ({
        periode: b.period,
        pemasukan: round2(b.income),
        pengeluaran: round2(b.expense),
        selisih: round2(b.income - b.expense)
      }))

    const totalIncome = round2(rows.reduce((s, r) => s + r.pemasukan, 0))
    const totalExpense = round2(rows.reduce((s, r) => s + r.pengeluaran, 0))

    return {
      ...empty,
      summary: [
        { label: 'Total pemasukan', value: totalIncome },
        { label: 'Total pengeluaran', value: totalExpense },
        { label: 'Arus kas bersih', value: round2(totalIncome - totalExpense) }
      ],
      columns: ['Periode', 'Pemasukan', 'Pengeluaran', 'Selisih'],
      rows
    }
  }

  if (report === 'expenses-by-category') {
    const expenses = await prisma.financeExpense.findMany({
      where: { date: { gte: start, lte: end }, status: 'Paid' },
      select: { category: true, amount: true }
    })

    const buckets = new Map<string, { category: string; total: number; count: number }>()
    expenses.forEach(e => {
      const key = e.category || 'Lain-lain'
      const bucket = buckets.get(key) || { category: key, total: 0, count: 0 }
      bucket.total += e.amount
      bucket.count += 1
      buckets.set(key, bucket)
    })

    const rows = Array.from(buckets.values())
      .map(b => ({ kategori: b.category, jumlah_transaksi: b.count, total_dibayar: round2(b.total) }))
      .sort((a, b) => b.total_dibayar - a.total_dibayar)

    return {
      ...empty,
      summary: [
        { label: 'Total kategori', value: rows.length },
        { label: 'Total pengeluaran lunas', value: round2(rows.reduce((s, r) => s + r.total_dibayar, 0)) }
      ],
      columns: ['Kategori', 'Jumlah Transaksi', 'Total Dibayar'],
      rows
    }
  }

  // outstanding
  const invoices = await prisma.financeInvoice.findMany({
    where: { type: 'SALES', status: { notIn: ['Paid', 'Cancelled'] } },
    orderBy: { due_date: 'asc' },
    include: { payments: { select: { amount: true } } }
  })

  const rows = invoices
    .map(inv => {
      const paid = (inv.payments || []).reduce((s, p) => s + p.amount, 0)
      return {
        referensi: inv.reference,
        pelanggan: inv.customer_name,
        tanggal: inv.date.toISOString().slice(0, 10),
        jatuh_tempo: inv.due_date.toISOString().slice(0, 10),
        total: round2(inv.amount),
        dibayar: round2(paid),
        sisa: round2(Math.max(0, inv.amount - paid)),
        status: deriveStatus(inv)
      }
    })
    .filter(row => row.sisa > 0)

  return {
    ...empty,
    summary: [
      { label: 'Jumlah faktur belum lunas', value: rows.length },
      { label: 'Total sisa tagihan', value: round2(rows.reduce((s, r) => s + r.sisa, 0)) },
      { label: 'Sudah jatuh tempo', value: rows.filter(r => r.status === 'Overdue').length }
    ],
    columns: ['Referensi', 'Pelanggan', 'Tanggal', 'Jatuh Tempo', 'Total', 'Dibayar', 'Sisa', 'Status'],
    rows
  }
}

export async function exportFinanceReportCsv(params: { report: FinanceReportKind | string; from?: string; to?: string }) {
  const result = await getFinanceReport(params)
  return toCSV(result.rows as any[])
}
