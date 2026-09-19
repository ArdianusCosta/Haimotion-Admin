const fs = require('fs');

const files = [
  'components/finance/pembelian/faktur-pembelian-page.tsx',
  'components/finance/pembelian/pembayaran-pembelian-page.tsx',
  'components/finance/pembelian/pesanan-pembelian-page.tsx',
  'components/finance/pembelian/uang-muka-pembelian-page.tsx',
  'components/finance/penjualan/faktur-penjualan-page.tsx',
  'components/finance/penjualan/penawaran-penjualan-page.tsx',
  'components/finance/penjualan/penerimaan-penjualan-page.tsx',
  'components/finance/penjualan/uang-muka-penjualan-page.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/<SelectItem value="pt-global">.*?<\/SelectItem>/g, '');
  content = content.replace(/<SelectItem value="pt-sejahtera">.*?<\/SelectItem>/g, '');
  fs.writeFileSync(file, content);
  console.log('Cleaned select items from', file);
});
