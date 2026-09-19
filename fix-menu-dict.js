const fs = require('fs');
let code = fs.readFileSync('components/language-provider.tsx', 'utf8');

const idToEnMap = {
  'Beranda': 'Dashboard',
  'Akun Perkiraan': 'Chart of Accounts',
  'Penjualan': 'Sales',
  'Penawaran Penjualan': 'Sales Quote',
  'Uang Muka Penjualan': 'Sales Down Payment',
  'Faktur Penjualan': 'Sales Invoice',
  'Penerimaan Penjualan': 'Sales Receipt',
  'Pelanggan': 'Customers',
  'Pembelian': 'Purchases',
  'Pesanan Pembelian': 'Purchase Order',
  'Faktur Pembelian': 'Purchase Invoice',
  'Uang Muka Pembelian': 'Purchase Down Payment',
  'Pembayaran Pembelian': 'Purchase Payment',
  'Pemasok': 'Suppliers',
  'Barang & Jasa': 'Products & Services',
  'Buku Besar': 'General Ledger',
  'Karyawan': 'Employees'
};

let enReplacements = [];
let idReplacements = [];

for (const [id, en] of Object.entries(idToEnMap)) {
  if (!code.includes(`'${id}': '${en}'`)) {
    enReplacements.push(`    '${id}': '${en}',`);
  }
  if (!code.includes(`'${id}': '${id}'`)) {
    idReplacements.push(`    '${id}': '${id}',`);
  }
}

if (enReplacements.length > 0) {
  code = code.replace("'Dashboard': 'Dashboard',", "'Dashboard': 'Dashboard',\n" + enReplacements.join('\n'));
}

if (idReplacements.length > 0) {
  code = code.replace("'Dashboard': 'Beranda',", "'Dashboard': 'Beranda',\n" + idReplacements.join('\n'));
}

fs.writeFileSync('components/language-provider.tsx', code);
console.log('Fixed menu dictionary');
