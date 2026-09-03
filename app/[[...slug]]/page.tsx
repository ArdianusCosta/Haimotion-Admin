import { AuthWrapper } from '@/components/auth-wrapper'

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const resolvedParams = await params
  // Convert slug back to section name (e.g., ['user-management'] -> 'User Management')
  const rawSlug = resolvedParams.slug?.[0] || ''
  
  let initialSection = 'Dashboard'
  if (rawSlug) {
    // Map URL slug back to section label
    // e.g. "user-management" -> "User Management", "roles-permissions" -> "Roles & Permissions"
    initialSection = rawSlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      
    // Handle special cases
    if (initialSection === 'Roles And Permissions') initialSection = 'Roles & Permissions'
    if (initialSection === 'Roles Permissions') initialSection = 'Roles & Permissions'
  }

  return <AuthWrapper initialSection={initialSection} />
}
