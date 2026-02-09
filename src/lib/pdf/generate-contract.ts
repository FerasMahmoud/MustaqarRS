import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { ContractPDF, type ContractData } from '@/components/contract/ContractPDF';
import { getSupabase } from '@/lib/supabase';

export interface GenerateContractParams {
  bookingId: string;
  locale: 'en' | 'ar';
}

/**
 * Fetches booking, guest, and room data from the database
 */
async function fetchBookingData(bookingId: string) {
  const supabase = getSupabase();

  // Fetch booking with guest and room information
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .select(
      `
      id,
      created_at,
      start_date,
      end_date,
      duration_days,
      total_amount,
      signature,
      terms_accepted,
      guest_id,
      room_id,
      guests (
        id,
        full_name,
        email,
        phone,
        id_type,
        id_number,
        nationality
      ),
      rooms (
        id,
        name,
        name_ar,
        monthly_rate
      )
    `
    )
    .eq('id', bookingId)
    .single();

  if (bookingError || !booking) {
    throw new Error(
      `Failed to fetch booking: ${bookingError?.message || 'Not found'}`
    );
  }

  return booking;
}

/**
 * Generates a contract PDF as a buffer
 */
export async function generateContractPDF(
  params: GenerateContractParams
): Promise<Buffer> {
  try {
    const booking = await fetchBookingData(params.bookingId);

    // Safely access guest and room data
    const guest = Array.isArray(booking.guests)
      ? booking.guests[0]
      : booking.guests;
    const room = Array.isArray(booking.rooms) ? booking.rooms[0] : booking.rooms;

    // Prepare contract data
    const contractData: ContractData = {
      guestName: guest.full_name,
      guestEmail: guest.email,
      guestPhone: guest.phone,
      guestIdType: guest.id_type,
      guestIdNumber: guest.id_number,
      guestNationality: guest.nationality,
      roomName: room.name,
      roomNameAr: room.name_ar,
      startDate: booking.start_date,
      endDate: booking.end_date,
      durationDays: booking.duration_days,
      monthlyRate: room.monthly_rate,
      totalAmount: booking.total_amount,
      signatureData: booking.signature, // Base64 PNG from booking signature
      termsAccepted: booking.terms_accepted,
      bookingDate: booking.created_at,
      locale: params.locale,
    };

    // Render PDF to buffer
    const contractComponent = React.createElement(ContractPDF, {
      data: contractData,
    });
    const pdfBuffer = await renderToBuffer(contractComponent as any);

    return pdfBuffer;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate contract PDF: ${errorMessage}`);
  }
}

/**
 * Generates a contract PDF and returns it as a data URL (for preview)
 */
export async function generateContractPDFDataURL(
  params: GenerateContractParams
): Promise<string> {
  const buffer = await generateContractPDF(params);
  const base64 = buffer.toString('base64');
  return `data:application/pdf;base64,${base64}`;
}
