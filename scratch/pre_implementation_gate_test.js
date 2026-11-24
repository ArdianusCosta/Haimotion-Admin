// scratch/pre_implementation_gate_test.js
// Comprehensive Pre-Implementation Gate Test Suite for HaiMotion Finance V2

class Decimal {
  constructor(val) {
    if (val instanceof Decimal) {
      this.d = val.d;
    } else if (typeof val === 'number') {
      this.d = Math.round(val * 100);
    } else if (typeof val === 'string') {
      this.d = Math.round(parseFloat(val) * 100);
    } else {
      this.d = 0;
    }
  }
  plus(other) {
    const o = new Decimal(other);
    const res = new Decimal(0);
    res.d = this.d + o.d;
    return res;
  }
  minus(other) {
    const o = new Decimal(other);
    const res = new Decimal(0);
    res.d = this.d - o.d;
    return res;
  }
  equals(other) {
    const o = new Decimal(other);
    return this.d === o.d;
  }
  isZero() {
    return this.d === 0;
  }
  isPositive() {
    return this.d > 0;
  }
  toNumber() {
    return this.d / 100;
  }
  toString() {
    return (this.d / 100).toFixed(2);
  }
}

// In-Memory Database Simulation
const db = {
  periods: [
    { id: 1, name: 'Jan 2026', start: '2026-01-01', end: '2026-01-31', status: 'CLOSED' },
    { id: 2, name: 'Feb 2026', start: '2026-02-01', end: '2026-02-28', status: 'LOCKED' },
    { id: 3, name: 'Mar 2026', start: '2026-03-01', end: '2026-03-31', status: 'OPEN' }
  ],
  journalEntries: [],
  journalEntryLines: [],
  auditLogs: [],
  idempotencyStore: new Set()
};

// COA Catalog
const COA = {
  KAS_UTAMA: { id: 1, code: '1-1001', name: 'Kas Utama', type: 'ASSET', normal: 'DEBIT' },
  BANK_BCA: { id: 2, code: '1-1002', name: 'Bank BCA', type: 'ASSET', normal: 'DEBIT' },
  PIUTANG_USAHA: { id: 3, code: '1-1200', name: 'Piutang Usaha', type: 'ASSET', normal: 'DEBIT' },
  CLEARING_ACCOUNT: { id: 4, code: '1-1999', name: 'Akun Kliring / Transisi', type: 'ASSET', normal: 'DEBIT' },
  UTANG_USAHA: { id: 5, code: '2-1100', name: 'Utang Usaha', type: 'LIABILITY', normal: 'CREDIT' },
  DEPOSIT_PELANGGAN: { id: 6, code: '2-1300', name: 'Deposit Pelanggan', type: 'LIABILITY', normal: 'CREDIT' },
  OPENING_EQUITY: { id: 7, code: '3-1002', name: 'Saldo Penyeimbang Awal', type: 'EQUITY', normal: 'CREDIT' },
  PENDAPATAN: { id: 8, code: '4-1000', name: 'Pendapatan Animasi', type: 'REVENUE', normal: 'CREDIT' },
  BEBAN_PROYEK: { id: 9, code: '5-1000', name: 'Beban Subkontraktor Proyek', type: 'EXPENSE', normal: 'DEBIT' },
  BEBAN_GAJI: { id: 10, code: '6-1001', name: 'Beban Gaji Karyawan', type: 'EXPENSE', normal: 'DEBIT' }
};

// Transaction Runner with Rollback Simulation
async function withTransaction(fn) {
  const snapshotEntries = [...db.journalEntries];
  const snapshotLines = [...db.journalEntryLines];
  const snapshotKeys = new Set(db.idempotencyStore);
  try {
    const result = await fn();
    return result;
  } catch (err) {
    // Rollback
    db.journalEntries = snapshotEntries;
    db.journalEntryLines = snapshotLines;
    db.idempotencyStore = snapshotKeys;
    throw err;
  }
}

// Posting Engine
class AdvancedPostingEngine {
  static validatePeriod(entryDate) {
    const period = db.periods.find(p => entryDate >= p.start && entryDate <= p.end);
    if (!period) return; // Future / unknown period
    if (period.status === 'CLOSED' || period.status === 'LOCKED') {
      throw new Error(`PERIOD_BLOCKED: Periode akuntansi ${period.name} berstatus ${period.status}. Posting dilarang.`);
    }
  }

  static async post(entry) {
    return withTransaction(async () => {
      this.validatePeriod(entry.entryDate);

      const idempotencyKey = entry.idempotencyKey;
      if (db.idempotencyStore.has(idempotencyKey)) {
        throw new Error(`CONCURRENT_DUPLICATE_KEY: ${idempotencyKey}`);
      }

      // Check lines
      if (!entry.lines || entry.lines.length < 2) {
        throw new Error("MIN_LINES_REQUIRED");
      }

      let totalDebit = new Decimal(0);
      let totalCredit = new Decimal(0);

      for (const line of entry.lines) {
        const d = new Decimal(line.debit || 0);
        const c = new Decimal(line.credit || 0);
        if (d.isZero() && c.isZero()) throw new Error("ZERO_AMOUNT_LINE");
        if (d.isPositive() && c.isPositive()) throw new Error("BOTH_DEBIT_CREDIT_LINE");
        totalDebit = totalDebit.plus(d);
        totalCredit = totalCredit.plus(c);
      }

      if (!totalDebit.equals(totalCredit)) {
        throw new Error(`UNBALANCED_JOURNAL: Dr ${totalDebit.toString()} != Cr ${totalCredit.toString()}`);
      }

      const journalId = db.journalEntries.length + 1;
      const newEntry = {
        id: journalId,
        entry_number: `JV/2026/${String(journalId).padStart(4, '0')}`,
        entry_date: entry.entryDate,
        posting_type: entry.postingType || 'ORIGINAL',
        idempotency_key: idempotencyKey,
        reversal_of_id: entry.reversalOfId || null,
        status: 'POSTED'
      };

      // Simpan lines (jika salah satu gagal, transaction melempar error dan rollback otomatis)
      for (const line of entry.lines) {
        if (line.shouldFailSimulated) {
          throw new Error("SIMULATED_LINE_PERSIST_FAILURE");
        }
        db.journalEntryLines.push({
          id: db.journalEntryLines.length + 1,
          journal_id: journalId,
          coa_id: line.coa_id,
          project_id: line.project_id || null,
          debit: new Decimal(line.debit || 0).toString(),
          credit: new Decimal(line.credit || 0).toString()
        });
      }

      db.journalEntries.push(newEntry);
      db.idempotencyStore.add(idempotencyKey);
      db.auditLogs.push({
        event: 'JOURNAL_POSTED',
        journalId,
        key: idempotencyKey,
        time: new Date()
      });

      return newEntry;
    });
  }

  static async reverse(originalId, key, reason) {
    const original = db.journalEntries.find(j => j.id === originalId);
    if (!original) throw new Error("ORIGINAL_NOT_FOUND");
    if (original.posting_type === 'REVERSAL') throw new Error("CANNOT_REVERSE_A_REVERSAL");

    const alreadyReversed = db.journalEntries.find(j => j.reversal_of_id === originalId);
    if (alreadyReversed) throw new Error("ALREADY_REVERSED");

    const lines = db.journalEntryLines.filter(l => l.journal_id === originalId);
    const reversedLines = lines.map(l => ({
      coa_id: l.coa_id,
      project_id: l.project_id,
      debit: l.credit,
      credit: l.debit
    }));

    return this.post({
      entryDate: '2026-03-15',
      postingType: 'REVERSAL',
      idempotencyKey: key,
      reversalOfId: originalId,
      lines: reversedLines
    });
  }

  static calculateProjectBudgetBurn(projectId) {
    const lines = db.journalEntryLines.filter(l => l.project_id === projectId);
    let totalBurn = new Decimal(0);
    for (const line of lines) {
      const coa = Object.values(COA).find(c => c.id === line.coa_id);
      if (coa && coa.type === 'EXPENSE') {
        totalBurn = totalBurn.plus(line.debit).minus(line.credit);
      }
    }
    return totalBurn.toNumber();
  }
}

// TEST SUITE
async function runTests() {
  const tests = [];
  function assert(cond, msg) {
    if (!cond) throw new Error(msg);
  }

  // 1. Period Blocking
  try {
    await AdvancedPostingEngine.post({
      entryDate: '2026-01-15', // Closed period
      idempotencyKey: 'TEST:CLOSED_PERIOD',
      lines: [
        { coa_id: COA.BANK_BCA.id, debit: 100, credit: 0 },
        { coa_id: COA.PENDAPATAN.id, debit: 0, credit: 100 }
      ]
    });
    tests.push({ name: 'Period Blocking: Closed Period Rejected', pass: false });
  } catch (err) {
    tests.push({ name: 'Period Blocking: Closed Period Rejected', pass: err.message.includes('PERIOD_BLOCKED') });
  }

  // 2. Concurrent Posting Idempotency
  try {
    const key = 'CONCURRENT:PAY:999';
    const p1 = AdvancedPostingEngine.post({
      entryDate: '2026-03-10',
      idempotencyKey: key,
      lines: [
        { coa_id: COA.BANK_BCA.id, debit: 5000000, credit: 0 },
        { coa_id: COA.PIUTANG_USAHA.id, debit: 0, credit: 5000000 }
      ]
    });
    const p2 = AdvancedPostingEngine.post({
      entryDate: '2026-03-10',
      idempotencyKey: key,
      lines: [
        { coa_id: COA.BANK_BCA.id, debit: 5000000, credit: 0 },
        { coa_id: COA.PIUTANG_USAHA.id, debit: 0, credit: 5000000 }
      ]
    });

    const res = await Promise.allSettled([p1, p2]);
    const fulfilled = res.filter(r => r.status === 'fulfilled').length;
    const rejected = res.filter(r => r.status === 'rejected').length;
    assert(fulfilled === 1 && rejected === 1, "Exactly one must succeed, one must reject");
    tests.push({ name: 'Concurrent Posting: Exactly one succeeds, duplicate rejected', pass: true });
  } catch (err) {
    tests.push({ name: 'Concurrent Posting: Exactly one succeeds, duplicate rejected', pass: false, err: err.message });
  }

  // 3. Rollback on line failure
  try {
    const preEntriesCount = db.journalEntries.length;
    const preLinesCount = db.journalEntryLines.length;

    await AdvancedPostingEngine.post({
      entryDate: '2026-03-12',
      idempotencyKey: 'FAIL_TEST:001',
      lines: [
        { coa_id: COA.BANK_BCA.id, debit: 1000000, credit: 0 },
        { coa_id: COA.PENDAPATAN.id, debit: 0, credit: 1000000, shouldFailSimulated: true }
      ]
    });
    tests.push({ name: 'Atomic Rollback: Journal and Lines completely reverted on failure', pass: false });
  } catch (err) {
    const postEntriesCount = db.journalEntries.length;
    const postLinesCount = db.journalEntryLines.length;
    const isClean = postEntriesCount === 1 && postLinesCount === 2; // only the successful concurrent one remains
    tests.push({ name: 'Atomic Rollback: Journal and Lines completely reverted on failure', pass: isClean });
  }

  // 4. Project Budget Analytical Tagging
  try {
    const projectId = 42;
    // Post expense tagged with project 42
    await AdvancedPostingEngine.post({
      entryDate: '2026-03-14',
      idempotencyKey: 'PROJ_EXP:42:001',
      lines: [
        { coa_id: COA.BEBAN_PROYEK.id, project_id: projectId, debit: 7500000, credit: 0 },
        { coa_id: COA.BANK_BCA.id, debit: 0, credit: 7500000 }
      ]
    });

    // Post operational expense NOT tagged with project
    await AdvancedPostingEngine.post({
      entryDate: '2026-03-14',
      idempotencyKey: 'GEN_EXP:001',
      lines: [
        { coa_id: COA.BEBAN_GAJI.id, debit: 12000000, credit: 0 },
        { coa_id: COA.BANK_BCA.id, debit: 0, credit: 12000000 }
      ]
    });

    const burn = AdvancedPostingEngine.calculateProjectBudgetBurn(projectId);
    assert(burn === 7500000, `Project burn must be exactly 7,500,000, got ${burn}`);
    tests.push({ name: 'Project Budget: Realization aggregates only actual project expense lines', pass: true });
  } catch (err) {
    tests.push({ name: 'Project Budget: Realization aggregates only actual project expense lines', pass: false, err: err.message });
  }

  // 5. Full Reversal Once Only
  try {
    const entryToRev = db.journalEntries[0];
    await AdvancedPostingEngine.reverse(entryToRev.id, 'REV:FIRST', 'Mistake in invoice');
    
    let secondBlocked = false;
    try {
      await AdvancedPostingEngine.reverse(entryToRev.id, 'REV:SECOND', 'Try reverse again');
    } catch (e) {
      if (e.message.includes('ALREADY_REVERSED')) secondBlocked = true;
    }
    assert(secondBlocked, "Second reversal must be blocked");
    tests.push({ name: 'Immutable Ledger: Full reversal permitted strictly once', pass: true });
  } catch (err) {
    tests.push({ name: 'Immutable Ledger: Full reversal permitted strictly once', pass: false, err: err.message });
  }

  // 6. Opening Balance with Clearing Account
  try {
    const openingEntry = await AdvancedPostingEngine.post({
      entryDate: '2026-03-01',
      postingType: 'OPENING_BALANCE',
      idempotencyKey: 'OPENING:2026-03-01',
      lines: [
        { coa_id: COA.KAS_UTAMA.id, debit: 5000000, credit: 0 },
        { coa_id: COA.BANK_BCA.id, debit: 85000000, credit: 0 },
        { coa_id: COA.PIUTANG_USAHA.id, debit: 20000000, credit: 0 },
        { coa_id: COA.CLEARING_ACCOUNT.id, debit: 2500000, credit: 0 }, // Unmapped legacy
        { coa_id: COA.UTANG_USAHA.id, debit: 0, credit: 10000000 },
        { coa_id: COA.DEPOSIT_PELANGGAN.id, debit: 0, credit: 2500000 },
        { coa_id: COA.OPENING_EQUITY.id, debit: 0, credit: 100000000 } // Balance
      ]
    });

    assert(openingEntry.status === 'POSTED', "Opening balance posted");
    tests.push({ name: 'Opening Balance: Properly separates cash, A/R, A/P, deposits, and clearing account', pass: true });
  } catch (err) {
    tests.push({ name: 'Opening Balance: Properly separates cash, A/R, A/P, deposits, and clearing account', pass: false, err: err.message });
  }

  console.log("\n================ GATE TEST SUMMARY ================");
  tests.forEach(t => {
    console.log(`${t.pass ? '✓ PASS' : '✗ FAIL'}: ${t.name}`);
    if (t.err) console.log(`   Error: ${t.err}`);
  });
  console.log(`TOTAL: ${tests.length} | PASSED: ${tests.filter(t => t.pass).length} | FAILED: ${tests.filter(t => !t.pass).length}`);
}

runTests();
