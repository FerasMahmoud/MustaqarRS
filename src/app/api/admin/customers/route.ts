import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    // Get unique customers from bookings with aggregated data
    // Using a raw query approach since we need to aggregate
    let query = supabase
      .from('bookings')
      .select(`
        id,
        guest_name,
        guest_email,
        guest_phone,
        guest_nationality,
        guest_id_type,
        total_amount,
        status,
        created_at
      `)
      .order('created_at', { ascending: false });

    // Apply search filter
    if (search) {
      query = query.or(`guest_name.ilike.%${search}%,guest_email.ilike.%${search}%,guest_phone.ilike.%${search}%`);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching customers:', error);
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }

    // Aggregate by email to get unique customers with stats
    const customerMap = new Map<string, {
      id: string;
      guest_name: string;
      guest_email: string;
      guest_phone: string;
      nationality?: string;
      id_type?: string;
      total_bookings: number;
      total_spent: number;
      last_booking_date: string;
      first_booking_date: string;
    }>();

    bookings?.forEach(booking => {
      const email = booking.guest_email?.toLowerCase() || booking.id;
      const existing = customerMap.get(email);

      if (existing) {
        existing.total_bookings += 1;
        if (booking.status !== 'cancelled') {
          existing.total_spent += booking.total_amount || 0;
        }
        if (new Date(booking.created_at) > new Date(existing.last_booking_date)) {
          existing.last_booking_date = booking.created_at;
          // Update to most recent name/phone
          existing.guest_name = booking.guest_name || existing.guest_name;
          existing.guest_phone = booking.guest_phone || existing.guest_phone;
        }
        if (new Date(booking.created_at) < new Date(existing.first_booking_date)) {
          existing.first_booking_date = booking.created_at;
        }
      } else {
        customerMap.set(email, {
          id: booking.id,
          guest_name: booking.guest_name || 'Unknown',
          guest_email: booking.guest_email || '',
          guest_phone: booking.guest_phone || '',
          nationality: booking.guest_nationality,
          id_type: booking.guest_id_type,
          total_bookings: 1,
          total_spent: booking.status !== 'cancelled' ? (booking.total_amount || 0) : 0,
          last_booking_date: booking.created_at,
          first_booking_date: booking.created_at,
        });
      }
    });

    // Convert to array and sort by last booking date
    const customers = Array.from(customerMap.values())
      .sort((a, b) => new Date(b.last_booking_date).getTime() - new Date(a.last_booking_date).getTime());

    // Apply pagination
    const paginatedCustomers = customers.slice(offset, offset + limit);
    const totalPages = Math.ceil(customers.length / limit);

    return NextResponse.json({
      customers: paginatedCustomers,
      total: customers.length,
      page,
      totalPages,
    });
  } catch (error) {
    console.error('Customers API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
