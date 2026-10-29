'use server'

import prisma from '@/lib/prisma'
import { requireAuth, requirePermission } from '@/lib/auth/authorization'
import { logActivity } from '@/lib/activity-log'

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
    totalTransactionsCount
  ] = await Promise.all([
    prisma.financeInvoice.findMany({
      where: { type: 'SALES' },
      select: { amount: true, status: true, due_date: true, payments: { select: { amount: true } } }
    }),
    prisma.financeInvoice.findMany({
      where: { type: 'PURCHASE' },
      select: { amount: true, status: true, payments: { select: { amount: true } } }
    }),
    prisma.financeExpense.aggregate({ _sum: { amount: true }, where: { status: 'Paid' } }),
    prisma.financeAccount.aggregate({ _sum: { balance: true } }),
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
      take: 6,
      include: { account: { select: { name: true } } }
    }),
    prisma.financeTransaction.count()
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

  const outstandingInvoices = round2(
    unpaidInvoices.reduce((sum, i) => sum + Math.max(0, i.amount - paidOf(i)), 0)
  )
  const overdueInvoicesCount = unpaidInvoices.filter(i => deriveStatus(i) === 'Overdue').length

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(year, i).toLocaleString('en-US', { month: 'short' })
    return { name: month, income: 0, expenses: 0 }
  })

  // Arus kas per bulan diambil dari transaksi kas/bank yang benar-benar tercatat
  payments.forEach(payment => {
    const monthIndex = new Date(payment.payment_date).getMonth()
    if (monthIndex < 0 || monthIndex > 11) return
    if (payment.invoice?.type === 'PURCHASE') {
      monthlyData[monthIndex].expenses += payment.amount
    } else {
      monthlyData[monthIndex].income += payment.amount
    }
  })

  return {
    totalRevenue,
    totalExpenses,
    purchaseCost,
    operatingExpenses,
    netProfit: round2(totalRevenue - totalExpenses),
    outstandingInvoices,
    outstandingInvoicesCount: unpaidInvoices.length,
    overdueInvoicesCount,
    paidInvoicesCount,
    totalTransactionsCount,
    cashAndBank: round2(accounts._sum.balance || 0),
    monthlyData,
    recentTransactions: recentTransactions.map(tx => ({
      id: tx.id,
      date: tx.date,
      description: tx.description,
      type: tx.type,
      amount: tx.amount,
      reference: tx.reference,
      account: tx.account?.name || '-'
    })),
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

  await prisma.$transaction(async tx => {
    // Transaksi kas/bank yang lahir dari pembayaran faktur ini ikut dibatalkan,
    // supaya saldo akun tidak menyisakan uang yang sebenarnya tidak ada.
    const linked = await tx.financeTransaction.findMany({ where: { reference: invoice.reference } })
    for (const txRow of linked) {
      if (txRow.account_id) {
        const delta = txRow.type === 'Income' ? -txRow.amount : txRow.amount
        await tx.financeAccount.update({
          where: { id: txRow.account_id },
          data: { balance: { increment: delta } }
        })
      }
    }
    if (linked.length > 0) {
      await tx.financeTransaction.deleteMany({ where: { id: { in: linked.map(t => t.id) } } })
    }

    await tx.financeInvoice.delete({ where: { id } })
  })

  await logActivity({
    userId: uid,
    activityType: 'delete',
    description: `Deleted invoice: ${invoice.reference}`
  })

  return invoice
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

  let accountId: number | null = null
  if (data.accountId) {
    const account = await prisma.financeAccount.findUnique({ where: { id: Number(data.accountId) } })
    if (!account) throw new Error('Akun kas/bank tidak ditemukan.')
    accountId = account.id
  }

  const paidAfter = round2(paidBefore + amount)
  const isFullyPaid = paidAfter >= invoice.amount - EPSILON
  const nextStatus = isFullyPaid ? 'Paid' : 'Partial'

  const result = await prisma.$transaction(async tx => {
    const payment = await tx.financePayment.create({
      data: {
        invoice_id: invoice.id,
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

export async function deleteExpense(id: number) {
  const _u = await requireAuth(); requirePermission(_u, 'finance.delete')
  const uid = await currentUserId()

  await prisma.$transaction(async tx => {
    // Batalkan transaksi kas yang terkait lalu kembalikan saldo akun.
    const linked = await tx.financeTransaction.findFirst({ where: { reference: `EXP-${id}` } })
    if (linked) {
      if (linked.account_id) {
        await tx.financeAccount.update({
          where: { id: linked.account_id },
          data: { balance: { increment: linked.amount } }
        })
      }
      await tx.financeTransaction.delete({ where: { id: linked.id } })
    }
    await tx.financeExpense.delete({ where: { id } })
  })

  await logActivity({
    userId: uid,
    activityType: 'delete',
    description: `Deleted expense #${id}`
  })

  return { success: true }
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

  let accounts = await prisma.financeAccount.findMany({ orderBy: { name: 'asc' } })

  // Seed sekali pakai agar instalasi baru punya akun kas/bank dasar.
  // Tidak lagi mengembalikan data palsu saat query gagal — error dibiarkan naik
  // supaya masalah database terlihat, bukan disembunyikan.
  if (accounts.length === 0) {
    await prisma.financeAccount.createMany({
      data: [
        { name: 'Kas Utama', type: 'Cash', balance: 0, currency: 'IDR' },
        { name: 'Bank Utama', type: 'Bank', balance: 0, currency: 'IDR' }
      ]
    })
    accounts = await prisma.financeAccount.findMany({ orderBy: { name: 'asc' } })
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
    const [salesPayments, purchasePayments, paidExpenses] = await Promise.all([
      prisma.financePayment.findMany({
        where: { payment_date: { gte: start, lte: end }, invoice: { type: 'SALES' } },
        select: { amount: true }
      }),
      prisma.financePayment.findMany({
        where: { payment_date: { gte: start, lte: end }, invoice: { type: 'PURCHASE' } },
        select: { amount: true }
      }),
      prisma.financeExpense.findMany({
        where: { status: 'Paid', date: { gte: start, lte: end } },
        select: { amount: true }
      })
    ])

    const revenue = round2(salesPayments.reduce((s, p) => s + p.amount, 0))
    const purchaseCost = round2(purchasePayments.reduce((s, p) => s + p.amount, 0))
    const operatingExpenses = round2(paidExpenses.reduce((s, e) => s + e.amount, 0))
    const grossProfit = round2(revenue - purchaseCost)
    const netProfit = round2(grossProfit - operatingExpenses)

    return {
      ...empty,
      summary: [
        { label: 'Pendapatan (pembayaran faktur penjualan)', value: revenue },
        { label: 'Biaya pembelian (pembayaran faktur pembelian)', value: purchaseCost },
        { label: 'Laba kotor', value: grossProfit },
        { label: 'Pengeluaran operasional (lunas)', value: operatingExpenses },
        { label: 'Laba bersih', value: netProfit }
      ],
      columns: ['Keterangan', 'Jumlah'],
      rows: [
        { keterangan: 'Pendapatan', jumlah: revenue },
        { keterangan: 'Biaya Pembelian', jumlah: -purchaseCost },
        { keterangan: 'Laba Kotor', jumlah: grossProfit },
        { keterangan: 'Pengeluaran Operasional', jumlah: -operatingExpenses },
        { keterangan: 'Laba Bersih', jumlah: netProfit }
      ]
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
