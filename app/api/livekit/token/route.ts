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

    // Determine if it's a direct call or a meeting
    let isAuthorized = false;

    // Check if it's a Messenger Call
    const call = await prisma.call.findUnique({
      where: { room_name: roomName },
      include: { thread: true }
    });

    if (call) {
      const uid = typeof user.id === 'string' ? parseInt(user.id) : user.id;
      if (call.thread.user1_id === uid || call.thread.user2_id === uid) {
        isAuthorized = true;
      }
    } else {
      // Check if it's a Meeting
      const uid = typeof user.id === 'string' ? parseInt(user.id) : user.id;
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

    const participantName = `${user.firstname} ${user.lastname}`;
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
