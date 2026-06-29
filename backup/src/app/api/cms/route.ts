import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  
  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  };

  if (!key) {
    return NextResponse.json({ success: false, error: "Missing key" }, { headers });
  }

  const filePath = path.join(process.cwd(), '.data', `${key}.json`);

  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      return NextResponse.json({ success: true, data: JSON.parse(data) }, { headers });
    }
    return NextResponse.json({ success: true, data: null }, { headers });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { headers });
  }
}

export async function POST(request: Request) {
  try {
    const { key, data } = await request.json();
    if (!key || data === undefined) return NextResponse.json({ success: false, error: "Missing key or data" });

    const dir = path.join(process.cwd(), '.data');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const filePath = path.join(dir, `${key}.json`);

    if (data === null) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return NextResponse.json({ success: true });
    }

    let existingData = {};
    if (fs.existsSync(filePath)) {
        try {
            existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        } catch(e) {}
    }
    
    // Merge the incoming data with the existing data
    const mergedData = { ...existingData, ...data };
    
    fs.writeFileSync(filePath, JSON.stringify(mergedData, null, 2), 'utf-8');

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
