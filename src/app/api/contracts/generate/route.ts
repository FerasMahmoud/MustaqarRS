import { NextRequest, NextResponse } from 'next/server';
import { generateContractPDF } from '@/lib/pdf/generate-contract';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { bookingId, locale = 'en' } = body;

    // Validate required parameters
    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId is required' },
        { status: 400 }
      );
    }

    if (!['en', 'ar'].includes(locale)) {
      return NextResponse.json(
        { error: 'locale must be "en" or "ar"' },
        { status: 400 }
      );
    }

    // Generate PDF
    const pdfBuffer = await generateContractPDF({
      bookingId,
      locale,
    });

    // Return PDF as file download
    const filename = `rental-agreement-${bookingId}-${locale}.pdf`;

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Contract generation error:', errorMessage);

    return NextResponse.json(
      {
        error: 'Failed to generate contract',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
