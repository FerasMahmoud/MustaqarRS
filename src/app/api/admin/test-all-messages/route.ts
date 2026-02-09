import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { sendWhatsAppReminder, generateRemindMessage, ReminderType, EnrichedBooking } from '@/lib/reminders';

// Get secret key for JWT verification
function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET || process.env.ADMIN_PASSWORD;
  if (!secret || secret.length < 32) {
    const baseSecret = secret || 'default-secret-change-me-in-production';
    const paddedSecret = baseSecret.padEnd(32, 'x').slice(0, 64);
    return new TextEncoder().encode(paddedSecret);
  }
  return new TextEncoder().encode(secret);
}

// Verify admin JWT token
async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });
    return payload.sub === 'admin' && payload.admin === true;
  } catch {
    return false;
  }
}

// All message types available for testing
const MESSAGE_TYPES = {
  contract_confirmation: {
    name: 'Contract Confirmation',
    description: 'Booking confirmation with contract details',
    icon: '📝',
  },
  checkin_7d: {
    name: '7-Day Check-in Reminder',
    description: 'Reminder sent 7 days before check-in',
    icon: '📅',
  },
  checkin_3d: {
    name: '3-Day Check-in Reminder',
    description: 'Reminder sent 3 days before check-in',
    icon: '📆',
  },
  pre_arrival: {
    name: 'Pre-Arrival Information',
    description: 'Door code, WiFi, and studio guide (2 days before)',
    icon: '🔑',
  },
  checkin_same: {
    name: 'Check-in Day Reminder',
    description: 'Reminder on the day of check-in',
    icon: '🏠',
  },
  checkout_7d: {
    name: '7-Day Check-out Reminder',
    description: 'Reminder sent 7 days before check-out',
    icon: '📋',
  },
  checkout_3d: {
    name: '3-Day Check-out Reminder',
    description: 'Reminder sent 3 days before check-out',
    icon: '⏰',
  },
  checkout_same: {
    name: 'Check-out Day Reminder',
    description: 'Reminder on the day of check-out',
    icon: '👋',
  },
} as const;

type MessageType = keyof typeof MESSAGE_TYPES;

// Generate contract confirmation message
function generateContractMessage(booking: EnrichedBooking): string {
  const isArabic = booking.guest_locale === 'ar';
  const startDate = new Date(booking.start_date).toLocaleDateString(
    isArabic ? 'ar-SA' : 'en-US',
    { dateStyle: 'long' }
  );
  const endDate = new Date(booking.end_date).toLocaleDateString(
    isArabic ? 'ar-SA' : 'en-US',
    { dateStyle: 'long' }
  );

  if (isArabic) {
    return `مرحباً ${booking.guest_full_name}! 🎉

تم تأكيد حجزك بنجاح!

📋 تفاصيل الحجز:
🏠 الاستوديو: استوديو فاخر
📅 تسجيل الوصول: ${startDate}
📅 تسجيل المغادرة: ${endDate}

سنرسل لك معلومات الوصول قبل يومين من تسجيل الوصول.

شكراً لاختيارك شركة مستقر! 🌟`;
  }

  return `Hello ${booking.guest_full_name}! 🎉

Your booking has been confirmed!

📋 Booking Details:
🏠 Studio: Luxury Studio
📅 Check-in: ${startDate}
📅 Check-out: ${endDate}

We'll send you access information 2 days before check-in.

Thank you for choosing شركة مستقر! 🌟`;
}

/**
 * GET /api/admin/test-all-messages
 * Returns available message types for testing
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    messageTypes: Object.entries(MESSAGE_TYPES).map(([id, info]) => ({
      id,
      ...info,
    })),
    testPhone: process.env.ADMIN_PHONE
      ? process.env.ADMIN_PHONE.slice(0, 6) + '***' + process.env.ADMIN_PHONE.slice(-2)
      : 'Not configured',
  });
}

/**
 * POST /api/admin/test-all-messages
 * Sends test messages to admin phone
 *
 * Body:
 * {
 *   "messageTypes": ["checkin_7d", "pre_arrival", ...],  // Optional: specific types to test
 *   "locale": "en" | "ar",  // Optional: language for messages
 *   "sendAll": true  // Optional: send all message types
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check for admin session
    const adminSession = request.cookies.get('admin_session');
    if (!adminSession || !adminSession.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isValid = await verifyAdminToken(adminSession.value);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    // Check if API key is configured
    const apiKey = process.env.TEXTMEBOT_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'TextMeBot API key not configured' },
        { status: 400 }
      );
    }

    // Get test phone
    const testPhone = process.env.ADMIN_PHONE;
    if (!testPhone) {
      return NextResponse.json(
        { error: 'ADMIN_PHONE not configured' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { messageTypes, locale = 'en', sendAll = false, delayMs = 2000 } = body;

    // Determine which message types to send
    let typesToSend: MessageType[] = [];

    if (sendAll) {
      typesToSend = Object.keys(MESSAGE_TYPES) as MessageType[];
    } else if (messageTypes && Array.isArray(messageTypes)) {
      typesToSend = messageTypes.filter((t: string) => t in MESSAGE_TYPES) as MessageType[];
    } else {
      return NextResponse.json(
        { error: 'Specify messageTypes array or set sendAll: true' },
        { status: 400 }
      );
    }

    if (typesToSend.length === 0) {
      return NextResponse.json(
        { error: 'No valid message types specified' },
        { status: 400 }
      );
    }

    // Create test booking data
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 7);
    const endDate = new Date(startDate);
    endDate.setMonth(startDate.getMonth() + 1);

    const testBooking: EnrichedBooking = {
      id: 'test-booking-' + Date.now(),
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      guest_locale: locale,
      guest_full_name: locale === 'ar' ? 'ضيف تجريبي' : 'Test Guest',
      guest_email: 'test@example.com',
      guest_phone: testPhone,
      door_code: '1234#',
      wifi_network: 'MustaqarRS_Guest',
      wifi_password: 'Welcome2026',
      checkin_time: '3:00 PM',
      checkout_time: '12:00 PM',
      studio_guide_url: 'https://mustaqar.vercel.app/guide',
    };

    const results: Array<{
      type: MessageType;
      name: string;
      success: boolean;
      error?: string;
      messagePreview?: string;
    }> = [];

    // Send each message type with delay to avoid rate limiting
    for (let i = 0; i < typesToSend.length; i++) {
      const msgType = typesToSend[i];
      const typeInfo = MESSAGE_TYPES[msgType];

      // Add delay between messages (except for first one)
      if (i > 0 && delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }

      try {
        let messageToSend: string;

        if (msgType === 'contract_confirmation') {
          messageToSend = generateContractMessage(testBooking);
        } else {
          const reminderMessages = generateRemindMessage(testBooking, msgType as ReminderType);
          messageToSend = reminderMessages.whatsappMessage;
        }

        // Add test prefix to message
        const testPrefix = locale === 'ar'
          ? `🧪 رسالة تجريبية - ${typeInfo.name}\n\n`
          : `🧪 TEST MESSAGE - ${typeInfo.name}\n\n`;

        const finalMessage = testPrefix + messageToSend;

        console.log(`Sending test message: ${msgType}`);
        const result = await sendWhatsAppReminder(testPhone, finalMessage);

        results.push({
          type: msgType,
          name: typeInfo.name,
          success: result.success,
          error: result.error,
          messagePreview: messageToSend.substring(0, 100) + '...',
        });
      } catch (error) {
        results.push({
          type: msgType,
          name: typeInfo.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    return NextResponse.json({
      success: failCount === 0,
      summary: {
        total: results.length,
        sent: successCount,
        failed: failCount,
      },
      results,
      testPhone: testPhone.slice(0, 6) + '***' + testPhone.slice(-2),
      locale,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Test all messages error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send test messages' },
      { status: 500 }
    );
  }
}
