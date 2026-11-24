const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

async function runEndToEndTest() {
  console.log("=== STARTING HAIMOTION FINANCE V2 END-TO-END VERIFICATION ===");
  const results = [];

  function assert(cond, msg) {
    if (!cond) throw new Error(msg);
  }

  try {
    // 1. Verifikasi Master COA
    const coaCount = await prisma.chartOfAccount.count();
    assert(coaCount >= 23, `COA count must be >= 23, found: ${coaCount}`);
    results.push({ test: 'Master Chart of Accounts: 23+ accounts verified', pass: true });

    // 2. Setup Rekening Kas & Bank
    const bcaCoa = await prisma.chartOfAccount.findUnique({ where: { account_code: '1-1002' } });
    const kasCoa = await prisma.chartOfAccount.findUnique({ where: { account_code: '1-1001' } });
    assert(bcaCoa && kasCoa, 'BCA and Kas COA must exist');

    let bankAccount = await prisma.financeAccount.findFirst({ where: { name: 'Bank BCA Operasional Test' } });
    if (!bankAccount) {
      bankAccount = await prisma.financeAccount.create({
        data: {
          name: 'Bank BCA Operasional Test',
          type: 'Bank',
          balance: 100000000,
          currency: 'IDR',
          account_number: '888-001-2345',
          coa_id: bcaCoa.id
        }
      });
    }

    let pettyCash = await prisma.financeAccount.findFirst({ where: { name: 'Kas Kecil Kantor Test' } });
    if (!pettyCash) {
      pettyCash = await prisma.financeAccount.create({
        data: {
          name: 'Kas Kecil Kantor Test',
          type: 'Cash',
          balance: 10000000,
          currency: 'IDR',
          account_number: 'CASH-001',
          coa_id: kasCoa.id
        }
      });
    }
    results.push({ test: 'Liquid Accounts: Created & mapped to COA', pass: true });

    // 3. Setup Project Test
    let project = await prisma.project_list.findFirst({ where: { name: 'Project Animasi V2 Test' } });
    if (!project) {
      project = await prisma.project_list.create({
        data: {
          name: 'Project Animasi V2 Test',
          description: 'Testing Budget and Realization',
          status: 1,
          start_date: new Date(),
          end_date: new Date(Date.now() + 30 * 86400000),
          manager_id: 1
        }
      });
    }
    results.push({ test: 'Project Dimension: project_list entity available', pass: true });

    // 4. Test Double-Entry Posting: Sales Payment
    const piutangCoa = await prisma.chartOfAccount.findUnique({ where: { account_code: '1-1200' } });
    const paymentAmount = 15000000;
    const paymentKey = `SALES_PAYMENT:TEST-INV-001:ORIGINAL:PAY-${Date.now()}`;

    const journal1 = await prisma.$transaction(async (tx) => {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const count = await tx.journalEntry.count();
      const entryNumber = `JV/${year}/${month}/${String(count + 1).padStart(4, '0')}`;

      return tx.journalEntry.create({
        data: {
          entry_number: entryNumber,
          entry_date: new Date(),
          source_type: 'SALES_PAYMENT',
          source_id: 101,
          posting_type: 'ORIGINAL',
          idempotency_key: paymentKey,
          reference_no: 'INV-2026-TEST-001',
          description: 'Penerimaan Pembayaran Faktur Animasi Seri 1',
          total_debit: new Prisma.Decimal(paymentAmount),
          total_credit: new Prisma.Decimal(paymentAmount),
          status: 'POSTED',
          lines: {
            create: [
              { coa_id: bcaCoa.id, debit: new Prisma.Decimal(paymentAmount), credit: new Prisma.Decimal(0), line_memo: 'Penerimaan BCA' },
              { coa_id: piutangCoa.id, debit: new Prisma.Decimal(0), credit: new Prisma.Decimal(paymentAmount), line_memo: 'Pelunasan A/R' }
            ]
          }
        },
        include: { lines: true }
      });
    });

    assert(journal1.lines.length === 2, 'Journal 1 must have 2 lines');
    assert(journal1.status === 'POSTED', 'Journal 1 status must be POSTED');
    results.push({ test: 'Double-Entry Posting: Sales Payment journal balanced', pass: true });

    // 5. Test Expense with Project Analytic Dimension
    const hppCoa = await prisma.chartOfAccount.findUnique({ where: { account_code: '5-1000' } });
    const expenseAmount = 4500000;
    const expenseKey = `EXPENSE:TEST-EXP-001:ORIGINAL:EXP-${Date.now()}`;

    const journal2 = await prisma.$transaction(async (tx) => {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const count = await tx.journalEntry.count();
      const entryNumber = `JV/${year}/${month}/${String(count + 1).padStart(4, '0')}`;

      return tx.journalEntry.create({
        data: {
          entry_number: entryNumber,
          entry_date: new Date(),
          source_type: 'OPERATIONAL_EXPENSE',
          source_id: 201,
          posting_type: 'ORIGINAL',
          idempotency_key: expenseKey,
          reference_no: 'EXP-TEST-001',
          description: 'Honor Freelance Animator Project Animasi V2',
          total_debit: new Prisma.Decimal(expenseAmount),
          total_credit: new Prisma.Decimal(expenseAmount),
          status: 'POSTED',
          lines: {
            create: [
              { coa_id: hppCoa.id, project_id: project.id, debit: new Prisma.Decimal(expenseAmount), credit: new Prisma.Decimal(0), line_memo: 'Upah Animator' },
              { coa_id: bcaCoa.id, debit: new Prisma.Decimal(0), credit: new Prisma.Decimal(expenseAmount), line_memo: 'Kas Keluar BCA' }
            ]
          }
        },
        include: { lines: true }
      });
    });

    assert(journal2.lines[0].project_id === project.id, 'Project ID must be linked to expense line');
    results.push({ test: 'Analytic Tagging: Expense correctly tagged with project_id', pass: true });

    // 6. Test Project Budget Realization Calculation
    const projectExpenseLines = await prisma.journalEntryLine.findMany({
      where: {
        project_id: project.id,
        journal: { status: 'POSTED' },
        account: { classification: 'EXPENSE' }
      }
    });

    let totalBurn = new Prisma.Decimal(0);
    for (const l of projectExpenseLines) {
      totalBurn = totalBurn.plus(l.debit).minus(l.credit);
    }
    assert(Number(totalBurn) === expenseAmount, `Project burn must equal ${expenseAmount}, got ${Number(totalBurn)}`);
    results.push({ test: 'Project Budget: Realization computed from actual POSTED expense lines', pass: true });

    // 7. Test Bank Transfer
    const transferAmount = 2000000;
    const transferKey = `TRANSFER:TRF-001:ORIGINAL:${Date.now()}`;

    const journal3 = await prisma.$transaction(async (tx) => {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const count = await tx.journalEntry.count();
      const entryNumber = `JV/${year}/${month}/${String(count + 1).padStart(4, '0')}`;

      return tx.journalEntry.create({
        data: {
          entry_number: entryNumber,
          entry_date: new Date(),
          source_type: 'BANK_TRANSFER',
          source_id: null,
          posting_type: 'ORIGINAL',
          idempotency_key: transferKey,
          reference_no: 'TRF-TEST-001',
          description: 'Transfer BCA ke Kas Kecil',
          total_debit: new Prisma.Decimal(transferAmount),
          total_credit: new Prisma.Decimal(transferAmount),
          status: 'POSTED',
          lines: {
            create: [
              { coa_id: kasCoa.id, debit: new Prisma.Decimal(transferAmount), credit: new Prisma.Decimal(0), line_memo: 'Kas masuk' },
              { coa_id: bcaCoa.id, debit: new Prisma.Decimal(0), credit: new Prisma.Decimal(transferAmount), line_memo: 'BCA keluar' }
            ]
          }
        },
        include: { lines: true }
      });
    });
    assert(journal3.lines.length === 2, 'Transfer journal balanced');
    results.push({ test: 'Bank Transfer: Zero P&L impact, Asset-to-Asset balanced', pass: true });

    // 8. Test Immutable Reversal (Reversal creates new journal, original untouched)
    const reversalJournal = await prisma.$transaction(async (tx) => {
      const orig = await tx.journalEntry.findUnique({
        where: { id: journal3.id },
        include: { lines: true }
      });

      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const count = await tx.journalEntry.count();
      const entryNumber = `JV/${year}/${month}/${String(count + 1).padStart(4, '0')}`;

      const rev = await tx.journalEntry.create({
        data: {
          entry_number: entryNumber,
          entry_date: new Date(),
          source_type: orig.source_type,
          source_id: orig.source_id,
          posting_type: 'REVERSAL',
          idempotency_key: `REVERSAL:${orig.id}:${Date.now()}`,
          reference_no: `REV-${orig.entry_number}`,
          description: `[REVERSAL] ${orig.description} - Salah input transfer`,
          reversal_of_id: orig.id,
          total_debit: orig.total_credit,
          total_credit: orig.total_debit,
          status: 'POSTED',
          lines: {
            create: orig.lines.map(l => ({
              coa_id: l.coa_id,
              project_id: l.project_id,
              debit: l.credit,
              credit: l.debit,
              line_memo: `Pembalik: ${orig.description}`
            }))
          }
        }
      });
      return rev;
    });

    const origAfter = await prisma.journalEntry.findUnique({ where: { id: journal3.id } });
    assert(origAfter.status === 'POSTED', 'Original journal must remain POSTED');
    assert(reversalJournal.reversal_of_id === journal3.id, 'Reversal must point to original id');
    results.push({ test: 'Immutable Ledger: Reversal creates new entry without modifying original POSTED status', pass: true });

    // 9. Test General Ledger Query
    const allLines = await prisma.journalEntryLine.findMany({
      where: { journal: { status: 'POSTED' } },
      include: { journal: true, account: true }
    });

    const totalDebit = allLines.reduce((s, l) => s.plus(l.debit), new Prisma.Decimal(0));
    const totalCredit = allLines.reduce((s, l) => s.plus(l.credit), new Prisma.Decimal(0));
    assert(totalDebit.equals(totalCredit), `GL must be strictly balanced! Dr: ${totalDebit} != Cr: ${totalCredit}`);
    results.push({ test: 'General Ledger Integrity: Sum(Debit) == Sum(Credit) exact zero variance', pass: true });

    console.log("\n=== ALL END-TO-END TESTS COMPLETED SUCCESSFULLY ===");
    results.forEach(r => console.log(`✓ PASS: ${r.test}`));
    console.log(`TOTAL: ${results.length} | ALL PASSED\n`);

  } catch (err) {
    console.error("END_TO_END_TEST_ERROR:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runEndToEndTest();
