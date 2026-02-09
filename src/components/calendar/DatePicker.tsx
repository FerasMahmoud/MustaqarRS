'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Check, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isRangeAvailable, getDateRange, getMaxAvailableDays, calculateOptimalDuration } from '@/lib/validation';

interface DatePickerProps {
  selectedDate: string;
  onDateSelect: (date: string) => void;
  locale: 'en' | 'ar';
  roomId?: string;
  bookedDates?: string[]; // Array of booked date strings "YYYY-MM-DD"
  durationDays?: number; // Duration for range calculation and highlighting
  onRangeValidation?: (
    isValid: boolean,
    conflictDate: string | null,
    availability?: { maxAvailable: number; recommendedDays?: number; mode?: string } // NEW: Gap-filling data
  ) => void;
}

const MONTH_NAMES = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};

const DAY_NAMES = {
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ar: ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
};

export function DatePicker({
  selectedDate,
  onDateSelect,
  locale,
  roomId,
  bookedDates = [],
  durationDays = 30,
  onRangeValidation,
}: DatePickerProps) {
  const isRtl = locale === 'ar';
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewMonth, setViewMonth] = useState(() => {
    if (selectedDate) {
      const d = new Date(selectedDate);
      return { year: d.getFullYear(), month: d.getMonth() };
    }
    return { year: today.getFullYear(), month: today.getMonth() };
  });

  const [bookings, setBookings] = useState<{ start_date: string; end_date: string }[]>([]);
  const [availabilityBlocks, setAvailabilityBlocks] = useState<{ start_date: string; end_date: string }[]>([]);
  const [selectedRange, setSelectedRange] = useState<string[]>([]);
  const [rangeConflict, setRangeConflict] = useState<string | null>(null);

  // Fetch bookings AND availability blocks for the room
  useEffect(() => {
    if (roomId) {
      // Pass roomId to server for efficient filtering - returns this room's bookings AND blocks
      fetch(`/api/bookings?availability=true&roomId=${roomId}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to fetch bookings');
          }
          return res.json();
        })
        .then(data => {
          if (data.bookings) {
            setBookings(data.bookings);
          }
          // Also store availability blocks (owner reservations, maintenance, etc.)
          if (data.availabilityBlocks) {
            setAvailabilityBlocks(data.availabilityBlocks);
          }
        })
        .catch(err => console.error('Error fetching bookings:', err));
    }
  }, [roomId]);

  // Combine bookings and availability blocks for validation
  const allUnavailablePeriods = useMemo(() => {
    return [...bookings, ...availabilityBlocks];
  }, [bookings, availabilityBlocks]);

  // Calculate and validate date range when selectedDate or durationDays changes
  useEffect(() => {
    if (selectedDate && durationDays > 0) {
      // Get all dates in the selected range
      const range = getDateRange(selectedDate, durationDays);
      setSelectedRange(range);

      // Validate if entire range is available (check both bookings AND availability blocks)
      const validation = isRangeAvailable(selectedDate, durationDays, allUnavailablePeriods);
      setRangeConflict(validation.conflictDate);

      // Notify parent component of validation result
      onRangeValidation?.(validation.available, validation.conflictDate);
    } else {
      setSelectedRange([]);
      setRangeConflict(null);
    }
  }, [selectedDate, durationDays, allUnavailablePeriods, onRangeValidation]);

  // Memoize booking dates AND availability blocks for efficient lookups
  const bookedDateRanges = useMemo(() => {
    // Combine bookings and availability blocks into one array of unavailable ranges
    const bookingRanges = bookings.map(booking => ({
      start: new Date(booking.start_date),
      end: new Date(booking.end_date),
    }));
    const blockRanges = availabilityBlocks.map(block => ({
      start: new Date(block.start_date),
      end: new Date(block.end_date),
    }));
    return [...bookingRanges, ...blockRanges];
  }, [bookings, availabilityBlocks]);

  // Check if a date is booked - memoized for performance
  const isDateBooked = useMemo(() => {
    return (dateStr: string): boolean => {
      if (bookedDates.includes(dateStr)) return true;

      const date = new Date(dateStr);
      return bookedDateRanges.some(range => date >= range.start && date <= range.end);
    };
  }, [bookedDates, bookedDateRanges]);

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get first day of month (0 = Sunday)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(viewMonth.year, viewMonth.month);
  const firstDay = getFirstDayOfMonth(viewMonth.year, viewMonth.month);

  // Navigate months
  const prevMonth = () => {
    if (viewMonth.month === 0) {
      setViewMonth({ year: viewMonth.year - 1, month: 11 });
    } else {
      setViewMonth({ ...viewMonth, month: viewMonth.month - 1 });
    }
  };

  const nextMonth = () => {
    if (viewMonth.month === 11) {
      setViewMonth({ year: viewMonth.year + 1, month: 0 });
    } else {
      setViewMonth({ ...viewMonth, month: viewMonth.month + 1 });
    }
  };

  // Check if current view is current month
  const isCurrentMonth = viewMonth.year === today.getFullYear() && viewMonth.month === today.getMonth();

  // Generate calendar days
  const days = [];

  // Empty cells for days before first day of month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const handleDateClick = (day: number) => {
    const dateStr = `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const clickedDate = new Date(dateStr);

    // Don't allow selecting past dates or individually booked/blocked dates
    if (clickedDate < today || isDateBooked(dateStr)) {
      return;
    }

    // Calculate optimal duration for this date (including availability blocks)
    const optimal = calculateOptimalDuration(dateStr, durationDays || 30, allUnavailablePeriods);

    // Check if range conflicts (including availability blocks)
    if (durationDays && durationDays > 0) {
      const validation = isRangeAvailable(
        dateStr,
        Math.min(durationDays, optimal.maxAvailable === Infinity ? durationDays : optimal.maxAvailable),
        allUnavailablePeriods
      );

      if (!validation.available) {
        setRangeConflict(validation.conflictDate);
        onRangeValidation?.(false, validation.conflictDate, { maxAvailable: optimal.maxAvailable });
        return;
      }
    }

    // Notify parent about availability
    onRangeValidation?.(true, null, {
      maxAvailable: optimal.maxAvailable,
      recommendedDays: optimal.recommendedDays,
      mode: optimal.mode
    });

    onDateSelect(dateStr);
  };

  return (
    <div className="bg-white border border-[#E8E3DB] rounded-xl p-4 shadow-sm">
      {/* Month Navigation */}
      <div className={`flex items-center justify-between mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <Button
          variant="ghost"
          size="icon"
          onClick={prevMonth}
          disabled={isCurrentMonth}
          className="text-[#2D2D2D]/60 hover:text-[#C9A96E] hover:bg-[#C9A96E]/10 disabled:opacity-30"
        >
          {isRtl ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </Button>

        <h3 className="text-booking-section font-medium text-[#2D2D2D]">
          {MONTH_NAMES[locale][viewMonth.month]} {viewMonth.year}
        </h3>

        <Button
          variant="ghost"
          size="icon"
          onClick={nextMonth}
          className="text-[#2D2D2D]/60 hover:text-[#C9A96E] hover:bg-[#C9A96E]/10"
        >
          {isRtl ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </Button>
      </div>

      {/* Day Headers */}
      <div className={`grid grid-cols-7 gap-1 mb-2 ${isRtl ? 'direction-rtl' : ''}`}>
        {DAY_NAMES[locale].map((day, index) => (
          <div
            key={index}
            className="text-center text-booking-label font-medium text-[#8B7355] py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateStr = `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const date = new Date(dateStr);
          const isPast = date < today;
          const isBooked = isDateBooked(dateStr);
          const isSelected = dateStr === selectedDate;
          const isInRange = selectedRange.includes(dateStr); // NEW: Check if date is in selected range
          const isToday = date.getTime() === today.getTime();

          let dayClass = 'hover:bg-[#C9A96E]/10 hover:border-[#C9A96E] cursor-pointer';

          if (isPast) {
            dayClass = 'bg-[#F5F1ED] text-[#A89968] cursor-not-allowed border-[#E8E3DB] line-through opacity-50';
          } else if (isBooked) {
            dayClass = 'bg-red-50 text-red-400 cursor-not-allowed line-through border-red-200';
          } else if (isSelected) {
            dayClass = 'bg-[#C9A96E] text-white font-semibold shadow-md border-[#C9A96E]';
          } else if (isInRange) {
            // Light gold background for dates in range - still clickable to change selection
            dayClass = 'bg-[#C9A96E]/30 text-[#2D2D2D] hover:bg-[#C9A96E]/50 cursor-pointer border-[#C9A96E]/30';
          } else if (isToday) {
            dayClass = 'border-[#C9A96E] border-2 font-semibold hover:bg-[#C9A96E]/10 cursor-pointer text-[#C9A96E]';
          }

          return (
            <button
              key={day}
              onClick={() => handleDateClick(day)}
              disabled={isPast || isBooked}
              className={`
                aspect-square flex flex-col items-center justify-center rounded-lg
                text-booking-body-sm transition-all duration-200 border border-transparent
                ${dayClass}
              `}
            >
              <span>{day}</span>
              {isSelected && !isPast && !isBooked && (
                <Check className="w-3 h-3 mt-0.5" />
              )}
              {isBooked && !isPast && (
                <X className="w-3 h-3 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Conflict Error Message */}
      {rangeConflict && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-booking-body-sm font-medium text-red-800">
              {isRtl
                ? 'لا يمكن حجز هذه الفترة - يوجد حجز آخر'
                : 'Cannot select this date range - conflicts with existing booking'}
            </p>
            <p className="text-booking-label text-red-600 mt-1">
              {isRtl ? 'تاريخ التعارض: ' : 'Conflict on: '}
              <span className="font-medium">{rangeConflict}</span>
            </p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className={`flex flex-wrap justify-center gap-4 mt-4 pt-4 border-t border-[#E8E3DB] text-booking-label ${isRtl ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className="w-4 h-4 rounded bg-[#C9A96E]" />
          <span className="text-booking-body-sm text-[#6B6B6B]">{isRtl ? 'محدد' : 'Selected'}</span>
        </div>
        <div className={`flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className="w-4 h-4 rounded border-2 border-[#C9A96E]" />
          <span className="text-booking-body-sm text-[#6B6B6B]">{isRtl ? 'اليوم' : 'Today'}</span>
        </div>
        <div className={`flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className="w-4 h-4 rounded bg-[#F5F1ED] border border-[#E8E3DB] line-through opacity-50" />
          <span className="text-booking-body-sm text-[#6B6B6B]">{isRtl ? 'منقضية' : 'Past'}</span>
        </div>
        <div className={`flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className="w-4 h-4 rounded bg-red-50 border border-red-200" />
          <span className="text-booking-body-sm text-[#6B6B6B]">{isRtl ? 'محجوز' : 'Booked'}</span>
        </div>
      </div>
    </div>
  );
}
