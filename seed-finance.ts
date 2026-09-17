import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding finance data...')

  // Get first user for created_by
  const user = await prisma.user.findFirst()
  const userId = user ? user.id : 1

  // 1. Ensure accounts exist
  const accounts = await prisma.financeAccount.findMany()
  let bankAccountId, cashAccountId
  
  if (accounts.length === 0) {
    const bank = await prisma.financeAccount.create({
      data: { name: 'Main Checking', type: 'Bank', balance: 0, currency: 'IDR' }
    })
    const cash = await prisma.financeAccount.create({
      data: { name: 'Petty Cash', type: 'Cash', balance: 0, currency: 'IDR' }
    })
    bankAccountId = bank.id
    cashAccountId = cash.id
  } else {
    bankAccountId = accounts.find(a => a.type === 'Bank')?.id || accounts[0].id
    cashAccountId = accounts.find(a => a.type === 'Cash')?.id || accounts[0].id
  }

  // 2. Create an Invoice
  await prisma.financeInvoice.create({
    data: {
      reference: `INV-2026-0123`,
      customer_name: 'PT Mega Terang',
      customer_email: 'finance@megaterang.com',
      date: new Date(),
      due_date: new Date(new Date().setDate(new Date().getDate() + 14)), // 14 days from now
      amount: 15000000, // 15,000,000 IDR
      status: 'Sent',
      created_by: userId,
      items: {
        create: [
          { description: 'Website Redesign', quantity: 1, price: 10000000 },
          { description: 'SEO Optimization', quantity: 1, price: 5000000 }
        ]
      }
    }
  })

  // 3. Create an Expense
  await prisma.financeExpense.create({
    data: {
      date: new Date(),
      description: 'Langganan Server AWS (Bulanan)',
      category: 'Operations',
      amount: 1200000, // 1,200,000 IDR
      vendor: 'Amazon Web Services',
      status: 'Approved',
      created_by: userId
    }
  })

  // 4. Create a Transaction (Income)
  await prisma.financeTransaction.create({
    data: {
      date: new Date(),
      description: 'DP Proyek Website',
      type: 'Income',
      amount: 5000000, // 5,000,000 IDR
      account_id: bankAccountId,
      reference: 'TRX-5541',
      created_by: userId
    }
  })
  
  // Update account balance
  await prisma.financeAccount.update({
    where: { id: bankAccountId },
    data: { balance: { increment: 5000000 } }
  })

  console.log('Finance seeding completed!')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
