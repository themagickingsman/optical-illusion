import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  timestamp: number;
}

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'leaderboard.json');

async function getScores(): Promise<LeaderboardEntry[]> {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const res = await fetch(`${process.env.KV_REST_API_URL}/get/leaderboard`, {
        headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
        cache: 'no-store'
      });
      const data = await res.json();
      if (data.result) {
        return JSON.parse(data.result);
      }
    } catch (e) {
      console.error('KV get failed', e);
    }
    return [];
  } else {
    try {
      const data = await fs.readFile(DATA_FILE, 'utf-8');
      return JSON.parse(data) as LeaderboardEntry[];
    } catch (error) {
      return [];
    }
  }
}

async function setScores(scores: LeaderboardEntry[]) {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    await fetch(`${process.env.KV_REST_API_URL}/set/leaderboard`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}` },
      body: JSON.stringify(JSON.stringify(scores)) // Upstash REST requires the value to be stringified as the body
    });
  } else {
    await fs.writeFile(DATA_FILE, JSON.stringify(scores, null, 2), 'utf-8');
  }
}

export async function GET() {
  try {
    const scores = await getScores();
    return NextResponse.json(scores);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as LeaderboardEntry;
    
    let scores = await getScores();

    // Ensure we only add valid scores
    if (body.name && typeof body.score === 'number' && body.id) {
      scores.push({
        id: body.id,
        name: body.name.substring(0, 3).toUpperCase(), // Enforce 3 chars
        score: body.score,
        timestamp: body.timestamp || Date.now()
      });
    }

    // Sort descending by score
    scores.sort((a, b) => b.score - a.score);

    // Keep top 5
    scores = scores.slice(0, 5);

    await setScores(scores);

    return NextResponse.json(scores);
  } catch (error) {
    console.error('Failed to post score', error);
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 });
  }
}
