const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runAudit() {
  try {
    const accCount = await prisma.financeAccount.count();
    const expCount = await prisma.financeExpense.count();
    const payCount = await prisma.financePayment.count();
    const invCount = await prisma.financeInvoice.count();
    
    // Check expenses
    const expenses = await prisma.financeExpense.findMany({
      select: { id: true, account_id: true, amount: true, date: true, description: true }
    });
    
    const accounts = await prisma.financeAccount.findMany({
      select: { id: true, name: true, type: true, balance: true }
    });
    const accIds = new Set(accounts.map(a => a.id));
    
    const orphanExpenses = expenses.filter(e => e.account_id !== null && !accIds.has(e.account_id));
    const nullAccountExpenses = expenses.filter(e => e.account_id === null);
    
    // Check payments
    const payments = await prisma.financePayment.findMany({
      select: { id: true, invoice_id: true, amount: true, payment_method: true }
    });
    
    // Invoices by status
    const invoicesByStatus = await prisma.financeInvoice.groupBy({
      by: ['status', 'type'],
      _count: { id: true },
      _sum: { amount: true }
    });

    console.log("=== DB AUDIT RESULT ===");
    console.log(JSON.stringify({
      status: "SUCCESS",
      counts: { accounts: accCount, expenses: expCount, payments: payCount, invoices: invCount },
      accountsList: accounts,
      orphanExpensesCount: orphanExpenses.length,
      orphanExpensesSample: orphanExpenses.slice(0, 5),
      nullAccountExpensesCount: nullAccountExpenses.length,
      invoicesSummary: invoicesByStatus
    }, null, 2));

  } catch (err) {
    console.log("=== DB AUDIT ERROR ===");
    console.log(JSON.stringify({ status: "ERROR", message: err.message }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

runAudit();
