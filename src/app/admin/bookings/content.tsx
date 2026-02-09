'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Booking {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  room: { id: string; name: string };
  start_date: string;
  end_date: string;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method: string;
  expires_at: string | null;
  created_at: string;
}

export default function AdminBookingsContent() {
  const searchParams = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [status, setStatus] = useState(searchParams.get('status') || 'all');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    fetchBookings();
  }, [status, paymentStatus, search, page]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: ((page - 1) * pageSize).toString(),
      });

      if (status !== 'all') {
        params.append('status', status);
      }
      if (paymentStatus !== 'all') {
        params.append('payment_status', paymentStatus);
      }
      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/admin/bookings?${params}`);
      if (!response.ok) throw new Error('Failed to fetch bookings');

      const data = await response.json();
      setBookings(data.bookings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    const reason = prompt('Enter cancellation reason:');
    if (!reason) return;

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellation_reason: reason }),
      });

      if (!response.ok) throw new Error('Failed to cancel booking');
      alert('Booking cancelled successfully');
      fetchBookings();
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleConfirmPayment = async (bookingId: string) => {
    if (!confirm('Confirm payment for this booking?')) return;

    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.status === 409) {
        const data = await response.json();
        alert('ERROR: ' + data.message);
        return;
      }

      if (!response.ok) throw new Error('Failed to confirm payment');
      alert('Payment confirmed successfully');
      fetchBookings();
    } catch (err) {
      alert('Error: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const getStatusBadge = (booking: Booking) => {
    if (booking.status === 'pending_payment') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF5F0] text-[#C97355] rounded-full text-xs font-bold border border-[#C97355]/20">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C97355] animate-pulse"></span>
          Pending Payment
        </span>
      );
    }

    if (booking.status === 'confirmed' && booking.payment_status === 'paid') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F0F9F4] text-[#5B8A6B] rounded-full text-xs font-bold border border-[#5B8A6B]/20">
          <span className="w-1.5 h-1.5 rounded-full bg-[#5B8A6B]"></span>
          Confirmed
        </span>
      );
    }

    if (booking.status === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F5F5] text-[#6B6B6B] rounded-full text-xs font-bold border border-[#6B6B6B]/20">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6B6B6B]"></span>
          Cancelled
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFF9F0] text-[#B89355] rounded-full text-xs font-bold border border-[#B89355]/20">
        <span className="w-1.5 h-1.5 rounded-full bg-[#B89355]"></span>
        {booking.status}
      </span>
    );
  };

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
        <p className="text-red-700">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#2D2D2D]">Bookings</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#C9A96E]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <input
            type="text"
            placeholder="Search by guest name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border-2 border-[#E8E3DB] rounded-lg focus:outline-none focus:border-[#C9A96E] bg-[#FFF9F0]"
          />

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border-2 border-[#E8E3DB] rounded-lg focus:outline-none focus:border-[#C9A96E] bg-[#FFF9F0]"
          >
            <option value="all">All Status</option>
            <option value="pending_payment">Pending Payment</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Payment Status Filter */}
          <select
            value={paymentStatus}
            onChange={(e) => {
              setPaymentStatus(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border-2 border-[#E8E3DB] rounded-lg focus:outline-none focus:border-[#C9A96E] bg-[#FFF9F0]"
          >
            <option value="all">All Payment Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
          </select>

          {/* Reset Filters */}
          <button
            onClick={() => {
              setStatus('all');
              setPaymentStatus('all');
              setSearch('');
              setPage(1);
            }}
            className="px-4 py-2 bg-[#E8E3DB] text-[#2D2D2D] rounded-lg font-bold hover:bg-[#D9CFC0] transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-[#C9A96E]">
        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9A96E] mx-auto mb-4"></div>
              <p className="text-[#2D2D2D]">Loading bookings...</p>
            </div>
          </div>
        ) : bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F5F0EB]">
                <tr>
                  <th className="px-4 py-2 text-left text-[#2D2D2D] font-bold">ID</th>
                  <th className="px-4 py-2 text-left text-[#2D2D2D] font-bold">Guest</th>
                  <th className="px-4 py-2 text-left text-[#2D2D2D] font-bold">Room</th>
                  <th className="px-4 py-2 text-left text-[#2D2D2D] font-bold">Dates</th>
                  <th className="px-4 py-2 text-left text-[#2D2D2D] font-bold">Amount</th>
                  <th className="px-4 py-2 text-left text-[#2D2D2D] font-bold">Status</th>
                  <th className="px-4 py-2 text-left text-[#2D2D2D] font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-[#E8E3DB] hover:bg-[#FFF9F0] transition-colors"
                  >
                    <td className="px-4 py-3 text-[#2D2D2D] font-mono text-sm">
                      {booking.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-[#2D2D2D] font-medium">{booking.guest_name}</p>
                        <p className="text-[#8B7355] text-sm">{booking.guest_email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#2D2D2D]">{booking.room.name}</td>
                    <td className="px-4 py-3 text-[#8B7355] text-sm">
                      {new Date(booking.start_date).toLocaleDateString()} -{' '}
                      {new Date(booking.end_date).toLocaleDateString()}
                      {booking.status === 'pending_payment' && booking.expires_at && (
                        <div className="text-xs text-red-600 font-bold mt-1">
                          Expires: {new Date(booking.expires_at).toLocaleTimeString()}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#2D2D2D] font-bold">
                      SAR {booking.total_amount.toLocaleString('en-US')}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(booking)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/admin/bookings/${booking.id}`}
                          className="px-3 py-1 bg-[#C9A96E] text-white rounded text-xs font-bold hover:bg-[#B89A5F] transition-colors"
                        >
                          View
                        </Link>

                        {booking.status === 'pending_payment' && (
                          <button
                            onClick={() => handleConfirmPayment(booking.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-700 transition-colors"
                          >
                            Confirm
                          </button>
                        )}

                        {booking.status !== 'cancelled' && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="px-3 py-1 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-[#8B7355] text-center py-8">No bookings found</p>
        )}
      </div>

      {/* Pagination */}
      {bookings.length > 0 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-[#C9A96E] text-white rounded-lg font-bold hover:bg-[#B89A5F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          <span className="text-[#2D2D2D] font-medium">Page {page}</span>

          <button
            onClick={() => setPage(page + 1)}
            disabled={bookings.length < pageSize}
            className="px-4 py-2 bg-[#C9A96E] text-white rounded-lg font-bold hover:bg-[#B89A5F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
