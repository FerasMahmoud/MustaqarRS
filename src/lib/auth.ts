/**
 * JWT Authentication Utilities
 *
 * Uses HMAC-SHA256 signed tokens instead of base64 encoding.
 * Tokens cannot be forged without the secret key.
 */

import { SignJWT, jwtVerify, JWTPayload } from 'jose';

// Secret key for signing JWTs - must be at least 32 characters
function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret || secret.length < 32) {
    // If no proper secret, create one from admin password with padding
    const baseSecret = secret || 'default-secret-change-me-in-production';
    const paddedSecret = baseSecret.padEnd(32, 'x').slice(0, 64);
    return new TextEncoder().encode(paddedSecret);
  }
  return new TextEncoder().encode(secret);
}

export interface AdminTokenPayload extends JWTPayload {
  admin: boolean;
  createdAt: number;
}

/**
 * Create a signed JWT token for admin session
 */
export async function createAdminToken(): Promise<string> {
  const secret = getSecretKey();

  const token = await new SignJWT({
    admin: true,
    createdAt: Date.now(),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .setSubject('admin')
    .sign(secret);

  return token;
}

/**
 * Verify and decode an admin JWT token
 * Returns the payload if valid, null if invalid
 */
export async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  try {
    const secret = getSecretKey();

    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    // Verify it's an admin token
    if (payload.sub !== 'admin' || !payload.admin) {
      return null;
    }

    return payload as AdminTokenPayload;
  } catch (error) {
    // Token is invalid, expired, or tampered with
    return null;
  }
}

/**
 * Check if a token is valid (for quick validation)
 */
export async function isValidAdminToken(token: string): Promise<boolean> {
  const payload = await verifyAdminToken(token);
  return payload !== null;
}
