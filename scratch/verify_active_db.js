const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  try {
    const coaCount = await prisma.chartOfAccount.count();
    const periodCount = await prisma.accountingPeriod.count();
    const journalCount = await prisma.journalEntry.count();
    const accountsCount = await prisma.financeAccount.count();
    
    // Check migration log
    const migrationLog = await prisma.$queryRaw`SELECT version, status, started_at, applied_at, execution_time_ms FROM _finance_migration_log`;
    
    console.log("=== ACTIVE DATABASE VERIFICATION SUCCESS ===");
    console.log(JSON.stringify({
      coaCount,
      periodCount,
      journalCount,
      accountsCount,
      migrationLog
    }, null, 2));
    
    await prisma.$disconnect();
  } catch (err) {
    console.error("=== ACTIVE DATABASE VERIFICATION ERROR ===", err);
    await prisma.$disconnect();
    process.exit(1);
  }
}
verify();
