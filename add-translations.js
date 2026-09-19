const fs = require('fs');
let code = fs.readFileSync('components/finance/finance-overview-page.tsx', 'utf8');

if (!code.includes('useLanguage')) {
  code = code.replace("import React from 'react'", "import React from 'react'\nimport { useLanguage } from '@/components/language-provider'");
}
if (!code.includes('const { t } = useLanguage()')) {
  code = code.replace("export function FinanceOverviewPage({ user }: { user?: any }) {", "export function FinanceOverviewPage({ user }: { user?: any }) {\n  const { t } = useLanguage()");
}

// Replacements
code = code.replace(/>Pemasukan<\/span>/g, ">{t('Income')}</span>");
code = code.replace(/>Pemasukan & Pengeluaran<\/CardTitle>/g, ">{t('Income & Expenses')}</CardTitle>");
code = code.replace(/>Income<\/span>/g, ">{t('Income')}</span>");
code = code.replace(/>Expenses<\/span>/g, ">{t('Expenses')}</span>");
code = code.replace(/>Bulan ini/g, ">{t('This month')}");
code = code.replace(/>Total Saldo<\/p>/g, ">{t('Total Balance')}</p>");
code = code.replace(/>Invoice Belum Dibayar<\/p>/g, ">{t('Unpaid Invoices')}</p>");
code = code.replace(/>Total Transaksi<\/p>/g, ">{t('Total Transactions')}</p>");
code = code.replace(/>Transaksi<\/h2>/g, ">{t('Transactions')}</h2>");
code = code.replace(/>Lihat semua<\/button>/g, ">{t('View all')}</button>");
code = code.replace(/>Lunas<\/span>/g, ">{t('Paid')}</span>");
code = code.replace(/>Belum Dibayar<\/span>/g, ">{t('Unpaid')}</span>");

fs.writeFileSync('components/finance/finance-overview-page.tsx', code);
console.log('Translations applied.');
