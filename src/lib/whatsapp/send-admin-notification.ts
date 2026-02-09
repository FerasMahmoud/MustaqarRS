/**
 * WhatsApp notification service for admin alerts
 * Sends real-time booking notifications to admin via WhatsApp
 */

import { getAdminSettings } from '@/lib/db';
import { formatWhatsAppNumber } from './send-contract-whatsapp';

export type AdminNotificationType =
  | 'booking_created'      // New booking attempt
  | 'payment_confirmed'    // Stripe payment confirmed
  | 'bank_transfer_pending'; // Bank transfer booking awaiting payment

export interface AdminNotificationParams {
  type: AdminNotificationType;
  guestName: string;
  roomName: string;
  totalAmount: number;
  bookingId?: string;
  paymentMethod?: 'stripe' | 'bank_transfer' | 'cash';
}

/**
 * Check if admin notifications are enabled for a specific type
 */
function isAdminNotificationEnabled(type: AdminNotificationType): boolean {
  const settings = getAdminSettings();

  // Must have a phone number configured
  if (!settings.admin_whatsapp_number) {
    return false;
  }

  // Check specific notification type
  switch (type) {
    case 'booking_created':
      return settings.admin_notify_booking_created;
    case 'payment_confirmed':
      return settings.admin_notify_payment_confirmed;
    case 'bank_transfer_pending':
      return settings.admin_notify_bank_transfer;
    default:
      return false;
  }
}

/**
 * Generate notification message based on type
 */
function generateAdminMessage(params: AdminNotificationParams): string {
  const amount = params.totalAmount.toLocaleString();

  switch (params.type) {
    case 'booking_created':
      return `🔔 *New Booking Attempt*\n\n` +
        `👤 Guest: ${params.guestName}\n` +
        `🏠 Room: ${params.roomName}\n` +
        `💰 Amount: ${amount} SAR\n` +
        `💳 Method: ${params.paymentMethod || 'pending'}\n` +
        `${params.bookingId ? `📋 ID: ${params.bookingId}` : ''}\n\n` +
        `⏰ ${new Date().toLocaleString('en-SA')}`;

    case 'payment_confirmed':
      return `✅ *Payment Confirmed!*\n\n` +
        `👤 Guest: ${params.guestName}\n` +
        `🏠 Room: ${params.roomName}\n` +
        `💰 Amount: ${amount} SAR\n` +
        `💳 Paid via: Stripe\n` +
        `${params.bookingId ? `📋 Booking ID: ${params.bookingId}` : ''}\n\n` +
        `🎉 Booking is now confirmed!`;

    case 'bank_transfer_pending':
      return `🏦 *Bank Transfer Booking*\n\n` +
        `👤 Guest: ${params.guestName}\n` +
        `🏠 Room: ${params.roomName}\n` +
        `💰 Amount: ${amount} SAR\n` +
        `⏳ Status: Awaiting Payment\n` +
        `${params.bookingId ? `📋 Booking ID: ${params.bookingId}` : ''}\n\n` +
        `📢 Please confirm payment when received.`;

    default:
      return `📌 Booking Update for ${params.roomName}`;
  }
}

/**
 * Sends admin notification via WhatsApp using TextMeBot API
 */
export async function sendAdminNotification(
  params: AdminNotificationParams
): Promise<{ success: boolean; messageId?: string; error?: string; skipped?: string }> {
  try {
    // Check if this notification type is enabled
    if (!isAdminNotificationEnabled(params.type)) {
      console.log(`Admin notification (${params.type}) disabled or phone not configured. Skipping.`);
      return { success: true, skipped: 'notification_disabled' };
    }

    // Validate API key
    if (!process.env.TEXTMEBOT_API_KEY) {
      throw new Error('TEXTMEBOT_API_KEY environment variable is not set');
    }

    // Check for demo mode
    if (process.env.TEXTMEBOT_DEMO_MODE === 'true') {
      console.log(`[DEMO MODE] Admin notification (${params.type}):`, params);
      return { success: true, skipped: 'demo_mode' };
    }

    const settings = getAdminSettings();
    const apiUrl = process.env.TEXTMEBOT_API_URL || 'https://api.textmebot.com/send';

    // Format admin phone number
    const whatsappNumber = formatWhatsAppNumber(settings.admin_whatsapp_number);

    // Generate message
    const messageText = generateAdminMessage(params);

    // Send via TextMeBot API
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
    console.log(`Admin notification (${params.type}) sent successfully to ${whatsappNumber}`);

    return {
      success: true,
      messageId: data.id || data.messageId,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to send admin WhatsApp notification:', errorMessage);
    return {
      success: false,
      error: `Failed to send admin notification: ${errorMessage}`,
    };
  }
}

/**
 * Test admin notification (for admin panel testing)
 */
export async function testAdminNotification(): Promise<{ success: boolean; error?: string }> {
  const settings = getAdminSettings();

  if (!settings.admin_whatsapp_number) {
    return { success: false, error: 'Admin phone number not configured' };
  }

  if (!process.env.TEXTMEBOT_API_KEY) {
    return { success: false, error: 'TEXTMEBOT_API_KEY not configured' };
  }

  const apiUrl = process.env.TEXTMEBOT_API_URL || 'https://api.textmebot.com/send';
  const whatsappNumber = formatWhatsAppNumber(settings.admin_whatsapp_number);

  const testMessage = `✅ *Test Notification*\n\n` +
    `This is a test message from your Studio Rentals admin panel.\n\n` +
    `Your admin notifications are working correctly!\n\n` +
    `⏰ ${new Date().toLocaleString('en-SA')}`;

  try {
    if (process.env.TEXTMEBOT_DEMO_MODE === 'true') {
      console.log('[DEMO MODE] Test admin notification sent');
      return { success: true };
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.TEXTMEBOT_API_KEY}`,
      },
      body: JSON.stringify({
        phone: whatsappNumber,
        message: testMessage,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || response.statusText);
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}
