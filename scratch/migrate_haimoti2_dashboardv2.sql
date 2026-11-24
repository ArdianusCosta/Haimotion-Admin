USE `haimoti2_dashboardv2`;

-- 1. BASE LEGACY TABLES (matching current Prisma schema)
CREATE TABLE IF NOT EXISTS `project_list` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(200) NOT NULL,
  `description` TEXT NOT NULL,
  `status` TINYINT NOT NULL DEFAULT 1,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `manager_id` INT NOT NULL,
  `date_created` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `finance_contacts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `type` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `finance_invoices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `reference` VARCHAR(100) NOT NULL UNIQUE,
  `type` VARCHAR(20) NOT NULL DEFAULT 'SALES',
  `contact_id` INT NULL,
  `customer_name` VARCHAR(200) NOT NULL,
  `customer_email` VARCHAR(200) NULL,
  `date` DATE NOT NULL,
  `due_date` DATE NOT NULL,
  `amount` DOUBLE NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Draft',
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` INT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `finance_accounts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(50) NULL,
  `sub_type` VARCHAR(100) NULL,
  `name` VARCHAR(200) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `balance` DOUBLE NOT NULL DEFAULT 0,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'IDR',
  `account_number` VARCHAR(100) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `finance_payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `invoice_id` INT NOT NULL,
  `amount` DOUBLE NOT NULL,
  `payment_date` DATE NOT NULL,
  `payment_method` VARCHAR(100) NOT NULL,
  `reference` VARCHAR(255) NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_legacy_payments_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `finance_invoices`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `finance_expenses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `date` DATE NOT NULL,
  `description` TEXT NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `amount` DOUBLE NOT NULL,
  `vendor` VARCHAR(200) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'Pending',
  `receipt_url` TEXT NULL,
  `payroll_id` INT NULL,
  `account_id` INT NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` INT NULL,
  `category_id` INT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `finance_transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `date` DATE NOT NULL,
  `description` TEXT NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `amount` DOUBLE NOT NULL,
  `account_id` INT NOT NULL,
  `reference` VARCHAR(200) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_by` INT NULL,
  CONSTRAINT `fk_legacy_transactions_account` FOREIGN KEY (`account_id`) REFERENCES `finance_accounts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. MILESTONE 1 MIGRATION
CREATE TABLE IF NOT EXISTS `_finance_migration_log` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `version` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(255) NOT NULL,
  `status` ENUM('STARTED', 'APPLIED', 'FAILED') NOT NULL DEFAULT 'STARTED',
  `started_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `applied_at` DATETIME NULL,
  `failed_at` DATETIME NULL,
  `error_code` VARCHAR(50) NULL,
  `error_message` TEXT NULL,
  `execution_time_ms` INT NULL,
  `checksum` VARCHAR(64) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `_finance_migration_log` (`version`, `description`, `status`, `started_at`, `error_message`)
VALUES ('V2.0_M1_FINAL_GATE', 'Milestone 1 Expand Phase: Double Entry, COA, Refunds, Period, Audit', 'STARTED', NOW(), NULL)
ON DUPLICATE KEY UPDATE `status` = 'STARTED', `started_at` = NOW(), `applied_at` = NULL, `failed_at` = NULL, `error_message` = NULL;

CREATE TABLE IF NOT EXISTS `accounting_periods` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `period_name` VARCHAR(50) NOT NULL UNIQUE,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `status` ENUM('OPEN', 'LOCKED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
  `closed_at` DATETIME(3) NULL,
  `closed_by` INT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_period_dates` (`start_date`, `end_date`),
  INDEX `idx_period_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `finance_audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `event_type` VARCHAR(50) NOT NULL,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` INT NOT NULL,
  `actor_id` INT NULL,
  `ip_address` VARCHAR(100) NULL,
  `description` TEXT NOT NULL,
  `details` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `idx_audit_entity` (`entity_type`, `entity_id`),
  INDEX `idx_audit_event` (`event_type`),
  INDEX `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `chart_of_accounts` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `account_code` VARCHAR(50) NOT NULL UNIQUE,
  `account_name` VARCHAR(150) NOT NULL,
  `classification` ENUM('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE') NOT NULL,
  `normal_balance` ENUM('DEBIT', 'CREDIT') NOT NULL,
  `parent_id` INT NULL,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  `description` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_coa_classification` (`classification`),
  INDEX `idx_coa_parent` (`parent_id`),
  CONSTRAINT `fk_coa_parent` FOREIGN KEY (`parent_id`) REFERENCES `chart_of_accounts`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `journal_entries` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `entry_number` VARCHAR(50) NOT NULL UNIQUE,
  `entry_date` DATE NOT NULL,
  `source_type` VARCHAR(50) NOT NULL,
  `source_id` INT NULL,
  `posting_type` ENUM('ORIGINAL', 'REVERSAL', 'ADJUSTMENT', 'OPENING_BALANCE') NOT NULL DEFAULT 'ORIGINAL',
  `idempotency_key` VARCHAR(191) NOT NULL UNIQUE,
  `reference_no` VARCHAR(100) NULL,
  `description` TEXT NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'IDR',
  `exchange_rate` DECIMAL(10, 4) NOT NULL DEFAULT 1.0000,
  `total_debit` DECIMAL(15, 2) NOT NULL,
  `total_credit` DECIMAL(15, 2) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'POSTED',
  `posted_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `created_by` INT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  `reversal_of_id` INT NULL UNIQUE,
  INDEX `idx_journal_source` (`source_type`, `source_id`),
  INDEX `idx_journal_date` (`entry_date`),
  INDEX `idx_journal_status` (`status`),
  CONSTRAINT `fk_journal_reversal` FOREIGN KEY (`reversal_of_id`) REFERENCES `journal_entries`(`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `journal_entry_lines` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `journal_id` INT NOT NULL,
  `coa_id` INT NOT NULL,
  `project_id` INT NULL,
  `debit` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `credit` DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
  `line_memo` VARCHAR(255) NULL,
  INDEX `idx_line_journal` (`journal_id`),
  INDEX `idx_line_coa` (`coa_id`),
  INDEX `idx_line_project` (`project_id`),
  CONSTRAINT `fk_line_journal` FOREIGN KEY (`journal_id`) REFERENCES `journal_entries`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_line_coa` FOREIGN KEY (`coa_id`) REFERENCES `chart_of_accounts`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_line_project` FOREIGN KEY (`project_id`) REFERENCES `project_list`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `finance_refunds` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `refund_number` VARCHAR(50) NOT NULL UNIQUE,
  `invoice_id` INT NULL,
  `payment_id` INT NULL,
  `account_id` INT NOT NULL,
  `amount` DECIMAL(15, 2) NOT NULL,
  `refund_date` DATE NOT NULL,
  `reason` TEXT NOT NULL,
  `created_by` INT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_refund_invoice` (`invoice_id`),
  INDEX `idx_refund_payment` (`payment_id`),
  INDEX `idx_refund_account` (`account_id`),
  CONSTRAINT `fk_refund_account` FOREIGN KEY (`account_id`) REFERENCES `finance_accounts`(`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_refund_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `finance_invoices`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_refund_payment` FOREIGN KEY (`payment_id`) REFERENCES `finance_payments`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Conditional Alterations and Seeding
DELIMITER $$
DROP PROCEDURE IF EXISTS `sp_apply_finance_m1_final_gate`$$
CREATE PROCEDURE `sp_apply_finance_m1_final_gate`()
proc_block: BEGIN
  DECLARE start_time BIGINT;
  DECLARE v_step VARCHAR(100);

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
    UPDATE `_finance_migration_log`
    SET 
      `status` = 'FAILED', 
      `failed_at` = NOW(), 
      `error_code` = CONCAT('ERR_', @errno),
      `error_message` = CONCAT('Step [', v_step, '] failed with SQLState ', @sqlstate, ': ', @text)
    WHERE `version` = 'V2.0_M1_FINAL_GATE';
    RESIGNAL;
  END;

  SET start_time = ROUND(UNIX_TIMESTAMP(CURTIME(4)) * 1000);

  -- STEP 1: finance_accounts.coa_id column & FK
  SET v_step = 'ADD_COLUMN_FINANCE_ACCOUNTS_COA_ID';
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'finance_accounts' AND COLUMN_NAME = 'coa_id'
  ) THEN
    ALTER TABLE `finance_accounts` ADD COLUMN `coa_id` INT NULL AFTER `sub_type`;
  END IF;

  SET v_step = 'ADD_FK_FINANCE_ACCOUNTS_COA';
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'finance_accounts' AND CONSTRAINT_NAME = 'fk_finance_accounts_coa'
  ) THEN
    ALTER TABLE `finance_accounts` ADD CONSTRAINT `fk_finance_accounts_coa` 
      FOREIGN KEY (`coa_id`) REFERENCES `chart_of_accounts`(`id`) ON DELETE RESTRICT;
  END IF;

  -- STEP 2: finance_payments.account_id column & FK
  SET v_step = 'ADD_COLUMN_FINANCE_PAYMENTS_ACCOUNT_ID';
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'finance_payments' AND COLUMN_NAME = 'account_id'
  ) THEN
    ALTER TABLE `finance_payments` ADD COLUMN `account_id` INT NULL AFTER `notes`;
  END IF;

  SET v_step = 'ADD_FK_FINANCE_PAYMENTS_ACCOUNT';
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'finance_payments' AND CONSTRAINT_NAME = 'fk_finance_payments_account'
  ) THEN
    ALTER TABLE `finance_payments` ADD CONSTRAINT `fk_finance_payments_account` 
      FOREIGN KEY (`account_id`) REFERENCES `finance_accounts`(`id`) ON DELETE RESTRICT;
  END IF;

  -- STEP 3: finance_expenses.account_id FK constraint
  SET v_step = 'ADD_FK_FINANCE_EXPENSES_ACCOUNT';
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'finance_expenses' AND CONSTRAINT_NAME = 'fk_finance_expenses_account'
  ) THEN
    ALTER TABLE `finance_expenses` ADD CONSTRAINT `fk_finance_expenses_account` 
      FOREIGN KEY (`account_id`) REFERENCES `finance_accounts`(`id`) ON DELETE RESTRICT;
  END IF;

  -- STEP 4: SEED CHART OF ACCOUNTS UTAMA (IDEMPOTENT)
  SET v_step = 'SEED_CHART_OF_ACCOUNTS';
  INSERT IGNORE INTO `chart_of_accounts` (`account_code`, `account_name`, `classification`, `normal_balance`, `description`) VALUES
  ('1-0000', 'ASET', 'ASSET', 'DEBIT', 'Header Akun Aset Perusahaan'),
  ('1-1000', 'Kas & Setara Kas', 'ASSET', 'DEBIT', 'Header Akun Kas dan Simpanan Bank'),
  ('1-1001', 'Kas Utama (Petty Cash)', 'ASSET', 'DEBIT', 'Kas fisik tunai operasional kantor'),
  ('1-1002', 'Bank BCA Operasional', 'ASSET', 'DEBIT', 'Rekening BCA Giro/Operasional Utama'),
  ('1-1003', 'Bank Mandiri Payroll', 'ASSET', 'DEBIT', 'Rekening Mandiri untuk distribusi gaji'),
  ('1-1200', 'Piutang Usaha (A/R)', 'ASSET', 'DEBIT', 'Tagihan invoice aktif kepada klien'),
  ('1-1999', 'Akun Kliring / Transisi', 'ASSET', 'DEBIT', 'Akun penampung transaksi historis belum terpetakan'),
  ('2-0000', 'LIABILITAS', 'LIABILITY', 'CREDIT', 'Header Kewajiban & Utang'),
  ('2-1100', 'Utang Usaha (A/P)', 'LIABILITY', 'CREDIT', 'Kewajiban tagihan kepada vendor & supplier'),
  ('2-1200', 'Utang Gaji Karyawan', 'LIABILITY', 'CREDIT', 'Akrual beban gaji yang belum dicairkan'),
  ('2-1300', 'Deposit Pelanggan (Unearned)', 'LIABILITY', 'CREDIT', 'Titipan dana invoice batal / uang muka'),
  ('3-0000', 'EKUITAS', 'EQUITY', 'CREDIT', 'Header Modal & Ekuitas Pemilik'),
  ('3-1001', 'Modal Disetor', 'EQUITY', 'CREDIT', 'Modal dasar pendirian perusahaan'),
  ('3-1002', 'Saldo Penyeimbang Awal', 'EQUITY', 'CREDIT', 'Opening Balance Equity penyeimbang neraca'),
  ('3-2001', 'Laba Ditahan', 'EQUITY', 'CREDIT', 'Akumulasi laba periode sebelum tahun berjalan'),
  ('4-0000', 'PENDAPATAN', 'REVENUE', 'CREDIT', 'Header Pendapatan Usaha'),
  ('4-1000', 'Pendapatan Produksi Animasi', 'REVENUE', 'CREDIT', 'Pendapatan jasa animasi 2D, 3D, dan motion'),
  ('4-1100', 'Pendapatan Jasa Software & ERP', 'REVENUE', 'CREDIT', 'Pendapatan pembuatan aplikasi & custom system'),
  ('5-0000', 'BEBAN POKOK PRODUKSI (HPP)', 'EXPENSE', 'DEBIT', 'Header Biaya Langsung Proyek'),
  ('5-1000', 'Beban Tenaga Lepas (Freelancer)', 'EXPENSE', 'DEBIT', 'Upah animator lepas, audio talent, dan scriptwriter'),
  ('6-0000', 'BEBAN OPERASIONAL (OPEX)', 'EXPENSE', 'DEBIT', 'Header Biaya Operasional Kantor'),
  ('6-1001', 'Beban Gaji & Upah Karyawan', 'EXPENSE', 'DEBIT', 'Gaji pokok dan tunjangan tetap karyawan'),
  ('6-1004', 'Beban Operasional & ATK', 'EXPENSE', 'DEBIT', 'Keperluan rutin kantor dan studio render');

  -- STEP 5: VERIFIKASI AKHIR KESELURUHAN OBJEK
  SET v_step = 'FINAL_STRUCTURE_VERIFICATION';
  IF NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'journal_entries') OR
     NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'journal_entry_lines') OR
     NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'finance_refunds') OR
     NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'accounting_periods') OR
     NOT EXISTS (SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'finance_audit_logs') THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'VERIFICATION_FAILED: Tabel baru belum lengkap.';
  END IF;

  -- UPDATE STATUS MENJADI APPLIED HANYA SETELAH SELURUH LANGKAH DI ATAS SUKSES
  UPDATE `_finance_migration_log`
  SET 
    `status` = 'APPLIED', 
    `applied_at` = NOW(), 
    `error_code` = NULL,
    `error_message` = NULL,
    `execution_time_ms` = ROUND(UNIX_TIMESTAMP(CURTIME(4)) * 1000) - start_time
  WHERE `version` = 'V2.0_M1_FINAL_GATE';

END proc_block$$
DELIMITER ;

CALL `sp_apply_finance_m1_final_gate`();
DROP PROCEDURE IF EXISTS `sp_apply_finance_m1_final_gate`;
