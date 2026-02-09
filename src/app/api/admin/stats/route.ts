import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { getAllBookings, getAllRooms, getAllGuests } from '@/lib/db';

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

// Helper: Get start and end of a month
function getMonthBoundaries(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

// Helper: Calculate percentage change
function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
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

    // Get all data from JSON database (3 reads instead of 20+)
    const bookings = getAllBookings();
    const rooms = getAllRooms();
    const guests = getAllGuests();

    // Create lookup maps for O(1) access (fixes N+1 query pattern)
    const roomsMap = new Map(rooms.map(room => [room.id, room]));
    const guestsMap = new Map(guests.map(guest => [guest.id, guest]));

    // Get month boundaries for comparison
    const now = new Date();
    const thisMonth = getMonthBoundaries(now);
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = getMonthBoundaries(lastMonthDate);

    // Calculate stats
    const nonCancelledBookings = bookings.filter(b => b.status !== 'cancelled');
    const totalBookings = nonCancelledBookings.length;

    const pendingPayments = bookings.filter(b => b.status === 'pending_payment').length;

    const confirmedPaidBookings = bookings.filter(
      b => b.status === 'confirmed' && b.payment_status === 'paid'
    );
    const revenue = confirmedPaidBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);

    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    const totalRooms = rooms.length || 1;
    const occupancyRate = totalRooms > 0 ? (confirmedBookings.length / totalRooms) * 100 : 0;

    // Calculate this month's stats
    const thisMonthBookings = nonCancelledBookings.filter(b => {
      const createdAt = new Date(b.created_at);
      return createdAt >= thisMonth.start && createdAt <= thisMonth.end;
    });

    const thisMonthRevenue = confirmedPaidBookings
      .filter(b => {
        const createdAt = new Date(b.created_at);
        return createdAt >= thisMonth.start && createdAt <= thisMonth.end;
      })
      .reduce((sum, b) => sum + (b.total_amount || 0), 0);

    const thisMonthConfirmed = bookings.filter(b => {
      const createdAt = new Date(b.created_at);
      return b.status === 'confirmed' && createdAt >= thisMonth.start && createdAt <= thisMonth.end;
    });

    // Calculate last month's stats
    const lastMonthBookings = nonCancelledBookings.filter(b => {
      const createdAt = new Date(b.created_at);
      return createdAt >= lastMonth.start && createdAt <= lastMonth.end;
    });

    const lastMonthRevenue = confirmedPaidBookings
      .filter(b => {
        const createdAt = new Date(b.created_at);
        return createdAt >= lastMonth.start && createdAt <= lastMonth.end;
      })
      .reduce((sum, b) => sum + (b.total_amount || 0), 0);

    const lastMonthConfirmed = bookings.filter(b => {
      const createdAt = new Date(b.created_at);
      return b.status === 'confirmed' && createdAt >= lastMonth.start && createdAt <= lastMonth.end;
    });

    // Calculate comparison percentages
    const bookingsChange = calculatePercentageChange(thisMonthBookings.length, lastMonthBookings.length);
    const revenueChange = calculatePercentageChange(thisMonthRevenue, lastMonthRevenue);

    // For occupancy, compare confirmed bookings ratio
    const thisMonthOccupancy = totalRooms > 0 ? (thisMonthConfirmed.length / totalRooms) * 100 : 0;
    const lastMonthOccupancy = totalRooms > 0 ? (lastMonthConfirmed.length / totalRooms) * 100 : 0;
    const occupancyChange = calculatePercentageChange(thisMonthOccupancy, lastMonthOccupancy);

    // Get recent bookings (last 10, non-cancelled, sorted by created_at)
    // Uses lookup maps for O(1) access instead of individual DB reads
    const recentBookings = nonCancelledBookings
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
      .map(booking => {
        const room = roomsMap.get(booking.room_id);
        const guest = guestsMap.get(booking.guest_id);
        return {
          id: booking.id,
          guest_name: guest?.full_name || 'Unknown Guest',
          guest_email: guest?.email || '',
          room_name: room?.name || 'Studio',
          start_date: booking.start_date,
          end_date: booking.end_date,
          total_amount: booking.total_amount,
          status: booking.status,
          payment_status: booking.payment_status,
          created_at: booking.created_at,
        };
      });

    return NextResponse.json({
      totalBookings,
      pendingPayments,
      revenue,
      occupancyRate: Math.round(occupancyRate * 10) / 10, // Round to 1 decimal place
      comparison: {
        bookingsChange: Math.round(bookingsChange * 10) / 10,
        revenueChange: Math.round(revenueChange * 10) / 10,
        occupancyChange: Math.round(occupancyChange * 10) / 10,
      },
      recentBookings,
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
