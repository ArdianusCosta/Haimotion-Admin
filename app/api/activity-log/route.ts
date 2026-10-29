import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth/authorization";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch logs, include user details
    const logs = await prisma.activity_log.findMany({
      orderBy: { created_at: 'desc' },
      take: 1000 // Limit to recent logs
    });
    
    // Manual join to User table since schema might not have relations defined for activity_log
    const userIds = Array.from(new Set(logs.map(log => Number(log.user_id)).filter(id => !isNaN(id) && id > 0)));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds }, status: { not: 'resign' } },
      select: { id: true, firstname: true, lastname: true, name: true, email: true, avatar: true }
    });
    const userMap = new Map(users.map(u => [Number(u.id), u]));

    const enrichedLogs = logs.map(log => ({
      ...log,
      user: userMap.get(Number(log.user_id)) || null
    }));

    return NextResponse.json(enrichedLogs);
  } catch (error) {
    console.error("Failed to fetch activity logs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUserSession();
    const body = await request.json().catch(() => ({}));
    const { activityType, description, userId: reqUserId, projectId, taskId } = body;
    
    // Resolve user ID: use session user ID or fallback to reqUserId (essential for login and logout transitions)
    let userId = user?.id;
    if (reqUserId) {
      const parsedReqId = parseInt(String(reqUserId), 10);
      if (!isNaN(parsedReqId) && parsedReqId > 0) {
        userId = parsedReqId;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: User not identified" }, { status: 401 });
    }

    if (!activityType) {
      return NextResponse.json({ error: "activityType is required" }, { status: 400 });
    }

    await logActivity({
      userId,
      activityType,
      description: description || `User performed ${activityType}`,
      projectId,
      taskId
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to create activity log:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
