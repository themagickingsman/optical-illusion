import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src', 'data', 'engines.json');

export async function GET() {
  try {
    const fileContents = await fs.readFile(dataFilePath, 'utf8');
    const engines = JSON.parse(fileContents);
    return NextResponse.json(engines);
  } catch (error) {
    console.error('Failed to read engines.json', error);
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newEngine = await request.json();
    const fileContents = await fs.readFile(dataFilePath, 'utf8');
    const engines = JSON.parse(fileContents);
    
    // Add the new engine to the beginning of the array so it shows up first
    engines.unshift(newEngine);
    
    await fs.writeFile(dataFilePath, JSON.stringify(engines, null, 2), 'utf8');
    return NextResponse.json({ success: true, engine: newEngine });
  } catch (error) {
    console.error('Failed to write engines.json', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}
