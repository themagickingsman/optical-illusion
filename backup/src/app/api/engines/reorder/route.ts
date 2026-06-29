import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src', 'data', 'engines.json');

export async function POST(request: Request) {
  try {
    const { newOrder } = await request.json(); // Array of engine objects in the new order
    
    // Ensure we are receiving an array
    if (!Array.isArray(newOrder)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 });
    }

    // Overwrite the file with the new array
    await fs.writeFile(dataFilePath, JSON.stringify(newOrder, null, 2), 'utf8');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save reordered engines.json', error);
    return NextResponse.json({ error: 'Failed to reorder data' }, { status: 500 });
  }
}
