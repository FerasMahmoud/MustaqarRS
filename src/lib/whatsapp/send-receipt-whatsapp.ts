/**
 * WhatsApp messaging service for payment receipts using TextMeBot API
 * Sends payment confirmation and receipt download link via WhatsApp
 */

export interface SendReceiptWhatsAppParams {
  phoneNumber: string;
  guestName: string;
  roomName: string;
  totalAmount: number;
  paymentDate: string;
  receiptNumber: string;
  receiptDownloadUrl: string;
  locale: 'en' | 'ar';
}

/**
 * Sends payment receipt information via WhatsApp using TextMeBot API
 */
export async function sendReceiptWhatsApp(
  params: SendReceiptWhatsAppParams
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Validate required environment variables
    if (!process.env.TEXTMEBOT_API_KEY) {
      throw new Error('TEXTMEBOT_API_KEY environment variable is not set');
    }

    const apiUrl = process.env.TEXTMEBOT_API_URL || 'https://api.textmebot.com/send';

    // Normalize phone number (remove +, add country code if needed)
    const normalizedPhone = params.phoneNumber
      .replace(/^\+/, '')
      .replace(/[^\d]/g, '');

    // Ensure Saudi Arabia country code (966)
    const whatsappNumber = normalizedPhone.startsWith('966')
      ? normalizedPhone
      : `966${normalizedPhone.replace(/^0/, '')}`;

    // Prepare message content based on locale
    const isArabic = params.locale === 'ar';

    const formattedDate = new Date(params.paymentDate).toLocaleDateString(
      isArabic ? 'ar-SA' : 'en-US'
    );
    const formattedAmount = params.totalAmount.toLocaleString();

    const messageText = isArabic
      ? `مرحباً ${params.guestName}،

✅ *تم استلام دفعتك بنجاح!*

📄 *تفاصيل الدفع:*
• رقم الإيصال: ${params.receiptNumber}
• الوحدة: ${params.roomName}
• تاريخ الدفع: ${formattedDate}
• المبلغ المدفوع: ${formattedAmount} ريال

🧾 *تحميل الإيصال:*
${params.receiptDownloadUrl}

شكراً لاختيارك لنا! 🏠`
      : `Hello ${params.guestName},

✅ *Payment Received Successfully!*

📄 *Payment Details:*
• Receipt #: ${params.receiptNumber}
• Unit: ${params.roomName}
• Payment Date: ${formattedDate}
• Amount Paid: ${formattedAmount} SAR

🧾 *Download Receipt:*
${params.receiptDownloadUrl}

Thank you for choosing us! 🏠`;

    // Send message via TextMeBot API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.TEXTMEBOT_API_KEY}`,
      },
      body: JSON.stringify({
        phone: whatsappNumber,
        message: messageText,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `TextMeBot API error: ${response.status} ${(errorData as { message?: string }).message || response.statusText}`
      );
    }

    const data = await response.json() as { id?: string; messageId?: string };

    return {
      success: true,
      messageId: data.id || data.messageId,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to send receipt WhatsApp message:', errorMessage);
    return {
      success: false,
      error: `Failed to send WhatsApp: ${errorMessage}`,
    };
  }
}
