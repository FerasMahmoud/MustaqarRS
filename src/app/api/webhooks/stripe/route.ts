import { NextRequest, NextResponse } from 'next/server';
import { getStripeServer, ROOM_ID_MAP } from '@/lib/stripe';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { generateContractPDF } from '@/lib/pdf/generate-contract';
import { checkAndMarkWebhookEvent } from '@/lib/db';
import { logger } from '@/lib/logger';
import { sendReceiptWithData } from '@/lib/receipt/send-receipt';
import { sendAdminNotification } from '@/lib/whatsapp/send-admin-notification';
import { emitPaymentConfirmed } from '@/lib/events';

// Type definitions for webhook data structures
interface BookingGuest {
  full_name: string;
  email: string | null;
  phone: string | null;
  nationality: string | null;
}

interface BookingRoom {
  name: string;
  name_ar: string | null;
  monthly_rate: number;
}

// Supabase returns nested relations - can be object or array depending on relationship type
interface BookingWithDetailsRaw {
  id: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  guests: BookingGuest | BookingGuest[] | null;
  rooms: BookingRoom | BookingRoom[] | null;
}

// Helper to safely extract single record from Supabase relation
function extractSingle<T>(data: T | T[] | null): T | null {
  if (data === null) return null;
  if (Array.isArray(data)) return data[0] ?? null;
  return data;
}

// Lazy load Supabase client to avoid errors during build when env vars might not be set
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event;

  try {
    event = getStripeServer().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    logger.errorWithException('Webhook signature verification failed', err, { endpoint: 'POST /api/webhooks/stripe' });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Idempotency check: prevent duplicate processing of the same event
  // Stripe can send the same webhook event multiple times
  const alreadyProcessed = await checkAndMarkWebhookEvent(event.id, event.type);
  if (alreadyProcessed) {
    logger.info('Webhook event already processed, skipping', { eventId: event.id, eventType: event.type });
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const metadata = session.metadata || {};

      // Check if this is the new day-based booking system
      if (metadata.roomId && metadata.durationDays) {
        // New day-based booking system
        const { roomId, startDate, endDate, durationDays, totalAmount } = metadata;

        // Find the pending booking and confirm it
        const { data: booking, error: findError } = await supabase
          .from('bookings')
          .select('id, status')
          .eq('room_id', roomId)
          .eq('start_date', startDate)
          .eq('end_date', endDate)
          .eq('status', 'pending_payment')
          .single();

        if (booking && !findError) {
          // Confirm the booking
          const { error: updateError } = await supabase
            .from('bookings')
            .update({
              status: 'confirmed',
              payment_status: 'paid',
              stripe_session_id: session.id,
              stripe_payment_intent: session.payment_intent as string,
              confirmed_at: new Date().toISOString(),
            })
            .eq('id', booking.id);

          if (updateError) {
            console.error('Error confirming booking:', updateError);
          } else {
            console.log(`Day-based booking ${booking.id} confirmed via webhook`);

            // Send contract to guest via email and WhatsApp
            try {
              await sendContractAfterPayment(booking.id, supabase);
            } catch (error) {
              console.error('Error sending contract after payment:', error);
              // Don't fail the webhook if contract sending fails
            }
          }
        } else {
          console.log('No pending booking found for webhook confirmation');
        }

      } else if (metadata.studioId) {
        // Legacy billing period based system
        const {
          studioId,
          billingPeriod,
          startDate,
          customerName,
          customerPhone,
          idType,
          idNumber,
          nationality,
        } = metadata;

        // Get the database UUID for the room
        const roomDbId = ROOM_ID_MAP[studioId] || studioId;

        // Calculate end date based on billing period
        const start = new Date(startDate);
        const end = new Date(start);
        if (billingPeriod === 'yearly') {
          end.setFullYear(end.getFullYear() + 1);
        } else {
          end.setMonth(end.getMonth() + 1);
        }

        // First, create or find the guest
        const { data: guestData, error: guestError } = await supabase
          .from('guests')
          .insert({
            full_name: customerName,
            email: session.customer_email,
            phone: customerPhone,
            id_type: idType,
            id_number: idNumber,
            nationality: nationality,
          })
          .select()
          .single();

        if (guestError) {
          console.error('Error creating guest:', guestError);
          return NextResponse.json({ error: 'Failed to create guest' }, { status: 500 });
        }

        // Create booking in Supabase
        const { error: bookingError } = await supabase.from('bookings').insert({
          room_id: roomDbId,
          guest_id: guestData.id,
          start_date: startDate,
          end_date: end.toISOString().split('T')[0],
          rental_type: billingPeriod,
          rate_at_booking: session.amount_total ? session.amount_total / 100 : 0,
          total_amount: session.amount_total ? session.amount_total / 100 : 0,
          status: 'confirmed',
          payment_status: 'paid',
          stripe_session_id: session.id,
          confirmed_at: new Date().toISOString(),
        });

        if (bookingError) {
          console.error('Error creating booking:', bookingError);
        } else {
          console.log('Legacy booking created successfully for session:', session.id);

          // Send contract to guest via email and WhatsApp
          // Fetch the booking to get its ID
          const { data: newBooking } = await supabase
            .from('bookings')
            .select('id')
            .eq('stripe_session_id', session.id)
            .single();

          if (newBooking) {
            try {
              await sendContractAfterPayment(newBooking.id, supabase);
            } catch (error) {
              console.error('Error sending contract after payment:', error);
              // Don't fail the webhook if contract sending fails
            }
          }
        }
      }

      break;
    }

    case 'checkout.session.expired': {
      const session = event.data.object;
      const metadata = session.metadata || {};

      // For new day-based system, delete pending booking
      if (metadata.roomId && metadata.startDate && metadata.endDate) {
        const { data: booking } = await supabase
          .from('bookings')
          .select('id')
          .eq('room_id', metadata.roomId)
          .eq('start_date', metadata.startDate)
          .eq('end_date', metadata.endDate)
          .eq('status', 'pending_payment')
          .single();

        if (booking) {
          await supabase
            .from('bookings')
            .delete()
            .eq('id', booking.id);

          console.log(`Expired booking ${booking.id} deleted via webhook`);
        }
      }

      console.log('Checkout session expired:', session.id);
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      console.log('Payment failed:', paymentIntent.id);
      // Could send notification to admin here
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

/**
 * Helper function to send contract after payment confirmation via n8n workflow
 */
async function sendContractAfterPayment(
  bookingId: string,
  supabase: SupabaseClient
): Promise<void> {
  try {
    // Fetch booking, guest, and room information
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select(
        `
        id,
        start_date,
        end_date,
        total_amount,
        guests (
          full_name,
          email,
          phone,
          nationality
        ),
        rooms (
          name,
          name_ar,
          monthly_rate
        )
      `
      )
      .eq('id', bookingId)
      .single();

    if (fetchError || !booking) {
      console.error('Failed to fetch booking for contract:', fetchError);
      return;
    }

    // Type-safe access to the booking data with proper handling of nested relations
    const rawBooking = booking as BookingWithDetailsRaw;
    const guest = extractSingle(rawBooking.guests);
    const room = extractSingle(rawBooking.rooms);

    // Detect locale based on guest nationality or default to English
    const locale = guest?.nationality?.toLowerCase().includes('arab')
      ? 'ar'
      : 'en';

    // Generate contract PDF
    try {
      const pdfBuffer = await generateContractPDF({
        bookingId,
        locale,
      });

      // Convert PDF to base64
      const pdfBase64 = pdfBuffer.toString('base64');

      // Generate contract download URL
      const contractDownloadUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://mustaqar.vercel.app'}/api/contracts/download/${bookingId}?locale=${locale}`;

      // Prepare payload for n8n workflow
      const n8nPayload = {
        bookingId,
        locale,
        guest: {
          email: guest?.email,
          phone: guest?.phone,
          fullName: guest?.full_name,
        },
        room: {
          name: room?.name,
          nameAr: room?.name_ar,
        },
        booking: {
          startDate: rawBooking.start_date,
          endDate: rawBooking.end_date,
          totalAmount: rawBooking.total_amount,
        },
        contract: {
          pdfBase64,
          downloadUrl: contractDownloadUrl,
        },
      };

      // Trigger n8n unified workflow for contract delivery
      const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || 'https://primary-production-22d7.up.railway.app/webhook/mustaqar';
      if (!n8nWebhookUrl) {
        console.error('N8N_WEBHOOK_URL environment variable not set');
        return;
      }

      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType: 'contract_delivery',
          ...n8nPayload,
        }),
      });

      if (!n8nResponse.ok) {
        console.error(`n8n workflow failed: ${n8nResponse.statusText}`);
        return;
      }

      const n8nResult = await n8nResponse.json();
      console.log('n8n contract delivery result:', n8nResult);

      // Update booking with contract sent flag
      await supabase
        .from('bookings')
        .update({
          contract_sent: true,
          contract_sent_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      console.log(`Contract marked as sent for booking ${bookingId}`);

      // Send payment receipt after contract
      try {
        const receiptResult = await sendReceiptWithData({
          bookingId,
          locale,
          paymentDate: new Date().toISOString(),
          guest: {
            fullName: guest?.full_name || 'Guest',
            email: guest?.email || null,
            phone: guest?.phone || null,
          },
          room: {
            name: room?.name || 'Studio',
            nameAr: room?.name_ar || 'استوديو',
          },
          booking: {
            startDate: rawBooking.start_date,
            endDate: rawBooking.end_date,
            totalAmount: rawBooking.total_amount,
            paymentMethod: 'stripe',
          },
        });

        if (receiptResult.success) {
          // Update booking with receipt sent flag
          await supabase
            .from('bookings')
            .update({
              receipt_sent: true,
              receipt_sent_at: new Date().toISOString(),
            })
            .eq('id', bookingId);

          console.log(`Receipt sent for booking ${bookingId}:`, {
            email: receiptResult.email.sent,
            whatsapp: receiptResult.whatsapp.sent,
          });

          // Send admin WhatsApp notification for payment confirmation
          sendAdminNotification({
            type: 'payment_confirmed',
            guestName: guest?.full_name || 'Guest',
            roomName: room?.name || 'Studio',
            totalAmount: rawBooking.total_amount,
            bookingId: bookingId,
            paymentMethod: 'stripe',
          }).catch(notifyError => {
            console.error('Failed to send admin notification:', notifyError);
          });

          // Emit real-time event for admin dashboard
          emitPaymentConfirmed({
            guestName: guest?.full_name || 'Guest',
            roomName: room?.name || 'Studio',
            amount: rawBooking.total_amount,
            bookingId: bookingId,
          });
        } else {
          console.error(`Failed to send receipt for booking ${bookingId}:`, receiptResult.error);
        }
      } catch (receiptError) {
        console.error('Error sending receipt:', receiptError);
        // Don't fail the webhook if receipt sending fails
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Unknown error';
      console.error('Error generating/sending contract:', errorMsg);
      // Don't throw - allow webhook to succeed even if contract delivery fails
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in sendContractAfterPayment:', errorMsg);
    // Don't throw - allow webhook to succeed even if contract delivery fails
  }
}
