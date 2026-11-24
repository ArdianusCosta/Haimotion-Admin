import { Prisma } from '@prisma/client'
import prisma from '@/lib/prisma'

export const COA_CODES = {
  KAS_UTAMA: '1-1001',
  BANK_BCA: '1-1002',
  BANK_MANDIRI: '1-1003',
  PIUTANG_USAHA: '1-1200',
  KLIRING_SUSPENSE: '1-1999',
  UTANG_USAHA: '2-1100',
  UTANG_GAJI: '2-1200',
  DEPOSIT_PELANGGAN: '2-1300',
  SALDO_PENYEIMBANG_AWAL: '3-1002',
  LABA_DITAHAN: '3-2001',
  PENDAPATAN_JASA: '4-1000',
  PENDAPATAN_SOFTWARE: '4-1100',
  HPP_FREELANCER: '5-1000',
  BEBAN_GAJI: '6-1001',
  BEBAN_OPERASIONAL: '6-1004'
} as const

export interface JournalLineInput {
  coa_id: number
  debit: number | Prisma.Decimal
  credit: number | Prisma.Decimal
  project_id?: number | null
  line_memo?: string | null
}

export interface PostJournalParams {
  entryDate?: Date | string
  sourceType:
    | 'SALES_INVOICE'
    | 'PURCHASE_INVOICE'
    | 'SALES_PAYMENT'
    | 'PURCHASE_PAYMENT'
    | 'OPERATIONAL_EXPENSE'
    | 'BANK_TRANSFER'
    | 'PAYROLL_ACCRUAL'
    | 'PAYROLL_PAYMENT'
    | 'CUSTOMER_REFUND'
    | 'VENDOR_REFUND'
    | 'OPENING_BALANCE'
    | 'MANUAL_JOURNAL'
  sourceId?: number | null
  postingType?: 'ORIGINAL' | 'REVERSAL' | 'ADJUSTMENT' | 'OPENING_BALANCE'
  eventId?: string | number
  idempotencyKey?: string
  referenceNo?: string | null
  description: string
  lines: JournalLineInput[]
  createdBy?: number | null
  currency?: string
  exchangeRate?: number
}

export class PostingEngine {
  /**
   * Helper untuk mencari ID COA berdasarkan kode akun standar
   */
  static async resolveCOAId(tx: any, code: string): Promise<number> {
    const coa = await tx.chartOfAccount.findUnique({
      where: { account_code: code },
      select: { id: true }
    })
    if (coa) return coa.id

    // Fallback: jika belum ada, buat akun darurat dengan normal balance yang sesuai
    const isCredit = code.startsWith('2-') || code.startsWith('3-') || code.startsWith('4-')
    const classification = code.startsWith('1-')
      ? 'ASSET'
      : code.startsWith('2-')
      ? 'LIABILITY'
      : code.startsWith('3-')
      ? 'EQUITY'
      : code.startsWith('4-')
      ? 'REVENUE'
      : 'EXPENSE'

    const created = await tx.chartOfAccount.create({
      data: {
        account_code: code,
        account_name: `Akun Standar ${code}`,
        classification,
        normal_balance: isCredit ? 'CREDIT' : 'DEBIT'
      }
    })
    return created.id
  }

  /**
   * Validasi bahwa tanggal transaksi tidak berada dalam periode akuntansi yang ditutup/dikunci
   */
  static async validatePeriod(tx: any, entryDate: Date) {
    const period = await tx.accountingPeriod.findFirst({
      where: {
        start_date: { lte: entryDate },
        end_date: { gte: entryDate }
      }
    })

    if (period && (period.status === 'CLOSED' || period.status === 'LOCKED')) {
      const dateStr = entryDate.toISOString().slice(0, 10)
      throw new Error(
        `PERIOD_BLOCKED: Periode akuntansi "${period.period_name}" berstatus ${period.status}. Posting transaksi pada tanggal ${dateStr} dilarang.`
      )
    }
  }

  /**
   * Posting jurnal umum berpasangan seimbang (Double-Entry)
   */
  static async postJournal(tx: any, params: PostJournalParams) {
    const entryDate = params.entryDate ? new Date(params.entryDate) : new Date()
    if (Number.isNaN(entryDate.getTime())) throw new Error('Tanggal jurnal tidak valid.')

    // 1. Validasi Periode Akuntansi
    await this.validatePeriod(tx, entryDate)

    // 2. Buat Idempotency Key deterministik
    const postingType = params.postingType || 'ORIGINAL'
    const eventId = params.eventId || params.sourceId || Date.now().toString()
    const idempotencyKey =
      params.idempotencyKey ||
      `${params.sourceType}:${params.sourceId || 0}:${postingType}:${eventId}`

    // 3. Validasi Baris Jurnal
    const lines = params.lines || []
    if (lines.length < 2) {
      throw new Error('Jurnal akuntansi wajib memiliki minimal 2 baris (Debit dan Kredit).')
    }

    let totalDebit = new Prisma.Decimal(0)
    let totalCredit = new Prisma.Decimal(0)

    const validatedLines: Array<{
      coa_id: number
      project_id: number | null
      debit: Prisma.Decimal
      credit: Prisma.Decimal
      line_memo: string | null
    }> = []

    for (const [idx, line] of lines.entries()) {
      if (!line.coa_id) {
        throw new Error(`Baris jurnal ke-${idx + 1}: Akun COA wajib dipilih.`)
      }

      const d = new Prisma.Decimal(line.debit || 0)
      const c = new Prisma.Decimal(line.credit || 0)

      if (d.lessThan(0) || c.lessThan(0)) {
        throw new Error(`Baris jurnal ke-${idx + 1}: Nominal tidak boleh bernilai negatif.`)
      }
      if (d.equals(0) && c.equals(0)) {
        throw new Error(`Baris jurnal ke-${idx + 1}: Salah satu dari Debit atau Kredit harus bernilai lebih besar dari 0.`)
      }
      if (d.greaterThan(0) && c.greaterThan(0)) {
        throw new Error(`Baris jurnal ke-${idx + 1}: Debit dan Kredit tidak boleh diisi bersamaan pada baris yang sama.`)
      }

      totalDebit = totalDebit.plus(d)
      totalCredit = totalCredit.plus(c)

      validatedLines.push({
        coa_id: line.coa_id,
        project_id: line.project_id || null,
        debit: d,
        credit: c,
        line_memo: line.line_memo || null
      })
    }

    // 4. Validasi Keseimbangan Matematis
    if (!totalDebit.equals(totalCredit)) {
      throw new Error(
        `Jurnal tidak seimbang! Total Debit (Rp ${totalDebit.toString()}) != Total Kredit (Rp ${totalCredit.toString()}).`
      )
    }

    // 5. Generate Nomor Entri Jurnal Berurutan
    const year = entryDate.getFullYear()
    const month = String(entryDate.getMonth() + 1).padStart(2, '0')
    const countToday = await tx.journalEntry.count({
      where: {
        entry_date: {
          gte: new Date(year, entryDate.getMonth(), 1),
          lte: new Date(year, entryDate.getMonth() + 1, 0)
        }
      }
    })
    const seq = String(countToday + 1).padStart(4, '0')
    const entryNumber = `JV/${year}/${month}/${seq}`

    // 6. Simpan Header Jurnal & Rincian Baris dalam transaksi atomik
    const createdJournal = await tx.journalEntry.create({
      data: {
        entry_number: entryNumber,
        entry_date: entryDate,
        source_type: params.sourceType,
        source_id: params.sourceId || null,
        posting_type: postingType,
        idempotency_key: idempotencyKey,
        reference_no: params.referenceNo || null,
        description: params.description,
        currency: params.currency || 'IDR',
        exchange_rate: new Prisma.Decimal(params.exchangeRate || 1.0),
        total_debit: totalDebit,
        total_credit: totalCredit,
        status: 'POSTED',
        created_by: params.createdBy || null,
        lines: {
          create: validatedLines
        }
      },
      include: {
        lines: {
          include: { account: true }
        }
      }
    })

    // 7. Catat Audit Log
    try {
      await tx.financeAuditLog.create({
        data: {
          event_type: 'JOURNAL_POST',
          entity_type: 'JournalEntry',
          entity_id: createdJournal.id,
          actor_id: params.createdBy || null,
          description: `Posted journal ${createdJournal.entry_number}: ${params.description}`,
          details: JSON.stringify({
            entryNumber: createdJournal.entry_number,
            sourceType: params.sourceType,
            sourceId: params.sourceId,
            totalDebit: totalDebit.toString(),
            totalCredit: totalCredit.toString(),
            linesCount: validatedLines.length
          })
        }
      })
    } catch {
      // Non-blocking log
    }

    return createdJournal
  }

  /**
   * Reversal penuh jurnal asli (Audit-Proof, 100% Immutable)
   */
  static async reverseJournal(
    tx: any,
    params: {
      originalJournalId: number
      reason: string
      uid?: number | null
      eventId?: string
    }
  ) {
    const original = await tx.journalEntry.findUnique({
      where: { id: params.originalJournalId },
      include: { lines: true }
    })

    if (!original) throw new Error('Jurnal asli tidak ditemukan.')
    if (original.status !== 'POSTED') {
      throw new Error(`Jurnal #${original.entry_number} tidak berstatus POSTED.`)
    }
    if (original.posting_type === 'REVERSAL') {
      throw new Error('Jurnal pembalik (reversal) tidak dapat dibalik kembali.')
    }

    // Cek apakah sudah pernah dibalik sebelumnya (strictly 1-to-1)
    const existingReversal = await tx.journalEntry.findUnique({
      where: { reversal_of_id: original.id }
    })
    if (existingReversal) {
      throw new Error(
        `ALREADY_REVERSED: Jurnal #${original.entry_number} sudah memiliki jurnal pembalik #${existingReversal.entry_number}.`
      )
    }

    // Buat baris kebalikan: Debit -> Kredit, Kredit -> Debit
    const reversedLines: JournalLineInput[] = original.lines.map((l: any) => ({
      coa_id: l.coa_id,
      project_id: l.project_id,
      debit: l.credit, // Ditukar
      credit: l.debit, // Ditukar
      line_memo: `Pembalik: ${l.line_memo || original.description} (${params.reason})`
    }))

    const reversalEventId = params.eventId || `REV-${Date.now().toString().slice(-4)}`
    const reversalJournal = await this.postJournal(tx, {
      entryDate: new Date(),
      sourceType: original.source_type,
      sourceId: original.source_id,
      postingType: 'REVERSAL',
      eventId: reversalEventId,
      referenceNo: `REV-${original.entry_number}`,
      description: `[REVERSAL] ${original.description} - Alasan: ${params.reason}`,
      lines: reversedLines,
      createdBy: params.uid || null
    })

    // Tautkan link reversal_of_id
    await tx.journalEntry.update({
      where: { id: reversalJournal.id },
      data: { reversal_of_id: original.id }
    })

    return { original, reversal: reversalJournal }
  }

  /**
   * Hitung realisasi anggaran proyek secara dinamis dari baris jurnal beban aktual
   */
  static async calculateProjectRealization(tx: any, projectId: number): Promise<number> {
    const expenseLines = await tx.journalEntryLine.findMany({
      where: {
        project_id: projectId,
        journal: { status: 'POSTED' },
        account: { classification: 'EXPENSE' }
      },
      select: {
        debit: true,
        credit: true
      }
    })

    let total = new Prisma.Decimal(0)
    for (const line of expenseLines) {
      total = total.plus(line.debit).minus(line.credit)
    }

    return Number(total.toFixed(2))
  }
}
