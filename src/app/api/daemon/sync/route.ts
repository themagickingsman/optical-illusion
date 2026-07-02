import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

export async function POST(req: Request) {
  try {
    const { subreddits } = await req.json();
    
    // Save to targets.json
    const targetsPath = path.join(process.cwd(), 'public/targets.json');
    fs.writeFileSync(targetsPath, JSON.stringify({ subreddits }, null, 2));

    // Run scraper in the background
    exec('node src/daemon/stealth-scraper.js', (err, stdout, stderr) => {
      if (err) console.error('Scraper background error:', err);
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
