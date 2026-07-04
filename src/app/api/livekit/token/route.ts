import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get('room');
  const username = req.nextUrl.searchParams.get('username');

  if (!room || !username) {
    return NextResponse.json({ error: 'Missing room or username' }, { status: 400 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY || 'APIMvtjEHpfNuG4';
  const apiSecret = process.env.LIVEKIT_API_SECRET || 'txS9eZCdgYmBzZAMX7ImU9aMANp1HlDawwVMUZFUahe';

  try {
    const at = new AccessToken(apiKey, apiSecret, {
      identity: username,
      name: username,
    });
    
    at.addGrant({ roomJoin: true, room: room });

    const token = await at.toJwt();
    return NextResponse.json({ token });
  } catch (err: any) {
    console.error("LiveKit token generation failed:", err);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}
