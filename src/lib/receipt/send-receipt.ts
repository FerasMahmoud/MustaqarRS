/**
 * Unified Receipt Sending Service
 *
 * Orchestrates receipt generation and delivery via:
 * - Email (with PDF attachment)
 * - WhatsApp (with download link)
 *
 * Also updates the booking record to track receipt delivery status.
 */

import { generateReceiptPDF, generateReceiptPDFWithData, type GenerateReceiptWithDataParams } from '@/lib/pdf/generate-receipt';
import { sendReceiptEmail } from '@/lib/email/send-receipt-email';
import { sendReceiptWhatsApp } from '@/lib/whatsapp/send-receipt-whatsapp';
import { getBookingById, getRoomById, getGuestById, updateBookingLocked, now } from '@/lib/db';
import { logger } from '@/lib/logger';

export interface SendReceiptParams {
  bookingId: string;
  locale?: 'en' | 'ar';
  sendEmail?: boolean;
  sendWhatsApp?: boolean;
}

export interface SendReceiptResult {
  success: boolean;
  email: { sent: boolean; messageId?: string; error?: string };
  whatsapp: { sent: boolean; messageId?: string; error?: string };
  error?: string;
}

/**
 * Generates a short receipt number from booking ID
 */
function generateReceiptNumber(bookingId: string): string {
  return bookingId.slice(0, 8).toUpperCase();
}

/**
 * Gets the base URL for receipt downloads
 */
function getBaseUrl(): string {
  // In production, use the NEXT_PUBLIC_BASE_URL or vercel URL
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Fallback to localhost for development
  return 'http://localhost:3000';
}

/**
 * Sends a payment receipt via email and/or WhatsApp
 *
 * This function:
 * 1. Generates the receipt PDF
 * 2. Sends email with PDF attachment (if enabled)
 * 3. Sends WhatsApp message with download link (if enabled)
 * 4. Updates the booking record with receipt delivery status
 */
export async function sendReceipt(
  params: SendReceiptParams
): Promise<SendReceiptResult> {
  const {
    bookingId,
    locale = 'en',
    sendEmail: shouldSendEmail = true,
    sendWhatsApp: shouldSendWhatsApp = true,
  } = params;

  const result: SendReceiptResult = {
    success: false,
    email: { sent: false },
    whatsapp: { sent: false },
  };

  try {
    // Fetch booking data
    const booking = getBookingById(bookingId);
    if (!booking) {
      throw new Error(`Booking not found: ${bookingId}`);
    }

    // Verify payment is completed
    if (booking.payment_status !== 'paid' && booking.status !== 'confirmed') {
      throw new Error(`Cannot send receipt: Payment not confirmed for booking ${bookingId}`);
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

    const receiptNumber = generateReceiptNumber(bookingId);
    const paymentDate = booking.confirmed_at || booking.created_at;
    const baseUrl = getBaseUrl();
    const receiptDownloadUrl = `${baseUrl}/api/receipts/download/${bookingId}`;

    // Generate receipt PDF
    logger.info('Generating receipt PDF', { bookingId, locale });
    const receiptPDF = await generateReceiptPDF({ bookingId, locale });

    // Send email if enabled
    if (shouldSendEmail && guest.email) {
      logger.info('Sending receipt email', { bookingId, email: guest.email });
      const emailResult = await sendReceiptEmail({
        guestEmail: guest.email,
        guestName: guest.full_name,
        receiptPDF,
        roomName: locale === 'ar' ? room.name_ar : room.name,
        totalAmount: booking.total_amount,
        paymentDate,
        receiptNumber,
        locale,
      });

      result.email = {
        sent: emailResult.success,
        messageId: emailResult.messageId,
        error: emailResult.error,
      };

      if (emailResult.success) {
        logger.info('Receipt email sent successfully', { bookingId, messageId: emailResult.messageId });
      } else {
        logger.error('Failed to send receipt email', { bookingId, error: emailResult.error });
      }
    }

    // Send WhatsApp if enabled
    if (shouldSendWhatsApp && guest.phone) {
      logger.info('Sending receipt WhatsApp', { bookingId, phone: guest.phone });
      const whatsappResult = await sendReceiptWhatsApp({
        phoneNumber: guest.phone,
        guestName: guest.full_name,
        roomName: locale === 'ar' ? room.name_ar : room.name,
        totalAmount: booking.total_amount,
        paymentDate,
        receiptNumber,
        receiptDownloadUrl,
        locale,
      });

      result.whatsapp = {
        sent: whatsappResult.success,
        messageId: whatsappResult.messageId,
        error: whatsappResult.error,
      };

      if (whatsappResult.success) {
        logger.info('Receipt WhatsApp sent successfully', { bookingId, messageId: whatsappResult.messageId });
      } else {
        logger.error('Failed to send receipt WhatsApp', { bookingId, error: whatsappResult.error });
      }
    }

    // Update booking with receipt status
    const anySent = result.email.sent || result.whatsapp.sent;
    if (anySent) {
      await updateBookingLocked(bookingId, {
        receipt_sent: true,
        receipt_sent_at: now(),
      } as Partial<typeof booking> & { receipt_sent?: boolean; receipt_sent_at?: string });

      logger.info('Booking updated with receipt status', { bookingId });
    }

    result.success = anySent;
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to send receipt', { bookingId, error: errorMessage });
    result.error = errorMessage;
    return result;
  }
}

/**
 * Convenience function to send receipt for Stripe payments
 * Called automatically after successful Stripe checkout
 */
export async function sendReceiptAfterStripePayment(
  bookingId: string,
  locale: 'en' | 'ar' = 'en'
): Promise<SendReceiptResult> {
  return sendReceipt({
    bookingId,
    locale,
    sendEmail: true,
    sendWhatsApp: true,
  });
}

/**
 * Convenience function for admin to manually send receipt
 * Called when admin confirms bank transfer payment
 */
export async function sendReceiptManual(
  bookingId: string,
  locale: 'en' | 'ar' = 'en'
): Promise<SendReceiptResult> {
  return sendReceipt({
    bookingId,
    locale,
    sendEmail: true,
    sendWhatsApp: true,
  });
}

/**
 * Parameters for sending receipt with pre-fetched data
 * Used by Stripe webhook where data comes from Supabase
 */
export interface SendReceiptWithDataParams {
  bookingId: string;
  locale?: 'en' | 'ar';
  paymentDate: string;
  guest: {
    fullName: string;
    email: string | null;
    phone: string | null;
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
  sendEmail?: boolean;
  sendWhatsApp?: boolean;
}

/**
 * Sends a payment receipt using pre-fetched data
 * Used by Stripe webhook where booking data comes from Supabase
 */
export async function sendReceiptWithData(
  params: SendReceiptWithDataParams
): Promise<SendReceiptResult> {
  const {
    bookingId,
    locale = 'en',
    paymentDate,
    guest,
    room,
    booking,
    sendEmail: shouldSendEmail = true,
    sendWhatsApp: shouldSendWhatsApp = true,
  } = params;

  const result: SendReceiptResult = {
    success: false,
    email: { sent: false },
    whatsapp: { sent: false },
  };

  try {
    const receiptNumber = generateReceiptNumber(bookingId);
    const baseUrl = getBaseUrl();
    const receiptDownloadUrl = `${baseUrl}/api/receipts/download/${bookingId}`;

    // Generate receipt PDF using the provided data
    logger.info('Generating receipt PDF with provided data', { bookingId, locale });

    const receiptPDF = await generateReceiptPDFWithData({
      bookingId,
      locale,
      paymentDate,
      guest: {
        fullName: guest.fullName,
        email: guest.email || '',
        phone: guest.phone || '',
      },
      room: {
        name: room.name,
        nameAr: room.nameAr,
      },
      booking: {
        startDate: booking.startDate,
        endDate: booking.endDate,
        durationDays: booking.durationDays,
        totalAmount: booking.totalAmount,
        cleaningFee: booking.cleaningFee,
        paymentMethod: booking.paymentMethod,
      },
    });

    // Send email if enabled and email is available
    if (shouldSendEmail && guest.email) {
      logger.info('Sending receipt email', { bookingId, email: guest.email });
      const emailResult = await sendReceiptEmail({
        guestEmail: guest.email,
        guestName: guest.fullName,
        receiptPDF,
        roomName: locale === 'ar' ? room.nameAr : room.name,
        totalAmount: booking.totalAmount,
        paymentDate,
        receiptNumber,
        locale,
      });

      result.email = {
        sent: emailResult.success,
        messageId: emailResult.messageId,
        error: emailResult.error,
      };

      if (emailResult.success) {
        logger.info('Receipt email sent successfully', { bookingId, messageId: emailResult.messageId });
      } else {
        logger.error('Failed to send receipt email', { bookingId, error: emailResult.error });
      }
    }

    // Send WhatsApp if enabled and phone is available
    if (shouldSendWhatsApp && guest.phone) {
      logger.info('Sending receipt WhatsApp', { bookingId, phone: guest.phone });
      const whatsappResult = await sendReceiptWhatsApp({
        phoneNumber: guest.phone,
        guestName: guest.fullName,
        roomName: locale === 'ar' ? room.nameAr : room.name,
        totalAmount: booking.totalAmount,
        paymentDate,
        receiptNumber,
        receiptDownloadUrl,
        locale,
      });

      result.whatsapp = {
        sent: whatsappResult.success,
        messageId: whatsappResult.messageId,
        error: whatsappResult.error,
      };

      if (whatsappResult.success) {
        logger.info('Receipt WhatsApp sent successfully', { bookingId, messageId: whatsappResult.messageId });
      } else {
        logger.error('Failed to send receipt WhatsApp', { bookingId, error: whatsappResult.error });
      }
    }

    result.success = result.email.sent || result.whatsapp.sent;
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to send receipt with data', { bookingId, error: errorMessage });
    result.error = errorMessage;
    return result;
  }
}
