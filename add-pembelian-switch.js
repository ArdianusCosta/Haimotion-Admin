const fs = require('fs');
const path = 'components/northstar-dashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

const newImports = `
import { PesananPembelianPage } from '@/components/finance/pembelian/pesanan-pembelian-page'
import { FakturPembelianPage } from '@/components/finance/pembelian/faktur-pembelian-page'
import { UangMukaPembelianPage } from '@/components/finance/pembelian/uang-muka-pembelian-page'
import { PembayaranPembelianPage } from '@/components/finance/pembelian/pembayaran-pembelian-page'
import { PemasokPage } from '@/components/finance/pembelian/pemasok-page'
`;
code = code.replace("import { PelangganPage } from '@/components/finance/penjualan/pelanggan-page'", "import { PelangganPage } from '@/components/finance/penjualan/pelanggan-page'\n" + newImports);

const newSwitchCases = `
              case 'Pesanan Pembelian': return <PesananPembelianPage />
              case 'Faktur Pembelian': return <FakturPembelianPage />
              case 'Uang Muka Pembelian': return <UangMukaPembelianPage />
              case 'Pembayaran Pembelian': return <PembayaranPembelianPage />
              case 'Pemasok': return <PemasokPage />
`;
code = code.replace("case 'Pelanggan': return <PelangganPage />", "case 'Pelanggan': return <PelangganPage />\n" + newSwitchCases);

fs.writeFileSync(path, code);
