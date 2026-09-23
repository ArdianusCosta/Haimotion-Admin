import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { auth } from '@/lib/auth/auth';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ meetingCode: string }> }
) {
  try {
    const { meetingCode } = await params;
    const body = await req.json();
    const { guestName, guestEmail, passcode } = body;

    // 1. Find the meeting
    const meeting = await prisma.meeting.findFirst({
      where: { meeting_code: meetingCode },
      include: {
        participants: true,
        organizer: { select: { id: true, firstname: true, lastname: true } }
      }
    });

    if (!meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // 2. Validate meeting status
    if (meeting.status === 'CANCELLED') {
      return NextResponse.json({ error: 'This meeting has been cancelled' }, { status: 410 });
    }
    if (meeting.status === 'ENDED') {
      return NextResponse.json({ error: 'This meeting has already ended' }, { status: 410 });
    }

    // 3. Check passcode if required
    if (meeting.passcode && meeting.passcode !== passcode) {
      return NextResponse.json({ error: 'Invalid passcode' }, { status: 403 });
    }

    // 4. Check if requester is an authenticated internal user
    let authenticatedUser: any = null;
    try {
      const session = await auth.api.getSession({ headers: await headers() });
      if (session?.user?.id) {
        authenticatedUser = await prisma.user.findUnique({
          where: { id: parseInt(session.user.id) }
        });
      }
    } catch {
      // Not authenticated — that's fine for public meetings
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return NextResponse.json({ error: 'LiveKit credentials not configured' }, { status: 500 });
    }

    if (!meeting.room_name) {
      return NextResponse.json({ error: 'Meeting room not configured' }, { status: 500 });
    }

    let participantIdentity: string;
    let participantName: string;
    let participantRole = 'PARTICIPANT';
    let requiresWaitingRoom = false;
    let participantId: number | null = null;

    if (authenticatedUser) {
      // INTERNAL USER FLOW
      const uid = authenticatedUser.id;
      participantIdentity = `hm-user-${uid}`;
      participantName = `${authenticatedUser.firstname} ${authenticatedUser.lastname}`.trim();

      const isOrganizer = meeting.organizer_id === uid;
      if (isOrganizer) participantRole = 'HOST';

      // Check join policy for internal users
      if (!isOrganizer && meeting.join_policy === 'INVITED_ONLY') {
        const isParticipant = meeting.participants.some((p: any) => p.user_id === uid);
        if (!isParticipant) {
          return NextResponse.json({ error: 'You are not invited to this meeting' }, { status: 403 });
        }
      }

      // Waiting room applies to non-hosts
      if (!isOrganizer && meeting.waiting_room) {
        requiresWaitingRoom = true;
      }

      // Upsert participant record
      const existing = meeting.participants.find((p: any) => p.user_id === uid);
      if (!existing) {
        const newParticipant = await prisma.meetingParticipant.create({
          data: {
            meeting_id: meeting.id,
            user_id: uid,
            role: participantRole,
            status: requiresWaitingRoom ? 'WAITING' : 'JOINED',
            joined_at: requiresWaitingRoom ? null : new Date(),
          }
        });
        participantId = newParticipant.id;
      } else {
        participantId = existing.id;
        if (existing.status === 'ADMITTED' || existing.status === 'JOINED' || isOrganizer) {
          requiresWaitingRoom = false;
        } else if (existing.status === 'WAITING') {
          requiresWaitingRoom = true;
        } else if (existing.status === 'REJECTED') {
          return NextResponse.json({ error: 'You have been removed from this meeting' }, { status: 403 });
        }
        await prisma.meetingParticipant.update({
          where: { id: existing.id },
          data: { 
            status: requiresWaitingRoom ? 'WAITING' : 'JOINED',
            joined_at: requiresWaitingRoom ? null : new Date(),
          }
        });
      }
    } else {
      // GUEST FLOW
      if (!guestName || !guestName.trim()) {
        return NextResponse.json({ error: 'Name is required to join this meeting' }, { status: 400 });
      }

      if (meeting.join_policy === 'INVITED_ONLY') {
        return NextResponse.json({ error: 'This meeting is for invited members only' }, { status: 403 });
      }

      participantName = guestName.trim();
      participantIdentity = `hm-guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      requiresWaitingRoom = meeting.waiting_room;

      const newParticipant = await prisma.meetingParticipant.create({
        data: {
          meeting_id: meeting.id,
          user_id: null,
          guest_name: participantName,
          guest_email: guestEmail || null,
          role: 'GUEST',
          status: requiresWaitingRoom ? 'WAITING' : 'JOINED',
          joined_at: requiresWaitingRoom ? null : new Date(),
        }
      });
      participantId = newParticipant.id;
    }

    // If waiting room is required, don't issue a token yet
    if (requiresWaitingRoom) {
      return NextResponse.json({
        requiresWaitingRoom: true,
        participantId,
        meetingTitle: meeting.title,
      });
    }

    // Generate LiveKit token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: participantIdentity,
      name: participantName,
    });

    at.addGrant({
      roomJoin: true,
      room: meeting.room_name,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    // Transition meeting to LIVE if it was SCHEDULED
    if (meeting.status === 'SCHEDULED') {
      await prisma.meeting.update({
        where: { id: meeting.id },
        data: { status: 'LIVE' }
      });
    }

    return NextResponse.json({
      token,
      serverUrl: process.env.LIVEKIT_URL,
      roomName: meeting.room_name,
      participantId,
      requiresWaitingRoom: false,
    });

  } catch (error: any) {
    console.error('Meeting join error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
