import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src', 'data', 'engines.json');

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const updatedData = await request.json();
    const fileContents = await fs.readFile(dataFilePath, 'utf8');
    let engines = JSON.parse(fileContents);
    
    const index = engines.findIndex((e: any) => e.id === params.id);
    if (index === -1) {
      return NextResponse.json({ error: 'Engine not found' }, { status: 404 });
    }
    
    engines[index] = { ...engines[index], ...updatedData };
    
    await fs.writeFile(dataFilePath, JSON.stringify(engines, null, 2), 'utf8');
    return NextResponse.json({ success: true, engine: engines[index] });
  } catch (error) {
    console.error('Failed to update engines.json', error);
    return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const fileContents = await fs.readFile(dataFilePath, 'utf8');
    let engines = JSON.parse(fileContents);
    
    const index = engines.findIndex((e: any) => e.id === params.id);
    if (index === -1) {
      return NextResponse.json({ error: 'Engine not found' }, { status: 404 });
    }
    
    engines.splice(index, 1);
    
    await fs.writeFile(dataFilePath, JSON.stringify(engines, null, 2), 'utf8');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete from engines.json', error);
    return NextResponse.json({ error: 'Failed to delete data' }, { status: 500 });
  }
}
