'use client';

import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { calculateEndDateByDays } from '@/lib/validation';

interface PriceInfo {
  totalPrice: number;
  originalPrice: number;
  days: number;
  savings: number;
  savingsPercent: number;
}

interface BookingSuccessProps {
  bookingId: string;
  roomName: string;
  startDate: string;
  durationDays: number;
  priceInfo: PriceInfo;
  paymentMethod: 'stripe' | 'bank_transfer';
  locale: string;
  isRtl: boolean;
}

export function BookingSuccess({
  bookingId,
  roomName,
  startDate,
  durationDays,
  priceInfo,
  paymentMethod,
  locale,
  isRtl,
}: BookingSuccessProps) {
  return (
    <div className="min-h-screen bg-[#FAF7F2] pt-24 pb-12" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="geometric-pattern" />
      <div className="container mx-auto px-4 max-w-2xl relative z-10">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full mx-auto flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>

          <div className="space-y-2">
            <h1 className="text-booking-section heading-serif text-charcoal">
              {isRtl ? 'تم إنشاء الحجز بنجاح!' : 'Booking Created Successfully!'}
            </h1>
            <p className="text-booking-body text-muted-foreground">
              {isRtl
                ? 'شكراً لك! سنتواصل معك قريباً لتأكيد التفاصيل والدفع.'
                : 'Thank you! We will contact you soon to confirm details and payment.'}
            </p>
          </div>

          <div className="p-4 bg-cream rounded-xl space-y-3">
            <div className="flex justify-between text-booking-body-sm">
              <span className="text-muted-foreground">{isRtl ? 'رقم الحجز' : 'Booking ID'}</span>
              <span className="text-gold font-mono font-semibold">{bookingId?.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-booking-body-sm">
              <span className="text-muted-foreground">{isRtl ? 'الغرفة' : 'Room'}</span>
              <span className="text-charcoal font-medium">{roomName}</span>
            </div>
            <div className="flex justify-between text-booking-body-sm">
              <span className="text-muted-foreground">{isRtl ? 'تاريخ البدء' : 'Start Date'}</span>
              <span className="text-charcoal">{startDate}</span>
            </div>
            <div className="flex justify-between text-booking-body-sm">
              <span className="text-muted-foreground">{isRtl ? 'تاريخ الانتهاء' : 'End Date'}</span>
              <span className="text-charcoal">
                {calculateEndDateByDays(startDate, durationDays)}
              </span>
            </div>
            <div className="border-t border-border pt-3 mt-3">
              <div className="flex justify-between items-center">
                <span className="text-charcoal font-medium">{isRtl ? 'الإجمالي' : 'Total'}</span>
                <span className="text-price-medium heading-serif text-gold font-tabular">
                  {priceInfo.totalPrice.toLocaleString()} SAR
                </span>
              </div>
            </div>
          </div>

          {/* Bank Transfer Details */}
          {paymentMethod === 'bank_transfer' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-left">
              <h3 className="text-booking-label-lg font-semibold text-amber-700 mb-3 uppercase tracking-wider flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                {isRtl ? 'تفاصيل التحويل البنكي' : 'Bank Transfer Details'}
              </h3>

              {/* Account Holder Name */}
              <div className="mb-3 pb-3 border-b border-amber-200">
                <div className="flex justify-between">
                  <span className="text-amber-600">{isRtl ? 'اسم المستفيد' : 'Account Name'}</span>
                  <span className="font-medium text-amber-900">Firas Farid Mahmoud</span>
                </div>
              </div>

              {/* Payment Options */}
              <div className="space-y-3 text-sm">
                {/* Al Rajhi Bank */}
                <div className="p-2 bg-white rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-amber-700 font-medium">{isRtl ? 'بنك الراجحي' : 'Al Rajhi Bank'}</span>
                  </div>
                  <div className="font-mono text-amber-900 text-xs">SA12 8000 0538 6080 1606 9776</div>
                </div>

                {/* Saudi French Bank */}
                <div className="p-2 bg-white rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-amber-700 font-medium">{isRtl ? 'البنك السعودي الفرنسي' : 'Saudi French Bank'}</span>
                  </div>
                  <div className="font-mono text-amber-900 text-xs">SA82 5500 0000 0P94 0930 0154</div>
                </div>

                {/* STC Pay */}
                <div className="p-2 bg-white rounded-lg">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-amber-700 font-medium">STC Pay</span>
                  </div>
                  <div className="font-mono text-amber-900">0531182200</div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-amber-200">
                <p className="text-xs text-amber-600">
                  {isRtl
                    ? `يرجى تحويل المبلغ خلال ساعة واحدة. أضف رقم الحجز (${bookingId?.slice(-8).toUpperCase()}) في وصف التحويل.`
                    : `Please transfer within 1 hour. Include booking ID (${bookingId?.slice(-8).toUpperCase()}) in transfer description.`}
                </p>
              </div>
            </div>
          )}

          <div className="p-4 bg-cream-dark rounded-xl text-left">
            <h3 className="text-booking-label-lg font-semibold text-gold mb-2 uppercase tracking-wider">
              {isRtl ? 'الخطوات التالية' : 'Next Steps'}
            </h3>
            <ul className="space-y-2 text-muted-foreground text-booking-body-sm">
              <li className="flex items-start gap-2">
                <span className="text-gold font-semibold">1.</span>
                {isRtl
                  ? 'ستصلك رسالة تأكيد على بريدك الإلكتروني'
                  : 'You will receive a confirmation email'}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold font-semibold">2.</span>
                {isRtl
                  ? paymentMethod === 'bank_transfer'
                    ? 'قم بتحويل المبلغ إلى الحساب البنكي أعلاه'
                    : 'سنتواصل معك خلال 24 ساعة لتأكيد الحجز'
                  : paymentMethod === 'bank_transfer'
                    ? 'Transfer the amount to the bank account above'
                    : 'We will contact you within 24 hours to confirm'}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold font-semibold">3.</span>
                {isRtl
                  ? paymentMethod === 'bank_transfer'
                    ? 'سيتم تأكيد حجزك بعد استلام التحويل'
                    : 'سيتم إرسال تفاصيل الدفع عبر البريد الإلكتروني'
                  : paymentMethod === 'bank_transfer'
                    ? 'Your booking will be confirmed after we receive the transfer'
                    : 'Payment details will be sent via email'}
              </li>
            </ul>
          </div>

          <div className="flex gap-4">
            <Link
              href={`/${locale}`}
              className="flex-1 py-3 border border-border rounded-lg text-charcoal hover:bg-cream text-center font-medium transition-all"
            >
              {isRtl ? 'الرئيسية' : 'Home'}
            </Link>
            <Link
              href={`/${locale}#rooms`}
              className="flex-1 py-3 btn-primary text-center rounded-lg"
            >
              {isRtl ? 'تصفح الغرف' : 'Browse Rooms'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
