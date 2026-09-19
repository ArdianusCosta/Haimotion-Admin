const fs = require('fs');
const path = require('path');

const translations = {
  'Simpan': 'Save',
  'Tambah': 'Add',
  'Data Baru': 'New Data',
  'Filter': 'Filter',
  'Dari': 'From',
  's/d': 'To',
  'Tanggal': 'Date',
  'Keterangan': 'Description',
  'Total': 'Total',
  'Status': 'Status',
  'Aksi': 'Action',
  'Nama': 'Name',
  'Kode': 'Code',
  'Jenis': 'Type',
  'Satuan': 'Unit',
  'Pelanggan': 'Customer',
  'Pemasok': 'Supplier',
  'Nomor': 'Number',
  'Debit': 'Debit',
  'Kredit': 'Credit',
  'Saldo Akhir': 'Ending Balance',
  'Tipe Transaksi': 'Transaction Type',
  'Informasi Lainnya': 'Other Information',
  'Akun Perkiraan': 'Chart of Accounts',
  'Buku Besar': 'General Ledger',
  'Barang & Jasa': 'Products & Services',
  'Penawaran Penjualan': 'Sales Quote',
  'Faktur Penjualan': 'Sales Invoice',
  'Uang Muka Penjualan': 'Sales Down Payment',
  'Penerimaan Penjualan': 'Sales Receipt',
  'Pesanan Pembelian': 'Purchase Order',
  'Faktur Pembelian': 'Purchase Invoice',
  'Uang Muka Pembelian': 'Purchase Down Payment',
  'Pembayaran Pembelian': 'Purchase Payment',
  'Merek': 'Brand'
};

const financeDir = 'components/finance';

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') && !fullPath.includes('finance-overview-page.tsx')) {
      let code = fs.readFileSync(fullPath, 'utf8');
      let originalCode = code;

      // Add imports
      if (!code.includes('useLanguage')) {
        code = code.replace("import React from 'react'", "import React from 'react'\nimport { useLanguage } from '@/components/language-provider'");
      }

      // Add hook
      if (!code.includes('const { t } = useLanguage()')) {
        code = code.replace(/export function \w+\(.*\) \{/, match => `${match}\n  const { t } = useLanguage()`);
      }

      // Replace texts
      for (const [idText, enKey] of Object.entries(translations)) {
        // Text inside JSX elements
        const regex1 = new RegExp(`>\\s*${idText}\\s*<`, 'g');
        code = code.replace(regex1, `>{t('${enKey}')}<`);
        
        // Text inside placeholders
        const regex2 = new RegExp(`placeholder="${idText}"`, 'g');
        code = code.replace(regex2, `placeholder={t('${enKey}')}`);
      }

      if (code !== originalCode) {
        fs.writeFileSync(fullPath, code);
        console.log(`Translated: ${fullPath}`);
      }
    }
  }
}

processDirectory(financeDir);

// Update language-provider
let langCode = fs.readFileSync('components/language-provider.tsx', 'utf8');
let enAdditions = Object.values(translations).map(v => `    '${v}': '${v}',`).join('\n');
let idAdditions = Object.entries(translations).map(([k, v]) => `    '${v}': '${k}',`).join('\n');

langCode = langCode.replace("'Income': 'Income',", "'Income': 'Income',\n" + enAdditions);
langCode = langCode.replace("'Income': 'Pemasukan',", "'Income': 'Pemasukan',\n" + idAdditions);
fs.writeFileSync('components/language-provider.tsx', langCode);

console.log('Done!');
