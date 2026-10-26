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

        // Penjualan / Sales (Parent)
        'sales': 'Penjualan',
        'penjualan': 'Penjualan',

        // Penjualan Sub-items
        'sales/penawaran': 'Penawaran Penjualan',
        'penawaran': 'Penawaran Penjualan',
        'penawaran-penjualan': 'Penawaran Penjualan',
        'sales/quote': 'Penawaran Penjualan',
        'sales/quotation': 'Penawaran Penjualan',
        'quotation': 'Penawaran Penjualan',

        'sales/uang-muka': 'Uang Muka Penjualan',
        'uang-muka': 'Uang Muka Penjualan',
        'uang-muka-penjualan': 'Uang Muka Penjualan',
        'sales/down-payment': 'Uang Muka Penjualan',
        'down-payment': 'Uang Muka Penjualan',

        'sales/faktur': 'Faktur Penjualan',
        'faktur-penjualan': 'Faktur Penjualan',
        'sales/invoice': 'Faktur Penjualan',
        'sales/invoices': 'Faktur Penjualan',

        'sales/penerimaan': 'Penerimaan Penjualan',
        'penerimaan-penjualan': 'Penerimaan Penjualan',
        'sales/receipt': 'Penerimaan Penjualan',
        'sales/receipts': 'Penerimaan Penjualan',

        'sales/pelanggan': 'Pelanggan',
        'pelanggan': 'Pelanggan',
        'sales/customers': 'Pelanggan',
        'customers': 'Pelanggan',

        // Pembelian / Purchases (Parent)
        'purchases': 'Pembelian',
        'pembelian': 'Pembelian',

        // Pembelian Sub-items
        'purchases/pesanan': 'Pesanan Pembelian',
        'pesanan': 'Pesanan Pembelian',
        'pesanan-pembelian': 'Pesanan Pembelian',
        'purchases/order': 'Pesanan Pembelian',
        'purchases/orders': 'Pesanan Pembelian',

        'purchases/faktur': 'Faktur Pembelian',
        'faktur-pembelian': 'Faktur Pembelian',
        'purchases/invoice': 'Faktur Pembelian',
        'purchases/invoices': 'Faktur Pembelian',

        'purchases/uang-muka': 'Uang Muka Pembelian',
        'uang-muka-pembelian': 'Uang Muka Pembelian',
        'purchases/down-payment': 'Uang Muka Pembelian',

        'purchases/pembayaran': 'Pembayaran Pembelian',
        'pembayaran': 'Pembayaran Pembelian',
        'pembayaran-pembelian': 'Pembayaran Pembelian',
        'purchases/payment': 'Pembayaran Pembelian',
        'purchases/payments': 'Pembayaran Pembelian',

        'purchases/pemasok': 'Pemasok',
        'pemasok': 'Pemasok',
        'purchases/suppliers': 'Pemasok',
        'suppliers': 'Pemasok',

        // Barang & Jasa / Products & Services
        'products-services': 'Barang & Jasa',
        'barang-jasa': 'Barang & Jasa',
        'products': 'Barang & Jasa',
        'services': 'Barang & Jasa',

        // Karyawan / Employees
        'employees': 'Karyawan',
        'karyawan': 'Karyawan',

        // Buku Besar / General Ledger
        'general-ledger': 'Buku Besar',
        'buku-besar': 'Buku Besar',
        'ledger': 'Buku Besar',

        // Extra Finance Pages
        'invoices': 'Invoices',
        'expenses': 'Expenses',
        'reports': 'Reports'
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
        'account-settings': 'Account Settings'
      }
      initialSection = topLevelRouteMap[rawSlug] || 'Dashboard'
    }
  }

  return <AuthWrapper initialSection={initialSection} slug={resolvedParams.slug} serverUser={fullUser} />
}
