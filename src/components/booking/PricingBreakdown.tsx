'use client';

import { TrendingDown, Sparkles } from 'lucide-react';

interface PricingBreakdownProps {
  monthlyRate: number;
  durationDays: number;
  discountPercent: number;
  locale: 'en' | 'ar';
  compact?: boolean; // For DurationSelector
}

function getSavingsForDays(days: number): number {
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

export function PricingBreakdown({
  monthlyRate,
  durationDays,
  discountPercent,
  locale,
  compact = false,
}: PricingBreakdownProps) {
  const isRtl = locale === 'ar';

  // Use provided discount or calculate from duration
  const discount = discountPercent || getSavingsForDays(durationDays);

  // Calculate prices
  const originalMonthlyRate = monthlyRate;
  const effectiveMonthlyRate = Math.round(monthlyRate * (1 - discount / 100));
  const months = Math.round(durationDays / 30);
  const originalTotal = Math.round(monthlyRate * months);
  const discountedTotal = Math.round(effectiveMonthlyRate * months);
  const totalSavings = originalTotal - discountedTotal;

  if (compact) {
    // Compact version for DurationSelector - minimal spacing
    return (
      <div className="space-y-2">
        {discount > 0 && (
          <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-medium text-[#8B7355]">
                {isRtl ? 'السعر الأساسي' : 'Base Price'}
              </span>
            </div>
            <span className="text-[9px] text-[#999] line-through">
              {originalMonthlyRate.toLocaleString()} SAR
            </span>
          </div>
        )}

        <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-medium text-[#2D2D2D]">
              {isRtl ? 'السعر الفعلي' : 'Monthly Rate'}
            </span>
            {discount > 0 && (
              <span className="px-1 py-0.5 rounded-full text-[7px] font-bold bg-emerald-500 text-white flex items-center gap-0.5">
                <Sparkles className="w-1 h-1" />
                -{discount}%
              </span>
            )}
          </div>
          <span className={`text-xs font-semibold ${discount > 0 ? 'text-emerald-600' : 'text-[#2D2D2D]'}`}>
            {effectiveMonthlyRate.toLocaleString()} SAR
          </span>
        </div>
      </div>
    );
  }

  // Full version for BookingSummaryCard
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <TrendingDown className="w-4 h-4 text-[#C9A96E]" />
        <h4 className="text-sm font-medium text-[#2D2D2D] uppercase tracking-wider">
          {isRtl ? 'تفصيل الأسعار' : 'Price Breakdown'}
        </h4>
      </div>

      {/* Monthly Rate Comparison */}
      <div className="grid grid-cols-2 gap-4">
        {/* Original Monthly Rate */}
        <div className="p-3 rounded-lg border border-[#E8E3DB] bg-white">
          <p className="text-[10px] text-[#8B7355] uppercase tracking-widest mb-1">
            {isRtl ? 'السعر الأساسي' : 'Starting Price'}
          </p>
          <p className="text-lg font-light text-[#2D2D2D]">
            {originalMonthlyRate.toLocaleString()}
            <span className="text-xs text-[#8B7355] font-normal ml-1">{isRtl ? '' : 'SAR'}</span>
          </p>
          <p className="text-[9px] text-[#8B7355] mt-1">
            {isRtl ? 'لكل شهر' : '/month'}
          </p>
        </div>

        {/* Effective Monthly Rate (after discount) */}
        <div className={`p-3 rounded-lg border-2 ${
          discount > 0
            ? 'border-emerald-500 bg-emerald-50'
            : 'border-[#E8E3DB] bg-white'
        }`}>
          <div className={`flex items-center gap-2 mb-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <p className="text-[10px] text-emerald-700 uppercase tracking-widest font-medium">
              {isRtl ? 'السعر النهائي' : 'After Discount'}
            </p>
            {discount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[7px] font-bold bg-emerald-500 text-white flex items-center gap-0.5">
                <Sparkles className="w-1.5 h-1.5" />
                -{discount}%
              </span>
            )}
          </div>
          <p className={`text-lg font-light ${discount > 0 ? 'text-emerald-600' : 'text-[#2D2D2D]'}`}>
            {effectiveMonthlyRate.toLocaleString()}
            <span className="text-xs text-emerald-600 font-normal ml-1">{isRtl ? '' : 'SAR'}</span>
          </p>
          <p className="text-[9px] text-emerald-700 mt-1">
            {isRtl ? 'لكل شهر' : '/month'}
          </p>
        </div>
      </div>

      {/* Total Breakdown */}
      <div className="p-3 rounded-lg bg-[#C9A96E]/10 border border-[#C9A96E]/30">
        <div className={`flex justify-between items-start mb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div>
            <p className="text-[10px] text-[#8B7355] uppercase tracking-widest mb-1">
              {isRtl ? 'المدة' : 'Duration'}
            </p>
            <p className="text-sm font-medium text-[#2D2D2D]">
              {months} {isRtl ? 'شهر' : 'months'}
            </p>
          </div>
          <div className={isRtl ? 'text-left' : 'text-right'}>
            <p className="text-[10px] text-[#8B7355] uppercase tracking-widest mb-1">
              {isRtl ? 'الإجمالي' : 'Total Price'}
            </p>
            <div className={`flex items-baseline gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              {discount > 0 && (
                <span className="text-xs text-[#999] line-through">
                  {originalTotal.toLocaleString()}
                </span>
              )}
              <p className="text-lg font-semibold text-[#C9A96E]">
                {discountedTotal.toLocaleString()} SAR
              </p>
            </div>
          </div>
        </div>

        {/* Savings Badge */}
        {discount > 0 && (
          <div className={`pt-3 border-t border-[#C9A96E]/30 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span className="text-sm font-medium text-emerald-700">
                {isRtl ? 'توفيرك' : 'You Save'}
              </span>
            </div>
            <span className="text-sm font-bold text-emerald-600">
              {totalSavings.toLocaleString()} SAR
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
