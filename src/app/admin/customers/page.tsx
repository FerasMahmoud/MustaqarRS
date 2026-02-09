'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Users, Mail, Phone, Calendar, DollarSign, Loader2, ChevronLeft, ChevronRight, Eye, User } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Customer {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  nationality?: string;
  id_type?: string;
  total_bookings: number;
  total_spent: number;
  last_booking_date: string;
  first_booking_date: string;
}

interface CustomerBooking {
  id: string;
  room_name: string;
  start_date: string;
  end_date: string;
  total_amount: number;
  status: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerBookings, setCustomerBookings] = useState<CustomerBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [page, searchQuery]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/admin/customers?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerBookings = async (customerId: string, email: string) => {
    try {
      setLoadingBookings(true);
      const response = await fetch(`/api/admin/bookings?email=${encodeURIComponent(email)}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        setCustomerBookings(data.bookings?.map((b: any) => ({
          id: b.id,
          room_name: b.room?.name || 'Studio',
          start_date: b.start_date,
          end_date: b.end_date,
          total_amount: b.total_amount,
          status: b.status,
        })) || []);
      }
    } catch (error) {
      console.error('Error fetching customer bookings:', error);
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    fetchCustomerBookings(customer.id, customer.guest_email);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      pending_payment: 'bg-amber-100 text-amber-700 border-amber-200',
      cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
      completed: 'bg-blue-100 text-blue-700 border-blue-200',
    };
    return styles[status] || 'bg-gray-100 text-gray-600 border-gray-200';
  };

  if (loading && !customers.length) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-[#C9A96E] animate-spin mx-auto mb-4" />
          <p className="text-[#2D2D2D]">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2D2D]">Customers</h1>
          <p className="text-[#8B7355] mt-1">Manage customer information and booking history</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-[#E8E3DB] p-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8B7355]" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="w-full pl-12 pr-4 py-3 bg-[#FAF7F2] border-2 border-[#E8E3DB] rounded-xl text-[#2D2D2D] placeholder-[#8B7355]/60 focus:outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer List */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-[#E8E3DB] overflow-hidden">
          <div className="bg-gradient-to-r from-[#FAF7F2] to-[#F5F0E8] px-6 py-4 border-b border-[#E8E3DB]">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#2D2D2D] flex items-center gap-2">
                <Users className="h-5 w-5 text-[#C9A96E]" />
                All Customers
              </h2>
              <span className="text-sm text-[#8B7355]">{customers.length} customers</span>
            </div>
          </div>

          {customers.length > 0 ? (
            <>
              <div className="divide-y divide-[#E8E3DB]">
                {customers.map(customer => (
                  <button
                    key={customer.id}
                    onClick={() => handleCustomerSelect(customer)}
                    className={`w-full px-6 py-4 flex items-center justify-between hover:bg-[#FAF7F2] transition-colors text-left ${
                      selectedCustomer?.id === customer.id ? 'bg-[#C9A96E]/10' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C9A96E]/30 to-[#C9A96E]/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-[#C9A96E]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#2D2D2D]">{customer.guest_name}</p>
                        <p className="text-sm text-[#8B7355]">{customer.guest_email}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium text-[#2D2D2D]">
                        {customer.total_bookings} booking{customer.total_bookings !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-[#8B7355]">
                        SAR {customer.total_spent?.toLocaleString() || 0}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-[#E8E3DB] flex items-center justify-between">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-lg bg-[#FAF7F2] text-[#2D2D2D] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#E8E3DB] transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>

                  <span className="text-sm text-[#8B7355]">
                    Page {page} of {totalPages}
                  </span>

                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-lg bg-[#FAF7F2] text-[#2D2D2D] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#E8E3DB] transition-colors flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="px-6 py-12 text-center">
              <Users className="h-12 w-12 text-[#E8E3DB] mx-auto mb-4" />
              <p className="text-[#8B7355]">
                {searchQuery ? `No customers found for "${searchQuery}"` : 'No customers yet'}
              </p>
            </div>
          )}
        </div>

        {/* Customer Details Panel */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#E8E3DB] overflow-hidden">
          <div className="bg-gradient-to-r from-[#FAF7F2] to-[#F5F0E8] px-6 py-4 border-b border-[#E8E3DB]">
            <h2 className="text-lg font-bold text-[#2D2D2D]">Customer Details</h2>
          </div>

          {selectedCustomer ? (
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#C9A96E] to-[#B89355] flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl font-bold text-white">
                    {selectedCustomer.guest_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#2D2D2D]">{selectedCustomer.guest_name}</h3>
                {selectedCustomer.nationality && (
                  <p className="text-sm text-[#8B7355]">{selectedCustomer.nationality}</p>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-[#FAF7F2] rounded-lg">
                  <Mail className="h-5 w-5 text-[#C9A96E]" />
                  <div>
                    <p className="text-xs text-[#8B7355]">Email</p>
                    <p className="text-sm text-[#2D2D2D]">{selectedCustomer.guest_email}</p>
                  </div>
                </div>

                {selectedCustomer.guest_phone && (
                  <div className="flex items-center gap-3 p-3 bg-[#FAF7F2] rounded-lg">
                    <Phone className="h-5 w-5 text-[#C9A96E]" />
                    <div>
                      <p className="text-xs text-[#8B7355]">Phone</p>
                      <p className="text-sm text-[#2D2D2D]">{selectedCustomer.guest_phone}</p>
                    </div>
                  </div>
                )}

                {selectedCustomer.id_type && (
                  <div className="flex items-center gap-3 p-3 bg-[#FAF7F2] rounded-lg">
                    <User className="h-5 w-5 text-[#C9A96E]" />
                    <div>
                      <p className="text-xs text-[#8B7355]">ID Type</p>
                      <p className="text-sm text-[#2D2D2D] capitalize">{selectedCustomer.id_type.replace('_', ' ')}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#FAF7F2] rounded-xl text-center">
                  <Calendar className="h-6 w-6 text-[#C9A96E] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-[#2D2D2D]">{selectedCustomer.total_bookings}</p>
                  <p className="text-xs text-[#8B7355]">Bookings</p>
                </div>
                <div className="p-4 bg-[#FAF7F2] rounded-xl text-center">
                  <DollarSign className="h-6 w-6 text-[#5B8A6B] mx-auto mb-2" />
                  <p className="text-2xl font-bold text-[#2D2D2D]">SAR {(selectedCustomer.total_spent || 0).toLocaleString()}</p>
                  <p className="text-xs text-[#8B7355]">Total Spent</p>
                </div>
              </div>

              {/* Booking History */}
              <div>
                <h4 className="font-bold text-[#2D2D2D] mb-3">Booking History</h4>
                {loadingBookings ? (
                  <div className="text-center py-4">
                    <Loader2 className="h-6 w-6 text-[#C9A96E] animate-spin mx-auto" />
                  </div>
                ) : customerBookings.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {customerBookings.map(booking => (
                      <Link
                        key={booking.id}
                        href={`/admin/bookings/${booking.id}`}
                        className="block p-3 bg-[#FAF7F2] rounded-lg hover:bg-[#E8E3DB] transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-[#2D2D2D] text-sm">{booking.room_name}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs border ${getStatusBadge(booking.status)}`}>
                            {booking.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-[#8B7355]">
                          {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                        </p>
                        <p className="text-sm font-bold text-[#C9A96E] mt-1">
                          SAR {booking.total_amount.toLocaleString()}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#8B7355] text-center py-4">No bookings found</p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <User className="h-12 w-12 text-[#E8E3DB] mx-auto mb-4" />
              <p className="text-[#8B7355]">Select a customer to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
