/**
 * WhatsApp messaging service using TextMeBot API
 * Sends booking confirmation and contract information via WhatsApp
 */

import { isWhatsAppEnabled, isAutomationEnabled } from '@/lib/db';

export interface SendContractWhatsAppParams {
  phoneNumber: string;
  guestName: string;
  roomName: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  contractDownloadUrl: string;
  locale: 'en' | 'ar';
}

/**
 * Sends contract information via WhatsApp using TextMeBot API
 */
export async function sendContractWhatsApp(
  params: SendContractWhatsAppParams
): Promise<{ success: boolean; messageId?: string; error?: string; skipped?: string }> {
  try {
    // Check if WhatsApp is globally enabled
    if (!isWhatsAppEnabled()) {
      console.log('WhatsApp notifications disabled in admin settings. Skipping contract message.');
      return { success: true, skipped: 'whatsapp_disabled' };
    }

    // Check if contract WhatsApp automation is enabled
    if (!isAutomationEnabled('automation_contract_whatsapp')) {
      console.log('Contract WhatsApp automation disabled in admin settings. Skipping message.');
      return { success: true, skipped: 'automation_disabled' };
    }

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

    const messageText = isArabic
      ? `مرحباً ${params.guestName}،\n\n✅ تم تأكيد حجزك معنا!\n\n📋 تفاصيل الحجز:\n• الوحدة: ${params.roomName}\n• تاريخ البداية: ${new Date(params.startDate).toLocaleDateString('ar-SA')}\n• تاريخ النهاية: ${new Date(params.endDate).toLocaleDateString('ar-SA')}\n• الإجمالي: ${params.totalAmount.toLocaleString()} ريال\n\n📄 عقد الإيجار الخاص بك:\n${params.contractDownloadUrl}\n\nشكراً لاختيارك لنا! 🏠`
      : `Hello ${params.guestName},\n\n✅ Your booking has been confirmed!\n\n📋 Booking Details:\n• Unit: ${params.roomName}\n• Check-in: ${new Date(params.startDate).toLocaleDateString('en-US')}\n• Check-out: ${new Date(params.endDate).toLocaleDateString('en-US')}\n• Total: ${params.totalAmount.toLocaleString()} SAR\n\n📄 Your Rental Agreement:\n${params.contractDownloadUrl}\n\nThank you for choosing us! 🏠`;

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
        `TextMeBot API error: ${response.status} ${errorData.message || response.statusText}`
      );
    }

    const data = await response.json();

    return {
      success: true,
      messageId: data.id || data.messageId,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to send WhatsApp message:', errorMessage);
    return {
      success: false,
      error: `Failed to send WhatsApp: ${errorMessage}`,
    };
  }
}

/**
 * Formats a phone number for WhatsApp (adds country code if needed)
 */
export function formatWhatsAppNumber(phoneNumber: string): string {
  const cleaned = phoneNumber.replace(/[^\d]/g, '');

  // If it starts with 0 (Saudi format), replace with 966
  if (cleaned.startsWith('0')) {
    return `966${cleaned.slice(1)}`;
  }

  // If it doesn't have country code, add Saudi Arabia's 966
  if (!cleaned.startsWith('966')) {
    return `966${cleaned}`;
  }

  return cleaned;
}
