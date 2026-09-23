import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import prisma from '@/lib/prisma';

// Polling endpoint for guests/users in the waiting room
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ meetingCode: string }> }
) {
  try {
    const { meetingCode } = await params;
    const participantId = req.nextUrl.searchParams.get('participantId');

    if (!participantId) {
      return NextResponse.json({ error: 'Participant ID required' }, { status: 400 });
    }

    const meeting = await prisma.meeting.findFirst({
      where: { meeting_code: meetingCode }
    });

    if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });

    const participant = await prisma.meetingParticipant.findUnique({
      where: { id: parseInt(participantId) }
    });

    if (!participant) return NextResponse.json({ error: 'Participant not found' }, { status: 404 });

    if (participant.status === 'REJECTED') {
      return NextResponse.json({ status: 'REJECTED' });
    }

    if (participant.status === 'WAITING') {
      return NextResponse.json({ status: 'WAITING' });
    }

    if (participant.status === 'ADMITTED' || participant.status === 'JOINED') {
      // Generate token
      const apiKey = process.env.LIVEKIT_API_KEY;
      const apiSecret = process.env.LIVEKIT_API_SECRET;

      if (!apiKey || !apiSecret) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
      }

      const identity = participant.user_id ? `hm-user-${participant.user_id}` : `hm-guest-${participant.id}`;
      const name = participant.guest_name || `User ${participant.user_id}`;

      const at = new AccessToken(apiKey, apiSecret, { identity, name });
      at.addGrant({ roomJoin: true, room: meeting.room_name!, canPublish: true, canSubscribe: true });
      const token = await at.toJwt();

      return NextResponse.json({ 
        status: participant.status,
        token, 
        serverUrl: process.env.LIVEKIT_URL 
      });
    }

    return NextResponse.json({ status: participant.status });
  } catch (error: any) {
    console.error('Status polling error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
