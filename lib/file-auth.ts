import prisma from '@/lib/prisma'

export type PermissionLevel = 'viewer' | 'editor' | 'manager'

const PERMISSION_WEIGHT = {
  'viewer': 1,
  'editor': 2,
  'manager': 3
}

export async function checkAccess(
  userId: number,
  itemId: number,
  itemType: 'file' | 'folder',
  requiredPermission: PermissionLevel = 'viewer'
): Promise<boolean> {
  const reqWeight = PERMISSION_WEIGHT[requiredPermission];

  if (itemType === 'file') {
    const file = await prisma.file.findUnique({
      where: { id: itemId },
      include: {
        shares: { where: { shared_with_user_id: userId } }
      }
    });

    if (!file) return false;
    
    // Owner has full access
    if (file.owner_id === userId) return true;

    // Check direct file share
    if (file.shares.length > 0) {
       const userPerm = file.shares[0].permission as PermissionLevel;
       if (PERMISSION_WEIGHT[userPerm] >= reqWeight) return true;
    }

    // Check inherited folder access if file is in a folder
    if (file.folder_id) {
       return await checkFolderAccess(userId, file.folder_id, requiredPermission);
    }
  } else if (itemType === 'folder') {
    return await checkFolderAccess(userId, itemId, requiredPermission);
  }

  return false;
}

// Helper to check folder access, walking up the tree if necessary
export async function checkFolderAccess(
  userId: number,
  folderId: number,
  requiredPermission: PermissionLevel
): Promise<boolean> {
  let currentFolderId: number | null = folderId;
  const reqWeight = PERMISSION_WEIGHT[requiredPermission];

  while (currentFolderId) {
    const folder = await prisma.folder.findUnique({
      where: { id: currentFolderId },
      include: {
        shares: { where: { shared_with_user_id: userId } }
      }
    });

    if (!folder) return false;

    // Owner has full access
    if (folder.owner_id === userId) return true;

    // Check direct folder share
    if (folder.shares.length > 0) {
       const userPerm = folder.shares[0].permission as PermissionLevel;
       if (PERMISSION_WEIGHT[userPerm] >= reqWeight) return true;
    }

    // Traverse upwards
    currentFolderId = folder.parent_id;
  }

  return false;
}

export async function getUserPermission(
  userId: number,
  itemId: number,
  itemType: 'file' | 'folder'
): Promise<'owner' | PermissionLevel | null> {
  if (itemType === 'file') {
    const file = await prisma.file.findUnique({
      where: { id: itemId },
      include: { shares: { where: { shared_with_user_id: userId } } }
    });
    if (!file) return null;
    if (file.owner_id === userId) return 'owner';
    
    let highestPermWeight = 0;
    let highestPerm: PermissionLevel | null = null;
    
    if (file.shares.length > 0) {
      const p = file.shares[0].permission as PermissionLevel;
      highestPermWeight = PERMISSION_WEIGHT[p];
      highestPerm = p;
    }
    
    if (file.folder_id) {
      const folderPerm = await getFolderPermission(userId, file.folder_id);
      if (folderPerm === 'owner') return 'owner';
      if (folderPerm && PERMISSION_WEIGHT[folderPerm as PermissionLevel] > highestPermWeight) {
        return folderPerm as PermissionLevel;
      }
    }
    return highestPerm;
  } else {
    return getFolderPermission(userId, itemId);
  }
}

async function getFolderPermission(
  userId: number,
  folderId: number
): Promise<'owner' | PermissionLevel | null> {
  let currentFolderId: number | null = folderId;
  let highestPermWeight = 0;
  let highestPerm: PermissionLevel | null = null;

  while (currentFolderId) {
    const folder = await prisma.folder.findUnique({
      where: { id: currentFolderId },
      include: { shares: { where: { shared_with_user_id: userId } } }
    });
    if (!folder) break;
    if (folder.owner_id === userId) return 'owner';

    if (folder.shares.length > 0) {
      const p = folder.shares[0].permission as PermissionLevel;
      if (PERMISSION_WEIGHT[p] > highestPermWeight) {
        highestPermWeight = PERMISSION_WEIGHT[p];
        highestPerm = p;
      }
    }
    currentFolderId = folder.parent_id;
  }
  return highestPerm;
}
