import { NextRequest, NextResponse } from 'next/server';
import { generateReceiptPDF } from '@/lib/pdf/generate-receipt';
import { getBookingById } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * GET /api/receipts/download/[bookingId]
 *
 * Downloads a payment receipt PDF for a booking.
 * This endpoint is used for WhatsApp download links.
 *
 * Query params:
 * - locale: 'en' | 'ar' (optional, defaults to booking's guest_locale)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;

    // Validate booking exists
    const booking = getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify payment is completed
    if (booking.payment_status !== 'paid' && booking.status !== 'confirmed') {
      return NextResponse.json(
        { error: 'Receipt not available: Payment not confirmed' },
        { status: 403 }
      );
    }

    // Get locale from query params or booking
    const searchParams = request.nextUrl.searchParams;
    const locale = (searchParams.get('locale') as 'en' | 'ar') ||
                   (booking.guest_locale as 'en' | 'ar') ||
                   'en';

    logger.info('Generating receipt PDF for download', { bookingId, locale });

    // Generate the receipt PDF
    const pdfBuffer = await generateReceiptPDF({ bookingId, locale });

    // Generate filename with receipt number
    const receiptNumber = bookingId.slice(0, 8).toUpperCase();
    const filename = `payment-receipt-${receiptNumber}.pdf`;

    // Convert Buffer to Uint8Array for NextResponse compatibility
    const pdfUint8Array = new Uint8Array(pdfBuffer);

    // Return PDF with proper headers for download
    return new NextResponse(pdfUint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        // Cache for 1 hour - receipts don't change often
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to generate receipt PDF', { error: errorMessage });

    return NextResponse.json(
      { error: 'Failed to generate receipt' },
      { status: 500 }
    );
  }
}
