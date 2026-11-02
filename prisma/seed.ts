/**
 * HaiMotion Admin - Prisma Seed Script
 * 
 * Jalankan dengan:
 *   npx tsx prisma/seed.ts
 * 
 * Atau setelah MySQL aktif, kunjungi:
 *   http://localhost:3000/api/roles/seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const defaultPermissions = [
  // Dashboard
  { id: 'dashboard.view', category: 'Dashboard', name: 'View Dashboard', description: 'Can view dashboard and analytics' },
  { id: 'dashboard.export', category: 'Dashboard', name: 'Export Dashboard', description: 'Can export dashboard data and reports' },
  // Projects
  { id: 'projects.view', category: 'Projects', name: 'View Projects', description: 'Can view projects' },
  { id: 'projects.create', category: 'Projects', name: 'Create Projects', description: 'Can create new projects' },
  { id: 'projects.update', category: 'Projects', name: 'Update Projects', description: 'Can edit existing projects' },
  { id: 'projects.delete', category: 'Projects', name: 'Delete Projects', description: 'Can delete projects' },
  { id: 'projects.archive', category: 'Projects', name: 'Archive Projects', description: 'Can archive projects' },
  { id: 'projects.manage_members', category: 'Projects', name: 'Manage Members', description: 'Can add/remove members from projects' },
  // Tasks
  { id: 'tasks.view', category: 'Tasks', name: 'View Tasks', description: 'Can view tasks' },
  { id: 'tasks.create', category: 'Tasks', name: 'Create Tasks', description: 'Can create new tasks' },
  { id: 'tasks.update', category: 'Tasks', name: 'Update Tasks', description: 'Can edit tasks' },
  { id: 'tasks.delete', category: 'Tasks', name: 'Delete Tasks', description: 'Can delete tasks' },
  // Calendar
  { id: 'calendar.view', category: 'Calendar', name: 'View Calendar', description: 'Can view calendar events' },
  { id: 'calendar.create', category: 'Calendar', name: 'Create Events', description: 'Can create events' },
  { id: 'calendar.update', category: 'Calendar', name: 'Update Events', description: 'Can edit events' },
  { id: 'calendar.delete', category: 'Calendar', name: 'Delete Events', description: 'Can delete events' },
  // Files
  { id: 'files.view', category: 'Files', name: 'View Files', description: 'Can view files and folders' },
  { id: 'files.upload', category: 'Files', name: 'Upload Files', description: 'Can upload new files' },
  { id: 'files.update', category: 'Files', name: 'Update Files', description: 'Can rename and star files' },
  { id: 'files.delete', category: 'Files', name: 'Delete Files', description: 'Can delete files' },
  { id: 'files.download', category: 'Files', name: 'Download Files', description: 'Can download files' },
  { id: 'files.share', category: 'Files', name: 'Share Files', description: 'Can share files with others' },
  // Folders
  { id: 'folders.view', category: 'Folders', name: 'View Folders', description: 'Can view folders' },
  { id: 'folders.create', category: 'Folders', name: 'Create Folders', description: 'Can create folders' },
  { id: 'folders.update', category: 'Folders', name: 'Update Folders', description: 'Can rename folders' },
  { id: 'folders.delete', category: 'Folders', name: 'Delete Folders', description: 'Can delete folders' },
  // Chat
  { id: 'chat.view', category: 'Chat', name: 'View Chats', description: 'Can view chat messages and groups' },
  { id: 'chat.create', category: 'Chat', name: 'Send Messages', description: 'Can send messages in chat' },
  { id: 'chat.call', category: 'Chat', name: 'Start Calls', description: 'Can start voice/video calls' },
  // AI Assistant
  { id: 'ai_chat.view', category: 'AI Assistant', name: 'View AI Chats', description: 'Can view AI chat history' },
  { id: 'ai_chat.create', category: 'AI Assistant', name: 'Chat with AI', description: 'Can send messages to AI' },
  { id: 'ai_chat.update', category: 'AI Assistant', name: 'Update AI Chats', description: 'Can rename AI chat threads' },
  { id: 'ai_chat.delete', category: 'AI Assistant', name: 'Delete AI Chats', description: 'Can delete AI chat threads' },
  // User Management
  { id: 'users.view', category: 'User Management', name: 'View Users', description: 'Can view user directory' },
  { id: 'users.create', category: 'User Management', name: 'Invite Users', description: 'Can invite new users' },
  { id: 'users.update', category: 'User Management', name: 'Edit Users', description: 'Can edit user details' },
  { id: 'users.delete', category: 'User Management', name: 'Delete Users', description: 'Can delete users' },
  // Roles & Permissions
  { id: 'roles.view', category: 'Roles & Permissions', name: 'View Roles', description: 'Can view roles and permissions' },
  { id: 'roles.create', category: 'Roles & Permissions', name: 'Create Roles', description: 'Can create custom roles' },
  { id: 'roles.update', category: 'Roles & Permissions', name: 'Update Roles', description: 'Can edit roles' },
  { id: 'roles.delete', category: 'Roles & Permissions', name: 'Delete Roles', description: 'Can delete roles' },
  { id: 'roles.manage_permissions', category: 'Roles & Permissions', name: 'Manage Permissions', description: 'Can modify permissions assigned to roles' },
  // CRM
  { id: 'crm.view', category: 'CRM', name: 'View CRM', description: 'Can view CRM leads, clients, deals, and reports' },
  { id: 'crm.create', category: 'CRM', name: 'Create CRM Records', description: 'Can create new leads, clients, deals, and follow-ups' },
  { id: 'crm.update', category: 'CRM', name: 'Update CRM Records', description: 'Can edit CRM records, stages, and status' },
  { id: 'crm.delete', category: 'CRM', name: 'Delete CRM Records', description: 'Can delete CRM leads, clients, deals, and follow-ups' },
  // Human Resources
  { id: 'hr.view', category: 'Human Resources', name: 'View HR', description: 'Can view HR overview, employees, attendance, and payroll' },
  { id: 'hr.create', category: 'Human Resources', name: 'Create HR Records', description: 'Can create attendance, leave requests, and payroll entries' },
  { id: 'hr.update', category: 'Human Resources', name: 'Update HR Records', description: 'Can edit HR records, approve leave, and update payroll status' },
  { id: 'hr.delete', category: 'Human Resources', name: 'Delete HR Records', description: 'Can delete attendance, leave requests, and payroll entries' },
  { id: 'hr.export', category: 'Human Resources', name: 'Export HR Data', description: 'Can export payroll and attendance data' },
  // Finance
  { id: 'finance.view', category: 'Finance', name: 'View Finance', description: 'Can view finance overview, invoices, expenses, and reports' },
  { id: 'finance.create', category: 'Finance', name: 'Create Finance Records', description: 'Can create invoices, expenses, transactions, and budgets' },
  { id: 'finance.update', category: 'Finance', name: 'Update Finance Records', description: 'Can edit invoices, expenses, and record payments' },
  { id: 'finance.delete', category: 'Finance', name: 'Delete Finance Records', description: 'Can delete invoices, expenses, and transactions' },
  { id: 'finance.export', category: 'Finance', name: 'Export Finance Data', description: 'Can export invoices, expenses, and financial reports' },
  // Meetings
  { id: 'meetings.view', category: 'Meetings', name: 'View Meetings', description: 'Can view scheduled meetings and meeting details' },
  { id: 'meetings.create', category: 'Meetings', name: 'Create Meetings', description: 'Can schedule new meetings and invite participants' },
  { id: 'meetings.update', category: 'Meetings', name: 'Update Meetings', description: 'Can edit meeting details and manage participants' },
  { id: 'meetings.delete', category: 'Meetings', name: 'Delete Meetings', description: 'Can cancel and delete meetings' },
  // Activity Log
  { id: 'activity_log.view', category: 'Activity Log', name: 'View Activity Log', description: 'Can view system activity logs' },
  { id: 'activity_log.export', category: 'Activity Log', name: 'Export Activity Log', description: 'Can export activity log data' },
  // Settings
  { id: 'settings.view', category: 'Settings', name: 'View Settings', description: 'Can view workspace settings' },
  { id: 'settings.update', category: 'Settings', name: 'Update Settings', description: 'Can edit workspace settings' },
];

async function main() {
  console.log('🌱 Seeding HaiMotion Admin database...\n');

  // 1. Seed SystemPermissions
  console.log('📋 Seeding system permissions...');
  for (const perm of defaultPermissions) {
    await prisma.systemPermission.upsert({
      where: { id: perm.id },
      update: { category: perm.category, name: perm.name, description: perm.description },
      create: perm,
    });
  }
  console.log(`✅ ${defaultPermissions.length} permissions seeded.`);

  // 2. Create Default Roles
  console.log('\n👥 Creating default roles...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'Administrator' },
    update: {},
    create: { name: 'Administrator', description: 'Full access to all system features and settings.' },
  });
  console.log(`   ✅ Administrator (id: ${adminRole.id})`);

  await prisma.role.upsert({
    where: { name: 'Developer' },
    update: {},
    create: { name: 'Developer', description: 'Can manage modules, flows, and API endpoints.' },
  });
  console.log('   ✅ Developer');

  await prisma.role.upsert({
    where: { name: 'Editor' },
    update: {},
    create: { name: 'Editor', description: 'Can edit content but cannot manage users or settings.' },
  });
  console.log('   ✅ Editor');

  await prisma.role.upsert({
    where: { name: 'Viewer' },
    update: {},
    create: { name: 'Viewer', description: 'Read-only access to specific project data.' },
  });
  console.log('   ✅ Viewer');

  await prisma.role.upsert({
    where: { name: 'Staff' },
    update: {},
    create: { name: 'Staff', description: 'Standard staff access for day-to-day operations.' },
  });
  console.log('   ✅ Staff');

  // 3. Assign ALL permissions to Administrator
  console.log('\n🔐 Assigning all permissions to Administrator...');
  await prisma.rolePermission.deleteMany({ where: { role_id: adminRole.id } });
  await prisma.rolePermission.createMany({
    data: defaultPermissions.map(p => ({ role_id: adminRole.id, permission: p.id }))
  });
  console.log(`✅ ${defaultPermissions.length} permissions assigned to Administrator.`);

  // 4. Create Admin user account
  console.log('\n👤 Creating/updating admin user...');
  const adminEmail = 'admin@haimotion.com';
  const hashedPassword = await bcrypt.hash('Admin@123', 12);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role_id: adminRole.id, status: 'active' },
    create: {
      email: adminEmail,
      firstname: 'Admin',
      lastname: 'HaiMotion',
      name: 'Admin HaiMotion',
      password: hashedPassword,
      avatar: '',
      status: 'active',
      role_id: adminRole.id,
    }
  });
  console.log(`✅ Admin user: ${adminEmail} (id: ${adminUser.id})`);

  // 5. Assign first existing user to Administrator role
  const firstUser = await prisma.user.findFirst({
    where: { status: { not: 'resign' } },
    orderBy: { id: 'asc' },
  });

  if (firstUser && firstUser.id !== adminUser.id) {
    await prisma.user.update({
      where: { id: firstUser.id },
      data: { role_id: adminRole.id }
    });
    console.log(`✅ User pertama (${firstUser.email}) di-assign ke role Administrator.`);
  }

  console.log('\n🎉 Seeding selesai!');
  console.log('\n📝 Kredensial Admin:');
  console.log(`   Email    : ${adminEmail}`);
  console.log('   Password : Admin@123');
  console.log('\n💡 Ganti password setelah login pertama!');
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error('❌ Seeding error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
