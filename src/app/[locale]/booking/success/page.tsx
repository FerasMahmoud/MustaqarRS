'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle, Calendar, Home, Mail, Phone, Loader } from 'lucide-react';

interface BookingDetails {
  roomName: string;
  roomNameAr: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  totalAmount: number;
}

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const bookingId = searchParams.get('booking_id');
  const locale = useLocale() as 'en' | 'ar';
  const isRtl = locale === 'ar';

  const [loading, setLoading] = useState(true);
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function confirmBooking() {
      if (!sessionId || !bookingId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/bookings/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, bookingId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to confirm booking');
        }

        setBookingDetails(data.booking);
      } catch (err) {
        console.error('Error confirming booking:', err);
        setError(isRtl ? 'فشل في تأكيد الحجز' : 'Failed to confirm booking');
      } finally {
        setLoading(false);
      }
    }

    confirmBooking();
  }, [sessionId, bookingId, isRtl]);

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const months = {
      en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    };
    return `${date.getDate()} ${months[locale][date.getMonth()]} ${date.getFullYear()}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF8F5] to-[#F0EBE3] flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-[#C9A96E] animate-spin mx-auto mb-4" />
          <p className="text-[#6B6B6B] uppercase tracking-widest text-sm">
            {isRtl ? 'جاري تأكيد الحجز...' : 'Confirming your booking...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FAF8F5] to-[#F0EBE3] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl text-red-500">!</span>
          </div>
          <h1 className="text-2xl font-light text-[#2D2D2D] mb-4">
            {isRtl ? 'حدث خطأ' : 'Something went wrong'}
          </h1>
          <p className="text-[#6B6B6B] mb-8">{error}</p>
          <Link href={`/${locale}`}>
            <Button className="bg-[#C9A96E] hover:bg-[#B89355] text-white px-8 py-6 uppercase tracking-widest">
              {isRtl ? 'العودة للرئيسية' : 'Return Home'}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF8F5] to-[#F0EBE3] pt-24 pb-12" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Success Animation */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-emerald-600" />
          </div>

          <h1 className="text-3xl md:text-4xl font-light text-[#2D2D2D] mb-4">
            {isRtl ? 'تم تأكيد الحجز!' : 'Booking Confirmed!'}
          </h1>
          <p className="text-lg text-[#6B6B6B]">
            {isRtl
              ? 'شكراً لك! تم استلام الدفع وتأكيد حجزك.'
              : 'Thank you! Your payment was received and your booking is confirmed.'}
          </p>
        </div>

        {/* Booking Details Card */}
        {bookingDetails && (
          <div className="card-luxury border border-[#C9A96E]/30 bg-white p-8 mb-8">
            <h2 className="text-xl font-medium text-[#2D2D2D] mb-6 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-[#C9A96E]" />
              {isRtl ? 'تفاصيل الحجز' : 'Booking Details'}
            </h2>

            <div className="space-y-4">
              <div className={`flex justify-between py-3 border-b border-[#E8E3DB] ${isRtl ? 'flex-row-reverse' : ''}`}>
                <span className="text-[#6B6B6B]">{isRtl ? 'الاستوديو' : 'Studio'}</span>
                <span className="text-[#2D2D2D] font-medium">
                  {isRtl ? bookingDetails.roomNameAr : bookingDetails.roomName}
                </span>
              </div>

              <div className={`flex justify-between py-3 border-b border-[#E8E3DB] ${isRtl ? 'flex-row-reverse' : ''}`}>
                <span className="text-[#6B6B6B]">{isRtl ? 'تاريخ البداية' : 'Start Date'}</span>
                <span className="text-[#2D2D2D] font-medium">{formatDate(bookingDetails.startDate)}</span>
              </div>

              <div className={`flex justify-between py-3 border-b border-[#E8E3DB] ${isRtl ? 'flex-row-reverse' : ''}`}>
                <span className="text-[#6B6B6B]">{isRtl ? 'تاريخ النهاية' : 'End Date'}</span>
                <span className="text-[#2D2D2D] font-medium">{formatDate(bookingDetails.endDate)}</span>
              </div>

              <div className={`flex justify-between py-3 border-b border-[#E8E3DB] ${isRtl ? 'flex-row-reverse' : ''}`}>
                <span className="text-[#6B6B6B]">{isRtl ? 'المدة' : 'Duration'}</span>
                <span className="text-[#2D2D2D] font-medium">
                  {bookingDetails.durationDays} {isRtl ? 'يوم' : 'days'}
                </span>
              </div>

              <div className={`flex justify-between py-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <span className="text-[#6B6B6B]">{isRtl ? 'المبلغ المدفوع' : 'Amount Paid'}</span>
                <span className="text-[#C9A96E] font-medium text-xl">
                  {bookingDetails.totalAmount.toLocaleString()} SAR
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Reference Number */}
        <div className="text-center mb-8 p-4 bg-[#C9A96E]/10 border border-[#C9A96E]/30 rounded-lg">
          <p className="text-sm text-[#8B7355] mb-1">
            {isRtl ? 'رقم المرجع' : 'Reference Number'}
          </p>
          <p className="font-mono text-lg text-[#2D2D2D]">
            {sessionId?.slice(-8).toUpperCase() || bookingId?.slice(-8).toUpperCase() || 'N/A'}
          </p>
        </div>

        {/* What's Next */}
        <div className="card-luxury border border-[#E8E3DB] bg-white p-8 mb-8">
          <h2 className="text-xl font-medium text-[#2D2D2D] mb-6 flex items-center gap-3">
            <Mail className="w-5 h-5 text-[#C9A96E]" />
            {isRtl ? 'الخطوات التالية' : "What's Next"}
          </h2>

          <ol className={`space-y-4 ${isRtl ? 'text-right' : 'text-left'}`}>
            {[
              {
                en: 'Check your email for booking confirmation',
                ar: 'تحقق من بريدك الإلكتروني لتأكيد الحجز',
              },
              {
                en: 'We will contact you 24 hours before check-in',
                ar: 'سنتواصل معك قبل 24 ساعة من الوصول',
              },
              {
                en: 'Prepare your ID for verification at check-in',
                ar: 'جهز هويتك للتحقق عند الوصول',
              },
              {
                en: 'Enjoy your stay!',
                ar: 'استمتع بإقامتك!',
              },
            ].map((step, index) => (
              <li key={index} className={`flex items-start gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <span className="w-6 h-6 rounded-full bg-[#C9A96E]/20 text-[#C9A96E] flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {index + 1}
                </span>
                <span className="text-[#6B6B6B]">
                  {isRtl ? step.ar : step.en}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* Support */}
        <div className="card-luxury border border-[#E8E3DB] bg-white p-6 mb-8">
          <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className="w-12 h-12 rounded-full bg-[#C9A96E]/20 flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-[#C9A96E]" />
            </div>
            <div className={isRtl ? 'text-right' : ''}>
              <p className="font-medium text-[#2D2D2D]">
                {isRtl ? 'هل تحتاج مساعدة؟' : 'Need Help?'}
              </p>
              <p className="text-sm text-[#6B6B6B]">
                {isRtl ? 'تواصل معنا عبر واتساب أو اتصل بنا' : 'Contact us via WhatsApp or call us'}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className={`flex flex-col sm:flex-row gap-4 justify-center ${isRtl ? 'sm:flex-row-reverse' : ''}`}>
          <Button asChild className="bg-[#C9A96E] hover:bg-[#B89355] text-white px-8 py-6 uppercase tracking-widest">
            <Link href={`/${locale}`}>
              <Home className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              {isRtl ? 'العودة للرئيسية' : 'Back to Home'}
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-[#C9A96E] text-[#C9A96E] hover:bg-[#C9A96E]/10 px-8 py-6 uppercase tracking-widest">
            <a href="mailto:info@riyadhstudios.com">
              <Mail className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              {isRtl ? 'تواصل معنا' : 'Contact Us'}
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-[#FAF8F5] to-[#F0EBE3] flex items-center justify-center">
        <Loader className="w-8 h-8 text-[#C9A96E] animate-spin" />
      </div>
    }>
      <BookingSuccessContent />
    </Suspense>
  );
}
