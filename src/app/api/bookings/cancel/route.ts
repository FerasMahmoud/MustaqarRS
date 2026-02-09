import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Lazy load Supabase client to avoid errors during build when env vars might not be set
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Missing booking ID' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Get the booking to verify it's pending
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('id, status')
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      // Booking might already be deleted, that's ok
      return NextResponse.json({ success: true });
    }

    // Only delete if it's pending payment
    if (booking.status === 'pending_payment') {
      const { error: deleteError } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);

      if (deleteError) {
        console.error('Error deleting pending booking:', deleteError);
        // Don't return error to user, the dates will be released
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel booking error:', error);
    // Don't return error to user
    return NextResponse.json({ success: true });
  }
}
