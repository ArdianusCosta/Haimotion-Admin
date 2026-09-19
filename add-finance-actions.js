const fs = require('fs');

const actionsCode = `
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
  return prisma.financeProductService.create({
    data: {
      code: data.code,
      name: data.name,
      type: data.type || 'Barang',
      unit: data.unit || 'Pcs',
      brand: data.brand || null,
      price: parseFloat(data.price) || 0
    }
  })
}

export async function updateProductService(id: number, data: any) {
  await requireAuth()
  return prisma.financeProductService.update({
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
`;

fs.appendFileSync('app/actions/finance.ts', actionsCode);
console.log('Appended actions');
