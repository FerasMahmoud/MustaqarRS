'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Edit3, TrendingDown, AlertCircle, Check } from 'lucide-react';

interface DurationSelectorProps {
  selectedDays: number;
  onDurationChange: (days: number) => void;
  locale: 'en' | 'ar';
  disabled?: boolean;
  monthlyRate: number;
  yearlyRate: number;
  hasConflict?: boolean;
  maxAvailableDays?: number; // NEW: Gap-filling support
  bookingMode?: 'standard' | 'gap-filling' | 'auto-extended'; // NEW
  startDate?: string; // NEW
  selectedCleaningService?: boolean;
  onCleaningServiceChange?: (enabled: boolean) => void;
}

// Duration options in days (30-day months for consistency)
// Discount structure: 1-2mo=0%, 3-5mo=5%, 6-8mo=7%, 9-11mo=9%, 12-14mo=11%, etc (+2% every 3 months)
const DAY_OPTIONS = [
  { days: 30, label: { en: '1 Month', ar: 'شهر' }, savings: 0 },
  { days: 60, label: { en: '2 Months', ar: 'شهرين' }, savings: 0 },
  { days: 90, label: { en: '3 Months', ar: '3 أشهر' }, savings: 5 },
  { days: 120, label: { en: '4 Months', ar: '4 أشهر' }, savings: 5 },
  { days: 150, label: { en: '5 Months', ar: '5 أشهر' }, savings: 5 },
  { days: 180, label: { en: '6 Months', ar: '6 أشهر' }, savings: 7 },
  { days: 240, label: { en: '8 Months', ar: '8 أشهر' }, savings: 7 },
  { days: 270, label: { en: '9 Months', ar: '9 أشهر' }, savings: 9 },
  { days: 360, label: { en: '1 Year', ar: 'سنة' }, savings: 11 },
  { days: 720, label: { en: '2 Years', ar: 'سنتين' }, savings: 19 },
  { days: 1080, label: { en: '3 Years', ar: '3 سنوات' }, savings: 25 },
];

// Calculate savings percentage for any number of days
// Pattern: 1-2mo=0%, 3-5mo=5%, 6-8mo=7%, 9-11mo=9%, 12-14mo=11%, +2% every 3 months
function getSavingsForDays(days: number): number {
  const months = Math.round(days / 30);

  if (months <= 2) return 0;      // 1-2 months: 0%
  if (months <= 5) return 5;      // 3-5 months: 5%
  if (months <= 8) return 7;      // 6-8 months: 7%
  if (months <= 11) return 9;     // 9-11 months: 9%
  if (months <= 14) return 11;    // 12-14 months: 11%
  if (months <= 17) return 13;    // 15-17 months: 13%
  if (months <= 20) return 15;    // 18-20 months: 15%
  if (months <= 23) return 17;    // 21-23 months: 17%
  if (months <= 26) return 19;    // 24-26 months: 19%
  if (months <= 29) return 21;    // 27-29 months: 21%
  if (months <= 32) return 23;    // 30-32 months: 23%
  return 25;                      // 33-36 months: 25%
}

export function DurationSelector({
  selectedDays,
  onDurationChange,
  locale,
  disabled = false,
  monthlyRate,
  yearlyRate,
  hasConflict = false,
  maxAvailableDays,
  bookingMode,
  startDate,
  selectedCleaningService,
  onCleaningServiceChange,
}: DurationSelectorProps) {
  const isRtl = locale === 'ar';
  const [customMonths, setCustomMonths] = useState<string>('');
  const [customYears, setCustomYears] = useState<string>('');

  // Always sync the custom inputs with selectedDays
  useEffect(() => {
    const months = Math.round(selectedDays / 30);
    setCustomMonths(String(months));

    // Calculate years (only show whole years)
    if (months >= 12 && months % 12 === 0) {
      setCustomYears(String(months / 12));
    } else {
      setCustomYears('');
    }
  }, [selectedDays]);

  // Calculate original price (no discount - full monthly rate)
  const calculateOriginalPrice = (days: number): number => {
    const months = days / 30;
    return Math.round(monthlyRate * months);
  };

  // Calculate discounted price for a given number of days
  const calculatePrice = (days: number, savingsPercent: number): number => {
    const originalPrice = calculateOriginalPrice(days);
    if (savingsPercent > 0) {
      return Math.round(originalPrice * (1 - savingsPercent / 100));
    }
    return originalPrice;
  };

  const isSelected = (days: number) => selectedDays === days;

  // Check if current selection is a custom value (not matching any preset)
  const isCustomSelection = !DAY_OPTIONS.some(opt => opt.days === selectedDays);

  // Handle custom month input
  const handleCustomMonthChange = (value: string) => {
    const numValue = value.replace(/[^0-9]/g, '');
    setCustomMonths(numValue);
    setCustomYears(''); // Clear years when manually entering months

    const months = parseInt(numValue, 10);
    if (months >= 1 && months <= 36) {
      const days = months * 30;
      onDurationChange(days);
    }
  };

  // Handle custom years input
  const handleCustomYearsChange = (value: string) => {
    const numValue = value.replace(/[^0-9]/g, '');
    setCustomYears(numValue);

    const years = parseInt(numValue, 10);
    if (years >= 1 && years <= 3) {
      const months = years * 12;
      setCustomMonths(String(months));
      const days = months * 30;
      onDurationChange(days);
    }
  };

  // Handle clicking a preset option
  const handlePresetClick = (days: number) => {
    onDurationChange(days);
  };

  return (
    <div className={`space-y-2 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Section Header */}
      <div className="text-center mb-2">
        <h4 className="text-booking-label-lg text-[#C9A96E] uppercase tracking-widest mb-0.5">
          {isRtl ? 'مدة الإيجار' : 'Rental Duration'}
        </h4>
        <p className="text-booking-body-sm text-[#6B6B6B]">
          {isRtl ? 'اختر المدة' : 'Select duration'}
        </p>
      </div>

      {/* Available Days Indicator */}
      {maxAvailableDays && maxAvailableDays !== Infinity && startDate && (
        <div className={`mb-3 p-3 rounded-lg border-2 ${
          bookingMode === 'auto-extended'
            ? 'bg-amber-50 border-amber-300'
            : 'bg-blue-50 border-blue-300'
        }`}>
          <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <AlertCircle className={`w-4 h-4 ${
              bookingMode === 'auto-extended' ? 'text-amber-600' : 'text-blue-600'
            }`} />
            <p className={`text-booking-body-sm font-medium ${
              bookingMode === 'auto-extended' ? 'text-amber-800' : 'text-blue-800'
            }`}>
              {isRtl
                ? `${maxAvailableDays} يوم متاحة`
                : `${maxAvailableDays} days available`
              }
            </p>
          </div>
          {bookingMode === 'auto-extended' && (
            <p className="text-booking-label text-amber-700 mt-1">
              {isRtl
                ? 'سيتم تمديد الحجز تلقائياً لملء الفراغ'
                : 'Auto-extended to fill gap'
              }
            </p>
          )}
        </div>
      )}

      {/* Conflict Error Message */}
      {hasConflict && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-booking-body-sm text-red-800 font-medium">
            {isRtl
              ? 'لا يمكن حجز هذه المدة للتاريخ المختار'
              : 'This duration is not available for the selected date'}
          </p>
        </div>
      )}

      {/* Duration Grid - Compact */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        {DAY_OPTIONS
          .filter(opt => {
            // Hide options that exceed available days
            if (maxAvailableDays && maxAvailableDays !== Infinity) {
              return opt.days <= maxAvailableDays;
            }
            return true;
          })
          .map(({ days, label, savings }) => {
          const originalPrice = calculateOriginalPrice(days);
          const discountedPrice = calculatePrice(days, savings);
          const hasDiscount = savings > 0;
          const isThisSelected = isSelected(days) && !isCustomSelection;

          return (
            <button
              key={days}
              onClick={() => handlePresetClick(days)}
              disabled={disabled}
              className={`
                relative p-3 md:p-4 rounded-lg text-center transition-all duration-200 border
                ${isThisSelected
                  ? 'border-[#C9A96E] bg-[#C9A96E]/10'
                  : 'border-[#E8E3DB] bg-white hover:border-[#C9A96E]/50 hover:bg-[#C9A96E]/5'
                }
              `}
            >
              {/* Savings Badge */}
              {hasDiscount && (
                <span className={`
                  absolute -top-1.5 ${isRtl ? '-left-0.5' : '-right-0.5'}
                  flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold
                  ${isThisSelected
                    ? 'bg-emerald-500 text-white'
                    : 'bg-[#C9A96E] text-white'
                  }
                `}>
                  <Sparkles className="w-1.5 h-1.5" />
                  {savings}%
                </span>
              )}

              {/* Duration Label */}
              <p className={`text-booking-body font-semibold mb-1 ${isThisSelected ? 'text-[#C9A96E]' : 'text-[#2D2D2D]'}`}>
                {isRtl ? label.ar : label.en}
              </p>

              {/* Days count */}
              <p className="text-booking-label-lg text-[#8B7355] mb-2 font-tabular">
                {days} {isRtl ? 'يوم' : 'days'}
              </p>

              {/* Price Section */}
              <div className="space-y-1">
                {/* Original Price (strikethrough) - only show if there's a discount */}
                {hasDiscount && (
                  <p className="text-booking-body text-[#999] line-through font-tabular">
                    {originalPrice.toLocaleString()} SAR
                  </p>
                )}

                {/* Discounted/Final Price */}
                <p className={`text-booking-section font-semibold font-tabular ${
                  isThisSelected ? 'text-[#C9A96E]' : 'text-[#2D2D2D]'
                }`}>
                  {discountedPrice.toLocaleString()}
                  <span className="text-booking-body-sm font-normal"> SAR</span>
                </p>

                {/* You Save text */}
                {hasDiscount && (
                  <p className="text-booking-body-sm text-emerald-600 font-medium font-tabular">
                    {isRtl ? 'وفّر' : 'Save'} {(originalPrice - discountedPrice).toLocaleString()}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Weekly Cleaning Service Toggle */}
      <div className="p-4 rounded-lg border-2 border-[#E8E3DB] bg-white">
        <label
          className={`flex items-center gap-3 cursor-pointer ${isRtl ? 'flex-row-reverse' : ''}`}
          htmlFor="cleaningService"
        >
          <input
            type="checkbox"
            id="cleaningService"
            checked={selectedCleaningService || false}
            onChange={(e) => onCleaningServiceChange?.(e.target.checked)}
            disabled={disabled}
            className="w-5 h-5 rounded border-2 border-[#C9A96E] text-[#C9A96E]
                       focus:ring-2 focus:ring-[#C9A96E]/30 cursor-pointer"
          />
          <div className="flex-1">
            <p className="text-booking-body font-medium text-[#2D2D2D]">
              {locale === 'ar' ? 'خدمة التنظيف الأسبوعية' : 'Weekly Cleaning Service'}
            </p>
            <p className="text-booking-body-sm text-[#8B7355]">
              {selectedDays < 30
                ? (locale === 'ar' ? '+50 ريال / أسبوع' : '+50 SAR / week')
                : (locale === 'ar' ? '+200 ريال / شهر' : '+200 SAR / month')
              }
            </p>
          </div>
          {selectedCleaningService && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#C9A96E]/10">
              <Check className="w-3 h-3 text-[#C9A96E]" />
              <span className="text-booking-label text-[#C9A96E] font-medium">
                {locale === 'ar' ? 'مضاف' : 'Added'}
              </span>
            </div>
          )}
        </label>
      </div>

      {/* Pricing Breakdown - Shows when duration is selected */}
      {selectedDays > 0 && (
        <div className="p-5 rounded-lg bg-gradient-to-r from-[#FAF7F2] to-white border-2 border-[#C9A96E]/30">
          <div className={`flex items-center gap-2 mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <TrendingDown className="w-4 h-4 text-[#C9A96E]" />
            <h4 className="text-booking-label-lg font-semibold text-[#2D2D2D] uppercase tracking-wider">
              {isRtl ? 'السعر شهريا' : 'Monthly Rate'}
            </h4>
          </div>

          {(() => {
            const savings = getSavingsForDays(selectedDays);
            const baseMonthlyRate = monthlyRate;
            const discountedMonthlyRate = Math.round(baseMonthlyRate * (1 - savings / 100));
            const months = Math.round(selectedDays / 30);

            return (
              <div className="grid grid-cols-2 gap-3">
                {/* Starting Price */}
                <div className="p-4 rounded-lg bg-white border border-[#E8E3DB]">
                  <p className="text-booking-label-lg text-[#8B7355] uppercase tracking-widest font-medium mb-2">
                    {isRtl ? 'السعر الأساسي' : 'Starting Price'}
                  </p>
                  <p className="text-booking-section font-light text-[#2D2D2D] font-tabular mb-1">
                    {baseMonthlyRate.toLocaleString()}
                  </p>
                  <p className="text-booking-body-sm text-[#C9A96E] font-medium">
                    SAR/{isRtl ? 'شهر' : 'mo'}
                  </p>
                </div>

                {/* After Discount */}
                <div className={`p-4 rounded-lg border-2 ${savings > 0 ? 'bg-emerald-50 border-emerald-400' : 'bg-white border-[#E8E3DB]'}`}>
                  <div className={`flex items-center gap-1 mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <p className={`text-booking-label-lg uppercase tracking-widest font-medium ${savings > 0 ? 'text-emerald-700' : 'text-[#8B7355]'}`}>
                      {isRtl ? 'السعر النهائي' : 'After Discount'}
                    </p>
                    {savings > 0 && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white flex items-center gap-0.5">
                        -{savings}%
                      </span>
                    )}
                  </div>
                  <p className={`text-booking-section font-light font-tabular mb-1 ${savings > 0 ? 'text-emerald-600' : 'text-[#2D2D2D]'}`}>
                    {discountedMonthlyRate.toLocaleString()}
                  </p>
                  <p className={`text-booking-body-sm font-medium ${savings > 0 ? 'text-emerald-600' : 'text-[#C9A96E]'}`}>
                    SAR/{isRtl ? 'شهر' : 'mo'}
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Custom Duration Input */}
      <div className="p-6 rounded-lg border-2 border-[#C9A96E] bg-[#C9A96E]/5">
        <div className={`flex items-center gap-3 mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#C9A96E] text-white flex-shrink-0">
            <Edit3 className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="text-booking-section font-semibold text-[#C9A96E]">
              {isRtl ? 'مخصص' : 'Custom'}
            </p>
            <p className="text-booking-body text-[#8B7355]">
              {isRtl ? 'أو أدخل مدة' : 'Enter duration'}
            </p>
          </div>
        </div>

        {/* Duration inputs row - Vertical on mobile, Horizontal on desktop */}
        <div className={`flex items-center gap-3 mt-4 flex-wrap ${isRtl ? 'flex-row-reverse' : ''}`}>
          {/* Years input */}
          <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <input
              type="text"
              inputMode="numeric"
              value={customYears}
              onChange={(e) => handleCustomYearsChange(e.target.value)}
              placeholder="0"
              maxLength={1}
              disabled={bookingMode === 'auto-extended'}
              className={`w-16 h-14 text-center text-2xl font-bold rounded-lg border-2 transition-all
                focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/30
                border-[#C9A96E] bg-white text-[#C9A96E]
                ${bookingMode === 'auto-extended' ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            <span className="text-booking-section text-[#6B6B6B] font-medium">
              {isRtl ? 'سنة' : 'yr'}
            </span>
          </div>

          <span className="text-[#8B7355] text-booking-body font-medium">{isRtl ? 'أو' : '/'}</span>

          {/* Months input */}
          <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <input
              type="text"
              inputMode="numeric"
              value={customMonths}
              onChange={(e) => handleCustomMonthChange(e.target.value)}
              placeholder="1"
              maxLength={2}
              disabled={bookingMode === 'auto-extended'}
              className={`w-16 h-14 text-center text-2xl font-bold rounded-lg border-2 transition-all
                focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/30
                border-[#C9A96E] bg-white text-[#C9A96E]
                ${bookingMode === 'auto-extended' ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            <span className="text-booking-section text-[#6B6B6B] font-medium">
              {isRtl ? 'شهر' : 'mo'}
            </span>
          </div>
        </div>

        {/* Price preview - always show */}
        {selectedDays > 0 && (
          <div className={`mt-4 pt-4 border-t-2 border-[#C9A96E]/30 ${isRtl ? 'text-right' : 'text-left'}`}>
            {(() => {
              const savings = getSavingsForDays(selectedDays);
              const originalPrice = calculateOriginalPrice(selectedDays);
              const finalPrice = calculatePrice(selectedDays, savings);

              return (
                <div className={`flex items-center justify-between gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-booking-body text-[#8B7355] font-medium font-tabular">
                      {selectedDays} {isRtl ? 'يوم' : 'days'}
                    </span>
                    {savings > 0 && (
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white flex items-center gap-0.5 flex-shrink-0">
                        <Sparkles className="w-2 h-2" />
                        {savings}%
                      </span>
                    )}
                  </div>
                  <div className={`${isRtl ? 'text-left' : 'text-right'}`}>
                    {savings > 0 && (
                      <span className="text-booking-body text-[#999] line-through font-tabular block">
                        {originalPrice.toLocaleString()}
                      </span>
                    )}
                    <span className="text-2xl font-bold text-[#C9A96E] font-tabular">
                      {finalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

    </div>
  );
}
