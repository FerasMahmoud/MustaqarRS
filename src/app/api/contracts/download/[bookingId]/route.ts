import { NextRequest, NextResponse } from 'next/server';
import { generateContractPDF } from '@/lib/pdf/generate-contract';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;
    const locale = (request.nextUrl.searchParams.get('locale') || 'en') as
      | 'en'
      | 'ar';

    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId is required' },
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
        'Content-Disposition': `inline; filename="${filename}"`, // inline for viewing in browser
        'Cache-Control': 'max-age=86400, public', // Cache for 24 hours
      },
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Contract download error:', errorMessage);

    return NextResponse.json(
      {
        error: 'Failed to download contract',
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
