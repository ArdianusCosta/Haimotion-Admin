const fs = require('fs');

const file1 = 'components/finance/finance-overview-page.tsx';
let content1 = fs.readFileSync(file1, 'utf8');
content1 = content1.replace(/const staticMonthlyData = \[[\s\S]*?\]/, 'const staticMonthlyData: any[] = []');
content1 = content1.replace(/const staticTransactions = \[[\s\S]*?\]/, 'const staticTransactions: any[] = []');
content1 = content1.replace(/const invoiceData = \[[\s\S]*?\]/, 'const invoiceData: any[] = []');
fs.writeFileSync(file1, content1);
console.log('Cleaned', file1);

const file2 = 'components/finance/buku-besar-page.tsx';
let content2 = fs.readFileSync(file2, 'utf8');
content2 = content2.replace(/const staticData = \[[\s\S]*?\]/, 'const staticData: any[] = []');
fs.writeFileSync(file2, content2);
console.log('Cleaned', file2);

const file3 = 'components/finance/reports-page.tsx';
let content3 = fs.readFileSync(file3, 'utf8');
content3 = content3.replace(/const financialReports = \[[\s\S]*?\]/, 'const financialReports: any[] = []');
fs.writeFileSync(file3, content3);
console.log('Cleaned', file3);

