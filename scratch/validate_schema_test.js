const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = 'c:\\Hai Motion\\ERP\\Haimotion-Admin';
const originalSchema = fs.readFileSync(path.join(rootDir, 'prisma', 'schema.prisma'), 'utf8');

// Target models & modifications to test validation
const targetAdditions = `

// ==========================================
// TARGET ADDITIONS FOR PRE-IMPLEMENTATION GATE
// ==========================================

enum AccountClassification {
  ASSET
  LIABILITY
  EQUITY
  REVENUE
  EXPENSE
}

enum NormalBalance {
  DEBIT
  CREDIT
}

enum PeriodStatus {
  OPEN
  LOCKED
  CLOSED
}

enum JournalPostingType {
  ORIGINAL
  REVERSAL
  ADJUSTMENT
  OPENING_BALANCE
}

enum JournalSourceType {
  SALES_INVOICE
  PURCHASE_INVOICE
  SALES_PAYMENT
  PURCHASE_PAYMENT
  OPERATIONAL_EXPENSE
  BANK_TRANSFER
  PAYROLL_ACCRUAL
  PAYROLL_PAYMENT
  CUSTOMER_REFUND
  OPENING_BALANCE
  MANUAL_JOURNAL
}

model AccountingPeriod {
  id          Int          @id @default(autoincrement())
  period_name String       @unique @db.VarChar(50)
  start_date  DateTime     @db.Date
  end_date    DateTime     @db.Date
  status      PeriodStatus @default(OPEN)
  closed_at   DateTime?
  closed_by   Int?
  created_at  DateTime     @default(now())
  updated_at  DateTime     @updatedAt

  @@map("accounting_periods")
}

model FinanceAuditLog {
  id          Int      @id @default(autoincrement())
  event_type  String   @db.VarChar(50)
  entity_type String   @db.VarChar(50)
  entity_id   Int
  actor_id    Int?
  ip_address  String?  @db.VarChar(100)
  description String   @db.Text
  details     String?  @db.Text
  created_at  DateTime @default(now())

  @@index([entity_type, entity_id])
  @@index([event_type])
  @@map("finance_audit_logs")
}

model ChartOfAccount {
  id              Int                   @id @default(autoincrement())
  account_code    String                @unique @db.VarChar(50)
  account_name    String                @db.VarChar(150)
  classification  AccountClassification
  normal_balance  NormalBalance
  parent_id       Int?
  is_active       Boolean               @default(true)
  description     String?               @db.Text
  created_at      DateTime              @default(now())
  updated_at      DateTime              @updatedAt

  parent          ChartOfAccount?       @relation("COAHierarchy", fields: [parent_id], references: [id], onDelete: Restrict)
  children        ChartOfAccount[]      @relation("COAHierarchy")
  liquid_accounts FinanceAccount[]      @relation("CoaLiquidAccounts")
  journal_lines   JournalEntryLine[]

  @@index([classification])
  @@index([parent_id])
  @@map("chart_of_accounts")
}

model JournalEntry {
  id              Int                @id @default(autoincrement())
  entry_number    String             @unique @db.VarChar(50)
  entry_date      DateTime           @db.Date
  source_type     JournalSourceType
  source_id       Int?
  posting_type    JournalPostingType @default(ORIGINAL)
  idempotency_key String             @unique @db.VarChar(191)
  reference_no    String?            @db.VarChar(100)
  description     String             @db.Text
  currency        String             @default("IDR") @db.VarChar(10)
  exchange_rate   Decimal            @default(1.0000) @db.Decimal(10, 4)
  total_debit     Decimal            @db.Decimal(15, 2)
  total_credit    Decimal            @db.Decimal(15, 2)
  status          String             @default("POSTED") @db.VarChar(20)
  posted_at       DateTime           @default(now())
  created_by      Int?
  created_at      DateTime           @default(now())
  updated_at      DateTime           @updatedAt

  lines           JournalEntryLine[]
  reversal_of_id  Int?               @unique
  reversal_of     JournalEntry?      @relation("JournalReversals", fields: [reversal_of_id], references: [id])
  reversed_by     JournalEntry?      @relation("JournalReversals")

  @@index([source_type, source_id])
  @@index([entry_date])
  @@map("journal_entries")
}

model JournalEntryLine {
  id              Int            @id @default(autoincrement())
  journal_id      Int
  coa_id          Int
  project_id      Int?
  debit           Decimal        @default(0.00) @db.Decimal(15, 2)
  credit          Decimal        @default(0.00) @db.Decimal(15, 2)
  line_memo       String?        @db.VarChar(255)

  journal         JournalEntry   @relation(fields: [journal_id], references: [id], onDelete: Cascade)
  account         ChartOfAccount @relation(fields: [coa_id], references: [id], onDelete: Restrict)
  project         project_list?  @relation("ProjectJournalLines", fields: [project_id], references: [id], onDelete: SetNull)

  @@index([journal_id])
  @@index([coa_id])
  @@index([project_id])
  @@map("journal_entry_lines")
}

model FinanceRefund {
  id              Int            @id @default(autoincrement())
  refund_number   String         @unique @db.VarChar(50)
  invoice_id      Int?
  payment_id      Int?
  account_id      Int
  amount          Decimal        @db.Decimal(15, 2)
  refund_date     DateTime       @db.Date
  reason          String         @db.Text
  created_by      Int?
  created_at      DateTime       @default(now())
  updated_at      DateTime       @updatedAt

  account         FinanceAccount @relation(fields: [account_id], references: [id], onDelete: Restrict)
  invoice         FinanceInvoice?@relation(fields: [invoice_id], references: [id], onDelete: SetNull)
  payment         FinancePayment?@relation(fields: [payment_id], references: [id], onDelete: SetNull)

  @@index([invoice_id])
  @@index([payment_id])
  @@index([account_id])
  @@map("finance_refunds")
}
`;

// Modify FinanceAccount, FinancePayment, FinanceExpense, and project_list in the test schema
let modifiedSchema = originalSchema;

// Replace model FinanceAccount
modifiedSchema = modifiedSchema.replace(
  /model FinanceAccount \{[\s\S]*?@@map\("finance_accounts"\)\s*\}/,
  `model FinanceAccount {
  code           String?              @db.VarChar(50)
  sub_type       String?              @db.VarChar(100)
  id             Int                  @id @default(autoincrement())
  name           String               @db.VarChar(200)
  type           String               @db.VarChar(50)
  balance        Float                @default(0)
  currency       String               @default("IDR") @db.VarChar(10)
  account_number String?              @db.VarChar(100)
  coa_id         Int?
  created_at     DateTime             @default(now())
  updated_at     DateTime             @default(now()) @updatedAt
  coa            ChartOfAccount?      @relation("CoaLiquidAccounts", fields: [coa_id], references: [id], onDelete: Restrict)
  transactions   FinanceTransaction[]
  payments       FinancePayment[]
  expenses       FinanceExpense[]
  refunds        FinanceRefund[]

  @@index([coa_id])
  @@map("finance_accounts")
}`
);

// Replace model FinancePayment
modifiedSchema = modifiedSchema.replace(
  /model FinancePayment \{[\s\S]*?@@map\("finance_payments"\)\s*\}/,
  `model FinancePayment {
  id             Int            @id @default(autoincrement())
  invoice_id     Int
  account_id     Int?
  invoice        FinanceInvoice @relation(fields: [invoice_id], references: [id], onDelete: Cascade)
  account        FinanceAccount?@relation(fields: [account_id], references: [id], onDelete: Restrict)
  amount         Float
  payment_date   DateTime       @db.Date
  payment_method String         @db.VarChar(100)
  reference      String?        @db.VarChar(255)
  notes          String?        @db.Text
  created_at     DateTime       @default(now())
  updated_at     DateTime       @default(now()) @updatedAt
  refunds        FinanceRefund[]

  @@index([invoice_id])
  @@index([account_id])
  @@map("finance_payments")
}`
);

// Replace model FinanceExpense
modifiedSchema = modifiedSchema.replace(
  /model FinanceExpense \{[\s\S]*?@@map\("finance_expenses"\)\s*\}/,
  `model FinanceExpense {
  id               Int              @id @default(autoincrement())
  date             DateTime         @db.Date
  description      String           @db.Text
  category         String           @db.VarChar(100)
  amount           Float
  vendor           String           @db.VarChar(200)
  status           String           @default("Pending") @db.VarChar(50)
  receipt_url      String?          @db.Text
  payroll_id       Int?
  account_id       Int?
  account          FinanceAccount?  @relation(fields: [account_id], references: [id], onDelete: Restrict)
  notes            String?          @db.Text
  created_at       DateTime         @default(now())
  updated_at       DateTime         @default(now()) @updatedAt
  created_by       Int?
  category_id      Int?
  finance_category FinanceCategory? @relation(fields: [category_id], references: [id])

  @@index([account_id])
  @@map("finance_expenses")
}`
);

// Add refunds to FinanceInvoice
modifiedSchema = modifiedSchema.replace(
  /payments\s+FinancePayment\[\]/,
  `payments       FinancePayment[]\n  refunds        FinanceRefund[]`
);

// Add journal_lines to project_list
modifiedSchema = modifiedSchema.replace(
  /finance_budgets\s+FinanceBudget\[\]/,
  `finance_budgets FinanceBudget[]\n  journal_lines   JournalEntryLine[] @relation("ProjectJournalLines")`
);

modifiedSchema += targetAdditions;

const testSchemaPath = path.join(rootDir, 'scratch', 'schema_test.prisma');
fs.writeFileSync(testSchemaPath, modifiedSchema, 'utf8');

console.log("Written scratch/schema_test.prisma successfully.");
