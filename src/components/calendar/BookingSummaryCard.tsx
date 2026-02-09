'use client';

import { Calendar, Home, Clock, CreditCard, X, ArrowRight, Sparkles, AlertTriangle, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Room {
  id: string;
  name: string;
  name_ar: string;
  monthly_rate: number;
  yearly_rate: number;
}

interface BookingSummaryCardProps {
  room: Room;
  startDate: string;
  durationDays: number;
  onClear: () => void;
  onProceedToPayment: () => void;
  locale: 'en' | 'ar';
}

// Format date for display
function formatDate(dateStr: string, locale: 'en' | 'ar'): string {
  const date = new Date(dateStr);
  const months = {
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  };
  return `${date.getDate()} ${months[locale][date.getMonth()]} ${date.getFullYear()}`;
}

// Calculate end date
function calculateEndDate(startDate: string, days: number): string {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + days - 1);
  return end.toISOString().split('T')[0];
}

// Calculate discount percentage based on duration
function getSavingsPercent(days: number): number {
  const months = Math.round(days / 30);
  if (months <= 2) return 0;
  if (months <= 5) return 5;
  if (months <= 8) return 7;
  if (months <= 11) return 9;
  if (months <= 14) return 11;
  if (months <= 17) return 13;
  if (months <= 20) return 15;
  if (months <= 23) return 17;
  if (months <= 26) return 19;
  if (months <= 29) return 21;
  if (months <= 32) return 23;
  return 25;
}

// Calculate price
function calculatePrice(monthlyRate: number, yearlyRate: number, days: number): {
  total: number;
  perDay: number;
  savings: number;
  savingsPercent: number;
} {
  const months = days / 30;
  let total: number;

  if (days >= 365) {
    const years = Math.floor(days / 365);
    const remainingDays = days % 365;
    const remainingMonths = remainingDays / 30;
    total = (yearlyRate * years) + (monthlyRate * remainingMonths);
  } else {
    total = monthlyRate * months;
  }

  const fullMonthlyPrice = monthlyRate * months;
  const savings = fullMonthlyPrice - total;
  const savingsPercent = fullMonthlyPrice > 0 ? Math.round((savings / fullMonthlyPrice) * 100) : 0;

  return {
    total,
    perDay: Math.round(total / days),
    savings,
    savingsPercent,
  };
}

export function BookingSummaryCard({
  room,
  startDate,
  durationDays,
  onClear,
  onProceedToPayment,
  locale,
}: BookingSummaryCardProps) {
  const isRtl = locale === 'ar';

  const endDate = calculateEndDate(startDate, durationDays);
  const pricing = calculatePrice(room.monthly_rate, room.yearly_rate, durationDays);

  return (
    <div className="card-luxury border border-[#C9A96E]/30 bg-gradient-to-br from-white to-[#FAF8F5] p-6 md:p-8">
      {/* Header */}
      <div className={`flex items-center justify-between mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <h3 className="text-booking-body font-medium text-[#2D2D2D] tracking-wide">
          {isRtl ? 'ملخص الحجز' : 'Summary'}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 -mr-2"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Details Grid */}
      <div className="space-y-4 mb-6">
        {/* Room */}
        <div className={`flex items-center gap-3 p-2 -mx-2 rounded-lg transition-all duration-200 hover:bg-[#C9A96E]/5 group ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className="w-10 h-10 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center transition-all duration-200 group-hover:bg-[#C9A96E]/20 group-hover:scale-105">
            <Home className="w-5 h-5 text-[#C9A96E]" />
          </div>
          <div className={isRtl ? 'text-right' : ''}>
            <p className="text-booking-label-lg">
              {isRtl ? 'الاستوديو' : 'Studio'}
            </p>
            <p className="text-booking-body font-medium">
              {isRtl ? room.name_ar : room.name}
            </p>
          </div>
        </div>

        {/* Period */}
        <div className={`flex items-center gap-3 p-2 -mx-2 rounded-lg transition-all duration-200 hover:bg-[#C9A96E]/5 group ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className="w-10 h-10 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center transition-all duration-200 group-hover:bg-[#C9A96E]/20 group-hover:scale-105">
            <Calendar className="w-5 h-5 text-[#C9A96E]" />
          </div>
          <div className={isRtl ? 'text-right' : ''}>
            <p className="text-booking-label-lg">
              {isRtl ? 'الفترة' : 'Check-in'}
            </p>
            <p className="text-booking-body">
              {formatDate(startDate, locale)} → {formatDate(endDate, locale)}
            </p>
          </div>
        </div>

        {/* Duration */}
        <div className={`flex items-center gap-3 p-2 -mx-2 rounded-lg transition-all duration-200 hover:bg-[#C9A96E]/5 group ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className="w-10 h-10 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center transition-all duration-200 group-hover:bg-[#C9A96E]/20 group-hover:scale-105">
            <Clock className="w-5 h-5 text-[#C9A96E]" />
          </div>
          <div className={isRtl ? 'text-right' : ''}>
            <p className="text-booking-label-lg">
              {isRtl ? 'المدة' : 'Duration'}
            </p>
            <p className="text-booking-body">
              <span className="font-tabular">{durationDays}</span> {isRtl ? 'يوم' : 'days'}
              {' '}
              <span className="text-[#8B7355]">
                (<span className="font-tabular">{Math.round(durationDays / 30)}</span> {isRtl ? 'شهر' : 'months'})
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Pricing Breakdown */}
      <div className="space-y-3 mb-6">
        {/* Monthly Rate Comparison Header */}
        <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <TrendingDown className="w-4 h-4 text-[#C9A96E]" />
          <h4 className="text-booking-label font-semibold text-[#2D2D2D]">
            {isRtl ? 'السعر شهريا' : 'Monthly Rate Breakdown'}
          </h4>
        </div>

        {/* Starting vs After Discount Boxes */}
        {(() => {
          const discount = getSavingsPercent(durationDays);
          const baseMonthlyRate = room.monthly_rate;
          const discountedMonthlyRate = Math.round(baseMonthlyRate * (1 - discount / 100));

          return (
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Starting Price */}
              <div className="p-4 rounded-lg bg-white border border-[#E8E3DB] text-center">
                <p className="text-booking-label-lg mb-2">
                  {isRtl ? 'السعر الأساسي' : 'Starting Price'}
                </p>
                <p className="text-xl font-light text-[#2D2D2D] font-tabular">
                  {baseMonthlyRate.toLocaleString()}
                </p>
                <p className="text-booking-label text-[#C9A96E] mt-1">
                  SAR/{isRtl ? 'شهر' : 'month'}
                </p>
              </div>

              {/* After Discount */}
              <div className={`p-4 rounded-lg text-center border-2 ${
                discount > 0
                  ? 'bg-emerald-50 border-emerald-400'
                  : 'bg-white border-[#E8E3DB]'
              }`}>
                <div className={`flex items-center justify-center gap-1 mb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <p className={`text-booking-label-lg ${discount > 0 ? 'text-emerald-700' : ''}`}>
                    {isRtl ? 'بعد الخصم' : 'After Discount'}
                  </p>
                  {discount > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white flex items-center gap-0.5">
                      -<span className="font-tabular">{discount}</span>%
                    </span>
                  )}
                </div>
                <p className={`text-xl font-light font-tabular ${discount > 0 ? 'text-emerald-600' : 'text-[#2D2D2D]'}`}>
                  {discountedMonthlyRate.toLocaleString()}
                </p>
                <p className={`text-booking-label mt-1 ${discount > 0 ? 'text-emerald-600' : 'text-[#C9A96E]'}`}>
                  SAR/{isRtl ? 'شهر' : 'month'}
                </p>
              </div>
            </div>
          );
        })()}

        {/* Total Price Section */}
        <div className="p-4 bg-[#C9A96E]/10 border border-[#C9A96E]/30 rounded-lg">
          <div className={`flex items-center justify-between mb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <CreditCard className="w-4 h-4 text-[#C9A96E]" />
              <span className="text-booking-label-lg">
                {isRtl ? 'ملخص الإجمالي' : 'Total Summary'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className={`flex justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
              <span className="text-booking-body-sm text-[#6B6B6B]">
                {isRtl ? 'السعر اليومي' : 'Per Day'}
              </span>
              <span className="text-booking-body font-tabular">
                {pricing.perDay.toLocaleString()} SAR
              </span>
            </div>

            {pricing.savings > 0 && (
              <div className={`flex justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                <span className="text-booking-body-sm text-emerald-600 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {isRtl ? 'التوفير' : 'Savings'}
                </span>
                <span className="text-booking-body-sm text-emerald-600 font-tabular">
                  -<span className="font-tabular">{pricing.savings.toLocaleString()}</span> SAR (<span className="font-tabular">{pricing.savingsPercent}</span>%)
                </span>
              </div>
            )}

            <div className="border-t border-[#C9A96E]/30 pt-2 mt-2">
              <div className={`flex justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                <span className="text-booking-body font-medium">
                  {isRtl ? 'الإجمالي' : 'Total'}
                </span>
                <span className="text-price-large font-tabular">
                  {pricing.total.toLocaleString()} SAR
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Required Notice */}
      <div className={`p-3 bg-amber-50 border border-amber-200 rounded-lg mb-6 flex items-start gap-3 ${isRtl ? 'flex-row-reverse text-right' : ''}`}>
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-booking-body font-medium text-amber-800">
            {isRtl ? 'الدفع مطلوب للتأكيد' : 'Payment Required to Confirm'}
          </p>
          <p className="text-booking-body-sm text-amber-700 mt-1">
            {isRtl
              ? 'الحجز غير مؤكد حتى يتم الدفع. قد يقوم آخرون بالحجز إذا لم تدفع.'
              : 'Booking is not confirmed until payment is made. Others may book if you don\'t pay.'}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          onClick={onProceedToPayment}
          className={`w-full bg-[#C9A96E] hover:bg-[#B89355] text-white rounded-lg py-6 text-booking-label-lg transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-gold/30 active:scale-[0.98] group ${isRtl ? 'flex-row-reverse' : ''}`}
        >
          {isRtl ? 'متابعة للدفع' : 'Proceed to Payment'}
          <ArrowRight className={`w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 ${isRtl ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
        </Button>

        <Button
          variant="ghost"
          onClick={onClear}
          className="w-full text-[#6B6B6B] hover:text-red-500 hover:bg-red-50 rounded-lg py-3 text-booking-body-sm transition-all duration-200 active:scale-[0.98]"
        >
          {isRtl ? 'مسح الاختيار' : 'Clear Selection'}
        </Button>
      </div>
    </div>
  );
}
