const fs = require('fs');
const path = 'components/northstar-dashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

const newImports = `
import { BarangJasaPage } from '@/components/finance/barang-jasa-page'
`;
code = code.replace("import { CashBankPage } from '@/components/finance/cash-bank-page'", "import { CashBankPage } from '@/components/finance/cash-bank-page'\n" + newImports);

const newSwitchCases = `
              case 'Barang & Jasa': return <BarangJasaPage />
`;
code = code.replace("case 'Barang & Jasa': return <ProductsServicesPage />", newSwitchCases);
// if it didn't have ProductsServicesPage but instead something else or nothing
if(!code.includes('<BarangJasaPage />')) {
    code = code.replace("case 'Pemasok': return <PemasokPage />", "case 'Pemasok': return <PemasokPage />\n" + newSwitchCases);
}

fs.writeFileSync(path, code);
