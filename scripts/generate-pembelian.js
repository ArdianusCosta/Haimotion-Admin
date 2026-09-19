const fs = require('fs');
const path = require('path');

const penjualanDir = 'components/finance/penjualan';
const pembelianDir = 'components/finance/pembelian';

const pesananSource = fs.readFileSync(path.join(penjualanDir, 'penawaran-penjualan-page.tsx'), 'utf8');
let pesananDest = pesananSource.replace(/Penawaran Penjualan/g, 'Pesanan Pembelian');
pesananDest = pesananDest.replace(/PenawaranPenjualanPage/g, 'PesananPembelianPage');
pesananDest = pesananDest.replace(/PT Global Makmur/g, 'Vendor Supplier X');
pesananDest = pesananDest.replace(/PT Sejahtera/g, 'Vendor Y');
pesananDest = pesananDest.replace(/Pelanggan/g, 'Pemasok');
pesananDest = pesananDest.replace(/Pilih Pemasok/g, 'Pilih Pemasok');
fs.writeFileSync(path.join(pembelianDir, 'pesanan-pembelian-page.tsx'), pesananDest);

const fakturSource = fs.readFileSync(path.join(penjualanDir, 'faktur-penjualan-page.tsx'), 'utf8');
let fakturDest = fakturSource.replace(/Faktur Penjualan/g, 'Faktur Pembelian');
fakturDest = fakturDest.replace(/FakturPenjualanPage/g, 'FakturPembelianPage');
fakturDest = fakturDest.replace(/PT Global Makmur/g, 'Vendor Supplier X');
fakturDest = fakturDest.replace(/PT Sejahtera/g, 'Vendor Y');
fakturDest = fakturDest.replace(/Pelanggan/g, 'Pemasok');
fs.writeFileSync(path.join(pembelianDir, 'faktur-pembelian-page.tsx'), fakturDest);

const uangMukaSource = fs.readFileSync(path.join(penjualanDir, 'uang-muka-penjualan-page.tsx'), 'utf8');
let uangMukaDest = uangMukaSource.replace(/Uang Muka Penjualan/g, 'Uang Muka Pembelian');
uangMukaDest = uangMukaDest.replace(/UangMukaPenjualanPage/g, 'UangMukaPembelianPage');
uangMukaDest = uangMukaDest.replace(/PT Global Makmur/g, 'Vendor Supplier X');
uangMukaDest = uangMukaDest.replace(/PT Sejahtera/g, 'Vendor Y');
uangMukaDest = uangMukaDest.replace(/Pelanggan/g, 'Pemasok');
fs.writeFileSync(path.join(pembelianDir, 'uang-muka-pembelian-page.tsx'), uangMukaDest);

const pembayaranSource = fs.readFileSync(path.join(penjualanDir, 'penerimaan-penjualan-page.tsx'), 'utf8');
let pembayaranDest = pembayaranSource.replace(/Penerimaan Penjualan/g, 'Pembayaran Pembelian');
pembayaranDest = pembayaranDest.replace(/PenerimaanPenjualanPage/g, 'PembayaranPembelianPage');
pembayaranDest = pembayaranDest.replace(/PT Global Makmur/g, 'Vendor Supplier X');
pembayaranDest = pembayaranDest.replace(/PT Sejahtera/g, 'Vendor Y');
pembayaranDest = pembayaranDest.replace(/Pelanggan/g, 'Pemasok');
fs.writeFileSync(path.join(pembelianDir, 'pembayaran-pembelian-page.tsx'), pembayaranDest);

const pemasokSource = fs.readFileSync(path.join(penjualanDir, 'pelanggan-page.tsx'), 'utf8');
let pemasokDest = pemasokSource.replace(/Pelanggan/g, 'Pemasok');
pemasokDest = pemasokDest.replace(/PelangganPage/g, 'PemasokPage');
pemasokDest = pemasokDest.replace(/PT Global Makmur/g, 'Vendor Supplier X');
pemasokDest = pemasokDest.replace(/Nama Pemasok/g, 'Nama Pemasok');
fs.writeFileSync(path.join(pembelianDir, 'pemasok-page.tsx'), pemasokDest);

console.log("Generated all 5 Pembelian components.");
