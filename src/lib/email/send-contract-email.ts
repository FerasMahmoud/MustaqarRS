import { Resend } from 'resend';

export interface SendContractEmailParams {
  guestEmail: string;
  guestName: string;
  contractPDF: Buffer;
  roomName: string;
  startDate: string;
  endDate: string;
  locale: 'en' | 'ar';
}

// Lazy-load Resend client to avoid build-time errors
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }
  return new Resend(apiKey);
}

/**
 * Sends a booking confirmation email with the contract PDF attachment
 */
export async function sendContractEmail(
  params: SendContractEmailParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const resend = getResendClient();

    // Prepare email content based on locale
    const isArabic = params.locale === 'ar';
    const subject = isArabic
      ? 'عقد الإيجار الخاص بك - Rental Agreement'
      : 'Your Rental Agreement - عقد الإيجار الخاص بك';

    const emailHtml = isArabic
      ? `
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 20px;">
          <h2 style="color: #2C1810; margin-bottom: 20px;">مرحباً بك ${params.guestName}</h2>

          <p style="color: #333; line-height: 1.6; margin-bottom: 15px;">
            شكراً لحجزك معنا! يرجى العثور على عقد الإيجار الخاص بك مرفقاً بهذا البريد الإلكتروني.
          </p>

          <div style="background-color: #F5F0EB; padding: 15px; border-right: 4px solid #D4A574; margin: 20px 0;">
            <p style="margin: 5px 0; color: #2C1810;"><strong>تفاصيل الحجز:</strong></p>
            <p style="margin: 5px 0; color: #333;">الوحدة: ${params.roomName}</p>
            <p style="margin: 5px 0; color: #333;">تاريخ البداية: ${new Date(params.startDate).toLocaleDateString('ar-SA')}</p>
            <p style="margin: 5px 0; color: #333;">تاريخ النهاية: ${new Date(params.endDate).toLocaleDateString('ar-SA')}</p>
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            إذا كان لديك أي أسئلة، يرجى الاتصال بنا على +966531182200 أو البريد الإلكتروني Firas@fitechco.com
          </p>

          <p style="color: #999; font-size: 10px; margin-top: 20px; border-top: 1px solid #E0D5C7; padding-top: 15px;">
            هذا البريد الإلكتروني تم إنشاؤه تلقائياً. يرجى عدم الرد على هذا البريد.
          </p>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #2C1810; margin-bottom: 20px;">Welcome ${params.guestName}</h2>

          <p style="color: #333; line-height: 1.6; margin-bottom: 15px;">
            Thank you for your booking with us! Please find your rental agreement attached to this email.
          </p>

          <div style="background-color: #F5F0EB; padding: 15px; border-left: 4px solid #D4A574; margin: 20px 0;">
            <p style="margin: 5px 0; color: #2C1810;"><strong>Booking Details:</strong></p>
            <p style="margin: 5px 0; color: #333;">Unit: ${params.roomName}</p>
            <p style="margin: 5px 0; color: #333;">Check-in Date: ${new Date(params.startDate).toLocaleDateString('en-US')}</p>
            <p style="margin: 5px 0; color: #333;">Check-out Date: ${new Date(params.endDate).toLocaleDateString('en-US')}</p>
          </div>

          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            If you have any questions, please contact us at +966531182200 or email Firas@fitechco.com
          </p>

          <p style="color: #999; font-size: 10px; margin-top: 20px; border-top: 1px solid #E0D5C7; padding-top: 15px;">
            This email was generated automatically. Please do not reply to this email.
          </p>
        </div>
      `;

    // Send email with PDF attachment
    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@studio-rentals.com',
      to: params.guestEmail,
      subject: subject,
      html: emailHtml,
      attachments: [
        {
          filename: `rental-agreement-${new Date().getTime()}.pdf`,
          content: params.contractPDF,
        },
      ],
    });

    if ('error' in response && response.error) {
      return {
        success: false,
        error: `Resend API error: ${(response.error as any).message || 'Unknown error'}`,
      };
    }

    return {
      success: true,
      messageId: (response as any).id || (response as any).data?.id || 'sent',
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to send contract email:', errorMessage);
    return {
      success: false,
      error: `Failed to send email: ${errorMessage}`,
    };
  }
}
