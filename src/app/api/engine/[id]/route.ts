import { NextResponse } from 'next/server';
import { engines } from '@/data/engines';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const engine = engines.find(e => e.id === id);
  
  if (!engine) {
    return NextResponse.json({ error: 'Engine not found' }, { status: 404 });
  }

  return NextResponse.json({ engine });
}
