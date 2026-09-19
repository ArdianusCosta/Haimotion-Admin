const fs = require('fs');
const path = 'components/northstar-dashboard.tsx';
let code = fs.readFileSync(path, 'utf8');

const newImports = `
import { BukuBesarPage } from '@/components/finance/buku-besar-page'
`;
if (!code.includes('import { BukuBesarPage }')) {
    code = code.replace("import { BarangJasaPage } from '@/components/finance/barang-jasa-page'", "import { BarangJasaPage } from '@/components/finance/barang-jasa-page'\n" + newImports);
}

const newSwitchCases = `
              case 'Buku Besar': return <BukuBesarPage />
`;
if (!code.includes('<BukuBesarPage />')) {
    code = code.replace("case 'Karyawan': return <EmployeesPage />", "case 'Karyawan': return <EmployeesPage />\n" + newSwitchCases);
}

fs.writeFileSync(path, code);
