'use server'

import prisma from '@/lib/prisma'
import { requireAuth } from '@/lib/auth/authorization'

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
    // Basic CSV line parsing (doesn't handle commas inside quotes perfectly, but sufficient here)
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

// -----------------------------------------------------------------------------
// OVERVIEW & SUMMARY
// -----------------------------------------------------------------------------
export async function getFinanceSummary() {
  await requireAuth()
  
  const [invoices, expenses, accounts, unpaidInvoicesCount, paidInvoicesCount, totalTransactionsCount] = await Promise.all([
    prisma.financeInvoice.aggregate({
      _sum: { amount: true },
      where: { status: 'Paid' }
    }),
    prisma.financeExpense.aggregate({
      _sum: { amount: true },
      where: { status: 'Paid' }
    }),
    prisma.financeAccount.aggregate({
      _sum: { balance: true }
    }),
    prisma.financeInvoice.count({
      where: { status: { in: ['Draft', 'Sent', 'Overdue', 'Unpaid'] } }
    }),
    prisma.financeInvoice.count({
      where: { status: 'Paid' }
    }),
    prisma.financeTransaction.count()
  ])
  
  const totalRevenue = invoices._sum.amount || 0
  const totalExpenses = expenses._sum.amount || 0
  const netProfit = totalRevenue - totalExpenses
  
  const outstandingInvoicesResult = await prisma.financeInvoice.aggregate({
    _sum: { amount: true },
    where: { status: { in: ['Draft', 'Sent', 'Overdue', 'Unpaid'] } }
  })

  // Group transactions by month for the current year
  const currentYear = new Date().getFullYear()
  const transactions = await prisma.financeTransaction.findMany({
    where: {
      date: {
        gte: new Date(`${currentYear}-01-01`),
        lte: new Date(`${currentYear}-12-31`)
      }
    }
  })

  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(currentYear, i).toLocaleString('en-US', { month: 'short' })
    return { name: month, income: 0, expenses: 0 }
  })

  transactions.forEach(tx => {
    const monthIndex = new Date(tx.date).getMonth()
    if (tx.type === 'Income') {
      monthlyData[monthIndex].income += tx.amount
    } else if (tx.type === 'Expense') {
      monthlyData[monthIndex].expenses += tx.amount
    }
  })
  
  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    outstandingInvoices: outstandingInvoicesResult._sum.amount || 0,
    outstandingInvoicesCount: unpaidInvoicesCount,
    paidInvoicesCount,
    totalTransactionsCount,
    cashAndBank: accounts._sum.balance || 0,
    monthlyData
  }
}

// -----------------------------------------------------------------------------
// INVOICES
// -----------------------------------------------------------------------------
export async function getInvoices(filters?: { status?: string, search?: string }) {
  await requireAuth()
  
  const where: any = {}
  if (filters?.status && filters.status !== 'All') {
    where.status = filters.status
  }
  if (filters?.search) {
    where.OR = [
      { customer_name: { contains: filters.search } },
      { reference: { contains: filters.search } }
    ]
  }
  
  return prisma.financeInvoice.findMany({
    where,
    orderBy: { created_at: 'desc' },
    include: { items: true }
  })
}

export async function createInvoice(data: any) {
  const auth = await requireAuth()
  
  // Format dates
  const date = data.date ? new Date(data.date) : new Date()
  const due_date = data.dueDate ? new Date(data.dueDate) : new Date()
  
  // Create reference if missing
  const ref = data.reference || `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`

  return prisma.financeInvoice.create({
    data: {
      reference: ref,
      customer_name: data.customerName,
      customer_email: data.customerEmail,
      date,
      due_date,
      amount: data.amount,
      status: data.status || 'Draft',
      created_by: parseInt(auth.id, 10),
      items: {
        create: data.items ? data.items.map((i: any) => ({
          description: i.description,
          quantity: i.quantity,
          price: i.price
        })) : []
      }
    }
  })
}

export async function updateInvoice(id: number, data: any) {
  await requireAuth()
  return prisma.financeInvoice.update({
    where: { id },
    data: {
      status: data.status
    }
  })
}

export async function deleteInvoice(id: number) {
  await requireAuth()
  return prisma.financeInvoice.delete({
    where: { id }
  })
}

export async function exportInvoicesCsv() {
  await requireAuth()
  const invoices = await prisma.financeInvoice.findMany({
    orderBy: { created_at: 'desc' }
  })
  
  const records = invoices.map(i => ({
    Reference: i.reference,
    Customer: i.customer_name,
    Email: i.customer_email || '',
    Date: i.date.toISOString().split('T')[0],
    DueDate: i.due_date.toISOString().split('T')[0],
    Amount: i.amount,
    Status: i.status
  }))
  
  return toCSV(records)
}

export async function importInvoicesCsv(csvContent: string) {
  const auth = await requireAuth()
  const records = fromCSV(csvContent)
  
  let count = 0
  for (const record of records) {
    try {
      await prisma.financeInvoice.create({
        data: {
          reference: record.Reference || `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`,
          customer_name: record.Customer || 'Unknown',
          customer_email: record.Email || null,
          date: record.Date ? new Date(record.Date) : new Date(),
          due_date: record.DueDate ? new Date(record.DueDate) : new Date(),
          amount: parseFloat(record.Amount) || 0,
          status: record.Status || 'Draft',
          created_by: parseInt(auth.id, 10)
        }
      })
      count++
    } catch (err) {
      console.error('Failed to import invoice record', err)
    }
  }
  return count
}


// -----------------------------------------------------------------------------
// EXPENSES
// -----------------------------------------------------------------------------
export async function getExpenses(filters?: { category?: string, search?: string }) {
  await requireAuth()
  
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
  const auth = await requireAuth()
  
  return prisma.financeExpense.create({
    data: {
      date: data.date ? new Date(data.date) : new Date(),
      description: data.description,
      category: data.category || 'Other',
      amount: data.amount,
      vendor: data.vendor,
      status: data.status || 'Pending',
      created_by: parseInt(auth.id, 10)
    }
  })
}

export async function updateExpense(id: number, data: any) {
  await requireAuth()
  return prisma.financeExpense.update({
    where: { id },
    data: {
      status: data.status
    }
  })
}

export async function deleteExpense(id: number) {
  await requireAuth()
  return prisma.financeExpense.delete({
    where: { id }
  })
}

export async function exportExpensesCsv() {
  await requireAuth()
  const expenses = await prisma.financeExpense.findMany({
    orderBy: { date: 'desc' }
  })
  
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
  const auth = await requireAuth()
  const records = fromCSV(csvContent)
  
  let count = 0
  for (const record of records) {
    try {
      await prisma.financeExpense.create({
        data: {
          date: record.Date ? new Date(record.Date) : new Date(),
          vendor: record.Vendor || 'Unknown',
          description: record.Description || 'Imported Expense',
          category: record.Category || 'Other',
          amount: parseFloat(record.Amount) || 0,
          status: record.Status || 'Pending',
          created_by: parseInt(auth.id, 10)
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
// ACCOUNTS & TRANSACTIONS
// -----------------------------------------------------------------------------
export async function getBankAccounts() {
  await requireAuth()
  // Ensure we have default accounts if empty
  let accounts = await prisma.financeAccount.findMany({
    orderBy: { name: 'asc' }
  })
  
  if (accounts.length === 0) {
    await prisma.financeAccount.createMany({
      data: [
        { name: 'Main Checking', type: 'Bank', balance: 0, currency: 'USD' },
        { name: 'Petty Cash', type: 'Cash', balance: 0, currency: 'USD' }
      ]
    })
    accounts = await prisma.financeAccount.findMany({
      orderBy: { name: 'asc' }
    })
  }
  
  return accounts
}

export async function getTransactions(filters?: { search?: string }) {
  await requireAuth()
  
  const where: any = {}
  if (filters?.search) {
    where.OR = [
      { description: { contains: filters.search } },
      { reference: { contains: filters.search } }
    ]
  }
  
  return prisma.financeTransaction.findMany({
    where,
    orderBy: { date: 'desc' },
    include: { account: true }
  })
}

export async function createTransaction(data: any) {
  const auth = await requireAuth()
  
  // Fetch account first
  let accountId = data.accountId
  if (!accountId && data.account) {
    const acc = await prisma.financeAccount.findFirst({
      where: { name: data.account }
    })
    if (acc) {
      accountId = acc.id
    }
  }
  
  if (!accountId) {
    const acc = await prisma.financeAccount.findFirst()
    accountId = acc?.id || 1
  }

  // Update Account Balance
  if (data.type === 'Income') {
    await prisma.financeAccount.update({
      where: { id: accountId },
      data: { balance: { increment: data.amount } }
    })
  } else if (data.type === 'Expense') {
    await prisma.financeAccount.update({
      where: { id: accountId },
      data: { balance: { decrement: data.amount } }
    })
  }

  return prisma.financeTransaction.create({
    data: {
      date: data.date ? new Date(data.date) : new Date(),
      description: data.description,
      type: data.type || 'Expense',
      amount: data.amount,
      reference: data.reference,
      account_id: accountId,
      created_by: parseInt(auth.id, 10)
    }
  })
}

// -----------------------------------------------------------------------------
// CONTACTS (CUSTOMERS / SUPPLIERS)
// -----------------------------------------------------------------------------
export async function getContacts(filters?: { type?: string, search?: string }) {
  await requireAuth()
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
  await requireAuth()
  return prisma.financeContact.create({
    data: {
      type: data.type || 'CUSTOMER',
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null
    }
  })
}

export async function updateContact(id: number, data: any) {
  await requireAuth()
  return prisma.financeContact.update({
    where: { id },
    data: {
      type: data.type,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address
    }
  })
}

export async function deleteContact(id: number) {
  await requireAuth()
  return prisma.financeContact.delete({ where: { id } })
}

// -----------------------------------------------------------------------------
// PRODUCTS & SERVICES
// -----------------------------------------------------------------------------
export async function getProductsServices(filters?: { type?: string, search?: string }) {
  await requireAuth()
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
  await requireAuth()
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
  await requireAuth()
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
  await requireAuth()
  return prisma.financeProductService.delete({ where: { id } })
}

// -----------------------------------------------------------------------------
// ACCOUNTS (CHART OF ACCOUNTS)
// -----------------------------------------------------------------------------
export async function getChartOfAccounts(filters?: { search?: string }) {
  await requireAuth()
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
  await requireAuth()
  return prisma.financeAccount.create({
    data: {
      code: data.code || null,
      name: data.name,
      type: data.type || 'Asset',
      sub_type: data.subType || null,
      balance: parseFloat(data.balance) || 0,
      currency: data.currency || 'IDR'
    }
  })
}

export async function updateAccount(id: number, data: any) {
  await requireAuth()
  return prisma.financeAccount.update({
    where: { id },
    data: {
      code: data.code,
      name: data.name,
      type: data.type,
      sub_type: data.subType,
      balance: parseFloat(data.balance) || 0
    }
  })
}

export async function deleteAccount(id: number) {
  await requireAuth()
  return prisma.financeAccount.delete({ where: { id } })
}
