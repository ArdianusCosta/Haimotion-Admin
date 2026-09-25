import { NextResponse } from "next/server";
import { getUserSession } from "@/lib/auth/authorization";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";

export async function GET(request: Request) {
  try {
    const user = await getUserSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // You could check for admin roles here if needed
    
    // Fetch logs, include user details
    const logs = await prisma.activity_log.findMany({
      orderBy: { created_at: 'desc' },
      take: 1000 // Limit to recent logs
    });
    
    // Manual join to User table since schema might not have relations defined for activity_log
    const userIds = Array.from(new Set(logs.map(log => log.user_id)));
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstname: true, lastname: true, email: true, avatar: true }
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    const enrichedLogs = logs.map(log => ({
      ...log,
      user: userMap.get(log.user_id) || null
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
    const { activityType, description, userId: reqUserId } = await request.json();
    
    // For login events, the session cookie might not be fully propagated yet to the fetch request,
    // so we allow passing the userId explicitly.
    let userId = user?.id;
    if (activityType === 'login' && reqUserId) {
      userId = reqUserId;
    } else if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await logActivity({
      userId: userId,
      activityType,
      description
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to create activity log:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
