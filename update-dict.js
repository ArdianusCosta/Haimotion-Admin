const fs = require('fs');
let code = fs.readFileSync('components/language-provider.tsx', 'utf8');

// Add to English
code = code.replace(
  "'Income': 'Income',",
  "'Income': 'Income',\n    'Income & Expenses': 'Income & Expenses',\n    'Total Balance': 'Total Balance',\n    'Unpaid Invoices': 'Unpaid Invoices',\n    'Total Transactions': 'Total Transactions',\n    'Unpaid': 'Unpaid',"
);

// Add to Indonesian
code = code.replace(
  "'Income': 'Pemasukan',",
  "'Income': 'Pemasukan',\n    'Income & Expenses': 'Pemasukan & Pengeluaran',\n    'Total Balance': 'Total Saldo',\n    'Unpaid Invoices': 'Invoice Belum Dibayar',\n    'Total Transactions': 'Total Transaksi',\n    'Unpaid': 'Belum Dibayar',"
);

fs.writeFileSync('components/language-provider.tsx', code);
