import { Resend } from 'resend';

export interface SendReceiptEmailParams {
  guestEmail: string;
  guestName: string;
  receiptPDF: Buffer;
  roomName: string;
  totalAmount: number;
  paymentDate: string;
  receiptNumber: string;
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
 * Sends a payment receipt email with the receipt PDF attachment
 */
export async function sendReceiptEmail(
  params: SendReceiptEmailParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const resend = getResendClient();

    // Prepare email content based on locale
    const isArabic = params.locale === 'ar';
    const subject = isArabic
      ? 'إيصال الدفع الخاص بك - Payment Receipt'
      : 'Your Payment Receipt - إيصال الدفع الخاص بك';

    const formattedDate = new Date(params.paymentDate).toLocaleDateString(
      isArabic ? 'ar-SA' : 'en-US'
    );
    const formattedAmount = params.totalAmount.toLocaleString();

    const emailHtml = isArabic
      ? `
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 20px; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #2C1810; padding: 20px; text-align: center;">
            <h1 style="color: #D4A574; margin: 0; font-size: 24px;">إيصال الدفع</h1>
          </div>

          <div style="padding: 20px; background-color: #ffffff;">
            <h2 style="color: #2C1810; margin-bottom: 20px;">مرحباً ${params.guestName}</h2>

            <div style="background-color: #22c55e; color: white; padding: 15px; text-align: center; border-radius: 8px; margin-bottom: 20px;">
              <span style="font-size: 20px; font-weight: bold;">✓ تم استلام دفعتك بنجاح</span>
            </div>

            <p style="color: #333; line-height: 1.6; margin-bottom: 15px;">
              شكراً لك! تم تأكيد دفعتك بنجاح. يرجى العثور على إيصال الدفع الرسمي مرفقاً بهذا البريد الإلكتروني.
            </p>

            <div style="background-color: #F5F0EB; padding: 15px; border-right: 4px solid #D4A574; margin: 20px 0;">
              <p style="margin: 5px 0; color: #2C1810;"><strong>تفاصيل الدفع:</strong></p>
              <p style="margin: 5px 0; color: #333;">رقم الإيصال: ${params.receiptNumber}</p>
              <p style="margin: 5px 0; color: #333;">الوحدة: ${params.roomName}</p>
              <p style="margin: 5px 0; color: #333;">تاريخ الدفع: ${formattedDate}</p>
              <p style="margin: 10px 0; color: #2C1810; font-size: 18px;"><strong>المبلغ المدفوع: ${formattedAmount} ريال</strong></p>
            </div>

            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              إذا كان لديك أي أسئلة، يرجى الاتصال بنا على +966531182200 أو البريد الإلكتروني Firas@fitechco.com
            </p>
          </div>

          <div style="background-color: #F5F0EB; padding: 15px; text-align: center; border-top: 2px solid #D4A574;">
            <p style="color: #999; font-size: 10px; margin: 0;">
              هذا البريد الإلكتروني تم إنشاؤه تلقائياً. يرجى عدم الرد على هذا البريد.
            </p>
          </div>
        </div>
      `
      : `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #2C1810; padding: 20px; text-align: center;">
            <h1 style="color: #D4A574; margin: 0; font-size: 24px;">Payment Receipt</h1>
          </div>

          <div style="padding: 20px; background-color: #ffffff;">
            <h2 style="color: #2C1810; margin-bottom: 20px;">Hello ${params.guestName}</h2>

            <div style="background-color: #22c55e; color: white; padding: 15px; text-align: center; border-radius: 8px; margin-bottom: 20px;">
              <span style="font-size: 20px; font-weight: bold;">✓ Payment Received Successfully</span>
            </div>

            <p style="color: #333; line-height: 1.6; margin-bottom: 15px;">
              Thank you! Your payment has been confirmed successfully. Please find your official payment receipt attached to this email.
            </p>

            <div style="background-color: #F5F0EB; padding: 15px; border-left: 4px solid #D4A574; margin: 20px 0;">
              <p style="margin: 5px 0; color: #2C1810;"><strong>Payment Details:</strong></p>
              <p style="margin: 5px 0; color: #333;">Receipt #: ${params.receiptNumber}</p>
              <p style="margin: 5px 0; color: #333;">Unit: ${params.roomName}</p>
              <p style="margin: 5px 0; color: #333;">Payment Date: ${formattedDate}</p>
              <p style="margin: 10px 0; color: #2C1810; font-size: 18px;"><strong>Amount Paid: ${formattedAmount} SAR</strong></p>
            </div>

            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              If you have any questions, please contact us at +966531182200 or email Firas@fitechco.com
            </p>
          </div>

          <div style="background-color: #F5F0EB; padding: 15px; text-align: center; border-top: 2px solid #D4A574;">
            <p style="color: #999; font-size: 10px; margin: 0;">
              This email was generated automatically. Please do not reply to this email.
            </p>
          </div>
        </div>
      `;

    // Send email with PDF attachment
    const response = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@mustaqar.com',
      to: params.guestEmail,
      subject: subject,
      html: emailHtml,
      attachments: [
        {
          filename: `payment-receipt-${params.receiptNumber}.pdf`,
          content: params.receiptPDF,
        },
      ],
    });

    if ('error' in response && response.error) {
      return {
        success: false,
        error: `Resend API error: ${(response.error as { message?: string }).message || 'Unknown error'}`,
      };
    }

    return {
      success: true,
      messageId: (response as { id?: string }).id || (response as { data?: { id?: string } }).data?.id || 'sent',
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to send receipt email:', errorMessage);
    return {
      success: false,
      error: `Failed to send email: ${errorMessage}`,
    };
  }
}
