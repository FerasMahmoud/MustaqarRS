import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { ReceiptPDF, type ReceiptData } from '@/components/receipt/ReceiptPDF';
import { getBookingById, getRoomById, getGuestById } from '@/lib/db';

export interface GenerateReceiptParams {
  bookingId: string;
  locale?: 'en' | 'ar';
}

/**
 * Parameters for generating receipt with pre-fetched data
 * Used when data is already available (e.g., from Stripe webhook)
 */
export interface GenerateReceiptWithDataParams {
  bookingId: string;
  locale?: 'en' | 'ar';
  paymentDate: string;
  guest: {
    fullName: string;
    email: string;
    phone: string;
  };
  room: {
    name: string;
    nameAr: string;
  };
  booking: {
    startDate: string;
    endDate: string;
    durationDays?: number;
    totalAmount: number;
    cleaningFee?: number;
    paymentMethod: 'stripe' | 'bank_transfer';
  };
}

/**
 * Generates a short receipt number from booking ID
 * Takes first 8 characters and makes them uppercase
 */
function generateReceiptNumber(bookingId: string): string {
  return bookingId.slice(0, 8).toUpperCase();
}

/**
 * Generates a payment receipt PDF as a buffer
 */
export async function generateReceiptPDF(
  params: GenerateReceiptParams
): Promise<Buffer> {
  try {
    const { bookingId, locale = 'en' } = params;

    // Fetch booking from JSON database
    const booking = getBookingById(bookingId);
    if (!booking) {
      throw new Error(`Booking not found: ${bookingId}`);
    }

    // Fetch room and guest data
    const room = getRoomById(booking.room_id);
    if (!room) {
      throw new Error(`Room not found: ${booking.room_id}`);
    }

    const guest = getGuestById(booking.guest_id);
    if (!guest) {
      throw new Error(`Guest not found: ${booking.guest_id}`);
    }

    // Determine payment date (confirmed_at or created_at)
    const paymentDate = booking.confirmed_at || booking.created_at;

    // Calculate duration in days
    const startDate = new Date(booking.start_date);
    const endDate = new Date(booking.end_date);
    const durationDays = booking.duration_days ||
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Prepare receipt data
    const receiptData: ReceiptData = {
      receiptNumber: generateReceiptNumber(booking.id),
      paymentDate: paymentDate,
      guestName: guest.full_name,
      guestEmail: guest.email,
      guestPhone: guest.phone,
      roomName: room.name,
      roomNameAr: room.name_ar,
      startDate: booking.start_date,
      endDate: booking.end_date,
      durationDays: durationDays,
      monthlyRate: room.monthly_rate,
      cleaningFee: booking.cleaning_fee || 0,
      totalAmount: booking.total_amount,
      paymentMethod: booking.payment_method === 'stripe' ? 'stripe' : 'bank_transfer',
      locale: locale,
    };

    // Render PDF to buffer
    const receiptComponent = React.createElement(ReceiptPDF, {
      data: receiptData,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(receiptComponent as any);

    return pdfBuffer;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate receipt PDF: ${errorMessage}`);
  }
}

/**
 * Generates a receipt PDF and returns it as a data URL (for preview)
 */
export async function generateReceiptPDFDataURL(
  params: GenerateReceiptParams
): Promise<string> {
  const buffer = await generateReceiptPDF(params);
  const base64 = buffer.toString('base64');
  return `data:application/pdf;base64,${base64}`;
}

/**
 * Generates a payment receipt PDF with pre-fetched data
 * Use this when you already have the booking/guest/room data
 * (e.g., from Stripe webhook where data comes from Supabase)
 */
export async function generateReceiptPDFWithData(
  params: GenerateReceiptWithDataParams
): Promise<Buffer> {
  try {
    const { bookingId, locale = 'en', paymentDate, guest, room, booking } = params;

    // Calculate duration if not provided
    const startDate = new Date(booking.startDate);
    const endDate = new Date(booking.endDate);
    const durationDays = booking.durationDays ||
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // Prepare receipt data
    const receiptData: ReceiptData = {
      receiptNumber: generateReceiptNumber(bookingId),
      paymentDate: paymentDate,
      guestName: guest.fullName,
      guestEmail: guest.email,
      guestPhone: guest.phone,
      roomName: room.name,
      roomNameAr: room.nameAr,
      startDate: booking.startDate,
      endDate: booking.endDate,
      durationDays: durationDays,
      monthlyRate: 0, // Not needed for receipt display
      cleaningFee: booking.cleaningFee || 0,
      totalAmount: booking.totalAmount,
      paymentMethod: booking.paymentMethod,
      locale: locale,
    };

    // Render PDF to buffer
    const receiptComponent = React.createElement(ReceiptPDF, {
      data: receiptData,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(receiptComponent as any);

    return pdfBuffer;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to generate receipt PDF: ${errorMessage}`);
  }
}
