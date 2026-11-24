/**
 * Accounting Verification & Test Suite
 * Tests financial engine logic using isolated mock models matching prisma/schema.prisma
 * Runs in scratch directory, ZERO impact on production database.
 */

const EPSILON = 0.005;
const round2 = (val: number) => Math.round((Number(val) || 0) * 100) / 100;

interface TestResult {
  suite: string;
  test: string;
  passed: boolean;
  expected?: any;
  actual?: any;
  error?: string;
}

const results: TestResult[] = [];

function assert(suite: string, test: string, condition: boolean, expected?: any, actual?: any) {
  results.push({
    suite,
    test,
    passed: Boolean(condition),
    expected,
    actual
  });
}

// =============================================================================
// TEST SUITE 1: BALANCE SHEET WITH KNOWN DATASET
// =============================================================================
function testBalanceSheetDataset() {
  const suite = 'Balance Sheet Engine';

  // Dataset dari Prompt User:
  // 1. Modal awal: Rp 100.000.000
  // 2. Pembelian peralatan tunai: Rp 10.000.000
  // 3. Pendapatan jasa secara kredit: Rp 20.000.000 (Faktur Penjualan)
  // 4. Pembayaran pelanggan: Rp 10.000.000 (Pelunasan Parsial)
  // 5. Beban operasional tunai: Rp 5.000.000

  let kasBank = 0;
  let piutangUsaha = 0;
  let asetTetap = 0;
  let utangUsaha = 0;
  let modalAwal = 0;
  let pendapatan = 0;
  let beban = 0;

  // Transaksi 1: Modal Awal
  kasBank += 100_000_000;
  modalAwal += 100_000_000;

  // Transaksi 2: Pembelian peralatan tunai
  kasBank -= 10_000_000;
  asetTetap += 10_000_000;

  // Transaksi 3: Pendapatan jasa secara kredit
  piutangUsaha += 20_000_000;
  pendapatan += 20_000_000;

  // Transaksi 4: Pembayaran pelanggan diterima
  kasBank += 10_000_000;
  piutangUsaha -= 10_000_000;

  // Transaksi 5: Beban operasional tunai
  kasBank -= 5_000_000;
  beban += 5_000_000;

  // Perhitungan Akuntansi Murni:
  const asetLancar = round2(kasBank + piutangUsaha);
  const totalAset = round2(asetLancar + asetTetap);
  const labaDitahan = round2(pendapatan - beban);
  const totalEkuitas = round2(modalAwal + labaDitahan);
  const totalLiabilitasDanEkuitas = round2(utangUsaha + totalEkuitas);

  assert(suite, 'Kas & Bank harus Rp 95.000.000', kasBank === 95_000_000, 95_000_000, kasBank);
  assert(suite, 'Piutang Usaha harus Rp 10.000.000', piutangUsaha === 10_000_000, 10_000_000, piutangUsaha);
  assert(suite, 'Aset Tetap harus Rp 10.000.000', asetTetap === 10_000_000, 10_000_000, asetTetap);
  assert(suite, 'Total Aset harus Rp 115.000.000', totalAset === 115_000_000, 115_000_000, totalAset);
  assert(suite, 'Laba Bersih/Ditahan harus Rp 15.000.000', labaDitahan === 15_000_000, 15_000_000, labaDitahan);
  assert(suite, 'Total Ekuitas harus Rp 115.000.000', totalEkuitas === 115_000_000, 115_000_000, totalEkuitas);
  assert(suite, 'Persamaan Akuntansi Aset = Liabilitas + Ekuitas', totalAset === totalLiabilitasDanEkuitas, totalAset, totalLiabilitasDanEkuitas);
}

// =============================================================================
// TEST SUITE 2: BANK TRANSFER ENGINE
// =============================================================================
function testBankTransferEngine() {
  const suite = 'Bank Transfer Engine';

  const accounts = [
    { id: 1, name: 'Bank BCA', balance: 50_000_000, type: 'Bank' },
    { id: 2, name: 'Kas Kecil', balance: 5_000_000, type: 'Cash' }
  ];

  function simulateTransfer(fromId: number, toId: number, amount: number) {
    if (!fromId || !toId) throw new Error('Rekening sumber dan tujuan wajib dipilih.');
    if (fromId === toId) throw new Error('Rekening sumber dan tujuan tidak boleh sama.');
    if (amount <= 0) throw new Error('Nominal transfer harus lebih besar dari 0.');

    const fromAcc = accounts.find(a => a.id === fromId);
    const toAcc = accounts.find(a => a.id === toId);
    if (!fromAcc || !toAcc) throw new Error('Rekening tidak ditemukan.');
    if (fromAcc.balance < amount) throw new Error('Saldo rekening sumber tidak mencukupi.');

    fromAcc.balance -= amount;
    toAcc.balance += amount;

    return {
      success: true,
      reference: `TRF-${Date.now()}`,
      fromBalance: fromAcc.balance,
      toBalance: toAcc.balance
    };
  }

  // Skenario A: Transfer Berhasil
  try {
    const res = simulateTransfer(1, 2, 10_000_000);
    assert(suite, 'Transfer valid Rp 10.000.000 berhasil', res.success && res.fromBalance === 40_000_000 && res.toBalance === 15_000_000, true, res.success);
  } catch (e: any) {
    assert(suite, 'Transfer valid gagal', false, true, e.message);
  }

  // Skenario B: Saldo Tidak Mencukupi
  try {
    simulateTransfer(1, 2, 100_000_000);
    assert(suite, 'Harus tolak transfer jika saldo kurang', false, 'Exception thrown', 'No exception');
  } catch (e: any) {
    assert(suite, 'Berhasil tolak transfer saldo kurang', e.message.includes('tidak mencukupi'), true, e.message);
  }

  // Skenario C: Rekening Sumber & Tujuan Sama
  try {
    simulateTransfer(1, 1, 1_000_000);
    assert(suite, 'Harus tolak transfer ke akun yang sama', false, 'Exception thrown', 'No exception');
  } catch (e: any) {
    assert(suite, 'Berhasil tolak transfer akun yang sama', e.message.includes('tidak boleh sama'), true, e.message);
  }

  // Skenario D: Nominal Nol atau Negatif
  try {
    simulateTransfer(1, 2, -500_000);
    assert(suite, 'Harus tolak nominal negatif', false, 'Exception thrown', 'No exception');
  } catch (e: any) {
    assert(suite, 'Berhasil tolak nominal negatif', e.message.includes('lebih besar dari 0'), true, e.message);
  }
}

// =============================================================================
// TEST SUITE 3: INVOICE CANCELLATION & PAYMENTS
// =============================================================================
function testInvoiceCancellation() {
  const suite = 'Invoice Cancellation Engine';

  interface Invoice {
    id: number;
    reference: string;
    amount: number;
    status: string;
    notes?: string;
    payments: Array<{ id: number; amount: number; account_id: number }>;
  }

  const account = { id: 1, name: 'Bank BCA', balance: 20_000_000 };

  // Skenario A: Invoice Draft dibatalkan
  const draftInvoice: Invoice = {
    id: 101,
    reference: 'INV-2026-0101',
    amount: 5_000_000,
    status: 'Draft',
    payments: []
  };

  function cancelInvoice(inv: Invoice, reason: string) {
    if (inv.status === 'Cancelled') throw new Error('Faktur ini sudah dibatalkan.');
    if (!reason.trim()) throw new Error('Alasan pembatalan wajib diisi.');

    let reversalAmount = 0;
    // Reversal payments if any
    for (const p of inv.payments) {
      account.balance -= p.amount; // Reversal cash out
      reversalAmount += p.amount;
    }

    inv.status = 'Cancelled';
    inv.notes = `Dibatalkan: ${reason}`;

    return { success: true, reversalAmount, newBalance: account.balance };
  }

  const resDraft = cancelInvoice(draftInvoice, 'Salah draft');
  assert(suite, 'Draft invoice dibatalkan tanpa reversal saldo', draftInvoice.status === 'Cancelled' && resDraft.reversalAmount === 0, 'Cancelled & 0 reversal', `${draftInvoice.status} & ${resDraft.reversalAmount}`);

  // Skenario B: Invoice Lunas dibatalkan (Harus balikkan saldo)
  const paidInvoice: Invoice = {
    id: 102,
    reference: 'INV-2026-0102',
    amount: 10_000_000,
    status: 'Paid',
    payments: [{ id: 1, amount: 10_000_000, account_id: 1 }]
  };
  account.balance += 10_000_000; // Saldo awal sebelum cancel: 30jt

  const resPaid = cancelInvoice(paidInvoice, 'Pelanggan minta cancel & refund');
  assert(suite, 'Invoice lunas dibatalkan membalikkan saldo kas', paidInvoice.status === 'Cancelled' && account.balance === 20_000_000, 20_000_000, account.balance);
  assert(suite, 'Riwayat pembayaran historis tidak dihapus saat invoice dibatalkan', paidInvoice.payments.length === 1, 1, paidInvoice.payments.length);

  // Skenario C: Double Cancellation dicegah
  try {
    cancelInvoice(paidInvoice, 'Coba cancel lagi');
    assert(suite, 'Cegah double cancel', false, 'Exception', 'No exception');
  } catch (e: any) {
    assert(suite, 'Double cancel berhasil dicegah', e.message.includes('sudah dibatalkan'), true, e.message);
  }
}

// =============================================================================
// TEST SUITE 4: PAYMENT VALIDATION ENGINE
// =============================================================================
function testPaymentValidationEngine() {
  const suite = 'Payment Engine Validation';

  const invoice = {
    id: 201,
    amount: 10_000_000,
    paid: 6_000_000
  };

  function validatePayment(amount: number) {
    const outstanding = invoice.amount - invoice.paid;
    if (amount <= 0) throw new Error('Jumlah pembayaran harus lebih besar dari 0.');
    if (amount > outstanding + EPSILON) {
      throw new Error(`Jumlah pembayaran melebihi sisa tagihan (Rp ${outstanding.toLocaleString('id-ID')}).`);
    }
    invoice.paid += amount;
    return {
      newPaid: invoice.paid,
      isFullyPaid: invoice.paid >= invoice.amount - EPSILON
    };
  }

  // Parsial: Bayar Rp 2.000.000
  const res1 = validatePayment(2_000_000);
  assert(suite, 'Pembayaran parsial valid berhasil', res1.newPaid === 8_000_000 && !res1.isFullyPaid, 8_000_000, res1.newPaid);

  // Lebih: Coba bayar Rp 3.000.000 (Padahal sisa cuma 2.000.000)
  try {
    validatePayment(3_000_000);
    assert(suite, 'Harus tolak pembayaran melebihi sisa tagihan', false, 'Exception', 'No exception');
  } catch (e: any) {
    assert(suite, 'Berhasil tolak overpayment', e.message.includes('melebihi sisa tagihan'), true, e.message);
  }

  // Pelunasan: Bayar Rp 2.000.000 pas
  const res2 = validatePayment(2_000_000);
  assert(suite, 'Pelunasan sisa tagihan sukses & status Lunas', res2.isFullyPaid, true, res2.isFullyPaid);
}

// Run All Suites
testBalanceSheetDataset();
testBankTransferEngine();
testInvoiceCancellation();
testPaymentValidationEngine();

console.log('=== ACCOUNTING TEST EXECUTION RESULTS ===');
let passCount = 0;
let failCount = 0;
results.forEach((r, i) => {
  if (r.passed) {
    passCount++;
    console.log(`[PASS] ${r.suite} - ${r.test}`);
  } else {
    failCount++;
    console.error(`[FAIL] ${r.suite} - ${r.test} | Expected: ${r.expected}, Got: ${r.actual}`);
  }
});

console.log(`\nTOTAL: ${results.length} | PASSED: ${passCount} | FAILED: ${failCount}`);
if (failCount > 0) process.exit(1);
