import { headers } from "next/headers";
import { auth } from "./auth";
import prisma from "@/lib/prisma";

export async function getUserSession() {
  try {
    const hdrs = new Headers(await headers());
    console.log("getUserSession headers:", Object.fromEntries(hdrs.entries()));
    const session = await auth.api.getSession({
      headers: hdrs,
    });
    
    if (!session || !session.user) {
      console.log("getUserSession: No session or session.user", session);
      return null;
    }
    
    const dbUser = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      include: {
        role: {
          include: {
            permissions: true
          }
        }
      }
    });
    
    if (dbUser?.status === 'resign') {
      return null;
    }
    
    return dbUser;
  } catch (error) {
    console.error("getUserSession error:", error);
    return null;
  }
}

export async function requireAuth() {
  const user = await getUserSession();
  if (!user) {
    console.error("requireAuth failed: user is null");
    throw new Error("Unauthorized");
  }
  return user;
}
  

export function hasPermission(user: any, permissionName: string): boolean {
  if (user.type === 1) return true;
  if (!user.role || !user.role.permissions) return false;
  return user.role.permissions.some((p: any) => p.permission === permissionName);
}

export function requirePermission(user: any, permissionName: string) {
  if (!hasPermission(user, permissionName)) {
    throw new Error(`Forbidden: Missing permission ${permissionName}`);
  }
}

export async function canAccessProject(user: any, projectId: number, accessLevel: 'viewer' | 'editor' | 'manager' = 'viewer'): Promise<boolean> {
  const project = await prisma.project_list.findUnique({ 
    where: { id: projectId },
    include: { members: true }
  });
  if (!project) return false;

  // Manager has full access
  if (project.manager_id === user.id) return true;

  // Global Admin fallback (if they have the global permission, they can access it)
  // We check if the user has a global 'projects.manage_all' or similar, but for now let's rely on explicit membership
  if (hasPermission(user, 'projects.update') && accessLevel === 'editor') return true;
  if (hasPermission(user, 'projects.view') && accessLevel === 'viewer') return true;

  // Member checking
  const isMember = project.members.some(m => m.user_id === user.id);
  
  if (isMember) {
    // Members can view. Depending on business rules, maybe they can also edit.
    // Let's assume members can view, and edit if they have global 'projects.update'
    if (accessLevel === 'viewer') return true;
    if (accessLevel === 'editor' && hasPermission(user, 'projects.update')) return true;
  }

  return false;
}

export async function canAccessTask(user: any, taskId: number, accessLevel: 'viewer' | 'editor' | 'manager' = 'viewer'): Promise<boolean> {
  const task = await prisma.task_list.findUnique({ 
    where: { id: taskId },
    include: { assignees: true }
  });
  if (!task) return false;

  // Creator has full access
  if (task.created_by === user.id) return true;

  // Assignee checking
  const isAssignee = task.assignees.some(a => a.user_id === user.id);
    
  if (isAssignee) return true; // Assignees usually can view and edit their own tasks

  // Fallback to project access
  return canAccessProject(user, task.project_id, accessLevel);
}

export async function canAccessFile(user: any, fileId: number, accessLevel: 'viewer' | 'editor' | 'manager' = 'viewer'): Promise<boolean> {
  const file = await prisma.file.findUnique({ 
    where: { id: fileId },
    include: { shares: true }
  });
  
  if (!file) return false;
  if (file.owner_id === user.id) return true;

  const share = file.shares.find(s => s.shared_with_user_id === user.id);
  if (!share) return false;

  if (accessLevel === 'viewer') return true; // Any share implies view access
  if (accessLevel === 'editor' && (share.permission === 'editor' || share.permission === 'manager')) return true;
  if (accessLevel === 'manager' && share.permission === 'manager') return true;

  return false;
}

export async function canAccessFolder(user: any, folderId: number, accessLevel: 'viewer' | 'editor' | 'manager' = 'viewer'): Promise<boolean> {
  const folder = await prisma.folder.findUnique({ 
    where: { id: folderId },
    include: { shares: true }
  });
  
  if (!folder) return false;
  if (folder.owner_id === user.id) return true;

  const share = folder.shares.find(s => s.shared_with_user_id === user.id);
  if (!share) return false;

  if (accessLevel === 'viewer') return true;
  if (accessLevel === 'editor' && (share.permission === 'editor' || share.permission === 'manager')) return true;
  if (accessLevel === 'manager' && share.permission === 'manager') return true;

  return false;
}
