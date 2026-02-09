/**
 * Month-based availability utilities for booking calendar
 * Works with month format "YYYY-MM" (e.g., "2025-01")
 * Supports durations from 1-36 months
 */

/**
 * Convert month string (e.g., "2025-01") to Date (first day of month)
 */
export function monthStringToDate(monthStr: string): Date {
  const match = monthStr.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid month format: "${monthStr}". Expected format: "YYYY-MM"`);
  }

  const [, yearStr, monthPart] = match;
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthPart, 10) - 1; // JavaScript months are 0-indexed

  if (month < 0 || month > 11) {
    throw new Error(`Invalid month: ${monthPart}. Must be between 01 and 12`);
  }

  return new Date(year, month, 1);
}

/**
 * Convert Date to month string format (e.g., "2025-01")
 */
export function dateToMonthString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get array of month strings within a date range
 */
export function getMonthsInRange(startMonth: string, duration: number): string[] {
  if (duration < 1 || duration > 36) {
    throw new Error(`Invalid duration: ${duration}. Must be between 1 and 36 months`);
  }

  const start = monthStringToDate(startMonth);
  const months: string[] = [];

  for (let i = 0; i < duration; i++) {
    const currentDate = new Date(start);
    currentDate.setMonth(start.getMonth() + i);
    months.push(dateToMonthString(currentDate));
  }

  return months;
}

/**
 * Calculate the end month based on start month and duration
 */
export function calculateEndMonth(startMonth: string, duration: number): string {
  const months = getMonthsInRange(startMonth, duration);
  return months[months.length - 1];
}

/**
 * Check if a specific month is available for a room
 */
export function isMonthAvailable(
  roomId: string,
  month: string,
  bookings: Array<{
    room_id: string;
    start_month?: string;
    duration_months?: number;
    start_date?: string;
    end_date?: string;
    status?: string;
  }>
): boolean {
  if (!roomId || !month || !bookings) {
    return true;
  }

  const monthStart = monthStringToDate(month);
  const monthEnd = new Date(monthStart);
  monthEnd.setMonth(monthEnd.getMonth() + 1);
  monthEnd.setDate(0); // Last day of the month

  return !bookings.some((booking) => {
    // Only check non-cancelled bookings
    if (booking.status === 'cancelled') {
      return false;
    }

    // Only check bookings for this room
    if (booking.room_id !== roomId) {
      return false;
    }

    // Month-based check
    if (booking.start_month && booking.duration_months) {
      const bookedMonths = getMonthsInRange(booking.start_month, booking.duration_months);
      return bookedMonths.includes(month);
    }

    // Legacy date-based check
    if (booking.start_date && booking.end_date) {
      const bookingStart = new Date(booking.start_date);
      const bookingEnd = new Date(booking.end_date);
      return bookingStart <= monthEnd && bookingEnd >= monthStart;
    }

    return false;
  });
}

/**
 * Check availability for a complete booking range
 */
export function checkRangeAvailability(
  roomId: string,
  startMonth: string,
  duration: number,
  bookings: Array<{
    room_id: string;
    start_month?: string;
    duration_months?: number;
    start_date?: string;
    end_date?: string;
    status?: string;
  }>
): { available: boolean; conflicts: string[] } {
  try {
    const months = getMonthsInRange(startMonth, duration);
    const conflicts: string[] = [];

    for (const month of months) {
      if (!isMonthAvailable(roomId, month, bookings)) {
        conflicts.push(month);
      }
    }

    return {
      available: conflicts.length === 0,
      conflicts,
    };
  } catch {
    return {
      available: false,
      conflicts: [startMonth],
    };
  }
}

/**
 * Get availability map for multiple months
 */
export function getMonthAvailabilityMap(
  roomId: string,
  startMonth: string,
  numMonthsToShow: number,
  bookings: Array<{
    room_id: string;
    start_month?: string;
    duration_months?: number;
    start_date?: string;
    end_date?: string;
    status?: string;
  }>
): Record<string, boolean> {
  try {
    const months = getMonthsInRange(startMonth, numMonthsToShow);
    const availabilityMap: Record<string, boolean> = {};

    for (const month of months) {
      availabilityMap[month] = isMonthAvailable(roomId, month, bookings);
    }

    return availabilityMap;
  } catch {
    return {};
  }
}

/**
 * Get current month in "YYYY-MM" format
 */
export function getCurrentMonth(): string {
  return dateToMonthString(new Date());
}

/**
 * Add months to a month string
 */
export function addMonths(monthStr: string, monthsToAdd: number): string {
  const date = monthStringToDate(monthStr);
  date.setMonth(date.getMonth() + monthsToAdd);
  return dateToMonthString(date);
}

/**
 * Compare two month strings
 */
export function compareMonths(monthA: string, monthB: string): number {
  const dateA = monthStringToDate(monthA).getTime();
  const dateB = monthStringToDate(monthB).getTime();
  return dateA - dateB;
}

/**
 * Check if month string is valid
 */
export function isValidMonthString(monthStr: string): boolean {
  try {
    monthStringToDate(monthStr);
    return true;
  } catch {
    return false;
  }
}

/**
 * Calculate price based on duration and rate model
 */
export function calculateMonthlyPrice(
  monthlyRate: number,
  yearlyRate: number,
  durationMonths: number,
  rateModel: 'monthly' | 'yearly'
): {
  total: number;
  perMonth: number;
  savings: number;
  savingsPercent: number;
} {
  let total: number;

  if (rateModel === 'yearly') {
    const years = Math.floor(durationMonths / 12);
    const remaining = durationMonths % 12;
    total = (yearlyRate * years) + (monthlyRate * remaining);
  } else {
    total = monthlyRate * durationMonths;
  }

  const monthlyEquivalent = monthlyRate * durationMonths;
  const savings = monthlyEquivalent - total;
  const savingsPercent = monthlyEquivalent > 0 ? Math.round((savings / monthlyEquivalent) * 100) : 0;

  return {
    total,
    perMonth: Math.round(total / durationMonths),
    savings,
    savingsPercent,
  };
}

/**
 * Format month for display
 */
export function formatMonthDisplay(
  monthStr: string,
  locale: 'en' | 'ar' = 'en'
): string {
  const monthNames = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  };

  const [year, month] = monthStr.split('-').map(Number);
  const monthName = monthNames[locale][month - 1];
  return `${monthName} ${year}`;
}
