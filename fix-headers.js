const fs = require('fs');

const files = [
  'components/finance/penjualan/penawaran-penjualan-page.tsx',
  'components/finance/penjualan/pelanggan-page.tsx',
  'components/finance/penjualan/uang-muka-penjualan-page.tsx',
  'components/finance/penjualan/faktur-penjualan-page.tsx',
  'components/finance/penjualan/penerimaan-penjualan-page.tsx',
  'components/finance/barang-jasa-page.tsx',
  'components/finance/akun-perkiraan-page.tsx',
  'components/finance/pembelian/pemasok-page.tsx',
  'components/finance/pembelian/pembayaran-pembelian-page.tsx',
  'components/finance/pembelian/uang-muka-pembelian-page.tsx',
  'components/finance/pembelian/pesanan-pembelian-page.tsx',
  'components/finance/pembelian/faktur-pembelian-page.tsx',
  'components/finance/buku-besar-page.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  const regex = /<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">\s*<h1 className="text-2xl font-bold text-primary">(\{t\('.*?'\)\})<\/h1>/g;
  
  content = content.replace(regex, (match, titleCode) => {
    return `<div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-4 mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">${titleCode}</h1>
          <p className="text-sm text-muted-foreground">{t('Manage data for')} ${titleCode}</p>
        </div>`;
  });
  
  fs.writeFileSync(file, content);
  console.log('Fixed header in', file);
});
