const fs = require('fs');
const path = 'components/finance/penjualan/uang-muka-penjualan-page.tsx';
let code = fs.readFileSync('components/finance/penjualan/penawaran-penjualan-page.tsx', 'utf8');

code = code.replace(/Penawaran Penjualan/g, 'Uang Muka Penjualan');
code = code.replace(/PenawaranPenjualanPage/g, 'UangMukaPenjualanPage');
code = code.replace(/Penawaran proyek implementasi ERP/g, 'Pembayaran DP 30% proyek');

fs.writeFileSync(path, code);
