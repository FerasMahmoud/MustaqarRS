'use client';

import { calculateEndDateByDays } from '@/lib/validation';

interface PriceInfo {
  totalPrice: number;
  originalPrice: number;
  days: number;
  savings: number;
  savingsPercent: number;
  cleaningFee?: number;
  cleaningPeriods?: number;
  cleaningRateType?: 'weekly' | 'monthly';
}

interface BookingSummaryProps {
  roomName: string;
  durationDays: number;
  startDate: string;
  weeklyCleaningService: boolean;
  priceInfo: PriceInfo;
  isRtl: boolean;
}

export function BookingSummary({
  roomName,
  durationDays,
  startDate,
  weeklyCleaningService,
  priceInfo,
  isRtl,
}: BookingSummaryProps) {
  return (
    <div className="p-4 bg-cream rounded-xl space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{isRtl ? 'الغرفة' : 'Room'}</span>
        <span className="text-charcoal font-medium">{roomName}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{isRtl ? 'المدة' : 'Duration'}</span>
        <span className="text-charcoal">
          {durationDays} {isRtl ? 'يوم' : 'days'}
        </span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{isRtl ? 'تاريخ الدخول' : 'Check-in'}</span>
        <span className="text-charcoal">{startDate}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{isRtl ? 'تاريخ الخروج' : 'Check-out'}</span>
        <span className="text-charcoal">
          {calculateEndDateByDays(startDate, durationDays)}
        </span>
      </div>
      {weeklyCleaningService && priceInfo.cleaningFee && (
        <div className="flex justify-between text-sm border-t border-border pt-3">
          <span className="text-muted-foreground">
            {isRtl ? 'خدمة التنظيف' : 'Cleaning Service'}
            <span className="text-xs block text-[#8B7355]">
              {priceInfo.cleaningPeriods} {
                priceInfo.cleaningRateType === 'weekly'
                  ? (isRtl ? 'أسبوع' : 'weeks')
                  : (isRtl ? 'شهر' : 'months')
              }
            </span>
          </span>
          <span className="text-charcoal font-medium font-tabular">
            +{priceInfo.cleaningFee.toLocaleString()} SAR
          </span>
        </div>
      )}
      <div className="border-t border-border pt-3 mt-3">
        <div className="flex justify-between items-center">
          <span className="text-charcoal font-medium">{isRtl ? 'الإجمالي' : 'Total'}</span>
          <span className="text-2xl heading-serif text-gold">
            {priceInfo.totalPrice.toLocaleString()} SAR
          </span>
        </div>
        {priceInfo.savings > 0 && (
          <p className="text-gold text-sm text-right mt-1">
            {isRtl
              ? `توفير ${priceInfo.savings.toLocaleString()} ريال`
              : `You save ${priceInfo.savings.toLocaleString()} SAR`}
          </p>
        )}
      </div>
    </div>
  );
}
