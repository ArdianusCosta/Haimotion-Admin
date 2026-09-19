const fs = require('fs');
const path = 'components/northstar-dashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldMap = `const financeRouteMap: Record<string, string> = {
      'Beranda': 'finance/overview',
      'Akun Perkiraan': 'finance/chart-of-accounts',
      'Penjualan': 'finance/sales',
      'Pembelian': 'finance/purchases',
      'Barang & Jasa': 'finance/products-services',
      'Karyawan': 'finance/employees',
      'Buku Besar': 'finance/general-ledger'
    }`;

const newMap = `const financeRouteMap: Record<string, string> = {
      'Beranda': 'finance/overview',
      'Akun Perkiraan': 'finance/chart-of-accounts',
      'Penjualan': 'finance/sales',
      'Penawaran Penjualan': 'finance/sales/penawaran',
      'Uang Muka Penjualan': 'finance/sales/uang-muka',
      'Faktur Penjualan': 'finance/sales/faktur',
      'Penerimaan Penjualan': 'finance/sales/penerimaan',
      'Pelanggan': 'finance/sales/pelanggan',
      'Pembelian': 'finance/purchases',
      'Barang & Jasa': 'finance/products-services',
      'Karyawan': 'finance/employees',
      'Buku Besar': 'finance/general-ledger'
    }`;

code = code.replace(oldMap, newMap);
fs.writeFileSync(path, code);
