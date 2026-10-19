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
      const fullSubRoute = resolvedParams.slug.slice(1).join('/')
      initialSection = financeRouteMap[fullSubRoute] || financeRouteMap[subRoute] || 'Beranda'
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
    } else if (resolvedParams.slug[0] === 'crm' && resolvedParams.slug.length > 1) {
      const subRoute = resolvedParams.slug[1]
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
        'ai-assistant': 'AI Assistant',
        'project': 'Project',
        'kanban': 'Kanban',
        'tasks': 'Tasks',
        'calendar': 'Calendar',
        'meetings': 'Meetings',
        'layouts': 'Layouts',
        'settings': 'Settings',
        'finance': 'Beranda',
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
