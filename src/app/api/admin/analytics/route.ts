import { NextResponse } from 'next/server';
import { getAllBookings, getAllRooms, getAllGuests } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface AnalyticsSummary {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  avgBookingValue: number;
  avgStayDuration: number;
  occupancyRate: number;
  uniqueGuests: number;
  repeatGuestRate: number;
}

interface TimeSeriesPoint {
  date: string;
  count?: number;
  amount?: number;
}

interface RoomStats {
  roomId: string;
  roomName: string;
  bookings: number;
  revenue: number;
}

interface AnalyticsResponse {
  summary: AnalyticsSummary;
  comparison?: {
    bookingsChange: number;
    revenueChange: number;
    avgValueChange: number;
  };
  timeSeries: {
    bookings: TimeSeriesPoint[];
    revenue: TimeSeriesPoint[];
  };
  byRoom: RoomStats[];
  byPaymentMethod: {
    stripe: { count: number; amount: number };
    bank_transfer: { count: number; amount: number };
  };
  byStatus: {
    confirmed: number;
    pending_payment: number;
    cancelled: number;
    pending: number;
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const granularity = searchParams.get('granularity') || 'day';

    // Default to last 30 days if no dates provided
    const endDate = endDateStr ? new Date(endDateStr) : new Date();
    const startDate = startDateStr
      ? new Date(startDateStr)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calculate previous period for comparison
    const periodLength = endDate.getTime() - startDate.getTime();
    const prevEndDate = new Date(startDate.getTime() - 1);
    const prevStartDate = new Date(prevEndDate.getTime() - periodLength);

    // Fetch all data
    const [bookings, rooms, guests] = await Promise.all([
      getAllBookings(),
      getAllRooms(),
      getAllGuests(),
    ]);

    // Create lookup maps
    const roomMap = new Map(rooms.map(r => [r.id, r]));
    const guestMap = new Map(guests.map(g => [g.id, g]));

    // Filter bookings by date range
    const periodBookings = bookings.filter(b => {
      const createdAt = new Date(b.created_at);
      return createdAt >= startDate && createdAt <= endDate;
    });

    const prevPeriodBookings = bookings.filter(b => {
      const createdAt = new Date(b.created_at);
      return createdAt >= prevStartDate && createdAt <= prevEndDate;
    });

    // Calculate summary metrics
    const confirmedBookings = periodBookings.filter(
      b => b.status === 'confirmed' && b.payment_status === 'paid'
    );
    const pendingBookings = periodBookings.filter(
      b => b.status === 'pending_payment' || b.status === 'pending'
    );
    const cancelledBookings = periodBookings.filter(b => b.status === 'cancelled');

    const totalRevenue = confirmedBookings.reduce(
      (sum, b) => sum + (b.total_amount || 0),
      0
    );

    const avgBookingValue =
      confirmedBookings.length > 0 ? totalRevenue / confirmedBookings.length : 0;

    // Calculate average stay duration in days
    const stayDurations = periodBookings
      .filter(b => b.start_date && b.end_date)
      .map(b => {
        const start = new Date(b.start_date);
        const end = new Date(b.end_date);
        return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      });
    const avgStayDuration =
      stayDurations.length > 0
        ? stayDurations.reduce((a, b) => a + b, 0) / stayDurations.length
        : 0;

    // Calculate occupancy rate (simplified: confirmed bookings / total rooms)
    const occupancyRate = rooms.length > 0
      ? (confirmedBookings.length / rooms.length) * 100
      : 0;

    // Guest analytics - use guest_id since bookings reference guests by ID
    const guestIds = new Set(
      periodBookings
        .filter(b => b.guest_id)
        .map(b => b.guest_id)
    );
    const uniqueGuests = guestIds.size;

    // Count guests with multiple bookings
    const guestBookingCounts = new Map<string, number>();
    bookings.forEach(b => {
      if (b.guest_id) {
        guestBookingCounts.set(b.guest_id, (guestBookingCounts.get(b.guest_id) || 0) + 1);
      }
    });
    const repeatGuests = Array.from(guestBookingCounts.values()).filter(
      count => count > 1
    ).length;
    const totalGuestsEver = guestBookingCounts.size;
    const repeatGuestRate =
      totalGuestsEver > 0 ? (repeatGuests / totalGuestsEver) * 100 : 0;

    // Comparison with previous period
    const prevConfirmed = prevPeriodBookings.filter(
      b => b.status === 'confirmed' && b.payment_status === 'paid'
    );
    const prevRevenue = prevConfirmed.reduce(
      (sum, b) => sum + (b.total_amount || 0),
      0
    );
    const prevAvgValue =
      prevConfirmed.length > 0 ? prevRevenue / prevConfirmed.length : 0;

    const bookingsChange =
      prevPeriodBookings.length > 0
        ? ((periodBookings.length - prevPeriodBookings.length) /
            prevPeriodBookings.length) *
          100
        : 0;
    const revenueChange =
      prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    const avgValueChange =
      prevAvgValue > 0
        ? ((avgBookingValue - prevAvgValue) / prevAvgValue) * 100
        : 0;

    // Time series data
    const timeSeries = generateTimeSeries(
      periodBookings,
      startDate,
      endDate,
      granularity as 'day' | 'week' | 'month'
    );

    // Revenue by room
    const roomStats = new Map<string, { bookings: number; revenue: number }>();
    periodBookings.forEach(b => {
      if (b.room_id) {
        const stats = roomStats.get(b.room_id) || { bookings: 0, revenue: 0 };
        stats.bookings += 1;
        if (b.status === 'confirmed' && b.payment_status === 'paid') {
          stats.revenue += b.total_amount || 0;
        }
        roomStats.set(b.room_id, stats);
      }
    });

    const byRoom: RoomStats[] = Array.from(roomStats.entries()).map(
      ([roomId, stats]) => ({
        roomId,
        roomName: roomMap.get(roomId)?.name || 'Unknown Room',
        bookings: stats.bookings,
        revenue: stats.revenue,
      })
    );

    // Sort by revenue descending
    byRoom.sort((a, b) => b.revenue - a.revenue);

    // Payment method breakdown
    const stripeBookings = confirmedBookings.filter(
      b => b.payment_method === 'stripe' || b.stripe_session_id
    );
    const bankTransferBookings = confirmedBookings.filter(
      b => b.payment_method === 'bank_transfer'
    );

    const byPaymentMethod = {
      stripe: {
        count: stripeBookings.length,
        amount: stripeBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0),
      },
      bank_transfer: {
        count: bankTransferBookings.length,
        amount: bankTransferBookings.reduce(
          (sum, b) => sum + (b.total_amount || 0),
          0
        ),
      },
    };

    // Status breakdown
    const byStatus = {
      confirmed: confirmedBookings.length,
      pending_payment: periodBookings.filter(b => b.status === 'pending_payment')
        .length,
      cancelled: cancelledBookings.length,
      pending: periodBookings.filter(b => b.status === 'pending').length,
    };

    const response: AnalyticsResponse = {
      summary: {
        totalBookings: periodBookings.length,
        confirmedBookings: confirmedBookings.length,
        pendingBookings: pendingBookings.length,
        cancelledBookings: cancelledBookings.length,
        totalRevenue,
        avgBookingValue: Math.round(avgBookingValue),
        avgStayDuration: Math.round(avgStayDuration),
        occupancyRate: Math.round(occupancyRate * 10) / 10,
        uniqueGuests,
        repeatGuestRate: Math.round(repeatGuestRate * 10) / 10,
      },
      comparison: {
        bookingsChange: Math.round(bookingsChange * 10) / 10,
        revenueChange: Math.round(revenueChange * 10) / 10,
        avgValueChange: Math.round(avgValueChange * 10) / 10,
      },
      timeSeries,
      byRoom,
      byPaymentMethod,
      byStatus,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

function generateTimeSeries(
  bookings: any[],
  startDate: Date,
  endDate: Date,
  granularity: 'day' | 'week' | 'month'
): { bookings: TimeSeriesPoint[]; revenue: TimeSeriesPoint[] } {
  const bookingSeries: TimeSeriesPoint[] = [];
  const revenueSeries: TimeSeriesPoint[] = [];

  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    let periodEnd: Date;
    let dateLabel: string;

    if (granularity === 'day') {
      periodEnd = new Date(current);
      periodEnd.setDate(periodEnd.getDate() + 1);
      dateLabel = current.toISOString().split('T')[0];
    } else if (granularity === 'week') {
      periodEnd = new Date(current);
      periodEnd.setDate(periodEnd.getDate() + 7);
      dateLabel = `Week of ${current.toISOString().split('T')[0]}`;
    } else {
      // month
      periodEnd = new Date(current);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      dateLabel = current.toISOString().slice(0, 7); // YYYY-MM
    }

    const periodBookings = bookings.filter(b => {
      const createdAt = new Date(b.created_at);
      return createdAt >= current && createdAt < periodEnd;
    });

    const periodRevenue = periodBookings
      .filter(b => b.status === 'confirmed' && b.payment_status === 'paid')
      .reduce((sum, b) => sum + (b.total_amount || 0), 0);

    bookingSeries.push({ date: dateLabel, count: periodBookings.length });
    revenueSeries.push({ date: dateLabel, amount: periodRevenue });

    // Move to next period
    if (granularity === 'day') {
      current.setDate(current.getDate() + 1);
    } else if (granularity === 'week') {
      current.setDate(current.getDate() + 7);
    } else {
      current.setMonth(current.getMonth() + 1);
    }
  }

  return { bookings: bookingSeries, revenue: revenueSeries };
}
