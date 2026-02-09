'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatMonthDisplay } from '@/lib/availability';

interface Room {
  id: string;
  name: string;
  name_ar: string;
}

interface MonthGridProps {
  viewYear: number;
  onYearChange: (year: number) => void;
  rooms: Room[];
  selectedRoom: string | 'all';
  availabilityMap: Record<string, Record<string, boolean>>; // roomId -> month -> available
  selectedStartMonth: string | null;
  selectedDuration: number;
  onMonthSelect: (month: string) => void;
  locale: 'en' | 'ar';
  currentMonth: string;
}

const ROOM_COLORS: Record<string, { dot: string; selected: string; dotBorder: string }> = {
  'room-1': {
    dot: 'bg-[#D4AF37]',
    selected: 'ring-[#D4AF37] bg-[#D4AF37]/10',
    dotBorder: 'border-[#D4AF37]'
  },
  'room-2': {
    dot: 'bg-emerald-500',
    selected: 'ring-emerald-500 bg-emerald-500/10',
    dotBorder: 'border-emerald-500'
  },
};

const MONTH_NAMES = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};

export function MonthGrid({
  viewYear,
  onYearChange,
  rooms,
  selectedRoom,
  availabilityMap,
  selectedStartMonth,
  selectedDuration,
  onMonthSelect,
  locale,
  currentMonth,
}: MonthGridProps) {
  const isRtl = locale === 'ar';
  const monthNames = MONTH_NAMES[locale];

  // Generate array of 12 months for the year
  const months = Array.from({ length: 12 }, (_, i) => {
    const month = String(i + 1).padStart(2, '0');
    return `${viewYear}-${month}`;
  });

  // Check if a month is in the selected range
  const isInSelectedRange = (month: string): boolean => {
    if (!selectedStartMonth || selectedDuration < 1) return false;

    const startParts = selectedStartMonth.split('-').map(Number);
    const monthParts = month.split('-').map(Number);

    const startDate = new Date(startParts[0], startParts[1] - 1);
    const endDate = new Date(startParts[0], startParts[1] - 1 + selectedDuration - 1);
    const checkDate = new Date(monthParts[0], monthParts[1] - 1);

    return checkDate >= startDate && checkDate <= endDate;
  };

  // Check if a month is before current month
  const isPastMonth = (month: string): boolean => {
    return month < currentMonth;
  };

  // Get room availability for a specific month
  const getRoomAvailability = (month: string, roomId: string): boolean => {
    return availabilityMap[roomId]?.[month] ?? true;
  };

  // Get display rooms based on filter
  const displayRooms = selectedRoom === 'all'
    ? rooms
    : rooms.filter(r => r.id === selectedRoom);

  return (
    <div className="space-y-6">
      {/* Year Navigation */}
      <div className={`flex items-center justify-center gap-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onYearChange(viewYear - 1)}
          className="text-[#2D2D2D]/60 hover:text-[#C9A96E] hover:bg-[#C9A96E]/10"
        >
          {isRtl ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </Button>
        <h3 className="text-2xl font-light text-[#2D2D2D] tracking-widest min-w-[100px] text-center">
          {viewYear}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onYearChange(viewYear + 1)}
          className="text-[#2D2D2D]/60 hover:text-[#C9A96E] hover:bg-[#C9A96E]/10"
        >
          {isRtl ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </Button>
      </div>

      {/* Month Grid - 4x3 */}
      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
        {months.map((month, index) => {
          const isPast = isPastMonth(month);
          const isStart = month === selectedStartMonth;
          const isInRange = isInSelectedRange(month);
          const isClickable = !isPast && selectedRoom !== 'all';

          // Determine cell styling
          let cellClass = 'border border-[#E8E3DB] bg-white hover:border-[#C9A96E]/50';
          if (isPast) {
            cellClass = 'border border-[#E8E3DB]/50 bg-[#F5F2ED]/50 opacity-50 cursor-not-allowed';
          } else if (isStart) {
            cellClass = 'border-2 border-[#C9A96E] bg-[#C9A96E]/10 ring-2 ring-[#C9A96E] ring-offset-2';
          } else if (isInRange) {
            cellClass = 'border border-[#C9A96E] bg-[#C9A96E]/5';
          }

          return (
            <button
              key={month}
              onClick={() => isClickable && onMonthSelect(month)}
              disabled={isPast || selectedRoom === 'all'}
              className={`
                relative p-4 rounded-lg transition-all duration-200
                ${cellClass}
                ${isClickable ? 'cursor-pointer hover:shadow-md' : ''}
              `}
            >
              {/* Month Name */}
              <div className="text-center mb-3">
                <span className={`text-sm font-medium ${isPast ? 'text-[#B0A9A0]' : 'text-[#2D2D2D]'}`}>
                  {monthNames[index]}
                </span>
              </div>

              {/* Room Availability Dots */}
              <div className={`flex justify-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                {displayRooms.map((room, roomIndex) => {
                  const colorKey = `room-${roomIndex + 1}`;
                  const colors = ROOM_COLORS[colorKey] || ROOM_COLORS['room-1'];
                  const isAvailable = getRoomAvailability(month, room.id);

                  return (
                    <div
                      key={room.id}
                      className={`
                        w-3 h-3 rounded-full border-2 transition-all
                        ${isAvailable
                          ? `${colors.dot} ${colors.dotBorder}`
                          : 'bg-white border-gray-300'
                        }
                      `}
                      title={`${isRtl ? room.name_ar : room.name}: ${isAvailable ? (isRtl ? 'متاح' : 'Available') : (isRtl ? 'محجوز' : 'Booked')}`}
                    />
                  );
                })}
              </div>

              {/* Selected Range Indicator */}
              {isStart && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#C9A96E] rounded-full flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">1</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className={`flex flex-wrap justify-center gap-4 md:gap-6 pt-6 mt-6 px-4 py-6 bg-[#FAF7F2] rounded-2xl border-2 border-[#E8E3DB] ${isRtl ? 'flex-row-reverse' : ''}`}>
        {rooms.map((room, index) => {
          const colorKey = `room-${index + 1}`;
          const colors = ROOM_COLORS[colorKey] || ROOM_COLORS['room-1'];
          return (
            <div key={room.id} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/50 transition-all ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className={`w-5 h-5 rounded-full flex-shrink-0 shadow-md ${colors.dot}`} />
              <span className="text-sm md:text-base font-semibold text-[#1A1A1A] uppercase tracking-wide">
                {isRtl ? room.name_ar : room.name}
              </span>
            </div>
          );
        })}
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white/50 transition-all ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className="w-5 h-5 rounded-full flex-shrink-0 bg-white border-2 border-red-400 shadow-md" />
          <span className="text-sm md:text-base font-semibold text-[#1A1A1A] uppercase tracking-wide">
            {isRtl ? 'محجوز' : 'Booked'}
          </span>
        </div>
      </div>
    </div>
  );
}
