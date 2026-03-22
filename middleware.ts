import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow login page and login API without auth
  if (pathname === '/login' || pathname === '/api/auth/login') {
    return NextResponse.next();
  }

  // Check for auth cookie on all other routes
  const authToken = request.cookies.get('mcd_auth')?.value;

  // If no auth token, redirect to login
  if (!authToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify token is still valid (simple check - just verify it exists)
  // In production, you'd validate the signature here
  return NextResponse.next();
}

// Apply middleware to all routes except static files and public assets
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
