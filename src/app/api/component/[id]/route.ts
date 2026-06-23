import { NextResponse } from 'next/server';
import { engines } from '@/data/engines';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  for (const engine of engines) {
    const component = engine.components.find(c => c.id === id);
    if (component) {
      // Mock an AI agent integration payload
      return NextResponse.json({ 
        component,
        parentEngineId: engine.id,
        installationInstructions: `To install this ${component.type}, place the contents into your project.`,
        mockCodePayload: `export const ${component.id.replace(/-/g, '_')} = () => { console.log('Component ${component.name} initialized'); };`
      });
    }
  }

  return NextResponse.json({ error: 'Component not found' }, { status: 404 });
}
