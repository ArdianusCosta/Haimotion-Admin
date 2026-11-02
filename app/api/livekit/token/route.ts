import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { requireAuth } from '@/lib/auth/authorization';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { roomName } = await req.json();

    if (!roomName) {
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
    }

    const uid = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;

    // Determine if user has permission to join this room
    let isAuthorized = false;

    // 1. Check if it's a Group Call (e.g. group-call-123-timestamp)
    if (roomName.startsWith('group-call-')) {
      const parts = roomName.split('-');
      const gid = parseInt(parts[2], 10);
      if (!isNaN(gid)) {
        const membership = await prisma.group_members.findFirst({
          where: { group_id: gid, user_id: uid }
        });
        if (membership) {
          isAuthorized = true;
        }
      }
    }

    // 2. Check if it's a Messenger Direct Call
    if (!isAuthorized) {
      const call = await prisma.call.findUnique({
        where: { room_name: roomName },
        include: { thread: true }
      });

      if (call) {
        if (call.thread.user1_id === uid || call.thread.user2_id === uid) {
          isAuthorized = true;
        }
      }
    }

    // 3. Check if it's a Scheduled Meeting
    if (!isAuthorized) {
      const meeting = await prisma.meeting.findFirst({
        where: { room_name: roomName },
        include: { participants: true }
      });

      if (meeting) {
        if (
          meeting.organizer_id === uid || 
          meeting.participants.some((p: any) => p.user_id === uid)
        ) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden: You do not have access to this room' }, { status: 403 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: 'LiveKit credentials not configured' }, { status: 500 });
    }

    const participantName = `${user.firstname} ${user.lastname || ''}`.trim() || 'User';
    const participantIdentity = `hm-user-${user.id}`;

    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantIdentity,
      name: participantName,
    });

    at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });

    const token = await at.toJwt();
    const serverUrl = process.env.LIVEKIT_URL;

    return NextResponse.json({ token, serverUrl });
  } catch (error: any) {
    console.error('Error generating LiveKit token:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
