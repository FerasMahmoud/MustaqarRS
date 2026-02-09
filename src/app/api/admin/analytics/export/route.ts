import { NextResponse } from 'next/server';
import { getAllBookings, getAllRooms, getAllGuests } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    // Default to last 30 days if no dates provided
    const endDate = endDateStr ? new Date(endDateStr) : new Date();
    const startDate = startDateStr
      ? new Date(startDateStr)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Fetch data
    const [bookings, rooms, guests] = await Promise.all([
      getAllBookings(),
      getAllRooms(),
      getAllGuests(),
    ]);

    // Create lookup maps
    const roomMap = new Map(rooms.map(r => [r.id, r]));
    const guestMap = new Map(guests.map(g => [g.id, g]));

    // Filter bookings by date range
    const filteredBookings = bookings.filter(b => {
      const createdAt = new Date(b.created_at);
      return createdAt >= startDate && createdAt <= endDate;
    });

    // Sort by date descending
    filteredBookings.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // Generate CSV
    const headers = [
      'Booking ID',
      'Guest Name',
      'Guest Email',
      'Guest Phone',
      'Room',
      'Start Date',
      'End Date',
      'Duration (months)',
      'Total Amount (SAR)',
      'Status',
      'Payment Status',
      'Payment Method',
      'Created At',
    ];

    const rows = filteredBookings.map(booking => {
      const room = roomMap.get(booking.room_id);
      const guest = guestMap.get(booking.guest_id);
      const startDateFormatted = booking.start_date
        ? new Date(booking.start_date).toISOString().split('T')[0]
        : '';
      const endDateFormatted = booking.end_date
        ? new Date(booking.end_date).toISOString().split('T')[0]
        : '';
      const createdAtFormatted = booking.created_at
        ? new Date(booking.created_at).toISOString()
        : '';

      return [
        booking.id,
        escapeCSV(guest?.full_name || ''),
        escapeCSV(guest?.email || ''),
        escapeCSV(guest?.phone || ''),
        escapeCSV(room?.name || 'Unknown'),
        startDateFormatted,
        endDateFormatted,
        booking.duration_days ? Math.ceil(booking.duration_days / 30) : '',
        booking.total_amount || 0,
        booking.status || '',
        booking.payment_status || '',
        booking.payment_method || (booking.stripe_session_id ? 'stripe' : 'bank_transfer'),
        createdAtFormatted,
      ];
    });

    // Build CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    // Generate filename with date range
    const filename = `bookings_${startDate.toISOString().split('T')[0]}_to_${endDate.toISOString().split('T')[0]}.csv`;

    // Return CSV response
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Analytics export error:', error);
    return NextResponse.json(
      { error: 'Failed to export analytics data' },
      { status: 500 }
    );
  }
}

/**
 * Escape a value for CSV (handle commas, quotes, newlines)
 */
function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // If value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (
    stringValue.includes(',') ||
    stringValue.includes('"') ||
    stringValue.includes('\n')
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}
