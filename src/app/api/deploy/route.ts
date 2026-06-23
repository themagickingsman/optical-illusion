import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

export async function POST() {
  return new Promise((resolve) => {
    // Only allow this in local development
    if (process.env.NODE_ENV === 'production') {
      return resolve(NextResponse.json({ success: false, error: 'Cannot run deploy script from production.' }, { status: 403 }));
    }

    const scriptPath = path.join(process.cwd(), 'scripts', 'deploy.js');
    
    // Execute the deploy script
    exec(`node ${scriptPath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Deploy error: ${error.message}`);
        return resolve(NextResponse.json({ success: false, error: error.message, output: stderr }, { status: 500 }));
      }
      
      resolve(NextResponse.json({ success: true, output: stdout }));
    });
  });
}
