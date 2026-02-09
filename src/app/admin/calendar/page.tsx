'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Calendar, Loader2, Eye } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Room {
  id: string;
  name: string;
  slug: string;
}

interface Booking {
  id: string;
  room_id: string;
  guest_name: string;
  start_date: string;
  end_date: string;
  status: string;
  payment_status: string;
}

export default function AdminCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch rooms
      const roomsRes = await fetch('/api/rooms');
      if (roomsRes.ok) {
        const roomsData = await roomsRes.json();
        setRooms(roomsData);
      }

      // Fetch bookings for current month
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const bookingsRes = await fetch(`/api/admin/bookings?startDate=${startOfMonth.toISOString().split('T')[0]}&endDate=${endOfMonth.toISOString().split('T')[0]}&limit=100`);
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const getBookingsForDay = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return bookings.filter(booking => {
      const start = booking.start_date.split('T')[0];
      const end = booking.end_date.split('T')[0];
      return dateStr >= start && dateStr <= end &&
             (selectedRoom === 'all' || booking.room_id === selectedRoom);
    });
  };

  const getStatusColor = (status: string, paymentStatus: string) => {
    if (status === 'cancelled') return 'bg-gray-200 text-gray-600';
    if (status === 'pending_payment' || paymentStatus === 'pending') return 'bg-amber-100 text-amber-700';
    if (status === 'confirmed' && paymentStatus === 'paid') return 'bg-emerald-100 text-emerald-700';
    return 'bg-blue-100 text-blue-700';
  };

  const getRoomColor = (roomId: string) => {
    const colors = [
      'border-l-[#C9A96E]',
      'border-l-[#5B8A6B]',
      'border-l-[#C97355]',
      'border-l-[#6B7BC9]',
    ];
    const index = rooms.findIndex(r => r.id === roomId);
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-[#C9A96E] animate-spin mx-auto mb-4" />
          <p className="text-[#2D2D2D]">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#2D2D2D]">Booking Calendar</h1>
          <p className="text-[#8B7355] mt-1">View and manage room availability</p>
        </div>

        {/* Room Filter */}
        <select
          value={selectedRoom}
          onChange={(e) => setSelectedRoom(e.target.value)}
          className="px-4 py-2 bg-white border border-[#E8E3DB] rounded-xl text-[#2D2D2D] focus:outline-none focus:border-[#C9A96E] focus:ring-2 focus:ring-[#C9A96E]/20"
        >
          <option value="all">All Rooms</option>
          {rooms.map(room => (
            <option key={room.id} value={room.id}>{room.name}</option>
          ))}
        </select>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#E8E3DB] overflow-hidden">
        <div className="bg-gradient-to-r from-[#FAF7F2] to-[#F5F0E8] px-6 py-4 border-b border-[#E8E3DB] flex items-center justify-between">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-[#E8E3DB] rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-[#2D2D2D]" />
          </button>

          <h2 className="text-xl font-bold text-[#2D2D2D]">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>

          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-[#E8E3DB] rounded-lg transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-[#2D2D2D]" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-[#E8E3DB]">
          {dayNames.map(day => (
            <div key={day} className="px-2 py-3 text-center text-sm font-bold text-[#8B7355] bg-[#FAF7F2]/50">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: firstDayOfMonth }, (_, i) => (
            <div key={`empty-${i}`} className="min-h-[120px] bg-gray-50 border-b border-r border-[#E8E3DB]" />
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dayBookings = getBookingsForDay(day);
            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

            return (
              <div
                key={day}
                className={`min-h-[120px] border-b border-r border-[#E8E3DB] p-2 ${
                  isToday ? 'bg-[#C9A96E]/10' : 'bg-white hover:bg-[#FAF7F2]/50'
                } transition-colors`}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-[#C9A96E]' : 'text-[#2D2D2D]'}`}>
                  {day}
                </div>

                <div className="space-y-1">
                  {dayBookings.slice(0, 3).map(booking => {
                    const room = rooms.find(r => r.id === booking.room_id);
                    return (
                      <Link
                        key={booking.id}
                        href={`/admin/bookings/${booking.id}`}
                        className={`block px-2 py-1 text-xs rounded truncate border-l-2 ${getRoomColor(booking.room_id)} ${getStatusColor(booking.status, booking.payment_status)} hover:opacity-80 transition-opacity`}
                      >
                        {booking.guest_name}
                        {room && <span className="opacity-60 ml-1">• {room.name}</span>}
                      </Link>
                    );
                  })}

                  {dayBookings.length > 3 && (
                    <div className="text-xs text-[#8B7355] px-2">
                      +{dayBookings.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-2xl shadow-lg border border-[#E8E3DB] p-6">
        <h3 className="text-lg font-bold text-[#2D2D2D] mb-4">Legend</h3>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300" />
            <span className="text-sm text-[#2D2D2D]">Confirmed & Paid</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-amber-100 border border-amber-300" />
            <span className="text-sm text-[#2D2D2D]">Pending Payment</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-200 border border-gray-300" />
            <span className="text-sm text-[#2D2D2D]">Cancelled</span>
          </div>

          <div className="border-l border-[#E8E3DB] pl-6 flex flex-wrap gap-4">
            {rooms.map((room, index) => {
              const colors = ['#C9A96E', '#5B8A6B', '#C97355', '#6B7BC9'];
              return (
                <div key={room.id} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-sm"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="text-sm text-[#2D2D2D]">{room.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-[#E8E3DB] p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#C9A96E]/20 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-[#C9A96E]" />
            </div>
            <div>
              <p className="text-sm text-[#8B7355]">Total Bookings This Month</p>
              <p className="text-2xl font-bold text-[#2D2D2D]">{bookings.filter(b => b.status !== 'cancelled').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-[#E8E3DB] p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <span className="text-xl">⏳</span>
            </div>
            <div>
              <p className="text-sm text-[#8B7355]">Pending Confirmations</p>
              <p className="text-2xl font-bold text-[#2D2D2D]">{bookings.filter(b => b.status === 'pending_payment').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-[#E8E3DB] p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <span className="text-xl">✓</span>
            </div>
            <div>
              <p className="text-sm text-[#8B7355]">Confirmed Bookings</p>
              <p className="text-2xl font-bold text-[#2D2D2D]">{bookings.filter(b => b.status === 'confirmed').length}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
