'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, Home, MessageCircle, Loader } from 'lucide-react';

function BookingCancelContent() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  const locale = useLocale() as 'en' | 'ar';
  const isRtl = locale === 'ar';

  // Delete the pending booking when cancelled
  useEffect(() => {
    async function cancelPendingBooking() {
      if (!bookingId) return;

      try {
        await fetch('/api/bookings/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bookingId }),
        });
      } catch (error) {
        console.error('Error cancelling booking:', error);
      }
    }

    cancelPendingBooking();
  }, [bookingId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF8F5] to-[#F0EBE3] pt-24 pb-12" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Cancel Icon */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 rounded-full bg-[#E8E3DB] flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-12 h-12 text-[#8B7355]" />
          </div>

          <h1 className="text-3xl md:text-4xl font-light text-[#2D2D2D] mb-4">
            {isRtl ? 'تم إلغاء الدفع' : 'Payment Cancelled'}
          </h1>
          <p className="text-lg text-[#6B6B6B]">
            {isRtl
              ? 'لم تتم عملية الدفع. لم يتم خصم أي مبلغ من حسابك.'
              : 'Your payment was not processed. No charges were made to your account.'}
          </p>
        </div>

        {/* Info Box */}
        <div className="card-luxury border border-[#E8E3DB] bg-white p-6 mb-8">
          <p className="text-[#6B6B6B] text-center">
            {isRtl
              ? 'التواريخ التي اخترتها لا تزال متاحة للحجز. يمكنك المحاولة مرة أخرى أو اختيار تواريخ مختلفة.'
              : 'The dates you selected may still be available. You can try again or choose different dates.'}
          </p>
        </div>

        {/* Options Card */}
        <div className="card-luxury border border-[#E8E3DB] bg-white p-8 mb-8">
          <h2 className="text-xl font-medium text-[#2D2D2D] mb-6 text-center">
            {isRtl ? 'ماذا تريد أن تفعل؟' : 'What would you like to do?'}
          </h2>

          <div className="space-y-4">
            <Button asChild className="w-full bg-[#C9A96E] hover:bg-[#B89355] text-white px-8 py-6 uppercase tracking-widest">
              <Link href={`/${locale}/#calendar`}>
                <ArrowLeft className={`w-4 h-4 ${isRtl ? 'ml-2 rotate-180' : 'mr-2'}`} />
                {isRtl ? 'العودة للحجز' : 'Try Booking Again'}
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full border-[#C9A96E] text-[#C9A96E] hover:bg-[#C9A96E]/10 px-8 py-6 uppercase tracking-widest">
              <Link href={`/${locale}`}>
                <Home className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                {isRtl ? 'العودة للرئيسية' : 'Back to Home'}
              </Link>
            </Button>

            <Button asChild variant="outline" className="w-full border-[#E8E3DB] text-[#6B6B6B] hover:bg-[#F0EBE3] px-8 py-6 uppercase tracking-widest">
              <a href="https://wa.me/966500000000" target="_blank" rel="noopener noreferrer">
                <MessageCircle className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                {isRtl ? 'تواصل عبر واتساب' : 'Chat on WhatsApp'}
              </a>
            </Button>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center text-[#6B6B6B]">
          <p>
            {isRtl
              ? 'هل واجهت مشكلة في الدفع؟ نحن هنا للمساعدة!'
              : 'Having trouble with payment? We\'re here to help!'}
          </p>
          <p className="mt-2">
            <a href="mailto:info@riyadhstudios.com" className="text-[#C9A96E] hover:underline">
              info@riyadhstudios.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function BookingCancelPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-[#FAF8F5] to-[#F0EBE3] flex items-center justify-center">
        <Loader className="w-8 h-8 text-[#C9A96E] animate-spin" />
      </div>
    }>
      <BookingCancelContent />
    </Suspense>
  );
}
