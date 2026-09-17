const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: 'Administrator' },
    update: {},
    create: {
      name: 'Administrator',
      description: 'Full access to all system features and settings.',
    }
  });

  const staffRole = await prisma.role.upsert({
    where: { name: 'Staff' },
    update: {},
    create: {
      name: 'Staff',
      description: 'Standard access to projects and tasks.',
    }
  });

  // Assign roles based on user.type (1 = Admin, 2 = Staff)
  await prisma.user.updateMany({
    where: { type: 1 },
    data: { role_id: adminRole.id }
  });

  await prisma.user.updateMany({
    where: { type: 2 },
    data: { role_id: staffRole.id }
  });

  // Assign basic permissions to Admin
  const adminPerms = [
    'projects.create', 'projects.update', 'projects.delete', 'projects.view',
    'tasks.create', 'tasks.update', 'tasks.delete', 'tasks.view',
    'users.create', 'users.update', 'users.delete', 'users.view',
    'roles.create', 'roles.update', 'roles.delete', 'roles.view',
    'files.create', 'files.update', 'files.delete', 'files.view'
  ];

  for (const p of adminPerms) {
    await prisma.rolePermission.upsert({
      where: { role_id_permission: { role_id: adminRole.id, permission: p } },
      update: {},
      create: { role_id: adminRole.id, permission: p }
    });
  }

  // Assign basic permissions to Staff
  const staffPerms = [
    'projects.view', 'tasks.create', 'tasks.update', 'tasks.view', 'files.create', 'files.update', 'files.view', 'users.view'
  ];

  for (const p of staffPerms) {
    await prisma.rolePermission.upsert({
      where: { role_id_permission: { role_id: staffRole.id, permission: p } },
      update: {},
      create: { role_id: staffRole.id, permission: p }
    });
  }

  console.log('Roles seeded successfully.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
