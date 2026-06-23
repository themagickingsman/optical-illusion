import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export async function GET(): Promise<Response> {
  // Read telemetry status
  try {
    const { stdout, stderr } = await execPromise('npx next telemetry status');
    
    // Parse output to determine if it is enabled
    // Next.js output usually says "Status: Enabled" or "Status: Disabled"
    const isEnabled = stdout.toLowerCase().includes('status: enabled');
    
    return NextResponse.json({ 
      success: true, 
      isEnabled,
      rawOutput: stdout || stderr
    });
  } catch (error: any) {
    console.error('Failed to get telemetry status:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const { action } = await request.json();
    
    if (action !== 'disable' && action !== 'enable') {
      return NextResponse.json({ error: 'Invalid action. Must be disable or enable.' }, { status: 400 });
    }

    const { stdout, stderr } = await execPromise(`npx next telemetry ${action}`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Telemetry successfully ${action}d.`,
      rawOutput: stdout || stderr
    });

  } catch (error: any) {
    console.error(`Failed to execute telemetry action:`, error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
