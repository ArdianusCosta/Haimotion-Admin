import { AuthWrapper } from '@/components/auth-wrapper'
import { getUserSession } from '@/lib/auth/authorization'

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const resolvedParams = await params
  // Convert slug back to section name (e.g., ['user-management'] -> 'User Management')
  const rawSlug = resolvedParams.slug?.[0] || ''
  const fullUser = await getUserSession()
  
  let initialSection = 'Dashboard'
  if (resolvedParams.slug && resolvedParams.slug.length > 0) {
    if (resolvedParams.slug[0] === 'finance' && resolvedParams.slug.length > 1) {
      const subRoute = resolvedParams.slug[1]
      // Special mappings for finance nested routes
      const financeRouteMap: Record<string, string> = {
        'overview': 'Beranda',
        'chart-of-accounts': 'Akun Perkiraan',
        'sales': 'Penjualan',
        'sales/penawaran': 'Penawaran Penjualan',
        'sales/uang-muka': 'Uang Muka Penjualan',
        'sales/faktur': 'Faktur Penjualan',
        'sales/penerimaan': 'Penerimaan Penjualan',
        'sales/pelanggan': 'Pelanggan',
        'purchases': 'Pembelian',
        'purchases/pesanan': 'Pesanan Pembelian',
        'purchases/faktur': 'Faktur Pembelian',
        'purchases/uang-muka': 'Uang Muka Pembelian',
        'purchases/pembayaran': 'Pembayaran Pembelian',
        'purchases/pemasok': 'Pemasok',
        'products-services': 'Barang & Jasa',
        'employees': 'Karyawan',
        'general-ledger': 'Buku Besar'
      }
      initialSection = financeRouteMap[subRoute] || 'Beranda'
    } else if (resolvedParams.slug[0] === 'hr' && resolvedParams.slug.length > 1) {
      const subRoute = resolvedParams.slug[1]
      // Special mappings for hr nested routes
      const hrRouteMap: Record<string, string> = {
        'overview': 'HR Overview',
        'employees': 'Employees',
        'attendance': 'Attendance & Leave',
        'payroll': 'Payroll',
        'recruitment': 'Recruitment'
      }
      initialSection = hrRouteMap[subRoute] || 'HR Overview'
    } else {
      const rawSlug = resolvedParams.slug[0]
      initialSection = rawSlug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        
      if (initialSection === 'Roles And Permissions' || initialSection === 'Roles Permissions') {
        initialSection = 'Roles & Permissions'
      }
      if (rawSlug === 'ai-assistant') {
        initialSection = 'AI Assistant'
      }
      if (rawSlug === 'finance') {
        initialSection = 'Beranda'
      }
      if (rawSlug === 'hr') {
        initialSection = 'HR Overview'
      }
    }
  }

  return <AuthWrapper initialSection={initialSection} slug={resolvedParams.slug} serverUser={fullUser} />
}
