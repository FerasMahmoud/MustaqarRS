'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Check, X, Calendar as CalendarIcon, Loader, AlertCircle, CheckCircle2 } from 'lucide-react';
import { CLEANING_BUFFER_DAYS } from '@/lib/validation';

interface Room {
  id: string;
  slug: string;
  name: string;
  name_ar: string;
  monthly_rate: number;
  yearly_rate: number;
}

interface Booking {
  room_id: string;
  start_date: string;
  end_date: string;
  status: string;
}

interface AvailabilityBlock {
  room_id: string;
  start_date: string;
  end_date: string;
}

interface BookingCalendarProps {
  isAdminView?: boolean;
}

const roomColors: Record<string, { bg: string; border: string; text: string }> = {
  '33333333-3333-3333-3333-333333333333': { bg: 'bg-[#D4AF37]', border: 'border-[#D4AF37]', text: 'text-[#D4AF37]' },
  '44444444-4444-4444-4444-444444444444': { bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-emerald-500' },
  'room-1': { bg: 'bg-[#D4AF37]', border: 'border-[#D4AF37]', text: 'text-[#D4AF37]' },
  'room-2': { bg: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-emerald-500' },
};

const monthNames = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};

const dayNames = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ar: ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
};

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDisplayDate(dateStr: string, locale: string): string {
  const date = parseDate(dateStr);
  const months = monthNames[locale as keyof typeof monthNames] || monthNames.en;
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

export function BookingCalendar({ isAdminView = false }: BookingCalendarProps = {}) {
  const t = useTranslations('calendar');
  const locale = useLocale() as 'en' | 'ar';
  const isRtl = locale === 'ar';

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedStudio, setSelectedStudio] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<AvailabilityBlock[]>([]);
  const [loading, setLoading] = useState(true);

  // Selection state
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(null);
  const [selectedDurationDays, setSelectedDurationDays] = useState<number>(30); // Default 30 days minimum

  // Status
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bookings?availability=true');

      if (!response.ok) {
        throw new Error('Failed to fetch availability data');
      }

      const data = await response.json();
      setRooms(data.rooms || []);
      setBookings(data.bookings || []);
      setAvailabilityBlocks(data.availabilityBlocks || []);

      // Set first room (Comfort Studio) as default
      if (data.rooms && data.rooms.length > 0) {
        setSelectedStudio(data.rooms[0].id);
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      setRooms([]);
      setBookings([]);
      setAvailabilityBlocks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const days = dayNames[locale as keyof typeof dayNames] || dayNames.en;
  const months = monthNames[locale as keyof typeof monthNames] || monthNames.en;

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const isDateBooked = (dateStr: string, roomId: string): boolean => {
    const checkDate = parseDate(dateStr);
    return bookings.some((booking) => {
      if (booking.room_id !== roomId) return false;
      if (booking.status === 'cancelled') return false;
      const bookingStart = parseDate(booking.start_date);
      const bookingEnd = parseDate(booking.end_date);
      return checkDate >= bookingStart && checkDate <= bookingEnd;
    });
  };

  const isDateBlocked = (dateStr: string, roomId: string): boolean => {
    const checkDate = parseDate(dateStr);
    return availabilityBlocks.some((block) => {
      if (block.room_id !== roomId) return false;
      const blockStart = parseDate(block.start_date);
      const blockEnd = parseDate(block.end_date);
      return checkDate >= blockStart && checkDate <= blockEnd;
    });
  };

  const isDateUnavailable = (dateStr: string, roomId: string): boolean => {
    return isDateBooked(dateStr, roomId) || isDateBlocked(dateStr, roomId);
  };

  // Check if a date is in the cleaning buffer period (admin view only)
  const isDateInBuffer = (dateStr: string, roomId: string): boolean => {
    if (!isAdminView) return false;

    const checkDate = parseDate(dateStr);
    return bookings.some((booking) => {
      if (booking.room_id !== roomId) return false;
      if (booking.status === 'cancelled') return false;
      const bookingEnd = parseDate(booking.end_date);
      const bufferEnd = new Date(bookingEnd);
      bufferEnd.setDate(bufferEnd.getDate() + CLEANING_BUFFER_DAYS);
      // Check if date is after checkout but within buffer
      return checkDate > bookingEnd && checkDate <= bufferEnd;
    });
  };

  const isPast = (day: number): boolean => {
    const date = new Date(currentYear, currentMonth, day);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return date < todayStart;
  };

  // Check if entire duration range is available
  const isRangeAvailable = (startDate: string, days: number, roomId: string): boolean => {
    const start = parseDate(startDate);
    for (let i = 0; i < days; i++) {
      const checkDate = addDays(start, i);
      const dateStr = formatDate(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
      if (isDateUnavailable(dateStr, roomId)) {
        return false;
      }
    }
    return true;
  };

  // Check if a date is in the selected range
  const isInSelectedRange = (dateStr: string): boolean => {
    if (!selectedStartDate || !selectedDurationDays) return false;

    const date = parseDate(dateStr);
    const start = parseDate(selectedStartDate);
    const end = addDays(start, selectedDurationDays - 1);

    return date >= start && date <= end;
  };

  const getDateStatus = (day: number) => {
    const dateStr = formatDate(currentYear, currentMonth, day);

    if (isPast(day)) return 'past';

    if (selectedStudio) {
      // Admin view: check buffer first
      if (isAdminView && isDateInBuffer(dateStr, selectedStudio)) return 'buffer';
      if (isDateUnavailable(dateStr, selectedStudio)) return 'booked';
      if (isInSelectedRange(dateStr)) return 'selected';
      return 'available';
    }

    // When no studio selected, check if ANY room is available
    const bookedRoomCount = rooms.filter((room) => isDateUnavailable(dateStr, room.id)).length;
    const totalRooms = rooms.length;

    // Only show as booked if ALL rooms are booked
    if (bookedRoomCount === totalRooms && totalRooms > 0) return 'all-booked';
    // Otherwise show as available (at least one room is free)
    return 'available';
  };

  const handleDateClick = (day: number) => {
    if (!selectedStudio || isPast(day)) return;

    const dateStr = formatDate(currentYear, currentMonth, day);

    // If clicking on an unavailable date, do nothing
    if (isDateUnavailable(dateStr, selectedStudio)) return;

    // Redirect to booking page for this room and date
    const room = getSelectedRoom();
    if (!room) return;

    const bookingUrl = `/${locale}/book/${room.slug}?start=${dateStr}`;
    window.location.href = bookingUrl;
  };

  const handleDurationChange = (days: number) => {
    setSelectedDurationDays(days);

    // Re-validate selection if already selected
    if (selectedStartDate && selectedStudio) {
      if (!isRangeAvailable(selectedStartDate, days, selectedStudio)) {
        setSubmitStatus('error');
        setSubmitMessage(
          isRtl
            ? 'الفترة المحددة تحتوي على تواريخ محجوزة. اختر مدة أقصر.'
            : 'Selected period contains booked dates. Choose a shorter duration.'
        );
        setSelectedStartDate(null);
      }
    }
  };

  const getSelectedRoom = (): Room | undefined => {
    return rooms.find((r) => r.id === selectedStudio);
  };

  const clearSelection = () => {
    setSelectedStartDate(null);
    setSubmitStatus('idle');
  };

  // Proceed to payment - redirect to checkout
  const handleProceedToPayment = async () => {
    if (!selectedStudio || !selectedStartDate) return;

    const room = getSelectedRoom();
    if (!room) return;

    // Calculate total
    const days = selectedDurationDays;
    const months = days / 30;
    let total: number;

    if (days >= 365) {
      const years = Math.floor(days / 365);
      const remainingDays = days % 365;
      const remainingMonths = remainingDays / 30;
      total = (room.yearly_rate * years) + (room.monthly_rate * remainingMonths);
    } else {
      total = room.monthly_rate * months;
    }

    // Calculate end date
    const start = parseDate(selectedStartDate);
    const end = addDays(start, selectedDurationDays - 1);
    const endDate = formatDate(end.getFullYear(), end.getMonth(), end.getDate());

    // Redirect to checkout page or initiate Stripe
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: selectedStudio,
          startDate: selectedStartDate,
          endDate: endDate,
          durationDays: selectedDurationDays,
          totalAmount: total,
          locale: locale,
        }),
      });

      const result = await response.json();

      if (result.url) {
        // Redirect to Stripe checkout
        window.location.href = result.url;
      } else if (result.error) {
        setSubmitStatus('error');
        setSubmitMessage(isRtl ? result.errorAr || result.error : result.error);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setSubmitStatus('error');
      setSubmitMessage(
        isRtl
          ? 'حدث خطأ أثناء تجهيز الدفع. الرجاء المحاولة مرة أخرى.'
          : 'An error occurred preparing checkout. Please try again.'
      );
    }
  };

  return (
    <section id="calendar" className="py-24 bg-gradient-to-b from-[#FAF8F5] to-[#F0EBE3]">
      <div className="container-luxury">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-3 px-6 py-2.5 border border-[#C9A96E]/30 mb-6">
            <CalendarIcon className="w-5 h-5 text-[#C9A96E]" />
            <span className="text-[#C9A96E] text-sm font-semibold tracking-[0.25em] uppercase">
              {isRtl ? 'تقويم التوفر' : 'Availability'}
            </span>
          </div>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-light mb-6 text-[#1A1A1A] tracking-wide">
            {isRtl ? 'احجز' : 'Book'}{' '}
            <span className="text-gold-gradient font-normal">{isRtl ? 'استوديوك' : 'Your Studio'}</span>
          </h2>
          <p className="text-xl md:text-2xl text-[#5A5A5A] max-w-3xl mx-auto font-light leading-relaxed">
            {isRtl
              ? 'اختر تاريخ البداية ومدة الإقامة (الحد الأدنى 30 يوم)'
              : 'Select your start date and duration (minimum 30 days)'}
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 text-[#C9A96E] animate-spin mr-3" />
            <span className="text-[#C9A96E] uppercase tracking-widest text-sm">
              {isRtl ? 'جاري التحميل...' : 'Loading...'}
            </span>
          </div>
        )}

        {!loading && (
          <div className="w-full space-y-8">
            {/* Room Filter */}
            <div className={`flex flex-wrap justify-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              {rooms.map((room, index) => {
                const colorKey = `room-${index + 1}`;
                const colors = roomColors[colorKey] || roomColors['room-1'];
                return (
                  <Button
                    key={room.id}
                    variant="outline"
                    onClick={() => {
                      setSelectedStudio(room.id);
                      clearSelection();
                    }}
                    className={`rounded-lg uppercase tracking-widest text-xs px-4 py-2.5 transition-all duration-300 border flex items-center gap-2 ${
                      selectedStudio === room.id
                        ? `${colors.bg} text-black border-transparent font-bold shadow-lg`
                        : 'border-[#E8E3DB] text-[#2D2D2D] hover:bg-[#F0EBE3] hover:border-[#C9A96E]'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${colors.bg}`} />
                    {isRtl ? room.name_ar : room.name}
                  </Button>
                );
              })}
            </div>


            {/* Instructions */}
            {selectedStudio && (
              <div className="text-center p-4 bg-[#C9A96E]/10 border border-[#C9A96E]/30 rounded-lg">
                <p className="text-[#8B7355] text-sm md:text-base font-medium">
                  {isRtl
                    ? 'اختر تاريخ البداية لحجزك'
                    : 'Select your check-in date to proceed'}
                </p>
              </div>
            )}

            {/* Calendar Section - Only show when specific studio is selected */}
            {selectedStudio && (
            <div className="max-w-4xl mx-auto">
              {/* Calendar Card */}
                <div className="card-luxury border border-[#E8E3DB] p-4 md:p-5">
                  {/* Header */}
                  <div className={`flex items-center justify-between mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={goToPrevMonth}
                      className="text-[#2D2D2D]/60 hover:text-[#C9A96E] hover:bg-[#C9A96E]/10 h-8 w-8"
                    >
                      {isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </Button>
                    <h3 className="text-sm font-light text-[#2D2D2D] tracking-widest uppercase">
                      {months[currentMonth]} {currentYear}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={goToNextMonth}
                      className="text-[#2D2D2D]/60 hover:text-[#C9A96E] hover:bg-[#C9A96E]/10 h-8 w-8"
                    >
                      {isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </Button>
                  </div>

                  {/* Day Names */}
                  <div className={`grid grid-cols-7 gap-1 mb-2 ${isRtl ? 'direction-rtl' : ''}`}>
                    {days.map((day) => (
                      <div
                        key={day}
                        className="text-center text-[10px] font-medium text-[#C9A96E]/60 py-1.5 uppercase tracking-wider"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Empty cells for days before the first of the month */}
                    {Array.from({ length: firstDay }).map((_, index) => (
                      <div key={`empty-${index}`} className="aspect-square" />
                    ))}

                    {/* Days of the month */}
                    {Array.from({ length: daysInMonth }).map((_, index) => {
                      const day = index + 1;
                      const dateStr = formatDate(currentYear, currentMonth, day);
                      const status = getDateStatus(day);
                      const isClickable = selectedStudio && (status === 'available' || status === 'selected');
                      const isStartDate = dateStr === selectedStartDate;

                      let bgClass = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/25';
                      let icon: React.ReactNode = <Check className="w-3 h-3" />;

                      if (status === 'past') {
                        bgClass = 'bg-[#F0EBE3]/50 border-[#E8E3DB] text-[#B0A9A0] cursor-not-allowed';
                        icon = null;
                      } else if (status === 'buffer') {
                        // Admin view: buffer days in yellow with special styling
                        bgClass = 'bg-yellow-50 border-yellow-300 text-yellow-700 cursor-default';
                        icon = <span className="text-lg">🧹</span>;
                      } else if (status === 'booked' || status === 'all-booked') {
                        bgClass = 'bg-red-500/15 border-red-500/40 text-red-600 cursor-not-allowed';
                        icon = <X className="w-3 h-3" />;
                      } else if (status === 'selected') {
                        bgClass = isStartDate
                          ? 'bg-[#C9A96E] border-[#B89355] text-white ring-2 ring-[#C9A96E] ring-offset-2 ring-offset-white'
                          : 'bg-[#C9A96E]/30 border-[#C9A96E] text-[#8B7355]';
                        icon = isStartDate ? <Check className="w-3 h-3" /> : null;
                      }

                      const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

                      const title = status === 'buffer' ? 'Reserved for cleaning & inspection' : undefined;

                      return (
                        <button
                          key={day}
                          onClick={() => handleDateClick(day)}
                          disabled={!selectedStudio || status === 'past' || status === 'booked' || status === 'all-booked' || status === 'buffer'}
                          title={title}
                          className={`aspect-square border flex flex-col items-center justify-center gap-0.5 rounded-lg transition-all duration-300 text-xs ${bgClass} ${
                            isToday && status !== 'selected' ? 'ring-1 ring-[#C9A96E]' : ''
                          } ${isClickable ? 'cursor-pointer' : ''} ${isStartDate ? 'font-bold' : ''}`}
                        >
                          <span className="text-[11px] font-light">{day}</span>
                          {icon && <span className="opacity-75 w-2 h-2 flex items-center justify-center">{icon}</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className={`flex flex-wrap justify-center gap-3 md:gap-4 mt-4 pt-4 border-t border-[#E8E3DB] ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <div className="w-3 h-3 bg-emerald-500/15 border border-emerald-500/40 rounded-sm flex items-center justify-center">
                        <Check className="w-1.5 h-1.5 text-emerald-600" />
                      </div>
                      <span className="text-[10px] md:text-xs text-[#6B6B6B] uppercase tracking-wider">
                        {isRtl ? 'متاح' : 'Available'}
                      </span>
                    </div>
                    <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <div className="w-3 h-3 bg-[#C9A96E] border border-[#B89355] rounded-sm flex items-center justify-center">
                        <Check className="w-1.5 h-1.5 text-white" />
                      </div>
                      <span className="text-[10px] md:text-xs text-[#6B6B6B] uppercase tracking-wider">
                        {isRtl ? 'محدد' : 'Selected'}
                      </span>
                    </div>
                    <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <div className="w-3 h-3 bg-red-500/15 border border-red-500/40 rounded-sm flex items-center justify-center">
                        <X className="w-1.5 h-1.5 text-red-600" />
                      </div>
                      <span className="text-[10px] md:text-xs text-[#6B6B6B] uppercase tracking-wider">
                        {isRtl ? 'محجوز' : 'Booked'}
                      </span>
                    </div>
                    {isAdminView && (
                      <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <div className="w-3 h-3 bg-yellow-50 border border-yellow-300 rounded-sm flex items-center justify-center">
                          <span className="text-[10px]">🧹</span>
                        </div>
                        <span className="text-[10px] md:text-xs text-[#6B6B6B] uppercase tracking-wider">
                          {isRtl ? 'تنظيف' : 'Cleaning Buffer'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
