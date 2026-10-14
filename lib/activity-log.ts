import prisma from "@/lib/prisma"
import { headers } from "next/headers"

export async function logActivity({
  userId,
  activityType,
  description,
  projectId,
  taskId
}: {
  userId: number | string,
  activityType: string,
  description: string,
  projectId?: number | string | null,
  taskId?: number | string | null
}) {
  try {
    const parsedUserId = typeof userId === 'number' ? userId : parseInt(String(userId), 10);
    if (isNaN(parsedUserId) || !parsedUserId) {
      console.warn("Invalid userId provided to logActivity:", userId);
      return;
    }

    const parsedProjectId = projectId ? (typeof projectId === 'number' ? projectId : parseInt(String(projectId), 10)) : null;
    const parsedTaskId = taskId ? (typeof taskId === 'number' ? taskId : parseInt(String(taskId), 10)) : null;

    let ipAddress = null
    let userAgent = null
    
    try {
      const headersList = await headers()
      const forwardedFor = headersList.get('x-forwarded-for')
      const realIp = headersList.get('x-real-ip')
      ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : (realIp || '127.0.0.1')
      userAgent = headersList.get('user-agent') || 'Unknown'
    } catch (e) {
      // headers() might fail if not called within request context
      console.warn("Could not get headers for activity log", e)
    }

    await prisma.activity_log.create({
      data: {
        user_id: parsedUserId,
        activity_type: activityType,
        description,
        project_id: parsedProjectId && !isNaN(parsedProjectId) ? parsedProjectId : null,
        task_id: parsedTaskId && !isNaN(parsedTaskId) ? parsedTaskId : null,
        ip_address: ipAddress,
        user_agent: userAgent
      }
    })
  } catch (error) {
    console.error("Failed to log activity:", error)
  }
}
