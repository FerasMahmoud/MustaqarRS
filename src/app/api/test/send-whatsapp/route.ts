import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppReminder, generateRemindMessage } from '@/lib/reminders';

/**
 * Test endpoint to send a WhatsApp message
 *
 * Usage:
 * POST /api/test/send-whatsapp
 *
 * Body:
 * {
 *   "phone": "966501234567",  // or "05012345627"
 *   "message": "Test message"
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const { phone, message, reminderType, bookingData } = await request.json();

    // Validate required fields
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    if (!message && !reminderType) {
      return NextResponse.json(
        { error: 'Either message or reminderType is required' },
        { status: 400 }
      );
    }

    console.log(`Test WhatsApp send to: ${phone}`);

    let messageToSend = message;

    // If reminderType is provided, generate the message from template
    if (reminderType && bookingData) {
      const enrichedBooking = {
        id: bookingData.id || 'test-booking-id',
        guest_full_name: bookingData.guestName || 'Guest',
        guest_phone: phone,
        guest_email: bookingData.email,
        guest_locale: bookingData.locale || 'en',
        start_date: bookingData.startDate,
        end_date: bookingData.endDate,
        door_code: bookingData.doorCode || '1234',
        wifi_network: bookingData.wifiNetwork || 'StudioGUEST',
        wifi_password: bookingData.wifiPassword || 'Password123',
        checkin_time: bookingData.checkinTime || '15:00',
        checkout_time: bookingData.checkoutTime || '12:00',
        studio_guide_url: bookingData.studioGuideUrl || 'https://example.com/guide'
      };

      const messages = generateRemindMessage(enrichedBooking, reminderType);
      messageToSend = messages.whatsappMessage;

      console.log('Generated message from template:', {
        reminderType,
        locale: enrichedBooking.guest_locale,
        messageLength: messageToSend.length
      });
    }

    // Send the WhatsApp message
    const result = await sendWhatsAppReminder(phone, messageToSend);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'WhatsApp message sent successfully',
        phone: phone,
        messageLength: messageToSend.length,
        messagePreview: messageToSend.substring(0, 100) + '...',
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          phone: phone,
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Test WhatsApp error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET endpoint with example
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'WhatsApp Test Endpoint',
    method: 'POST',
    examples: [
      {
        name: 'Simple message',
        body: {
          phone: '966501234567',
          message: 'Hello! This is a test message from Studio Rentals.'
        }
      },
      {
        name: 'Generate 7-day check-in reminder (English)',
        body: {
          phone: '966501234567',
          reminderType: 'checkin_7d',
          bookingData: {
            guestName: 'Ahmed',
            email: 'ahmed@example.com',
            locale: 'en',
            startDate: '2026-01-14',
            endDate: '2026-02-13',
            doorCode: '1234',
            wifiNetwork: 'StudioGUEST_Modern',
            wifiPassword: 'WelcomeToStudio2024',
            checkinTime: '15:00',
            checkoutTime: '12:00',
            studioGuideUrl: 'https://app.studio-rentals.com/guides/modern-studio'
          }
        }
      },
      {
        name: 'Generate pre-arrival reminder (Arabic)',
        body: {
          phone: '966501234567',
          reminderType: 'pre_arrival',
          bookingData: {
            guestName: 'محمد',
            email: 'mohammed@example.com',
            locale: 'ar',
            startDate: '2026-01-09',
            endDate: '2026-02-08',
            doorCode: '5678',
            wifiNetwork: 'StudioGUEST_Comfort',
            wifiPassword: 'ComfortStay2024',
            checkinTime: '15:00',
            checkoutTime: '12:00',
            studioGuideUrl: 'https://app.studio-rentals.com/guides/comfort-studio'
          }
        }
      }
    ]
  });
}
