import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { jwtVerify } from 'jose';

// Create the next-intl middleware for locale handling
const intlMiddleware = createMiddleware({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
});

// Get secret key for JWT verification
function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret || secret.length < 32) {
    const baseSecret = secret || 'default-secret-change-me-in-production';
    const paddedSecret = baseSecret.padEnd(32, 'x').slice(0, 64);
    return new TextEncoder().encode(paddedSecret);
  }
  return new TextEncoder().encode(secret);
}

// Verify JWT token
async function verifyToken(token: string): Promise<boolean> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    // Verify it's an admin token
    return payload.sub === 'admin' && payload.admin === true;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Redirect /en/admin/* or /ar/admin/* to /admin/*
  const localeAdminMatch = pathname.match(/^\/(en|ar)(\/admin\/.*)$/);
  if (localeAdminMatch) {
    return NextResponse.redirect(new URL(localeAdminMatch[2], request.url));
  }

  // Handle admin routes - no i18n, just authentication
  if (pathname.startsWith('/admin')) {
    // Skip authentication for login page and auth API
    if (pathname === '/admin/login' || pathname.startsWith('/api/admin/auth')) {
      return NextResponse.next();
    }

    // Check for admin session cookie
    const adminToken = request.cookies.get('admin_session');

    if (!adminToken || !adminToken.value) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Verify JWT signature and validity
    const isValid = await verifyToken(adminToken.value);

    if (!isValid) {
      // Clear invalid cookie and redirect to login
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete('admin_session');
      return response;
    }

    return NextResponse.next();
  }

  // Apply next-intl middleware only for public routes
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    '/(ar|en)/:path*',
    '/admin/:path*',
  ],
};
