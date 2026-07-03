import { NextResponse } from 'next/server';
import { TwitterApi } from 'twitter-api-v2';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Initialize Twitter API client with credentials from environment variables
    const client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY || '',
      appSecret: process.env.TWITTER_API_SECRET || '',
      accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
      accessSecret: process.env.TWITTER_ACCESS_SECRET || '',
    });

    const rwClient = client.readWrite;

    // Post to Twitter
    const tweet = await rwClient.v2.tweet(text);

    return NextResponse.json({ success: true, tweet });
  } catch (error: any) {
    console.error('Error posting to Twitter:', error);
    return NextResponse.json({ error: error.message || 'Failed to post to Twitter' }, { status: 500 });
  }
}
