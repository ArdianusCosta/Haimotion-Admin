import prisma from "@/lib/prisma"
import { headers } from "next/headers"

export async function logActivity({
  userId,
  activityType,
  description,
  projectId,
  taskId
}: {
  userId: number,
  activityType: string,
  description: string,
  projectId?: number,
  taskId?: number
}) {
  try {
    let ipAddress = null
    let userAgent = null
    
    try {
      const headersList = await headers()
      const forwardedFor = headersList.get('x-forwarded-for')
      const realIp = headersList.get('x-real-ip')
      ipAddress = forwardedFor ? forwardedFor.split(',')[0] : (realIp || '127.0.0.1')
      userAgent = headersList.get('user-agent') || 'Unknown'
    } catch (e) {
      // headers() might fail if not called within request context
      console.warn("Could not get headers for activity log", e)
    }

    await prisma.activity_log.create({
      data: {
        user_id: userId,
        activity_type: activityType,
        description,
        project_id: projectId,
        task_id: taskId,
        ip_address: ipAddress,
        user_agent: userAgent
      }
    })
  } catch (error) {
    console.error("Failed to log activity:", error)
  }
}
