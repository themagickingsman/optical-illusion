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

export async function GET() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    const scores = JSON.parse(data) as LeaderboardEntry[];
    return NextResponse.json(scores);
  } catch (error) {
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as LeaderboardEntry;
    
    let scores: LeaderboardEntry[] = [];
    try {
      const data = await fs.readFile(DATA_FILE, 'utf-8');
      scores = JSON.parse(data);
    } catch (e) {
      // File might not exist yet, ignore
    }

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

    await fs.writeFile(DATA_FILE, JSON.stringify(scores, null, 2), 'utf-8');

    return NextResponse.json(scores);
  } catch (error) {
    console.error('Failed to post score', error);
    return NextResponse.json({ error: 'Failed to save score' }, { status: 500 });
  }
}
