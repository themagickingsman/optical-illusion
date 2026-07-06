import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Mock list of numbers in case the scraper fails due to Cloudflare
const FALLBACK_NUMBERS = [
  "+1 (323) 555-0199",
  "+1 (212) 555-0144",
  "+1 (415) 555-0122",
  "+44 7700 900077",
  "+44 7700 900111"
];

const DATA_PATH = path.join(process.cwd(), 'src/data/virtual_number.json');

export async function GET() {
  try {
    let activeNumber = null;
    if (fs.existsSync(DATA_PATH)) {
      const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
      activeNumber = data.active_number;
    }

    // Try to scrape anonymsms.com
    let availableNumbers = [];
    try {
      const res = await fetch('https://anonymsms.com/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      const html = await res.text();
      
      if (!html.includes('Cloudflare') && !html.includes('Just a moment')) {
        // Very basic regex to find numbers formatted with +
        const matches = html.match(/\+\d{1,3}[\s-]?\d{3}[\s-]?\d{3}[\s-]?\d{4}/g) || [];
        availableNumbers = [...new Set(matches)];
      }
    } catch (e) {
      console.warn("Scraper failed, falling back to dummy numbers");
    }

    // Fallback if scraping failed
    if (availableNumbers.length === 0) {
      availableNumbers = FALLBACK_NUMBERS;
    }

    return NextResponse.json({
      activeNumber,
      availableNumbers
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch virtual numbers' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { number } = await req.json();
    
    // Ensure data directory exists
    const dir = path.dirname(DATA_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(DATA_PATH, JSON.stringify({ active_number: number }, null, 2));

    return NextResponse.json({ success: true, activeNumber: number });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to set virtual number' }, { status: 500 });
  }
}
