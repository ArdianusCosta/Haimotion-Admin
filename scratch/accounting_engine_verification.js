// scratch/accounting_engine_verification.js
// Standalone Verification Test Suite for HaiMotion Finance V2 Final Technical Review

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
  chartOfAccounts: [],
  journalEntries: [],
  journalEntryLines: [],
  idempotencyStore: new Set()
};

// COA Catalog
const COA = {
  KAS_UTAMA: { id: 1, code: '1-1001', name: 'Kas Utama (Petty Cash)', type: 'ASSET', normal: 'DEBIT' },
  BANK_BCA: { id: 2, code: '1-1002', name: 'Bank BCA Operasional', type: 'ASSET', normal: 'DEBIT' },
  BANK_MANDIRI: { id: 3, code: '1-1003', name: 'Bank Mandiri Payroll', type: 'ASSET', normal: 'DEBIT' },
  PIUTANG_USAHA: { id: 4, code: '1-1200', name: 'Piutang Usaha (A/R)', type: 'ASSET', normal: 'DEBIT' },
  SUSPENSE_CLEARING: { id: 5, code: '1-1999', name: 'Rekening Transisi / Kliring', type: 'ASSET', normal: 'DEBIT' },
  UTANG_USAHA: { id: 6, code: '2-1100', name: 'Utang Usaha (A/P)', type: 'LIABILITY', normal: 'CREDIT' },
  UTANG_GAJI: { id: 7, code: '2-1200', name: 'Utang Gaji Karyawan', type: 'LIABILITY', normal: 'CREDIT' },
  DEPOSIT_PELANGGAN: { id: 8, code: '2-1300', name: 'Deposit Pelanggan (Unearned)', type: 'LIABILITY', normal: 'CREDIT' },
  OPENING_EQUITY: { id: 9, code: '3-1002', name: 'Saldo Penyeimbang Awal', type: 'EQUITY', normal: 'CREDIT' },
  PENDAPATAN_JASA: { id: 10, code: '4-1000', name: 'Pendapatan Jasa Animasi', type: 'REVENUE', normal: 'CREDIT' },
  BEBAN_PRODUKSI: { id: 11, code: '5-1000', name: 'Beban Tenaga Lepas', type: 'EXPENSE', normal: 'DEBIT' },
  BEBAN_GAJI: { id: 12, code: '6-1001', name: 'Beban Gaji Karyawan', type: 'EXPENSE', normal: 'DEBIT' },
  BEBAN_OPERASIONAL: { id: 13, code: '6-1004', name: 'Beban Operasional Kantor', type: 'EXPENSE', normal: 'DEBIT' }
};

// Journal Engine
class JournalEngine {
  static createIdempotencyKey(sourceType, sourceId, postingType, eventId) {
    if (!sourceType || !sourceId || !postingType || !eventId) {
      throw new Error(`Incomplete key params: ${sourceType}, ${sourceId}, ${postingType}, ${eventId}`);
    }
    return `${sourceType}:${sourceId}:${postingType}:${eventId}`;
  }

  static validateJournalLines(lines) {
    if (!lines || lines.length < 2) {
      throw new Error("Jurnal wajib memiliki minimal 2 baris (Debit dan Kredit).");
    }

    let totalDebit = new Decimal(0);
    let totalCredit = new Decimal(0);

    for (const [index, line] of lines.entries()) {
      const debit = new Decimal(line.debit || 0);
      const credit = new Decimal(line.credit || 0);

      if (!line.coa_id) {
        throw new Error(`Baris ${index + 1}: Akun COA wajib diisi.`);
      }

      // Aturan: Tidak boleh keduanya 0, dan tidak boleh keduanya > 0
      if (debit.isZero() && credit.isZero()) {
        throw new Error(`Baris ${index + 1}: Nominal debit atau kredit harus diisi.`);
      }
      if (debit.isPositive() && credit.isPositive()) {
        throw new Error(`Baris ${index + 1}: Debit dan Kredit tidak boleh terisi bersamaan.`);
      }
      if (debit.d < 0 || credit.d < 0) {
        throw new Error(`Baris ${index + 1}: Nominal tidak boleh bernilai negatif.`);
      }

      totalDebit = totalDebit.plus(debit);
      totalCredit = totalCredit.plus(credit);
    }

    // Validasi keseimbangan
    if (!totalDebit.equals(totalCredit)) {
      throw new Error(`Jurnal tidak seimbang! Total Debit: ${totalDebit.toString()} != Total Kredit: ${totalCredit.toString()}`);
    }

    return { totalDebit, totalCredit };
  }

  static postJournal(entry) {
    const idempotencyKey = entry.idempotencyKey || 
      this.createIdempotencyKey(entry.sourceType, entry.sourceId, entry.postingType || 'ORIGINAL', entry.eventId || entry.sourceId);

    // 1. Cek idempotency
    if (db.idempotencyStore.has(idempotencyKey)) {
      throw new Error(`DUPLICATE_POSTING_BLOCKED: Jurnal dengan key ${idempotencyKey} sudah pernah diposting.`);
    }

    // 2. Validasi baris
    const { totalDebit, totalCredit } = this.validateJournalLines(entry.lines);

    // 3. Simpan header
    const journalId = db.journalEntries.length + 1;
    const newEntry = {
      id: journalId,
      entry_number: `JV/2026/${String(journalId).padStart(4, '0')}`,
      entry_date: entry.entryDate || new Date().toISOString().slice(0, 10),
      source_type: entry.sourceType,
      source_id: entry.sourceId,
      posting_type: entry.postingType || 'ORIGINAL',
      idempotency_key: idempotencyKey,
      reference_no: entry.referenceNo || null,
      description: entry.description,
      total_debit: totalDebit.toString(),
      total_credit: totalCredit.toString(),
      status: 'POSTED', // Selalu POSTED, immutable
      reversal_of_id: entry.reversalOfId || null,
      created_at: new Date()
    };

    // 4. Simpan lines
    for (const line of entry.lines) {
      db.journalEntryLines.push({
        id: db.journalEntryLines.length + 1,
        journal_id: journalId,
        coa_id: line.coa_id,
        debit: new Decimal(line.debit || 0).toString(),
        credit: new Decimal(line.credit || 0).toString(),
        line_memo: line.line_memo || null
      });
    }

    db.journalEntries.push(newEntry);
    db.idempotencyStore.add(idempotencyKey);
    return newEntry;
  }

  static reverseJournal(originalJournalId, reversalEventId, reason) {
    const original = db.journalEntries.find(j => j.id === originalJournalId);
    if (!original) throw new Error("Jurnal asli tidak ditemukan.");
    if (original.posting_type === 'REVERSAL') throw new Error("Jurnal pembalik tidak dapat dibalik kembali.");

    // Cek apakah sudah pernah dibalik
    const existingReversal = db.journalEntries.find(j => j.reversal_of_id === originalJournalId);
    if (existingReversal) {
      throw new Error(`ALREADY_REVERSED: Jurnal #${originalJournalId} sudah memiliki pembalik #${existingReversal.id}`);
    }

    // Ambil baris jurnal asli
    const originalLines = db.journalEntryLines.filter(l => l.journal_id === originalJournalId);

    // Buat baris kebalikan: Debit -> Kredit, Kredit -> Debit
    const reversedLines = originalLines.map(l => ({
      coa_id: l.coa_id,
      debit: l.credit, // ditukar
      credit: l.debit, // ditukar
      line_memo: `Reversal of line #${l.id}: ${reason}`
    }));

    // Posting jurnal reversal baru
    // CATATAN PENTING: Jurnal original TETAP status = 'POSTED', TIDAK diubah jadi VOID!
    const reversalEntry = this.postJournal({
      sourceType: original.source_type,
      sourceId: original.source_id,
      postingType: 'REVERSAL',
      eventId: reversalEventId,
      referenceNo: `REV-${original.entry_number}`,
      description: `Pembalik: ${original.description} (${reason})`,
      lines: reversedLines,
      reversalOfId: original.id
    });

    return { original, reversal: reversalEntry };
  }
}

// TEST RUNNER
const results = [];
function test(name, fn) {
  try {
    fn();
    results.push({ name, pass: true });
  } catch (err) {
    results.push({ name, pass: false, error: err.message });
  }
}

// 1. Test Journal Idempotency & Partial Payments
test("Idempotency: Partial payments on same invoice have unique keys", () => {
  const invoiceId = 501;
  const pay1Key = JournalEngine.createIdempotencyKey('SALES_PAYMENT', invoiceId, 'ORIGINAL', 'PAY-001');
  const pay2Key = JournalEngine.createIdempotencyKey('SALES_PAYMENT', invoiceId, 'ORIGINAL', 'PAY-002');
  if (pay1Key === pay2Key) throw new Error("Keys should not collide for different payments");

  // Post payment 1 (Rp 4.000.000)
  JournalEngine.postJournal({
    sourceType: 'SALES_PAYMENT',
    sourceId: invoiceId,
    postingType: 'ORIGINAL',
    eventId: 'PAY-001',
    description: 'Pembayaran Termin 1 Invoice #501',
    lines: [
      { coa_id: COA.BANK_BCA.id, debit: 4000000, credit: 0 },
      { coa_id: COA.PIUTANG_USAHA.id, debit: 0, credit: 4000000 }
    ]
  });

  // Post payment 2 (Rp 6.000.000)
  JournalEngine.postJournal({
    sourceType: 'SALES_PAYMENT',
    sourceId: invoiceId,
    postingType: 'ORIGINAL',
    eventId: 'PAY-002',
    description: 'Pembayaran Pelunasan Invoice #501',
    lines: [
      { coa_id: COA.BANK_BCA.id, debit: 6000000, credit: 0 },
      { coa_id: COA.PIUTANG_USAHA.id, debit: 0, credit: 6000000 }
    ]
  });
});

test("Idempotency: Duplicate request with identical key is blocked", () => {
  let blocked = false;
  try {
    JournalEngine.postJournal({
      sourceType: 'SALES_PAYMENT',
      sourceId: 501,
      postingType: 'ORIGINAL',
      eventId: 'PAY-001', // Sama dengan di atas!
      description: 'Duplikat Bayar',
      lines: [
        { coa_id: COA.BANK_BCA.id, debit: 4000000, credit: 0 },
        { coa_id: COA.PIUTANG_USAHA.id, debit: 0, credit: 4000000 }
      ]
    });
  } catch (e) {
    if (e.message.includes("DUPLICATE_POSTING_BLOCKED")) blocked = true;
  }
  if (!blocked) throw new Error("Duplicate posting must be rejected!");
});

// 2. Test Immutable Ledger & Reversal
test("Immutable Ledger: Original journal remains POSTED after reversal", () => {
  // Post an expense journal
  const exp = JournalEngine.postJournal({
    sourceType: 'OPERATIONAL_EXPENSE',
    sourceId: 701,
    postingType: 'ORIGINAL',
    eventId: 'EXP-701',
    description: 'Beli ATK Kantor',
    lines: [
      { coa_id: COA.BEBAN_OPERASIONAL.id, debit: 500000, credit: 0 },
      { coa_id: COA.KAS_UTAMA.id, debit: 0, credit: 500000 }
    ]
  });

  // Reverse expense
  const { original, reversal } = JournalEngine.reverseJournal(exp.id, 'REV-EXP-701', 'Salah input transaksi');

  if (original.status !== 'POSTED') throw new Error("Original journal status must remain POSTED");
  if (reversal.status !== 'POSTED') throw new Error("Reversal journal status must be POSTED");
  if (reversal.posting_type !== 'REVERSAL') throw new Error("Reversal posting_type must be REVERSAL");
  if (reversal.reversal_of_id !== original.id) throw new Error("Reversal must link to original id");
});

test("Immutable Ledger: Double reversal on same journal is blocked", () => {
  const exp = db.journalEntries.find(j => j.source_id === 701 && j.posting_type === 'ORIGINAL');
  let blocked = false;
  try {
    JournalEngine.reverseJournal(exp.id, 'REV-EXP-701-SECOND', 'Coba batal kedua kali');
  } catch (e) {
    if (e.message.includes("ALREADY_REVERSED")) blocked = true;
  }
  if (!blocked) throw new Error("Double reversal must be blocked!");
});

// 3. Test Decimal Precision & Line Validation
test("Financial Precision: Unbalanced journal is rejected", () => {
  let failed = false;
  try {
    JournalEngine.postJournal({
      sourceType: 'MANUAL_JOURNAL',
      sourceId: 801,
      postingType: 'ORIGINAL',
      eventId: 'MAN-001',
      description: 'Jurnal tidak seimbang',
      lines: [
        { coa_id: COA.BANK_BCA.id, debit: 1000000, credit: 0 },
        { coa_id: COA.BEBAN_OPERASIONAL.id, debit: 0, credit: 999999 }
      ]
    });
  } catch (e) {
    if (e.message.includes("Jurnal tidak seimbang")) failed = true;
  }
  if (!failed) throw new Error("Unbalanced entry must fail validation");
});

test("Financial Precision: Both debit and credit filled on same line is rejected", () => {
  let failed = false;
  try {
    JournalEngine.postJournal({
      sourceType: 'MANUAL_JOURNAL',
      sourceId: 802,
      postingType: 'ORIGINAL',
      eventId: 'MAN-002',
      description: 'Debit dan kredit sama-sama terisi',
      lines: [
        { coa_id: COA.BANK_BCA.id, debit: 1000000, credit: 500000 },
        { coa_id: COA.BEBAN_OPERASIONAL.id, debit: 0, credit: 500000 }
      ]
    });
  } catch (e) {
    if (e.message.includes("Debit dan Kredit tidak boleh terisi bersamaan")) failed = true;
  }
  if (!failed) throw new Error("Mutually exclusive validation failed");
});

// 4. Test HR Payroll 3-Phase Accounting
test("HR Payroll: Accrual and Payment correctly recognize expense once and clear liability", () => {
  const payrollId = 901;
  const salary = 15000000;

  // Phase 1: Accrual (saat approve)
  const accrual = JournalEngine.postJournal({
    sourceType: 'PAYROLL',
    sourceId: payrollId,
    postingType: 'ORIGINAL',
    eventId: 'ACCRUAL',
    description: 'Akrual Gaji Karyawan Periode Maret 2026',
    lines: [
      { coa_id: COA.BEBAN_GAJI.id, debit: salary, credit: 0 },
      { coa_id: COA.UTANG_GAJI.id, debit: 0, credit: salary }
    ]
  });

  // Phase 2: Payment (saat transfer)
  const payment = JournalEngine.postJournal({
    sourceType: 'PAYROLL',
    sourceId: payrollId,
    postingType: 'ORIGINAL',
    eventId: 'PAYMENT',
    description: 'Pencairan Gaji Karyawan via Bank Mandiri',
    lines: [
      { coa_id: COA.UTANG_GAJI.id, debit: salary, credit: 0 },
      { coa_id: COA.BANK_MANDIRI.id, debit: 0, credit: salary }
    ]
  });

  // Check Net Effect on Utang Gaji: Debit 15 jt, Credit 15 jt -> Balance = 0
  const utangLines = db.journalEntryLines.filter(l => l.coa_id === COA.UTANG_GAJI.id);
  const totalUtangDr = utangLines.reduce((acc, l) => acc.plus(l.debit), new Decimal(0));
  const totalUtangCr = utangLines.reduce((acc, l) => acc.plus(l.credit), new Decimal(0));
  if (!totalUtangDr.equals(totalUtangCr)) {
    throw new Error(`Utang Gaji not cleared! Dr: ${totalUtangDr.toString()}, Cr: ${totalUtangCr.toString()}`);
  }
});

// 5. Test Refund Architecture (No Double Reversal)
test("Refund Architecture: Paid invoice cancellation + cash refund does NOT double-reverse revenue", () => {
  const invoiceId = 601;
  const amount = 20000000;

  // 1. Invoice Sent
  JournalEngine.postJournal({
    sourceType: 'SALES_INVOICE',
    sourceId: invoiceId,
    postingType: 'ORIGINAL',
    eventId: 'INV',
    description: 'Invoice Animasi #601',
    lines: [
      { coa_id: COA.PIUTANG_USAHA.id, debit: amount, credit: 0 },
      { coa_id: COA.PENDAPATAN_JASA.id, debit: 0, credit: amount }
    ]
  });

  // 2. Invoice Paid
  JournalEngine.postJournal({
    sourceType: 'SALES_PAYMENT',
    sourceId: invoiceId,
    postingType: 'ORIGINAL',
    eventId: 'PAY',
    description: 'Pembayaran Lunas Invoice #601',
    lines: [
      { coa_id: COA.BANK_BCA.id, debit: amount, credit: 0 },
      { coa_id: COA.PIUTANG_USAHA.id, debit: 0, credit: amount }
    ]
  });

  // 3. Invoice Cancelled: Membalik Pendapatan ke Deposit Pelanggan (Liabilitas)
  JournalEngine.postJournal({
    sourceType: 'SALES_INVOICE',
    sourceId: invoiceId,
    postingType: 'REVERSAL',
    eventId: 'CANCEL_DEPOSIT',
    description: 'Pembatalan Invoice #601 - Pengalihan ke Deposit Pelanggan',
    lines: [
      { coa_id: COA.PENDAPATAN_JASA.id, debit: amount, credit: 0 },
      { coa_id: COA.DEPOSIT_PELANGGAN.id, debit: 0, credit: amount }
    ]
  });

  // 4. Actual Cash Refund: Mengeluarkan uang dari Bank ke Pelanggan
  JournalEngine.postJournal({
    sourceType: 'CUSTOMER_REFUND',
    sourceId: invoiceId,
    postingType: 'ORIGINAL',
    eventId: 'REFUND_VOUCHER_001',
    description: 'Pencairan Refund Fisik Dana Pelanggan Invoice #601',
    lines: [
      { coa_id: COA.DEPOSIT_PELANGGAN.id, debit: amount, credit: 0 },
      { coa_id: COA.BANK_BCA.id, debit: 0, credit: amount }
    ]
  });

  // Verify:
  // a) Pendapatan Net = Credit 20 jt - Debit 20 jt = 0 (dibalik TEPAT 1 kali)
  const revLines = db.journalEntryLines.filter(l => l.coa_id === COA.PENDAPATAN_JASA.id);
  const revCr = revLines.reduce((acc, l) => acc.plus(l.credit), new Decimal(0));
  const revDr = revLines.reduce((acc, l) => acc.plus(l.debit), new Decimal(0));
  if (!revCr.equals(revDr)) throw new Error("Revenue was not balanced to zero!");

  // b) Deposit Pelanggan Net = Credit 20 jt - Debit 20 jt = 0 (kewajiban tuntas)
  const depLines = db.journalEntryLines.filter(l => l.coa_id === COA.DEPOSIT_PELANGGAN.id);
  const depCr = depLines.reduce((acc, l) => acc.plus(l.credit), new Decimal(0));
  const depDr = depLines.reduce((acc, l) => acc.plus(l.debit), new Decimal(0));
  if (!depCr.equals(depDr)) throw new Error("Deposit Pelanggan was not balanced to zero!");

  // c) Bank BCA Net = Debit 20 jt (saat terima bayar) - Credit 20 jt (saat refund) = 0
  const bcaLines = db.journalEntryLines.filter(l => l.coa_id === COA.BANK_BCA.id && l.journal_id >= 4);
  const bcaDr = bcaLines.reduce((acc, l) => acc.plus(l.debit), new Decimal(0));
  const bcaCr = bcaLines.reduce((acc, l) => acc.plus(l.credit), new Decimal(0));
  if (!bcaDr.equals(bcaCr)) throw new Error("Bank cash was not balanced to zero!");
});

// Print Results
console.log("\n================ TEST SUMMARY ================");
results.forEach(r => {
  console.log(`${r.pass ? '✓ PASS' : '✗ FAIL'}: ${r.name}`);
  if (!r.pass) console.log(`   Error: ${r.error}`);
});
console.log(`TOTAL: ${results.length} | PASSED: ${results.filter(r => r.pass).length} | FAILED: ${results.filter(r => !r.pass).length}`);
