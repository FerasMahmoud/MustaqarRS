import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import {
  getBookingById,
  updateBookingStatusLocked,
  getRoomById,
  getGuestById,
  getActiveBookingsForRoom,
  now,
} from '@/lib/db';

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

    // Get the booking from JSON database
    const booking = getBookingById(bookingId);

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Check for conflicts - see if there's another confirmed booking for the same dates
    const activeBookings = getActiveBookingsForRoom(booking.room_id);
    const conflictingBooking = activeBookings.find(b => {
      if (b.id === bookingId) return false; // Skip current booking
      if (b.status !== 'confirmed') return false; // Only check confirmed bookings

      const bookingStart = new Date(booking.start_date);
      const bookingEnd = new Date(booking.end_date);
      const existingStart = new Date(b.start_date);
      const existingEnd = new Date(b.end_date);

      // Check for overlap
      return bookingStart <= existingEnd && bookingEnd >= existingStart;
    });

    if (conflictingBooking) {
      // Cancel this booking due to conflict (using locked version)
      await updateBookingStatusLocked(bookingId, 'cancelled', {
        cancellation_reason: 'Cancelled due to payment confirmation conflict - another booking was already confirmed for these dates',
      });

      return NextResponse.json(
        {
          error: 'Booking cancelled due to payment confirmation conflict',
          message: 'Another booking for the same room during these dates was already confirmed',
          conflicting_booking: {
            id: conflictingBooking.id,
            start_date: conflictingBooking.start_date,
            end_date: conflictingBooking.end_date,
          },
        },
        { status: 409 }
      );
    }

    // Confirm the booking (using locked version to prevent race conditions)
    const updatedBooking = await updateBookingStatusLocked(bookingId, 'confirmed', {
      payment_status: 'paid',
    });

    if (!updatedBooking) {
      return NextResponse.json(
        { error: 'Failed to confirm payment' },
        { status: 400 }
      );
    }

    // Get room and guest details for response
    const room = getRoomById(booking.room_id);
    const guest = getGuestById(booking.guest_id);

    const enrichedBooking = {
      id: updatedBooking.id,
      guest_name: guest?.full_name || 'Unknown Guest',
      guest_email: guest?.email || '',
      guest_phone: guest?.phone || '',
      room: room ? { id: room.id, name: room.name } : null,
      start_date: updatedBooking.start_date,
      end_date: updatedBooking.end_date,
      total_amount: updatedBooking.total_amount,
      status: updatedBooking.status,
      payment_status: updatedBooking.payment_status,
      payment_method: updatedBooking.payment_method,
      confirmed_at: updatedBooking.confirmed_at,
    };

    // Trigger n8n unified workflow for payment confirmation email/WhatsApp
    // This is async and non-blocking
    if (guest?.email) {
      fetch(process.env.N8N_WEBHOOK_URL || 'https://primary-production-22d7.up.railway.app/webhook/mustaqar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'payment_confirmed',
          bookingId: updatedBooking.id,
          guestName: guest.full_name,
          guestEmail: guest.email,
          guestPhone: guest.phone,
          roomName: room?.name || 'Studio',
          startDate: updatedBooking.start_date,
          endDate: updatedBooking.end_date,
          totalAmount: updatedBooking.total_amount,
        })
      }).catch(error => {
        console.error('⚠️ Failed to trigger payment confirmed workflow:', error);
        // Don't fail the API response if n8n is down
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Payment confirmed successfully',
        booking: enrichedBooking,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in confirm payment:', error);
    return NextResponse.json(
      { error: 'An error occurred while confirming payment' },
      { status: 500 }
    );
  }
}
