import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { requireAuth } from '@/lib/auth/authorization';
import prisma from '@/lib/prisma';

// GET /api/meetings/[meetingCode]/participants
// Returns participants (waiting + admitted) — host only
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ meetingCode: string }> }
) {
  try {
    const user = await requireAuth();
    const uid = typeof user.id === 'string' ? parseInt(user.id) : user.id;
    const { meetingCode } = await params;

    const meeting = await prisma.meeting.findFirst({
      where: { meeting_code: meetingCode },
      include: {
        participants: {
          include: {
            user: { select: { id: true, firstname: true, lastname: true, avatar: true } }
          },
          orderBy: { created_at: 'asc' }
        }
      }
    });

    if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    if (meeting.organizer_id !== uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    return NextResponse.json({ participants: meeting.participants });
  } catch (error: any) {
    console.error('GET participants error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PATCH /api/meetings/[meetingCode]/participants
// Admit or reject a participant, optionally generate LiveKit token for admitted
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ meetingCode: string }> }
) {
  try {
    const user = await requireAuth();
    const uid = typeof user.id === 'string' ? parseInt(user.id) : user.id;
    const { meetingCode } = await params;
    const { participantId, action } = await req.json(); // action: 'admit' | 'reject'

    const meeting = await prisma.meeting.findFirst({
      where: { meeting_code: meetingCode }
    });

    if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    if (meeting.organizer_id !== uid) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (action === 'admit') {
      const updated = await prisma.meetingParticipant.update({
        where: { id: participantId },
        data: { status: 'ADMITTED', joined_at: new Date() }
      });

      // Generate a LiveKit token for the admitted participant so frontend can poll for it
      const apiKey = process.env.LIVEKIT_API_KEY!;
      const apiSecret = process.env.LIVEKIT_API_SECRET!;

      let token: string | null = null;
      if (meeting.room_name && apiKey && apiSecret) {
        const identity = updated.user_id
          ? `hm-user-${updated.user_id}`
          : `hm-guest-${participantId}`;
        const name = updated.guest_name || `User ${updated.user_id}`;

        const at = new AccessToken(apiKey, apiSecret, { identity, name });
        at.addGrant({ roomJoin: true, room: meeting.room_name, canPublish: true, canSubscribe: true });
        token = await at.toJwt();
      }

      return NextResponse.json({ participant: updated, token, serverUrl: process.env.LIVEKIT_URL });
    } else if (action === 'reject') {
      const updated = await prisma.meetingParticipant.update({
        where: { id: participantId },
        data: { status: 'REJECTED' }
      });
      return NextResponse.json({ participant: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('PATCH participants error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
