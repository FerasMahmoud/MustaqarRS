import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { sendReceiptManual } from '@/lib/receipt/send-receipt';
import { getBookingById } from '@/lib/db';
import { logger } from '@/lib/logger';

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

// Verify admin JWT token
async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });
    return payload.sub === 'admin' && payload.admin === true;
  } catch {
    return false;
  }
}

/**
 * POST /api/admin/bookings/[id]/send-receipt
 *
 * Manually sends a payment receipt to the guest.
 * Used by admin for bank transfer confirmations.
 *
 * Request body (optional):
 * - locale: 'en' | 'ar' (defaults to booking's guest_locale)
 * - sendEmail: boolean (defaults to true)
 * - sendWhatsApp: boolean (defaults to true)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check for admin session and verify JWT signature
    const adminSession = request.cookies.get('admin_session');
    if (!adminSession || !adminSession.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isValid = await verifyAdminToken(adminSession.value);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    const { id: bookingId } = await params;

    // Validate booking exists
    const booking = getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify payment is confirmed
    if (booking.status !== 'confirmed' || booking.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Cannot send receipt: Booking is not confirmed or payment is not completed' },
        { status: 400 }
      );
    }

    // Parse request body for options
    let locale: 'en' | 'ar' = (booking.guest_locale as 'en' | 'ar') || 'en';
    try {
      const body = await request.json();
      if (body.locale && (body.locale === 'en' || body.locale === 'ar')) {
        locale = body.locale;
      }
    } catch {
      // No body or invalid JSON - use defaults
    }

    logger.info('Admin sending receipt manually', { bookingId, locale });

    // Send the receipt
    const result = await sendReceiptManual(bookingId, locale);

    if (result.success) {
      logger.info('Receipt sent successfully via admin', {
        bookingId,
        emailSent: result.email.sent,
        whatsappSent: result.whatsapp.sent,
      });

      return NextResponse.json({
        success: true,
        message: 'Receipt sent successfully',
        details: {
          email: result.email,
          whatsapp: result.whatsapp,
        },
      });
    } else {
      logger.error('Failed to send receipt via admin', {
        bookingId,
        error: result.error,
        emailError: result.email.error,
        whatsappError: result.whatsapp.error,
      });

      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to send receipt',
          details: {
            email: result.email,
            whatsapp: result.whatsapp,
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.errorWithException('Error sending receipt', error, {
      endpoint: 'POST /api/admin/bookings/[id]/send-receipt',
    });

    return NextResponse.json(
      { error: 'An error occurred while sending receipt' },
      { status: 500 }
    );
  }
}
