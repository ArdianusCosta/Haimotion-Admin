const fs = require('fs');
const path = 'components/northstar-dashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

// Add imports
const newImports = `
import { PenawaranPenjualanPage } from '@/components/finance/penjualan/penawaran-penjualan-page'
import { UangMukaPenjualanPage } from '@/components/finance/penjualan/uang-muka-penjualan-page'
import { FakturPenjualanPage } from '@/components/finance/penjualan/faktur-penjualan-page'
import { PenerimaanPenjualanPage } from '@/components/finance/penjualan/penerimaan-penjualan-page'
import { PelangganPage } from '@/components/finance/penjualan/pelanggan-page'
`;

code = code.replace("import { AkunPerkiraanPage } from '@/components/finance/akun-perkiraan-page'", "import { AkunPerkiraanPage } from '@/components/finance/akun-perkiraan-page'\n" + newImports);

// Add to switch
const newSwitchCases = `
              case 'Penawaran Penjualan': return <PenawaranPenjualanPage />
              case 'Uang Muka Penjualan': return <UangMukaPenjualanPage />
              case 'Faktur Penjualan': return <FakturPenjualanPage />
              case 'Penerimaan Penjualan': return <PenerimaanPenjualanPage />
              case 'Pelanggan': return <PelangganPage />
`;

code = code.replace("case 'Akun Perkiraan': return <AkunPerkiraanPage />", "case 'Akun Perkiraan': return <AkunPerkiraanPage />\n" + newSwitchCases);

fs.writeFileSync(path, code);
