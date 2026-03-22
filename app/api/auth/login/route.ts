import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Get password from environment variable
// Set MCD_PASSWORD in your .env.local file
const DASHBOARD_PASSWORD = process.env.MCD_PASSWORD || 'changeme';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: 'Password required' },
        { status: 400 }
      );
    }

    // Compare passwords (in production, use bcrypt)
    if (password !== DASHBOARD_PASSWORD) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Create a simple auth token (in production, use JWT)
    const token = crypto.randomBytes(32).toString('hex');

    // Create response with auth cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: 'mcd_auth',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
