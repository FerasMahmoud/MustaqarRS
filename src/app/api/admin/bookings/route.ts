import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getAllBookings, getRoomById, getGuestById } from '@/lib/db';
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

export async function GET(request: NextRequest) {
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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('payment_status');
    const search = searchParams.get('search');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get all bookings from JSON database
    let bookings = getAllBookings();

    // Apply filters
    if (status && status !== 'all') {
      bookings = bookings.filter(b => b.status === status);
    }

    if (paymentStatus && paymentStatus !== 'all') {
      bookings = bookings.filter(b => b.payment_status === paymentStatus);
    }

    if (startDate) {
      bookings = bookings.filter(b => b.start_date >= startDate);
    }

    if (endDate) {
      bookings = bookings.filter(b => b.end_date <= endDate);
    }

    // Enrich bookings with room and guest data
    const enrichedBookings = bookings.map(booking => {
      const room = getRoomById(booking.room_id);
      const guest = getGuestById(booking.guest_id);

      return {
        id: booking.id,
        guest_name: guest?.full_name || 'Unknown Guest',
        guest_email: guest?.email || '',
        guest_phone: guest?.phone || '',
        room: room ? { id: room.id, name: room.name } : null,
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
      };
    });

    // Apply search filter (on enriched data)
    let filteredBookings = enrichedBookings;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredBookings = enrichedBookings.filter(b =>
        b.guest_name.toLowerCase().includes(searchLower) ||
        b.guest_email.toLowerCase().includes(searchLower)
      );
    }

    // Sort by created_at descending
    filteredBookings.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Apply pagination
    const total = filteredBookings.length;
    const paginatedBookings = filteredBookings.slice(offset, offset + limit);

    return NextResponse.json({
      bookings: paginatedBookings,
      total,
      limit,
      offset,
    });
  } catch (error) {
    logger.errorWithException('Error fetching admin bookings', error, { endpoint: 'GET /api/admin/bookings' });
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}
