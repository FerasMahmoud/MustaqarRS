import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getBookingById, updateBookingStatusLocked, getRoomById, getGuestById } from '@/lib/db';

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

    const { id } = await params;
    const bookingId = id;
    const { cancellation_reason } = await request.json();

    if (!cancellation_reason) {
      return NextResponse.json(
        { error: 'Cancellation reason is required' },
        { status: 400 }
      );
    }

    // Get current booking details from JSON database
    const currentBooking = getBookingById(bookingId);

    if (!currentBooking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Get room and guest details for notification
    const room = getRoomById(currentBooking.room_id);
    const guest = getGuestById(currentBooking.guest_id);

    // Update booking with cancelled status (using locked version)
    const cancelledBooking = await updateBookingStatusLocked(bookingId, 'cancelled', {
      cancellation_reason,
    });

    if (!cancelledBooking) {
      console.error('Error cancelling booking');
      return NextResponse.json(
        { error: 'Failed to cancel booking' },
        { status: 500 }
      );
    }

    // Trigger n8n unified workflow for cancellation email/WhatsApp
    // This is async and non-blocking
    if (guest?.email) {
      fetch(process.env.N8N_WEBHOOK_URL || 'https://primary-production-22d7.up.railway.app/webhook/mustaqar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'booking_cancelled',
          bookingId: currentBooking.id,
          guestName: guest.full_name,
          guestEmail: guest.email,
          guestPhone: guest.phone,
          roomName: room?.name || 'Studio',
          startDate: currentBooking.start_date,
          endDate: currentBooking.end_date,
          totalAmount: currentBooking.total_amount,
          cancellation_reason: cancellation_reason,
        })
      }).catch(error => {
        console.error('⚠️ Failed to trigger cancellation workflow:', error);
        // Don't fail the API response if n8n is down
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Booking cancelled successfully',
        booking: cancelledBooking,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json(
      { error: 'An error occurred while cancelling booking' },
      { status: 500 }
    );
  }
}
