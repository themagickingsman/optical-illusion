import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Check if chat_session cookie already exists
  let chatSession = request.cookies.get('chat_session')?.value;
  
  // If it doesn't exist, create a stable server-side session ID
  if (!chatSession) {
    chatSession = "session_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    
    // Set cookie on the response so the browser saves it robustly.
    // httpOnly: false allows client-side components to read it if necessary.
    response.cookies.set({
      name: 'chat_session',
      value: chatSession,
      path: '/',
      maxAge: 31536000, // 1 year
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false 
    });
  }
  
  return response;
}

export const config = {
  matcher: [
    // Apply to all routes except API, static files, images, etc.
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
