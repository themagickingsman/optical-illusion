import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'weapon-settings.json');

export async function GET() {
  try {
    const data = await fs.readFile(SETTINGS_FILE_PATH, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    // If file doesn't exist or fails to parse, return empty object
    return NextResponse.json({});
  }
}

export async function POST(req: Request) {
  try {
    const settings = await req.json();
    await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2), 'utf-8');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to write weapon settings:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
