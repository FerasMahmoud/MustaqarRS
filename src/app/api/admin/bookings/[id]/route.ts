import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getBookingById, getRoomById, getGuestById } from '@/lib/db';
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

export async function GET(
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

    const { id } = await params;
    const bookingId = id;

    // Fetch booking from JSON database
    const booking = getBookingById(bookingId);

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Get room and guest details
    const room = getRoomById(booking.room_id);
    const guest = getGuestById(booking.guest_id);

    // Format response to match expected structure
    const enrichedBooking = {
      id: booking.id,
      guest_name: guest?.full_name || 'Unknown Guest',
      guest_email: guest?.email || '',
      guest_phone: guest?.phone || '',
      guest_id_number: guest?.id_number || null,
      guest_nationality: guest?.nationality || '',
      room: room ? { id: room.id, name: room.name, price_per_night: room.monthly_rate / 30 } : null,
      start_date: booking.start_date,
      end_date: booking.end_date,
      total_amount: booking.total_amount,
      status: booking.status,
      payment_status: booking.payment_status,
      payment_method: booking.payment_method,
      expires_at: booking.expires_at,
      created_at: booking.created_at,
      confirmed_at: booking.confirmed_at,
      cancellation_reason: booking.cancellation_reason,
      special_requests: booking.notes,
      receipt_sent: booking.receipt_sent || false,
      receipt_sent_at: booking.receipt_sent_at || null,
    };

    return NextResponse.json({
      booking: enrichedBooking,
    });
  } catch (error) {
    logger.errorWithException('Error fetching booking', error, { endpoint: 'GET /api/admin/bookings/[id]' });
    return NextResponse.json(
      { error: 'An error occurred while fetching booking' },
      { status: 500 }
    );
  }
}
