import { NextRequest, NextResponse } from 'next/server';
import { createAdminToken } from '@/lib/auth';
import { logger } from '@/lib/logger';

// Simple in-memory rate limiting
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0] ||
         request.headers.get('x-real-ip') ||
         'unknown';
}

function isRateLimited(ip: string): boolean {
  const attempts = loginAttempts.get(ip);
  if (!attempts) return false;

  // Reset if lockout has passed
  if (Date.now() - attempts.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.delete(ip);
    return false;
  }

  return attempts.count >= MAX_ATTEMPTS;
}

function recordAttempt(ip: string, success: boolean): void {
  if (success) {
    loginAttempts.delete(ip);
    return;
  }

  const attempts = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 };
  attempts.count++;
  attempts.lastAttempt = Date.now();
  loginAttempts.set(ip, attempts);
}

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);

    // Check rate limiting
    if (isRateLimited(clientIP)) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again in 15 minutes.' },
        { status: 429 }
      );
    }

    const { password } = await request.json();

    // Validate password against environment variable
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      logger.error('ADMIN_PASSWORD environment variable is not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Use timing-safe comparison to prevent timing attacks
    const passwordBuffer = Buffer.from(password || '');
    const adminBuffer = Buffer.from(adminPassword);

    // Ensure same length comparison
    let isValid = passwordBuffer.length === adminBuffer.length;
    if (isValid) {
      // Use crypto.timingSafeEqual for constant-time comparison
      const crypto = await import('crypto');
      isValid = crypto.timingSafeEqual(passwordBuffer, adminBuffer);
    }

    if (!isValid) {
      recordAttempt(clientIP, false);
      logger.warn('Failed login attempt', { ip: clientIP });
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Record successful login
    recordAttempt(clientIP, true);
    logger.info('Admin login successful', { ip: clientIP });

    // Create a cryptographically signed JWT token
    const sessionToken = await createAdminToken();

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
    });

    // Set secure HTTP-only cookie
    response.cookies.set('admin_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    logger.errorWithException('Login error', error, { endpoint: 'POST /api/admin/auth/login' });
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
