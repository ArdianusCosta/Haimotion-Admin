const fs = require('fs');
const path = 'components/northstar-dashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldMenu = `const financeMenu = [
  { label: 'Beranda', icon: LayoutDashboard },
  { label: 'Akun Perkiraan', icon: Wallet },
  { label: 'Penjualan', icon: TrendingUp },
  { label: 'Pembelian', icon: TrendingDown },
  { label: 'Barang & Jasa', icon: Package },
  { label: 'Karyawan', icon: Users },
  { label: 'Buku Besar', icon: FileSpreadsheet },
]`;

const newMenu = `const financeMenu = [
  { label: 'Beranda', icon: LayoutDashboard },
  { label: 'Akun Perkiraan', icon: Wallet },
  { label: 'Penjualan', icon: TrendingUp, subItems: [
    { label: 'Penawaran Penjualan' },
    { label: 'Uang Muka Penjualan' },
    { label: 'Faktur Penjualan' },
    { label: 'Penerimaan Penjualan' },
    { label: 'Pelanggan' }
  ] },
  { label: 'Pembelian', icon: TrendingDown },
  { label: 'Barang & Jasa', icon: Package },
  { label: 'Karyawan', icon: Users },
  { label: 'Buku Besar', icon: FileSpreadsheet },
]`;

code = code.replace(oldMenu, newMenu);
fs.writeFileSync(path, code);
