'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

// Prevent prerendering for protected admin pages
export const dynamic = 'force-dynamic';

interface Booking {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  guest_id_number: string;
  guest_nationality: string;
  room: { id: string; name: string; price_per_night: number };
  start_date: string;
  end_date: string;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method: string;
  expires_at: string | null;
  created_at: string;
  confirmed_at: string | null;
  cancellation_reason: string | null;
  special_requests: string;
  receipt_sent?: boolean;
  receipt_sent_at?: string | null;
}

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/admin/bookings/${bookingId}`);
      if (!response.ok) throw new Error('Failed to fetch booking details');

      const data = await response.json();
      setBooking(data.booking);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!confirm('Confirm payment for this booking?')) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/bookings/${bookingId}/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 409) {
        const data = await response.json();
        setError(data.message || 'Conflict detected');
        return;
      }

      if (!response.ok) throw new Error('Failed to confirm payment');
      alert('Payment confirmed successfully');
      fetchBookingDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    const reason = prompt('Enter cancellation reason:');
    if (!reason) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellation_reason: reason }),
      });

      if (!response.ok) throw new Error('Failed to cancel booking');
      alert('Booking cancelled successfully');
      fetchBookingDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendReceipt = async () => {
    if (!confirm('Send payment receipt to guest via Email and WhatsApp?')) return;

    try {
      setActionLoading(true);
      const response = await fetch(`/api/admin/bookings/${bookingId}/send-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send receipt');
      }

      const messages: string[] = ['Receipt sent successfully!'];
      if (data.details?.email?.sent) messages.push('✓ Email sent');
      if (data.details?.whatsapp?.sent) messages.push('✓ WhatsApp sent');
      if (data.details?.email?.error) messages.push(`✗ Email: ${data.details.email.error}`);
      if (data.details?.whatsapp?.error) messages.push(`✗ WhatsApp: ${data.details.whatsapp.error}`);

      alert(messages.join('\n'));
      fetchBookingDetails();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9A96E] mx-auto mb-4"></div>
          <p className="text-[#2D2D2D]">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
        <p className="text-red-700">Error: {error || 'Booking not found'}</p>
        <Link href="/admin/bookings" className="text-[#C9A96E] hover:underline mt-2 inline-block">
          ← Back to Bookings
        </Link>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (booking.status === 'pending_payment') {
      return (
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFF5F0] text-[#C97355] rounded-full text-sm font-bold border border-[#C97355]/20">
          <span className="w-2 h-2 rounded-full bg-[#C97355] animate-pulse"></span>
          Pending Payment
        </span>
      );
    }

    if (booking.status === 'confirmed' && booking.payment_status === 'paid') {
      return (
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#F0F9F4] text-[#5B8A6B] rounded-full text-sm font-bold border border-[#5B8A6B]/20">
          <span className="w-2 h-2 rounded-full bg-[#5B8A6B]"></span>
          Confirmed & Paid
        </span>
      );
    }

    if (booking.status === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#F5F5F5] text-[#6B6B6B] rounded-full text-sm font-bold border border-[#6B6B6B]/20">
          <span className="w-2 h-2 rounded-full bg-[#6B6B6B]"></span>
          Cancelled
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFF9F0] text-[#B89355] rounded-full text-sm font-bold border border-[#B89355]/20">
        <span className="w-2 h-2 rounded-full bg-[#B89355]"></span>
        {booking.status}
      </span>
    );
  };

  const nightsCount = Math.ceil(
    (new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/bookings" className="text-[#C9A96E] hover:underline mb-2 inline-block">
            ← Back to Bookings
          </Link>
          <h1 className="text-3xl font-bold text-[#2D2D2D]">Booking REF-{booking.id.slice(-8).toUpperCase()}</h1>
        </div>
        <div>{getStatusBadge()}</div>
      </div>

      {/* Alert Banner */}
      {booking.status === 'pending_payment' && booking.expires_at && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <p className="text-red-700 font-bold">
            ⏳ Payment deadline: {new Date(booking.expires_at).toLocaleString()}
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Guest Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#C9A96E]">
          <h2 className="text-xl font-bold text-[#2D2D2D] mb-4">Guest Information</h2>
          <div className="space-y-3">
            <div>
              <p className="text-[#8B7355] text-sm">Name</p>
              <p className="text-[#2D2D2D] font-medium">{booking.guest_name}</p>
            </div>
            <div>
              <p className="text-[#8B7355] text-sm">Email</p>
              <p className="text-[#2D2D2D]">{booking.guest_email}</p>
            </div>
            <div>
              <p className="text-[#8B7355] text-sm">Phone</p>
              <p className="text-[#2D2D2D]">{booking.guest_phone}</p>
            </div>
            <div>
              <p className="text-[#8B7355] text-sm">ID Number</p>
              <p className="text-[#2D2D2D] font-mono">{booking.guest_id_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-[#8B7355] text-sm">Nationality</p>
              <p className="text-[#2D2D2D]">{booking.guest_nationality || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Booking Details */}
        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#C9A96E]">
          <h2 className="text-xl font-bold text-[#2D2D2D] mb-4">Booking Details</h2>
          <div className="space-y-3">
            <div>
              <p className="text-[#8B7355] text-sm">Room</p>
              <p className="text-[#2D2D2D] font-medium">{booking.room.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[#8B7355] text-sm">Check-in</p>
                <p className="text-[#2D2D2D]">{new Date(booking.start_date).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-[#8B7355] text-sm">Check-out</p>
                <p className="text-[#2D2D2D]">{new Date(booking.end_date).toLocaleDateString()}</p>
              </div>
            </div>
            <div>
              <p className="text-[#8B7355] text-sm">Duration</p>
              <p className="text-[#2D2D2D] font-medium">{nightsCount} night(s)</p>
            </div>
            <div>
              <p className="text-[#8B7355] text-sm">Payment Method</p>
              <p className="text-[#2D2D2D] capitalize">{booking.payment_method}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#C9A96E]">
        <h2 className="text-xl font-bold text-[#2D2D2D] mb-4">Payment Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-[#8B7355] text-sm">Total Amount</p>
            <p className="text-[#2D2D2D] text-3xl font-bold">SAR {booking.total_amount.toLocaleString('en-US')}</p>
          </div>
          <div>
            <p className="text-[#8B7355] text-sm">Payment Status</p>
            <p
              className={`text-xl font-bold ${
                booking.payment_status === 'paid' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {booking.payment_status === 'paid' ? '✓ Paid' : '⏳ Pending'}
            </p>
          </div>
          <div>
            <p className="text-[#8B7355] text-sm">Booking Status</p>
            <p className="text-[#2D2D2D] font-medium capitalize">{booking.status}</p>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#C9A96E]">
        <h2 className="text-xl font-bold text-[#2D2D2D] mb-4">Timeline</h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-[#C9A96E]"></div>
              <div className="w-0.5 h-12 bg-[#E8E3DB]"></div>
            </div>
            <div>
              <p className="text-[#2D2D2D] font-bold">Booking Created</p>
              <p className="text-[#8B7355] text-sm">{new Date(booking.created_at).toLocaleString()}</p>
            </div>
          </div>

          {booking.status === 'pending_payment' && booking.expires_at && (
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-0.5 h-12 bg-[#E8E3DB]"></div>
              </div>
              <div>
                <p className="text-[#2D2D2D] font-bold">Payment Deadline</p>
                <p className="text-red-600 font-bold">{new Date(booking.expires_at).toLocaleString()}</p>
              </div>
            </div>
          )}

          {booking.confirmed_at && (
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div>
                <p className="text-[#2D2D2D] font-bold">Payment Confirmed</p>
                <p className="text-[#8B7355] text-sm">{new Date(booking.confirmed_at).toLocaleString()}</p>
              </div>
            </div>
          )}

          {booking.status === 'cancelled' && (
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              </div>
              <div>
                <p className="text-[#2D2D2D] font-bold">Booking Cancelled</p>
                {booking.cancellation_reason && (
                  <p className="text-[#8B7355] text-sm">Reason: {booking.cancellation_reason}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Special Requests */}
      {booking.special_requests && (
        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#C9A96E]">
          <h2 className="text-xl font-bold text-[#2D2D2D] mb-4">Special Requests</h2>
          <p className="text-[#2D2D2D]">{booking.special_requests}</p>
        </div>
      )}

      {/* Actions */}
      {booking.status !== 'cancelled' && (
        <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#C9A96E]">
          <h2 className="text-xl font-bold text-[#2D2D2D] mb-4">Actions</h2>
          <div className="flex flex-wrap gap-4">
            {booking.status === 'pending_payment' && (
              <button
                onClick={handleConfirmPayment}
                disabled={actionLoading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Confirming...' : '✓ Confirm Payment'}
              </button>
            )}

            {/* Send Receipt Button - Only for confirmed & paid bookings */}
            {booking.status === 'confirmed' && booking.payment_status === 'paid' && (
              <button
                onClick={handleSendReceipt}
                disabled={actionLoading}
                className="px-6 py-3 bg-[#C9A96E] text-white rounded-lg font-bold hover:bg-[#B89355] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {actionLoading ? (
                  'Sending...'
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {booking.receipt_sent ? 'Resend Receipt' : 'Send Receipt'}
                  </>
                )}
              </button>
            )}

            <button
              onClick={handleCancelBooking}
              disabled={actionLoading}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'Cancelling...' : '✗ Cancel Booking'}
            </button>
          </div>

          {/* Receipt sent indicator */}
          {booking.receipt_sent && booking.receipt_sent_at && (
            <p className="mt-4 text-sm text-green-600">
              ✓ Receipt sent on {new Date(booking.receipt_sent_at).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
