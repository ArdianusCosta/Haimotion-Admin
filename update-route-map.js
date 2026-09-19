const fs = require('fs');
const path = 'app/[[...slug]]/page.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldMap = `const financeRouteMap: Record<string, string> = {
        'overview': 'Beranda',
        'chart-of-accounts': 'Akun Perkiraan',
        'sales': 'Penjualan',
        'purchases': 'Pembelian',
        'products-services': 'Barang & Jasa',
        'employees': 'Karyawan',
        'general-ledger': 'Buku Besar'
      }`;

const newMap = `const financeRouteMap: Record<string, string> = {
        'overview': 'Beranda',
        'chart-of-accounts': 'Akun Perkiraan',
        'sales': 'Penjualan',
        'sales/penawaran': 'Penawaran Penjualan',
        'sales/uang-muka': 'Uang Muka Penjualan',
        'sales/faktur': 'Faktur Penjualan',
        'sales/penerimaan': 'Penerimaan Penjualan',
        'sales/pelanggan': 'Pelanggan',
        'purchases': 'Pembelian',
        'products-services': 'Barang & Jasa',
        'employees': 'Karyawan',
        'general-ledger': 'Buku Besar'
      }`;

code = code.replace(oldMap, newMap);

fs.writeFileSync(path, code);
