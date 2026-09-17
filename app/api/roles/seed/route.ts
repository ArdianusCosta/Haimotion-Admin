import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const defaultPermissions = [
  { id: 'projects.view', category: 'Projects', name: 'View Projects', description: 'Can view projects' },
  { id: 'projects.create', category: 'Projects', name: 'Create Projects', description: 'Can create new projects' },
  { id: 'projects.update', category: 'Projects', name: 'Update Projects', description: 'Can edit existing projects' },
  { id: 'projects.delete', category: 'Projects', name: 'Delete Projects', description: 'Can delete projects' },
  { id: 'projects.archive', category: 'Projects', name: 'Archive Projects', description: 'Can archive projects' },
  { id: 'projects.manage_members', category: 'Projects', name: 'Manage Members', description: 'Can add/remove members from projects' },
  { id: 'tasks.view', category: 'Tasks', name: 'View Tasks', description: 'Can view tasks' },
  { id: 'tasks.create', category: 'Tasks', name: 'Create Tasks', description: 'Can create new tasks' },
  { id: 'tasks.update', category: 'Tasks', name: 'Update Tasks', description: 'Can edit tasks' },
  { id: 'tasks.delete', category: 'Tasks', name: 'Delete Tasks', description: 'Can delete tasks' },
  { id: 'calendar.view', category: 'Calendar', name: 'View Calendar', description: 'Can view calendar events' },
  { id: 'calendar.create', category: 'Calendar', name: 'Create Events', description: 'Can create events' },
  { id: 'calendar.update', category: 'Calendar', name: 'Update Events', description: 'Can edit events' },
  { id: 'calendar.delete', category: 'Calendar', name: 'Delete Events', description: 'Can delete events' },
  { id: 'files.view', category: 'Files', name: 'View Files', description: 'Can view files and folders' },
  { id: 'files.upload', category: 'Files', name: 'Upload Files', description: 'Can upload new files' },
  { id: 'files.update', category: 'Files', name: 'Update Files', description: 'Can rename and star files' },
  { id: 'files.delete', category: 'Files', name: 'Delete Files', description: 'Can delete files' },
  { id: 'files.download', category: 'Files', name: 'Download Files', description: 'Can download files' },
  { id: 'files.share', category: 'Files', name: 'Share Files', description: 'Can share files with others' },
  { id: 'folders.view', category: 'Folders', name: 'View Folders', description: 'Can view folders' },
  { id: 'folders.create', category: 'Folders', name: 'Create Folders', description: 'Can create folders' },
  { id: 'folders.update', category: 'Folders', name: 'Update Folders', description: 'Can rename folders' },
  { id: 'folders.delete', category: 'Folders', name: 'Delete Folders', description: 'Can delete folders' },
  { id: 'chat.view', category: 'Chat', name: 'View Chats', description: 'Can view chat messages and groups' },
  { id: 'chat.create', category: 'Chat', name: 'Send Messages', description: 'Can send messages in chat' },
  { id: 'chat.call', category: 'Chat', name: 'Start Calls', description: 'Can start voice/video calls' },
  { id: 'ai_chat.view', category: 'AI Assistant', name: 'View AI Chats', description: 'Can view AI chat history' },
  { id: 'ai_chat.create', category: 'AI Assistant', name: 'Chat with AI', description: 'Can send messages to AI' },
  { id: 'ai_chat.update', category: 'AI Assistant', name: 'Update AI Chats', description: 'Can rename AI chat threads' },
  { id: 'ai_chat.delete', category: 'AI Assistant', name: 'Delete AI Chats', description: 'Can delete AI chat threads' },
  { id: 'users.view', category: 'User Management', name: 'View Users', description: 'Can view user directory' },
  { id: 'users.create', category: 'User Management', name: 'Invite Users', description: 'Can invite new users' },
  { id: 'users.update', category: 'User Management', name: 'Edit Users', description: 'Can edit user details' },
  { id: 'users.delete', category: 'User Management', name: 'Delete Users', description: 'Can delete users' },
  { id: 'roles.view', category: 'Roles & Permissions', name: 'View Roles', description: 'Can view roles and permissions' },
  { id: 'roles.create', category: 'Roles & Permissions', name: 'Create Roles', description: 'Can create custom roles' },
  { id: 'roles.update', category: 'Roles & Permissions', name: 'Update Roles', description: 'Can edit roles' },
  { id: 'roles.delete', category: 'Roles & Permissions', name: 'Delete Roles', description: 'Can delete roles' },
  { id: 'roles.manage_permissions', category: 'Roles & Permissions', name: 'Manage Permissions', description: 'Can modify permissions assigned to roles' },
];

export async function GET() {
  try {
    // 1. Seed SystemPermissions
    for (const perm of defaultPermissions) {
      await prisma.systemPermission.upsert({
        where: { id: perm.id },
        update: { category: perm.category, name: perm.name, description: perm.description },
        create: perm,
      });
    }

    // 2. Ensure Default Roles Exist
    const adminRole = await prisma.role.upsert({
      where: { name: 'Administrator' },
      update: {},
      create: { name: 'Administrator', description: 'Full access to all system features and settings.' },
    });

    await prisma.role.upsert({
      where: { name: 'Developer' },
      update: {},
      create: { name: 'Developer', description: 'Can manage modules, flows, and API endpoints.' },
    });

    await prisma.role.upsert({
      where: { name: 'Editor' },
      update: {},
      create: { name: 'Editor', description: 'Can edit content but cannot manage users or settings.' },
    });

    await prisma.role.upsert({
      where: { name: 'Viewer' },
      update: {},
      create: { name: 'Viewer', description: 'Read-only access to specific project data.' },
    });

    // 3. Assign all permissions to Administrator
    const existingAdminPerms = await prisma.rolePermission.findMany({
      where: { role_id: adminRole.id }
    });
    
    const existingPermIds = new Set(existingAdminPerms.map(p => p.permission));

    const permsToAssign = defaultPermissions.filter(p => !existingPermIds.has(p.id));

    if (permsToAssign.length > 0) {
      await prisma.rolePermission.createMany({
        data: permsToAssign.map(p => ({
          role_id: adminRole.id,
          permission: p.id
        }))
      });
    }

    return NextResponse.json({ success: true, message: 'Database seeded successfully' });
  } catch (error: any) {
    console.error('Seeding error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
