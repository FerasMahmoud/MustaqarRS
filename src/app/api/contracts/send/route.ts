import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { generateContractPDF } from '@/lib/pdf/generate-contract';
import { sendContractEmail } from '@/lib/email/send-contract-email';
import { sendContractWhatsApp } from '@/lib/whatsapp/send-contract-whatsapp';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { bookingId, locale = 'en', sendEmail = true, sendWhatsApp = true } =
      body;

    // Validate required parameters
    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId is required' },
        { status: 400 }
      );
    }

    // Get booking and guest information
    const supabase = getSupabase();
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select(
        `
        id,
        start_date,
        end_date,
        total_amount,
        guests (
          id,
          full_name,
          email,
          phone
        ),
        rooms (
          name,
          name_ar
        )
      `
      )
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const results: Record<string, any> = {
      bookingId,
      email: null,
      whatsapp: null,
    };

    // Generate PDF
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await generateContractPDF({ bookingId, locale });
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json(
        { error: 'Failed to generate PDF', details: errorMsg },
        { status: 500 }
      );
    }

    // Safely access guest data
    const guest = Array.isArray(booking.guests)
      ? booking.guests[0]
      : booking.guests;
    const room = Array.isArray(booking.rooms)
      ? booking.rooms[0]
      : booking.rooms;

    // Send email with contract
    if (sendEmail && guest?.email) {
      try {
        const emailResult = await sendContractEmail({
          guestEmail: guest.email,
          guestName: guest.full_name,
          contractPDF: pdfBuffer,
          roomName: locale === 'ar' ? room.name_ar : room.name,
          startDate: booking.start_date,
          endDate: booking.end_date,
          locale,
        });

        results.email = emailResult;
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown error';
        console.error('Email sending error:', errorMsg);
        results.email = { success: false, error: errorMsg };
      }
    }

    // Generate contract URL for WhatsApp
    let contractDownloadUrl = '';
    if (sendWhatsApp) {
      // Generate a time-limited download URL (in production, you'd upload to storage)
      contractDownloadUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://studio-rentals.com'}/api/contracts/download/${bookingId}?locale=${locale}`;
    }

    // Send WhatsApp message with contract link
    if (sendWhatsApp && guest?.phone) {
      try {
        const whatsappResult = await sendContractWhatsApp({
          phoneNumber: guest.phone,
          guestName: guest.full_name,
          roomName: locale === 'ar' ? room.name_ar : room.name,
          startDate: booking.start_date,
          endDate: booking.end_date,
          totalAmount: booking.total_amount,
          contractDownloadUrl,
          locale,
        });

        results.whatsapp = whatsappResult;
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : 'Unknown error';
        console.error('WhatsApp sending error:', errorMsg);
        results.whatsapp = { success: false, error: errorMsg };
      }
    }

    // Update booking record with contract_sent flag
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        contract_sent: true,
        contract_sent_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateError) {
      console.error('Failed to update booking contract_sent flag:', updateError);
    }

    return NextResponse.json(
      {
        success: true,
        bookingId,
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Contract send error:', errorMessage);

    return NextResponse.json(
      {
        error: 'Failed to send contract',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
