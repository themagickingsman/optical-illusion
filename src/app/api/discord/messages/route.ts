import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channelType = searchParams.get('channel') || 'op';
  
  const token = channelType === 'cr' 
    ? process.env.DISCORD_BOT_TOKEN_CR 
    : process.env.DISCORD_BOT_TOKEN_OP;
    
  if (!token) {
    return NextResponse.json({ error: 'Discord Bot Token not configured' }, { status: 500 });
  }

  const channelId = channelType === 'cr' 
    ? process.env.DISCORD_CHANNEL_CR 
    : process.env.DISCORD_CHANNEL_OP;

  if (!channelId) {
    return NextResponse.json({ error: 'Channel ID not configured' }, { status: 500 });
  }

  try {
    const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages?limit=25`, {
      method: 'GET',
      headers: {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 10 } // Cache for 10 seconds to avoid hitting rate limits
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Discord API Error: ${response.status} ${response.statusText}`, errorText);
      
      let parsedError = errorText;
      try {
        const json = JSON.parse(errorText);
        parsedError = json.message || errorText;
      } catch (e) {}

      return NextResponse.json({ error: `Discord API: ${parsedError}` }, { status: response.status });
    }

    const messages = await response.json();

    // Map to a cleaner format
    const formattedMessages = messages.map((msg: any) => ({
      id: msg.id,
      author: {
        id: msg.author.id,
        username: msg.author.username,
        avatar: msg.author.avatar 
          ? `https://cdn.discordapp.com/avatars/${msg.author.id}/${msg.author.avatar}.png`
          : 'https://cdn.discordapp.com/embed/avatars/0.png', // Default fallback
      },
      content: msg.content,
      timestamp: msg.timestamp,
      attachments: msg.attachments.map((a: any) => ({ url: a.url, proxy_url: a.proxy_url, width: a.width, height: a.height, content_type: a.content_type })),
    })).reverse(); // Reverse so newest is at the bottom, matching chat UI

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error('Failed to fetch Discord messages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { channelType, content } = body;

    const token = channelType === 'cr' 
      ? process.env.DISCORD_BOT_TOKEN_CR 
      : process.env.DISCORD_BOT_TOKEN_OP;
      
    if (!token) {
      return NextResponse.json({ error: 'Discord Bot Token not configured' }, { status: 500 });
    }

    const channelId = channelType === 'cr' 
      ? process.env.DISCORD_CHANNEL_CR 
      : process.env.DISCORD_CHANNEL_OP;

    if (!channelId) {
      return NextResponse.json({ error: 'Channel ID not configured' }, { status: 500 });
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Format the message so server members know it came from the website
    const formattedContent = `🌐 **[Web Guest]:** ${content}`;

    const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: formattedContent })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Discord API POST Error: ${response.status} ${response.statusText}`, errorText);
      return NextResponse.json({ error: 'Failed to post message to Discord' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to post Discord message:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
