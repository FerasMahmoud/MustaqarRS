import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import {
  getAllRooms,
  getRoomById,
  getGuestByEmail,
  upsertGuestLocked,
  createBookingLocked,
  getActiveBookingsForRoom,
  isDateRangeAvailable,
  getAllBookings,
  getAllAvailabilityBlocks,
  getAvailabilityBlocksForRoom,
  now,
}  from '@/lib/db';
import { logger } from '@/lib/logger';
import { sendAdminNotification } from '@/lib/whatsapp/send-admin-notification';
import { emitBookingCreated, emitBankTransferBooking } from '@/lib/events';

// Get secret key for JWT verification (same as middleware)
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
async function isAdminAuthenticated(request: NextRequest): Promise<boolean> {
  try {
    const adminToken = request.cookies.get('admin_session');
    if (!adminToken || !adminToken.value) {
      return false;
    }

    const secret = getSecretKey();
    const { payload } = await jwtVerify(adminToken.value, secret, {
      algorithms: ['HS256'],
    });

    return payload.sub === 'admin' && payload.admin === true;
  } catch {
    return false;
  }
}
import {
  validateStep1,
  validateStep2,
  validateStep3,
  calculateEndDate,
  calculateEndDateByDays,
  calculateBookingPriceByDays,
  CLEANING_BUFFER_DAYS
} from '@/lib/validation';

// Revalidate every 60 seconds for availability data
export const revalidate = 60;

export interface BookingRequest {
  roomId: string;
  billingPeriod?: 'monthly' | 'yearly';
  startDate: string;
  endDate?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  idType: 'passport' | 'saudi_id' | 'iqama';
  idNumber: string;
  nationality: string;
  paymentMethod?: 'stripe' | 'bank_transfer' | 'cash';
  notes?: string;
  // Days-based booking fields (new)
  durationDays?: number;
  totalAmount?: number;
  // Month-based booking fields (legacy)
  startMonth?: string; // Format: "YYYY-MM"
  durationMonths?: number; // 1-36 months
  rateModel?: 'monthly' | 'yearly';
  // Cleaning service add-on
  weeklyCleaningService?: boolean;
  cleaningFee?: number;
  // Terms acceptance
  termsAccepted?: boolean;
  // Signature (base64 canvas export)
  signature?: string;
}

/**
 * Validates if a string is valid base64
 */
function isValidBase64(str: string): boolean {
  if (!str || typeof str !== 'string') return false;

  // Check if it's a data URL (e.g., data:image/png;base64,...)
  const base64Regex = /^data:image\/(png|jpeg|jpg|webp);base64,/;
  const isDataUrl = base64Regex.test(str);

  if (isDataUrl) {
    // Extract the base64 part after the prefix
    const base64Part = str.split(',')[1];
    if (!base64Part) return false;

    // Validate base64 content
    try {
      // Check if it's valid base64 characters
      const base64CharRegex = /^[A-Za-z0-9+/]*={0,2}$/;
      return base64CharRegex.test(base64Part) && base64Part.length > 0;
    } catch {
      return false;
    }
  }

  // If not a data URL, check if it's raw base64
  try {
    const base64CharRegex = /^[A-Za-z0-9+/]*={0,2}$/;
    return base64CharRegex.test(str) && str.length > 0;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    logger.debug('Bookings API called');
    const body: BookingRequest = await request.json();
    logger.debug('Request body parsed', { roomId: body.roomId, durationDays: body.durationDays });

    const {
      roomId,
      billingPeriod,
      startDate,
      endDate: providedEndDate,
      customerName,
      customerEmail,
      customerPhone,
      idType,
      idNumber,
      nationality,
      paymentMethod = 'bank_transfer',
      notes,
      // Days-based fields (new)
      durationDays,
      totalAmount: providedTotalAmount,
      // Month-based fields (legacy)
      startMonth,
      durationMonths,
      rateModel,
      // Cleaning service add-on
      weeklyCleaningService = false,
      // Terms acceptance
      termsAccepted,
      // Signature
      signature,
    } = body;

    // Validate terms acceptance
    if (!termsAccepted) {
      logger.warn('Booking rejected: terms not accepted', { roomId, customerEmail });
      return NextResponse.json(
        {
          error: 'Terms and conditions must be accepted',
          errorAr: 'يجب الموافقة على الشروط والأحكام',
          field: 'termsAccepted'
        },
        { status: 400 }
      );
    }

    // Validate signature is present
    if (!signature || signature.trim() === '') {
      logger.warn('Booking rejected: signature missing', { roomId, customerEmail });
      return NextResponse.json(
        {
          error: 'Signature is required to accept terms',
          errorAr: 'التوقيع مطلوب لقبول الشروط',
          field: 'signature'
        },
        { status: 400 }
      );
    }

    // Validate signature is valid base64
    if (!isValidBase64(signature)) {
      logger.warn('Booking rejected: invalid signature data', { roomId, customerEmail });
      return NextResponse.json(
        {
          error: 'Invalid signature data',
          errorAr: 'بيانات التوقيع غير صالحة',
          field: 'signature'
        },
        { status: 400 }
      );
    }
    logger.debug('Terms and signature validated');

    // Validate all steps
    logger.debug('Validating step 1');
    const step1Validation = validateStep1({ durationDays, billingPeriod, startDate });
    if (!step1Validation.valid) {
      logger.warn('Step 1 validation failed', { errors: step1Validation.errors });
      return NextResponse.json(
        { error: 'Validation failed', errors: step1Validation.errors },
        { status: 400 }
      );
    }
    

    logger.debug('Validating step 2');
    const step2Validation = validateStep2({ customerName, customerEmail, customerPhone });
    if (!step2Validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', errors: step2Validation.errors },
        { status: 400 }
      );
    }

    const step3Validation = validateStep3({ idType, idNumber, nationality });
    if (!step3Validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', errors: step3Validation.errors },
        { status: 400 }
      );
    }

    // Fetch room from JSON database
    logger.debug('Fetching room', { roomId });
    const room = getRoomById(roomId);

    if (!room) {
      logger.warn('Room not found', { roomId });
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }
    logger.debug('Room found', { roomId: room.id });

    // Calculate end date and price
    let endDate: string;
    let totalAmount: number;

    if (durationDays && durationDays >= 30) {
      // Days-based booking calculation (new)
      endDate = providedEndDate || calculateEndDateByDays(startDate, durationDays);
      const priceInfo = calculateBookingPriceByDays(room.monthly_rate, durationDays, false);
      totalAmount = providedTotalAmount || priceInfo.totalPrice;
    } else if (startMonth && durationMonths) {
      // Month-based booking calculation (legacy)
      const [year, month] = startMonth.split('-').map(Number);
      const endMonthDate = new Date(year, month - 1 + durationMonths, 0); // Last day of end month
      endDate = `${endMonthDate.getFullYear()}-${String(endMonthDate.getMonth() + 1).padStart(2, '0')}-${String(endMonthDate.getDate()).padStart(2, '0')}`;

      // Calculate price based on rate model
      if (rateModel === 'yearly' || billingPeriod === 'yearly') {
        const years = Math.floor(durationMonths / 12);
        const remainingMonths = durationMonths % 12;
        totalAmount = (room.yearly_rate * years) + (room.monthly_rate * remainingMonths);
      } else {
        totalAmount = room.monthly_rate * durationMonths;
      }
    } else if (billingPeriod) {
      // Legacy date-based calculation
      endDate = calculateEndDate(startDate, billingPeriod);
      totalAmount = billingPeriod === 'yearly' ? room.yearly_rate : room.monthly_rate;
    } else {
      // Default to 30 days if nothing specified
      endDate = calculateEndDateByDays(startDate, 30);
      totalAmount = room.monthly_rate;
    }

    // Calculate cleaning fee if service is enabled (supports all booking types)
    logger.debug('Calculating cleaning fee', { weeklyCleaningService });
    let cleaningFee = 0;
    if (weeklyCleaningService) {
      // Determine effective duration in days
      let effectiveDays = durationDays;

      if (!effectiveDays && billingPeriod === 'monthly') {
        effectiveDays = 30;
      } else if (!effectiveDays && billingPeriod === 'yearly') {
        effectiveDays = 365;
      } else if (!effectiveDays && durationMonths) {
        effectiveDays = durationMonths * 30;
      }

      // Calculate cleaning fee based on duration
      if (effectiveDays) {
        if (effectiveDays < 30) {
          const weeks = Math.ceil(effectiveDays / 7);
          cleaningFee = weeks * 50;
        } else {
          const months = Math.ceil(effectiveDays / 30);
          cleaningFee = months * 200;
        }
      }
    }
    logger.debug('Cleaning fee calculated', { cleaningFee });

    // Check for existing bookings that overlap (with 2-day cleaning buffer)
    logger.debug('Checking for overlapping bookings');
    const checkEndDate = new Date(endDate);
    checkEndDate.setDate(checkEndDate.getDate() + CLEANING_BUFFER_DAYS);
    const bufferEndDate = checkEndDate.toISOString().split('T')[0];

    if (!isDateRangeAvailable(roomId, startDate, bufferEndDate)) {
      return NextResponse.json(
        {
          error: 'Room is not available for the selected dates',
          errorAr: 'الغرفة غير متاحة في التواريخ المحددة'
        },
        { status: 409 }
      );
    }

    // Create or update guest (using locked version to prevent race conditions)
    const guest = await upsertGuestLocked({
      full_name: customerName,
      email: customerEmail,
      phone: customerPhone,
      id_type: idType,
      id_number: idNumber,
      nationality: nationality,
    });

    const guestId = guest.id;

    // Create booking
    logger.debug('Creating booking', { weeklyCleaningService, cleaningFee });

    // Determine booking status based on payment method
    let bookingStatus: 'pending' | 'pending_payment' | 'confirmed' | 'cancelled';
    let expiresAt: string | null = null;

    if (paymentMethod === 'bank_transfer') {
      bookingStatus = 'pending_payment'; // Room stays available for "first-to-pay wins"
      expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour from now
    } else if (paymentMethod === 'stripe') {
      bookingStatus = 'pending';
    } else {
      bookingStatus = 'confirmed'; // Cash or other payment methods
    }

    // Create booking (using locked version to prevent race conditions)
    const booking = await createBookingLocked({
      room_id: roomId,
      guest_id: guestId,
      start_date: startDate,
      end_date: endDate,
      rental_type: billingPeriod || rateModel || 'monthly',
      rate_at_booking: totalAmount,
      total_amount: totalAmount,
      status: bookingStatus,
      payment_status: 'pending',
      payment_method: paymentMethod,
      expires_at: expiresAt,
      notes: notes || null,
      duration_days: durationDays || null,
      rate_model: rateModel || billingPeriod || 'monthly',
      weekly_cleaning_service: weeklyCleaningService,
      cleaning_fee: cleaningFee,
      terms_accepted: termsAccepted || false,
      terms_accepted_at: termsAccepted ? now() : null,
      signature: signature || null,
      signature_accepted_at: signature ? now() : null,
    });

    // Send admin WhatsApp notification (async, non-blocking)
    sendAdminNotification({
      type: paymentMethod === 'bank_transfer' ? 'bank_transfer_pending' : 'booking_created',
      guestName: customerName,
      roomName: room?.name || 'Studio',
      totalAmount: booking.total_amount,
      bookingId: booking.id,
      paymentMethod: paymentMethod as 'stripe' | 'bank_transfer' | 'cash',
    }).catch(error => {
      logger.warn('Failed to send admin notification', {
        bookingId: booking.id,
        errorMessage: error instanceof Error ? error.message : String(error)
      });
    });

    // Emit real-time event for admin dashboard
    if (paymentMethod === 'bank_transfer') {
      emitBankTransferBooking({
        guestName: customerName,
        roomName: room?.name || 'Studio',
        amount: booking.total_amount,
        bookingId: booking.id,
      });
    } else {
      emitBookingCreated({
        guestName: customerName,
        roomName: room?.name || 'Studio',
        amount: booking.total_amount,
        bookingId: booking.id,
      });
    }

    // Trigger n8n unified workflow for bank transfer bookings (async, non-blocking)
    if (paymentMethod === 'bank_transfer') {
      logger.info('Triggering n8n workflow for bank transfer booking', { bookingId: booking.id });
      fetch(process.env.N8N_WEBHOOK_URL || 'https://primary-production-22d7.up.railway.app/webhook/mustaqar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'bank_transfer_booking',
          bookingId: booking.id,
          shortId: booking.id.slice(-8).toUpperCase(),
          guestName: customerName,
          guestEmail: customerEmail,
          guestPhone: customerPhone,
          roomName: room?.name || 'Studio',
          startDate: booking.start_date,
          endDate: booking.end_date,
          totalAmount: booking.total_amount,
          expiresAt: booking.expires_at,
          bankDetails: {
            accountName: process.env.BANK_ACCOUNT_NAME,
            accountNumber: process.env.BANK_ACCOUNT_NUMBER,
            iban: process.env.BANK_IBAN,
            swift: process.env.BANK_SWIFT,
          }
        })
      }).catch(error => {
        logger.warn('Failed to trigger n8n workflow', {
          bookingId: booking.id,
          errorMessage: error instanceof Error ? error.message : String(error)
        });
        // Don't fail booking creation if n8n is temporarily down
      });
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        roomId: booking.room_id,
        guestId: booking.guest_id,
        startDate: booking.start_date,
        endDate: booking.end_date,
        rentalType: booking.rental_type,
        totalAmount: booking.total_amount,
        status: booking.status,
        paymentStatus: booking.payment_status,
        termsAccepted: booking.terms_accepted,
        termsAcceptedAt: booking.terms_accepted_at,
        signatureStored: !!booking.signature,
        signatureAcceptedAt: booking.signature_accepted_at,
      },
      message: 'Booking created successfully',
      messageAr: 'تم إنشاء الحجز بنجاح',
      signatureAcknowledgment: {
        stored: true,
        message: 'Signature has been securely stored',
        messageAr: 'تم حفظ التوقيع بشكل آمن',
      },
    });
  } catch (error) {
    logger.errorWithException('Booking API error', error, { endpoint: 'POST /api/bookings' });
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
        type: error instanceof Error ? error.name : 'Unknown'
      },
      { status: 500 }
    );
  }
}

// GET - List bookings or availability data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const roomId = searchParams.get('roomId');
    const availability = searchParams.get('availability');

    // If requesting availability data (for calendar)
    if (availability === 'true') {
      // If specific room ID provided, fetch only that room's data (fast path for booking page)
      if (roomId) {
        // Fetch bookings for this specific room only
        const bookings = getActiveBookingsForRoom(roomId).map(b => ({
          room_id: b.room_id,
          start_date: b.start_date,
          end_date: b.end_date,
          status: b.status,
        }));

        // Fetch availability blocks for this room only
        const blocks = getAvailabilityBlocksForRoom(roomId).map(ab => ({
          room_id: ab.room_id,
          start_date: ab.start_date,
          end_date: ab.end_date,
        }));

        return NextResponse.json({
          bookings,
          availabilityBlocks: blocks,
        }, {
          headers: {
            'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          },
        });
      }

      // Fall back to fetching all rooms + bookings (for admin views)
      const rooms = getAllRooms().map(r => ({
        id: r.id,
        name: r.name,
        name_ar: r.name_ar,
        monthly_rate: r.monthly_rate,
        yearly_rate: r.yearly_rate,
      }));

      // Fetch bookings with 'confirmed' or 'pending' status
      const bookings = getAllBookings()
        .filter(b => b.status === 'confirmed' || b.status === 'pending')
        .map(b => ({
          room_id: b.room_id,
          start_date: b.start_date,
          end_date: b.end_date,
          status: b.status,
        }));

      // Fetch availability blocks (maintenance, etc.)
      const blocks = getAllAvailabilityBlocks().map(ab => ({
        room_id: ab.room_id,
        start_date: ab.start_date,
        end_date: ab.end_date,
      }));

      return NextResponse.json({
        rooms,
        bookings,
        availabilityBlocks: blocks,
      }, {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      });
    }

    // Standard bookings list query - REQUIRES ADMIN AUTHENTICATION
    // This protects guest PII (names, emails, phones, booking details)
    const isAdmin = await isAdminAuthenticated(request);
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin authentication required.' },
        { status: 401 }
      );
    }

    let bookings = getAllBookings();

    if (email) {
      // Get guest by email first
      const guest = getGuestByEmail(email);
      if (guest) {
        bookings = bookings.filter(b => b.guest_id === guest.id);
      } else {
        return NextResponse.json([]);
      }
    }

    if (roomId) {
      bookings = bookings.filter(b => b.room_id === roomId);
    }

    // Sort by created_at descending
    bookings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json(bookings);
  } catch (error) {
    logger.errorWithException('Bookings GET API error', error, { endpoint: 'GET /api/bookings' });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
