import { NextRequest, NextResponse } from 'next/server';
import { getStripeServer } from '@/lib/stripe';
import { getBookingById, updateBooking, getRoomById, now } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, bookingId } = body;

    if (!sessionId || !bookingId) {
      return NextResponse.json(
        { error: 'Missing session ID or booking ID' },
        { status: 400 }
      );
    }

    // Verify the Stripe session
    const stripe = getStripeServer();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // Get the booking from JSON database
    const booking = getBookingById(bookingId);

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Get room details
    const room = getRoomById(booking.room_id);

    // Check if already confirmed
    if (booking.status === 'confirmed') {
      // Already confirmed, just return the details
      return NextResponse.json({
        success: true,
        booking: {
          roomName: room?.name || 'Studio',
          roomNameAr: room?.name_ar || 'استوديو',
          startDate: booking.start_date,
          endDate: booking.end_date,
          durationDays: booking.duration_days,
          totalAmount: booking.total_amount,
        },
      });
    }

    // Update booking status to confirmed
    const updatedBooking = updateBooking(bookingId, {
      status: 'confirmed',
      stripe_session_id: sessionId,
      payment_status: 'paid',
      confirmed_at: now(),
    });

    if (!updatedBooking) {
      console.error('Error updating booking');
      return NextResponse.json(
        { error: 'Failed to confirm booking' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      booking: {
        roomName: room?.name || 'Studio',
        roomNameAr: room?.name_ar || 'استوديو',
        startDate: booking.start_date,
        endDate: booking.end_date,
        durationDays: booking.duration_days,
        totalAmount: booking.total_amount,
      },
    });
  } catch (error) {
    console.error('Confirm booking error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm booking' },
      { status: 500 }
    );
  }
}
