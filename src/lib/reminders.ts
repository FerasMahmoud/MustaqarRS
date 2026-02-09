import { getSupabaseClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { isAutomationEnabled, isWhatsAppEnabled } from '@/lib/db';

// Type definitions for reminder system
export type ReminderType =
  | 'checkin_7d'
  | 'checkin_3d'
  | 'checkin_same'
  | 'pre_arrival'
  | 'checkout_7d'
  | 'checkout_3d'
  | 'checkout_same';

export interface ReminderGuest {
  full_name: string;
  email: string | null;
  phone: string | null;
}

export interface ReminderRoom {
  name: string;
  name_ar: string | null;
  door_code: string | null;
  wifi_network: string | null;
  wifi_password: string | null;
  checkin_time: string | null;
  checkout_time: string | null;
  studio_guide_url: string | null;
}

// Supabase returns nested relations - can be object or array depending on relationship type
export interface ReminderBookingRaw {
  id: string;
  start_date: string;
  end_date: string;
  guest_locale: string | null;
  reminders_enabled: boolean;
  checkin_reminder_7d_sent: boolean | null;
  checkin_reminder_3d_sent: boolean | null;
  checkin_reminder_same_sent: boolean | null;
  checkout_reminder_7d_sent: boolean | null;
  checkout_reminder_3d_sent: boolean | null;
  checkout_reminder_same_sent: boolean | null;
  pre_arrival_sent: boolean | null;
  guests: ReminderGuest | ReminderGuest[] | null;
  rooms: ReminderRoom | ReminderRoom[] | null;
}

// Helper to safely extract single record from Supabase relation
function extractSingle<T>(data: T | T[] | null): T | null {
  if (data === null) return null;
  if (Array.isArray(data)) return data[0] ?? null;
  return data;
}

export interface EnrichedBooking {
  id: string;
  start_date: string;
  end_date: string;
  guest_locale: string | null;
  guest_full_name: string;
  guest_email: string | null;
  guest_phone: string | null;
  door_code: string | null;
  wifi_network: string | null;
  wifi_password: string | null;
  checkin_time: string | null;
  checkout_time: string | null;
  studio_guide_url: string | null;
}

export interface ReminderMessage {
  subject: string;
  body: string;
  whatsappMessage: string;
}

// Get Supabase admin client for write operations
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.warn('Service role key not available, falling back to public client');
    return null;
  }

  return createClient(url, key);
}

// Helper to calculate days until a date
export function getDaysUntil(dateString: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(dateString);
  targetDate.setHours(0, 0, 0, 0);

  return Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// Generate bilingual reminder message
export function generateRemindMessage(
  booking: EnrichedBooking,
  reminderType: ReminderType
): ReminderMessage {
  const isArabic = booking.guest_locale === 'ar';
  const isCheckin = reminderType.includes('checkin') || reminderType === 'pre_arrival';
  const targetDate = isCheckin ? new Date(booking.start_date) : new Date(booking.end_date);

  const formattedDate = isArabic
    ? targetDate.toLocaleDateString('ar-SA', { dateStyle: 'long' })
    : targetDate.toLocaleDateString('en-US', { dateStyle: 'long' });

  if (reminderType === 'pre_arrival') {
    // Pre-arrival welcome message
    const emailSubject = isArabic
      ? 'مرحباً بك في الاستوديو! معلومات تسجيل الوصول 🔑'
      : 'Welcome to Studio! Check-in Information 🔑';

    const emailBody = isArabic
      ? `<div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
          <h2>مرحباً ${booking.guest_full_name}،</h2>
          <p>تسجيل وصولك بعد يومين! إليك كل ما تحتاج إلى معرفته:</p>
          <div style="background: #FFF9E6; padding: 20px; border-right: 4px solid #D4A574; margin: 20px 0;">
            <h3>🚪 معلومات الوصول:</h3>
            <p><strong>رمز الباب:</strong> ${booking.door_code || 'تواصل معنا'}</p>
            <p><strong>شبكة WiFi:</strong> ${booking.wifi_network || 'متاحة عند تسجيل الوصول'}</p>
            <p><strong>كلمة مرور WiFi:</strong> ${booking.wifi_password || 'متاحة عند تسجيل الوصول'}</p>
          </div>
          <div style="background: #F5F0EB; padding: 20px; border-right: 4px solid #D4A574; margin: 20px 0;">
            <h3>⏰ تفاصيل تسجيل الوصول:</h3>
            <p>التاريخ: ${formattedDate}</p>
            <p>الوقت: ${booking.checkin_time || '3:00 مساءً'}</p>
          </div>
          <p><a href="${booking.studio_guide_url || '#'}" style="color: #D4A574; text-decoration: none;">📖 دليل الاستوديو</a></p>
          <p>نتطلع لاستضافتك!</p>
        </div>`
      : `<div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
          <h2>Hello ${booking.guest_full_name},</h2>
          <p>Your check-in is in 2 days! Here's everything you need to know:</p>
          <div style="background: #FFF9E6; padding: 20px; border-left: 4px solid #D4A574; margin: 20px 0;">
            <h3>🚪 Access Information:</h3>
            <p><strong>Door Code:</strong> ${booking.door_code || 'Contact us'}</p>
            <p><strong>WiFi Network:</strong> ${booking.wifi_network || 'Available at check-in'}</p>
            <p><strong>WiFi Password:</strong> ${booking.wifi_password || 'Available at check-in'}</p>
          </div>
          <div style="background: #F5F0EB; padding: 20px; border-left: 4px solid #D4A574; margin: 20px 0;">
            <h3>⏰ Check-in Details:</h3>
            <p>Date: ${formattedDate}</p>
            <p>Time: ${booking.checkin_time || '3:00 PM'}</p>
          </div>
          <p><a href="${booking.studio_guide_url || '#'}" style="color: #D4A574; text-decoration: none;">📖 Studio Guide</a></p>
          <p>Looking forward to hosting you!</p>
        </div>`;

    const whatsappMessage = isArabic
      ? `مرحباً ${booking.guest_full_name}!\n\nتسجيل وصولك بعد يومين! 🏠\n\n🚪 رمز الباب: ${booking.door_code || 'تواصل معنا'}\nWiFi: ${booking.wifi_network}\n⏰ وقت الوصول: ${booking.checkin_time}\n\nنتطلع لاستضافتك! 🎉`
      : `Hello ${booking.guest_full_name}!\n\nYour check-in is in 2 days! 🏠\n\n🚪 Door Code: ${booking.door_code || 'Contact us'}\nWiFi: ${booking.wifi_network}\n⏰ Check-in Time: ${booking.checkin_time}\n\nLooking forward to hosting you! 🎉`;

    return {
      subject: emailSubject,
      body: emailBody,
      whatsappMessage
    };
  } else {
    // Regular reminders
    const daysText = reminderType.includes('same')
      ? (isArabic ? 'اليوم' : 'today')
      : reminderType.includes('7d')
      ? (isArabic ? '7 أيام' : '7 days')
      : reminderType.includes('3d')
      ? (isArabic ? '3 أيام' : '3 days')
      : '';

    const isCheckout = reminderType.includes('checkout');
    const actionText = isCheckout
      ? (isArabic ? 'تسجيل المغادرة' : 'check-out')
      : (isArabic ? 'تسجيل الوصول' : 'check-in');

    const timeLabel = isCheckout
      ? (isArabic ? 'وقت المغادرة' : 'Check-out Time')
      : (isArabic ? 'وقت الوصول' : 'Check-in Time');

    const time = isCheckout ? booking.checkout_time : booking.checkin_time;

    const emailSubject = isArabic
      ? `تذكير ${actionText} - ${daysText} ⏰`
      : `${actionText} Reminder - ${daysText} ⏰`;

    const emailBody = isArabic
      ? `<div dir="rtl" style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>مرحباً ${booking.guest_full_name}،</h2>
          <p>${actionText} بعد ${daysText}!</p>
          <div style="background: #F5F0EB; padding: 15px; border-right: 4px solid #D4A574;">
            <p><strong>📅 ${actionText}:</strong> ${formattedDate}</p>
            <p><strong>⏰ ${timeLabel}:</strong> ${time}</p>
          </div>
          <p>الرجاء الرد إذا كان لديك أي أسئلة.</p>
        </div>`
      : `<div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Hello ${booking.guest_full_name},</h2>
          <p>Your ${actionText} is ${daysText}!</p>
          <div style="background: #F5F0EB; padding: 15px; border-left: 4px solid #D4A574;">
            <p><strong>📅 Date:</strong> ${formattedDate}</p>
            <p><strong>⏰ ${timeLabel}:</strong> ${time}</p>
          </div>
          <p>Please reply if you have any questions.</p>
        </div>`;

    const whatsappMessage = isArabic
      ? `مرحباً ${booking.guest_full_name}!\n\n${actionText} بعد ${daysText}! 🏠\n\n📅 ${formattedDate}\n⏰ ${time}`
      : `Hello ${booking.guest_full_name}!\n\nYour ${actionText} is ${daysText}! 🏠\n\n📅 ${formattedDate}\n⏰ ${time}`;

    return {
      subject: emailSubject,
      body: emailBody,
      whatsappMessage
    };
  }
}

// Send WhatsApp message via TextMeBot
export async function sendWhatsAppReminder(
  phone: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const apiKey = process.env.TEXTMEBOT_API_KEY;
    if (!apiKey) {
      throw new Error('TEXTMEBOT_API_KEY not configured');
    }

    // Normalize phone number: 0 → 966, or add 966 if missing
    let normalizedPhone = phone.replace(/^0/, '966');
    if (!normalizedPhone.startsWith('966')) {
      normalizedPhone = '966' + normalizedPhone.replace(/^\+/, '');
    }

    console.log(`Sending WhatsApp to ${normalizedPhone}`);
    console.log(`Message length: ${message.length} characters`);
    console.log(`Message preview: ${message.substring(0, 100)}...`);

    // Check if in demo mode (for testing when API is unavailable)
    const isDemoMode = process.env.TEXTMEBOT_DEMO_MODE === 'true';

    if (isDemoMode) {
      console.log('🧪 DEMO MODE: Message would be sent to TextMeBot');
      console.log(`Phone: ${normalizedPhone}`);
      console.log(`Message: ${message}`);
      return {
        success: true,
        messageId: `demo_${Date.now()}`
      };
    }

    // TextMeBot uses GET request with query parameters
    const params = new URLSearchParams({
      recipient: normalizedPhone,
      apikey: apiKey,
      text: message
    });

    const url = `http://api.textmebot.com/send.php?${params.toString()}`;
    console.log('Calling TextMeBot API:', url.replace(apiKey, '***'));

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('TextMeBot error:', response.status, errorData);
      return {
        success: false,
        error: `TextMeBot API error: ${response.status}`
      };
    }

    const responseText = await response.text();
    console.log('WhatsApp sent successfully:', responseText);

    return {
      success: true,
      messageId: 'sent'
    };
  } catch (error) {
    console.error('WhatsApp send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Send email reminder via Outlook (placeholder - implement based on your email service)
export async function sendEmailReminder(
  email: string,
  subject: string,
  body: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: Implement Outlook email sending
    // For now, just log
    console.log(`Email would be sent to ${email}: ${subject}`);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Main function to send all daily reminders
export async function sendDailyReminders() {
  const supabase = getSupabaseClient();
  const supabaseWrite = getSupabaseAdmin() || supabase;

  console.log('Starting daily reminder job...');

  // Check if WhatsApp is globally enabled
  if (!isWhatsAppEnabled()) {
    console.log('WhatsApp notifications are disabled in admin settings. Skipping reminders.');
    return { success: true, bookingsProcessed: 0, remindersSent: 0, skipped: 'whatsapp_disabled' };
  }

  try {
    // Fetch all confirmed bookings with guest and room details
    const { data: bookings, error: fetchError } = await supabase
      .from('bookings')
      .select(`
        id,
        start_date,
        end_date,
        guest_locale,
        reminders_enabled,
        checkin_reminder_7d_sent,
        checkin_reminder_3d_sent,
        checkin_reminder_same_sent,
        checkout_reminder_7d_sent,
        checkout_reminder_3d_sent,
        checkout_reminder_same_sent,
        pre_arrival_sent,
        guests(full_name, email, phone),
        rooms(name, name_ar, door_code, wifi_network, wifi_password, checkin_time, checkout_time, studio_guide_url)
      `)
      .eq('status', 'confirmed')
      .eq('reminders_enabled', true);

    if (fetchError) {
      throw new Error(`Failed to fetch bookings: ${fetchError.message}`);
    }

    if (!bookings || bookings.length === 0) {
      console.log('No confirmed bookings found');
      return { success: true, bookingsProcessed: 0, remindersSent: 0 };
    }

    console.log(`Found ${bookings.length} confirmed bookings`);

    let remindersSent = 0;

    // Process each booking
    for (const booking of bookings) {
      const daysUntilCheckin = getDaysUntil(booking.start_date);
      const daysUntilCheckout = getDaysUntil(booking.end_date);

      // Type-safe access to nested guest and room objects with proper handling of relations
      const rawBooking = booking as ReminderBookingRaw;
      const guest = extractSingle(rawBooking.guests);
      const room = extractSingle(rawBooking.rooms);

      if (!guest?.phone || !guest?.email) {
        console.log(`Skipping booking ${rawBooking.id}: missing guest contact info`);
        continue;
      }

      // Enhanced booking object with all details for reminder generation
      const enrichedBooking: EnrichedBooking = {
        id: rawBooking.id,
        start_date: rawBooking.start_date,
        end_date: rawBooking.end_date,
        guest_locale: rawBooking.guest_locale,
        guest_full_name: guest.full_name,
        guest_email: guest.email,
        guest_phone: guest.phone,
        door_code: room?.door_code ?? null,
        wifi_network: room?.wifi_network ?? null,
        wifi_password: room?.wifi_password ?? null,
        checkin_time: room?.checkin_time ?? null,
        checkout_time: room?.checkout_time ?? null,
        studio_guide_url: room?.studio_guide_url ?? null,
      };

      // Check-in reminders (check admin settings before sending)
      if (daysUntilCheckin === 7 && !booking.checkin_reminder_7d_sent && isAutomationEnabled('automation_checkin_7d')) {
        console.log(`Sending 7-day check-in reminder for booking ${booking.id}`);

        const messages = generateRemindMessage(enrichedBooking, 'checkin_7d');
        const whatsappResult = await sendWhatsAppReminder(guest.phone, messages.whatsappMessage);

        if (whatsappResult.success) {
          // Update database
          await supabaseWrite
            .from('bookings')
            .update({
              checkin_reminder_7d_sent: true,
              checkin_reminder_7d_sent_at: new Date().toISOString()
            })
            .eq('id', booking.id);

          remindersSent++;
        }
      }

      if (daysUntilCheckin === 3 && !booking.checkin_reminder_3d_sent && isAutomationEnabled('automation_checkin_3d')) {
        console.log(`Sending 3-day check-in reminder for booking ${booking.id}`);

        const messages = generateRemindMessage(enrichedBooking, 'checkin_3d');
        const whatsappResult = await sendWhatsAppReminder(guest.phone, messages.whatsappMessage);

        if (whatsappResult.success) {
          await supabaseWrite
            .from('bookings')
            .update({
              checkin_reminder_3d_sent: true,
              checkin_reminder_3d_sent_at: new Date().toISOString()
            })
            .eq('id', booking.id);

          remindersSent++;
        }
      }

      if (daysUntilCheckin === 2 && !booking.pre_arrival_sent && isAutomationEnabled('automation_pre_arrival')) {
        console.log(`Sending pre-arrival reminder for booking ${booking.id}`);

        const messages = generateRemindMessage(enrichedBooking, 'pre_arrival');
        const whatsappResult = await sendWhatsAppReminder(guest.phone, messages.whatsappMessage);

        if (whatsappResult.success) {
          await supabaseWrite
            .from('bookings')
            .update({
              pre_arrival_sent: true,
              pre_arrival_sent_at: new Date().toISOString()
            })
            .eq('id', booking.id);

          remindersSent++;
        }
      }

      if (daysUntilCheckin === 0 && !booking.checkin_reminder_same_sent && isAutomationEnabled('automation_checkin_same')) {
        console.log(`Sending same-day check-in reminder for booking ${booking.id}`);

        const messages = generateRemindMessage(enrichedBooking, 'checkin_same');
        const whatsappResult = await sendWhatsAppReminder(guest.phone, messages.whatsappMessage);

        if (whatsappResult.success) {
          await supabaseWrite
            .from('bookings')
            .update({
              checkin_reminder_same_sent: true,
              checkin_reminder_same_sent_at: new Date().toISOString()
            })
            .eq('id', booking.id);

          remindersSent++;
        }
      }

      // Check-out reminders (check admin settings before sending)
      if (daysUntilCheckout === 7 && !booking.checkout_reminder_7d_sent && isAutomationEnabled('automation_checkout_7d')) {
        console.log(`Sending 7-day checkout reminder for booking ${booking.id}`);

        const messages = generateRemindMessage(enrichedBooking, 'checkout_7d');
        const whatsappResult = await sendWhatsAppReminder(guest.phone, messages.whatsappMessage);

        if (whatsappResult.success) {
          await supabaseWrite
            .from('bookings')
            .update({
              checkout_reminder_7d_sent: true,
              checkout_reminder_7d_sent_at: new Date().toISOString()
            })
            .eq('id', booking.id);

          remindersSent++;
        }
      }

      if (daysUntilCheckout === 3 && !booking.checkout_reminder_3d_sent && isAutomationEnabled('automation_checkout_3d')) {
        console.log(`Sending 3-day checkout reminder for booking ${booking.id}`);

        const messages = generateRemindMessage(enrichedBooking, 'checkout_3d');
        const whatsappResult = await sendWhatsAppReminder(guest.phone, messages.whatsappMessage);

        if (whatsappResult.success) {
          await supabaseWrite
            .from('bookings')
            .update({
              checkout_reminder_3d_sent: true,
              checkout_reminder_3d_sent_at: new Date().toISOString()
            })
            .eq('id', booking.id);

          remindersSent++;
        }
      }

      if (daysUntilCheckout === 0 && !booking.checkout_reminder_same_sent && isAutomationEnabled('automation_checkout_same')) {
        console.log(`Sending same-day checkout reminder for booking ${booking.id}`);

        const messages = generateRemindMessage(enrichedBooking, 'checkout_same');
        const whatsappResult = await sendWhatsAppReminder(guest.phone, messages.whatsappMessage);

        if (whatsappResult.success) {
          await supabaseWrite
            .from('bookings')
            .update({
              checkout_reminder_same_sent: true,
              checkout_reminder_same_sent_at: new Date().toISOString()
            })
            .eq('id', booking.id);

          remindersSent++;
        }
      }
    }

    console.log(`Reminder job completed. Sent ${remindersSent} reminders`);
    return { success: true, bookingsProcessed: bookings.length, remindersSent };
  } catch (error) {
    console.error('Daily reminder job failed:', error);
    throw error;
  }
}
