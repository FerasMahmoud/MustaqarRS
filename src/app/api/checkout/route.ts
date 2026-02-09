import { NextRequest, NextResponse } from 'next/server';
import { createDayBasedCheckoutSession, createStudioCheckoutSession, StudioId, BillingPeriod } from '@/lib/stripe';
import { CLEANING_BUFFER_DAYS, calculateBookingPriceByDays } from '@/lib/validation';
import {
  getRoomById,
  getGuestByEmail,
  upsertGuestLocked,
  createBookingLocked,
  getActiveBookingsForRoom,
} from '@/lib/db';
import { logger } from '@/lib/logger';

// Maximum allowed price difference (in SAR) between client and server calculation
// Small tolerance for rounding differences
const MAX_PRICE_DIFFERENCE = 50;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Debug logging
    console.log('Checkout API received body:', {
      roomId: body.roomId,
      durationDays: body.durationDays,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      hasCustomerPhone: !!body.customerPhone,
    });

    // Check if this is the new day-based booking or legacy
    if (body.roomId && body.durationDays !== undefined) {
      // New day-based booking system
      const {
        roomId,
        startDate,
        endDate,
        durationDays,
        totalAmount,
        customerName,
        customerEmail,
        customerPhone,
        idType,
        idNumber,
        nationality,
        locale = 'en',
      } = body;

      // Validate required fields
      if (!roomId || !startDate || !endDate || !durationDays || !totalAmount) {
        return NextResponse.json(
          {
            error: 'Missing required fields',
            errorAr: 'الحقول المطلوبة مفقودة'
          },
          { status: 400 }
        );
      }

      // Validate minimum 30 days
      if (durationDays < 30) {
        return NextResponse.json(
          {
            error: 'Minimum booking is 30 days',
            errorAr: 'الحد الأدنى للحجز هو 30 يوم'
          },
          { status: 400 }
        );
      }

      // Get room info from JSON database
      console.log('Fetching room with ID:', roomId);
      const room = getRoomById(roomId);

      if (!room) {
        console.error('Room not found:', roomId);
        return NextResponse.json(
          {
            error: 'Room not found',
            errorAr: 'الغرفة غير موجودة'
          },
          { status: 404 }
        );
      }

      // SERVER-SIDE PRICE VALIDATION - Critical security check
      // Recalculate the price server-side and verify it matches what client sent
      const serverPriceInfo = calculateBookingPriceByDays(
        room.monthly_rate,
        durationDays,
        false // cleaning service - check if client sent this
      );

      const priceDifference = Math.abs(totalAmount - serverPriceInfo.totalPrice);

      if (priceDifference > MAX_PRICE_DIFFERENCE) {
        console.error('Price mismatch detected!', {
          clientAmount: totalAmount,
          serverAmount: serverPriceInfo.totalPrice,
          difference: priceDifference,
          roomId,
          durationDays,
          monthlyRate: room.monthly_rate,
        });
        return NextResponse.json(
          {
            error: 'Price validation failed. Please refresh and try again.',
            errorAr: 'فشل التحقق من السعر. يرجى التحديث والمحاولة مرة أخرى.'
          },
          { status: 400 }
        );
      }

      // Use server-calculated price for safety
      const validatedTotalAmount = serverPriceInfo.totalPrice;

      // Check availability - ensure no overlapping confirmed bookings (with cleaning buffer)
      const checkEndDate = new Date(endDate);
      checkEndDate.setDate(checkEndDate.getDate() + CLEANING_BUFFER_DAYS);
      const bufferEndDate = checkEndDate.toISOString().split('T')[0];

      const activeBookings = getActiveBookingsForRoom(roomId);
      const hasConflict = activeBookings.some(booking => {
        const bookingStart = new Date(booking.start_date);
        const bookingEnd = new Date(booking.end_date);
        const requestStart = new Date(startDate);
        const requestEnd = new Date(bufferEndDate);

        // Check for overlap
        return requestStart <= bookingEnd && requestEnd >= bookingStart;
      });

      if (hasConflict) {
        return NextResponse.json(
          {
            error: 'Selected dates are no longer available. Please choose different dates.',
            errorAr: 'التواريخ المحددة لم تعد متاحة. الرجاء اختيار تواريخ أخرى.'
          },
          { status: 409 }
        );
      }

      // Create or get guest record using JSON database (locked to prevent race conditions)
      console.log('Creating/getting guest with email:', customerEmail);

      const guest = await upsertGuestLocked({
        full_name: customerName || 'Guest',
        email: customerEmail || '',
        phone: customerPhone || '',
        id_type: idType || '',
        id_number: idNumber || null,
        nationality: nationality || '',
      });

      const guestId = guest.id;

      // Create a pending booking record (locked to prevent race conditions)
      console.log('Creating booking with:', {
        roomId,
        guestId,
        startDate,
        endDate,
        durationDays,
        totalAmount,
      });

      const pendingBooking = await createBookingLocked({
        room_id: roomId,
        guest_id: guestId,
        start_date: startDate,
        end_date: endDate,
        status: 'pending_payment',
        total_amount: validatedTotalAmount, // Use server-validated price
        duration_days: durationDays,
        rental_type: 'monthly',
        rate_at_booking: validatedTotalAmount / durationDays,
        guest_locale: locale,
      });

      // Create Stripe checkout session with server-validated price
      const session = await createDayBasedCheckoutSession({
        roomId,
        roomName: room.name,
        roomNameAr: room.name_ar,
        startDate,
        endDate,
        durationDays,
        totalAmount: validatedTotalAmount, // Use server-validated price
        successUrl: `${baseUrl}/${locale}/booking/success?session_id={CHECKOUT_SESSION_ID}&booking_id=${pendingBooking.id}`,
        cancelUrl: `${baseUrl}/${locale}/booking/cancel?booking_id=${pendingBooking.id}`,
        locale,
      });

      return NextResponse.json({
        sessionId: session.id,
        url: session.url,
        bookingId: pendingBooking.id
      });

    } else {
      // Legacy billing period based checkout
      const {
        studioId,
        billingPeriod,
        startDate,
        customerEmail,
        customerName,
        customerPhone,
        idType,
        idNumber,
        nationality,
        locale = 'en',
      } = body;

      // Validate required fields
      if (!studioId || !billingPeriod || !startDate || !customerEmail || !customerName || !customerPhone || !idType || !idNumber || !nationality) {
        return NextResponse.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      const session = await createStudioCheckoutSession({
        studioId: studioId as StudioId,
        billingPeriod: billingPeriod as BillingPeriod,
        startDate,
        customerEmail,
        customerName,
        customerPhone,
        idType,
        idNumber,
        nationality,
        successUrl: `${baseUrl}/${locale}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${baseUrl}/${locale}/booking/cancel`,
        locale,
      });

      return NextResponse.json({ sessionId: session.id, url: session.url });
    }
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        errorAr: 'فشل في إنشاء جلسة الدفع'
      },
      { status: 500 }
    );
  }
}
