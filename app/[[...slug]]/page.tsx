import { AuthWrapper } from '@/components/auth-wrapper'
import { getUserSession } from '@/lib/auth/authorization'

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const resolvedParams = await params
  // Convert slug back to section name (e.g., ['user-management'] -> 'User Management')
  const rawSlug = resolvedParams.slug?.[0] || ''
  const fullUser = await getUserSession()
  
  let initialSection = 'Dashboard'
  if (resolvedParams.slug && resolvedParams.slug.length > 0) {
    if (resolvedParams.slug[0].toLowerCase() === 'finance' && resolvedParams.slug.length > 1) {
      const fullSubRoute = resolvedParams.slug.slice(1).join('/').toLowerCase()
      const subRoute = resolvedParams.slug[1].toLowerCase()

      // Comprehensive mappings for all finance nested routes
      const financeRouteMap: Record<string, string> = {
        // Overview / Dashboard
        'overview': 'Beranda',
        'beranda': 'Beranda',
        'dashboard': 'Beranda',
        'home': 'Beranda',

        // Kas & Bank
        'cash-bank': 'Kas & Bank',
        'kas-bank': 'Kas & Bank',
        'cash': 'Kas & Bank',
        'kas': 'Kas & Bank',
        'bank': 'Kas & Bank',
        'cash-and-bank': 'Kas & Bank',

        // Akun Perkiraan / Chart of Accounts
        'chart-of-accounts': 'Akun Perkiraan',
        'akun-perkiraan': 'Akun Perkiraan',
        'coa': 'Akun Perkiraan',
        'accounts': 'Akun Perkiraan',

        // Penjualan / Sales
        'sales': 'Penjualan',
        'penjualan': 'Penjualan',
        'sales/faktur': 'Faktur Penjualan',
        'faktur-penjualan': 'Faktur Penjualan',
        'sales/invoice': 'Faktur Penjualan',
        'sales/invoices': 'Faktur Penjualan',
        'invoices': 'Faktur Penjualan',
        // Alias lama: penawaran / uang muka / penerimaan kini memakai Faktur Penjualan
        'sales/penawaran': 'Faktur Penjualan',
        'penawaran': 'Faktur Penjualan',
        'sales/quote': 'Faktur Penjualan',
        'sales/uang-muka': 'Faktur Penjualan',
        'uang-muka': 'Faktur Penjualan',
        'sales/penerimaan': 'Faktur Penjualan',
        'penerimaan-penjualan': 'Faktur Penjualan',
        'sales/pelanggan': 'Pelanggan',
        'pelanggan': 'Pelanggan',
        'sales/customers': 'Pelanggan',
        'customers': 'Pelanggan',

        // Pembelian / Purchases
        'purchases': 'Pembelian',
        'pembelian': 'Pembelian',
        'purchases/faktur': 'Faktur Pembelian',
        'faktur-pembelian': 'Faktur Pembelian',
        'purchases/invoice': 'Faktur Pembelian',
        'purchases/invoices': 'Faktur Pembelian',
        // Alias lama: pesanan / uang muka / pembayaran kini memakai Faktur Pembelian
        'purchases/pesanan': 'Faktur Pembelian',
        'pesanan': 'Faktur Pembelian',
        'purchases/uang-muka': 'Faktur Pembelian',
        'uang-muka-pembelian': 'Faktur Pembelian',
        'purchases/pembayaran': 'Faktur Pembelian',
        'pembayaran': 'Faktur Pembelian',
        'purchases/pemasok': 'Pemasok',
        'pemasok': 'Pemasok',
        'purchases/suppliers': 'Pemasok',
        'suppliers': 'Pemasok',

        // Barang & Jasa / Products & Services
        'products-services': 'Barang & Jasa',
        'barang-jasa': 'Barang & Jasa',
        'products': 'Barang & Jasa',
        'services': 'Barang & Jasa',

        // Pengeluaran / Expenses
        'expenses': 'Pengeluaran',
        'pengeluaran': 'Pengeluaran',

        // Laporan / Reports (menggantikan Buku Besar)
        'reports': 'Laporan',
        'laporan': 'Laporan',
        'general-ledger': 'Laporan',
        'buku-besar': 'Laporan',
        'ledger': 'Laporan',

        // Karyawan finance lama diarahkan ke modul HR
        'employees': 'Employees',
        'karyawan': 'Employees'
      }
      initialSection = financeRouteMap[fullSubRoute] || financeRouteMap[subRoute] || 'Beranda'
    } else if (resolvedParams.slug[0].toLowerCase() === 'hr' && resolvedParams.slug.length > 1) {
      const subRoute = resolvedParams.slug[1].toLowerCase()
      // Special mappings for hr nested routes
      const hrRouteMap: Record<string, string> = {
        'overview': 'HR Overview',
        'employees': 'Employees',
        'attendance': 'Attendance & Leave',
        'payroll': 'Payroll',
        'recruitment': 'Recruitment'
      }
      initialSection = hrRouteMap[subRoute] || 'HR Overview'
    } else if (resolvedParams.slug[0].toLowerCase() === 'crm' && resolvedParams.slug.length > 1) {
      const subRoute = resolvedParams.slug[1].toLowerCase()
      const crmRouteMap: Record<string, string> = {
        'overview': 'CRM Overview',
        'leads': 'Leads',
        'clients': 'Clients',
        'pipeline': 'Pipeline',
        'follow-ups': 'Follow Ups',
        'activities': 'Activities',
        'broadcast': 'Broadcast'
      }
      initialSection = crmRouteMap[subRoute] || 'CRM Overview'
    } else {
      const rawSlug = resolvedParams.slug[0].toLowerCase()
      const topLevelRouteMap: Record<string, string> = {
        'dashboard': 'Dashboard',
        'messenger': 'Messenger',
        'chat': 'Messenger',
        'ai-assistant': 'AI Assistant',
        'project': 'Project',
        'projects': 'Project',
        'kanban': 'Kanban',
        'tasks': 'Tasks',
        'calendar': 'Calendar',
        'meetings': 'Meetings',
        'layouts': 'Layouts',
        'settings': 'Settings',
        'finance': 'Beranda',
        'cash-bank': 'Kas & Bank',
        'kas-bank': 'Kas & Bank',
        'chart-of-accounts': 'Akun Perkiraan',
        'akun-perkiraan': 'Akun Perkiraan',
        'hr': 'HR Overview',
        'crm': 'CRM Overview',
        'roles-permissions': 'Roles & Permissions',
        'user-management': 'User Management',
        'activity-log': 'Activity Log',
        'account-settings': 'Account Settings',
        'file-manager': 'File Manager'
      }
      initialSection = topLevelRouteMap[rawSlug] || 'Dashboard'
    }
  }

  return <AuthWrapper initialSection={initialSection} slug={resolvedParams.slug} serverUser={fullUser} />
}
