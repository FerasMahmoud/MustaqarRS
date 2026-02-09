'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface BookingData {
  bookingId: string;
  guestName: string;
  roomName: string;
  totalAmount: number;
  expiresAt: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    iban: string;
    swift: string;
  };
}

export default function PendingPaymentPage() {
  const params = useParams();
  const t = useTranslations();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [isExpired, setIsExpired] = useState(false);
  const [isRtl, setIsRtl] = useState(false);

  // Detect RTL language
  useEffect(() => {
    const locale = params.locale as string;
    setIsRtl(locale === 'ar');
  }, [params.locale]);

  // Fetch booking data from localStorage (set during checkout)
  useEffect(() => {
    const storedData = localStorage.getItem(`booking_pending_${bookingId}`);
    if (storedData) {
      const data = JSON.parse(storedData);
      setBooking(data);
    }
  }, [bookingId]);

  // Countdown timer
  useEffect(() => {
    if (!booking) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiryTime = new Date(booking.expiresAt).getTime();
      const distance = expiryTime - now;

      if (distance < 0) {
        setIsExpired(true);
        setTimeRemaining('00:00');
        return;
      }

      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeRemaining(
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [booking]);

  if (!booking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F5F0EB]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9A96E] mx-auto mb-4"></div>
          <p className="text-[#2D2D2D]">
            {isRtl ? 'جاري التحميل...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  const shortId = booking.bookingId.slice(-8).toUpperCase();
  const isRed = timeRemaining < '00:10'; // Show red when less than 10 minutes

  return (
    <div className="min-h-screen bg-[#F5F0EB] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className={`text-4xl font-bold text-[#2D2D2D] mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>
            {isRtl ? 'تفاصيل الدفع' : 'Payment Instructions'}
          </h1>
          <p className={`text-[#8B7355] ${isRtl ? 'text-right' : 'text-left'}`}>
            {isRtl ? 'رقم الحجز: ' : 'Booking ID: '} <span className="font-bold">{shortId}</span>
          </p>
        </div>

        {/* Status Alert */}
        <div
          className={`mb-8 p-4 rounded-lg border-l-4 ${
            isExpired
              ? 'bg-red-50 border-red-500 text-red-800'
              : 'bg-[#E8E3DB] border-[#C9A96E] text-[#2D2D2D]'
          }`}
        >
          <p className={`font-medium ${isRtl ? 'text-right' : 'text-left'}`}>
            {isExpired
              ? isRtl
                ? '❌ انتهت مهلة الدفع'
                : '❌ Payment window expired'
              : isRed
              ? isRtl
                ? '⚠️ وقت قصير المتبقي'
                : '⚠️ Limited time remaining'
              : isRtl
              ? '⏳ في انتظار التأكيد'
              : '⏳ Awaiting confirmation'}
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="mb-8 text-center">
          <p className={`text-sm text-[#8B7355] mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>
            {isRtl ? 'الوقت المتبقي للتحويل:' : 'Time remaining to transfer:'}
          </p>
          <div
            className={`text-6xl font-bold font-mono py-6 px-8 rounded-lg transition-all ${
              isExpired
                ? 'bg-red-100 text-red-700'
                : isRed
                ? 'bg-red-100 text-red-700 animate-pulse'
                : 'bg-[#C9A96E] text-white'
            }`}
          >
            {timeRemaining}
          </div>
          {isExpired && (
            <p className="text-sm text-red-600 mt-2 font-medium">
              {isRtl
                ? 'للأسف انتهت مهلة التحويل. يرجى التواصل معنا لحجز جديد'
                : 'Unfortunately the payment window has expired. Please contact us to make a new booking'}
            </p>
          )}
        </div>

        {/* Bank Details Section */}
        {!isExpired && (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-t-4 border-[#C9A96E]">
              <h2 className={`text-2xl font-bold text-[#2D2D2D] mb-6 ${isRtl ? 'text-right' : 'text-left'}`}>
                {isRtl ? 'تفاصيل الحساب البنكي' : 'Bank Account Details'}
              </h2>

              <div className="space-y-4">
                {/* Account Name */}
                <div className={`p-3 bg-[#F5F0EB] rounded ${isRtl ? 'text-right' : 'text-left'}`}>
                  <p className="text-sm text-[#8B7355] mb-1">
                    {isRtl ? 'اسم المالك' : 'Account Name'}
                  </p>
                  <p className="text-lg font-bold text-[#2D2D2D]">
                    {booking.bankDetails.accountName}
                  </p>
                </div>

                {/* Account Number */}
                <div className={`p-3 bg-[#F5F0EB] rounded ${isRtl ? 'text-right' : 'text-left'}`}>
                  <p className="text-sm text-[#8B7355] mb-1">
                    {isRtl ? 'رقم الحساب' : 'Account Number'}
                  </p>
                  <p className="text-lg font-mono font-bold text-[#2D2D2D]">
                    {booking.bankDetails.accountNumber}
                  </p>
                </div>

                {/* IBAN */}
                <div className={`p-3 bg-[#F5F0EB] rounded ${isRtl ? 'text-right' : 'text-left'}`}>
                  <p className="text-sm text-[#8B7355] mb-1">
                    {isRtl ? 'IBAN' : 'IBAN'}
                  </p>
                  <p className="text-lg font-mono font-bold text-[#2D2D2D]">
                    {booking.bankDetails.iban}
                  </p>
                </div>

                {/* SWIFT */}
                <div className={`p-3 bg-[#F5F0EB] rounded ${isRtl ? 'text-right' : 'text-left'}`}>
                  <p className="text-sm text-[#8B7355] mb-1">
                    {isRtl ? 'SWIFT' : 'SWIFT Code'}
                  </p>
                  <p className="text-lg font-mono font-bold text-[#2D2D2D]">
                    {booking.bankDetails.swift}
                  </p>
                </div>
              </div>
            </div>

            {/* Amount and Reference */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-t-4 border-[#C9A96E]">
              <h3 className={`text-xl font-bold text-[#2D2D2D] mb-4 ${isRtl ? 'text-right' : 'text-left'}`}>
                {isRtl ? 'تفاصيل التحويل' : 'Transfer Details'}
              </h3>

              <div className="space-y-4">
                {/* Amount */}
                <div className={`p-4 bg-[#FFF9F0] rounded border border-[#C9A96E] ${isRtl ? 'text-right' : 'text-left'}`}>
                  <p className="text-sm text-[#8B7355] mb-2">
                    {isRtl ? 'المبلغ المطلوب' : 'Amount to Transfer'}
                  </p>
                  <p className="text-3xl font-bold text-[#C9A96E]">
                    {booking.totalAmount.toLocaleString('ar-SA')} <span className="text-lg">SAR</span>
                  </p>
                </div>

                {/* Booking Reference */}
                <div className={`p-4 bg-[#FFF9F0] rounded border border-[#C9A96E] ${isRtl ? 'text-right' : 'text-left'}`}>
                  <p className="text-sm text-[#8B7355] mb-2">
                    {isRtl ? 'رقم المرجع (ضروري)' : 'Booking Reference (Required)'}
                  </p>
                  <p className="text-2xl font-mono font-bold text-[#2D2D2D]">
                    REF-{shortId}
                  </p>
                  <p className="text-xs text-[#8B7355] mt-2 italic">
                    {isRtl
                      ? 'يجب تضمين هذا الرقم في ملاحظات التحويل'
                      : 'Include this reference in your transfer notes'}
                  </p>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-[#FFF9F0] rounded-lg p-6 mb-8 border-l-4 border-[#C9A96E]">
              <h3 className={`text-xl font-bold text-[#2D2D2D] mb-4 ${isRtl ? 'text-right' : 'text-left'}`}>
                {isRtl ? 'خطوات التحويل' : 'Transfer Instructions'}
              </h3>
              <ol className={`space-y-2 list-decimal ${isRtl ? 'text-right list-inside' : 'text-left ml-6'}`}>
                <li className="text-[#2D2D2D]">
                  {isRtl
                    ? 'افتح تطبيق بنكك أو موقعه الإلكتروني'
                    : 'Open your bank app or website'}
                </li>
                <li className="text-[#2D2D2D]">
                  {isRtl
                    ? 'اختر تحويل أموال إلى حساب محلي'
                    : 'Select transfer to local account'}
                </li>
                <li className="text-[#2D2D2D]">
                  {isRtl
                    ? 'أدخل تفاصيل الحساب المذكورة أعلاه'
                    : 'Enter the bank details above'}
                </li>
                <li className="text-[#2D2D2D]">
                  {isRtl
                    ? 'تأكد من المبلغ: '
                    : 'Confirm the amount: '}
                  <span className="font-bold">{booking.totalAmount.toLocaleString('ar-SA')} SAR</span>
                </li>
                <li className="text-[#2D2D2D]">
                  {isRtl
                    ? 'أضف المرجع في ملاحظات التحويل'
                    : 'Add the reference in notes: '}
                  <span className="font-mono font-bold">REF-{shortId}</span>
                </li>
                <li className="text-[#2D2D2D]">
                  {isRtl
                    ? 'أكمل التحويل'
                    : 'Complete the transfer'}
                </li>
              </ol>
            </div>

            {/* Booking Summary */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className={`text-xl font-bold text-[#2D2D2D] mb-4 ${isRtl ? 'text-right' : 'text-left'}`}>
                {isRtl ? 'ملخص الحجز' : 'Booking Summary'}
              </h3>
              <div className={`space-y-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                <p className="text-[#2D2D2D]">
                  <span className="text-[#8B7355]">{isRtl ? 'الوحدة: ' : 'Room: '}</span>
                  {booking.roomName}
                </p>
                <p className="text-[#2D2D2D]">
                  <span className="text-[#8B7355]">{isRtl ? 'الضيف: ' : 'Guest: '}</span>
                  {booking.guestName}
                </p>
                <p className="text-[#2D2D2D]">
                  <span className="text-[#8B7355]">{isRtl ? 'المبلغ: ' : 'Amount: '}</span>
                  <span className="font-bold">{booking.totalAmount.toLocaleString('ar-SA')} SAR</span>
                </p>
              </div>
            </div>
          </>
        )}

        {/* Contact Information */}
        <div className="bg-[#E8E3DB] rounded-lg p-6 mb-8">
          <h3 className={`text-lg font-bold text-[#2D2D2D] mb-3 ${isRtl ? 'text-right' : 'text-left'}`}>
            {isRtl ? 'هل تحتاج إلى مساعدة؟' : 'Need Help?'}
          </h3>
          <div className={`space-y-2 ${isRtl ? 'text-right' : 'text-left'}`}>
            <p className="text-[#2D2D2D]">
              <span className="text-[#8B7355]">{isRtl ? 'البريد الإلكتروني: ' : 'Email: '}</span>
              <a href="mailto:Firas@fitechco.com" className="text-[#C9A96E] hover:text-[#B89A5F] underline">
                Firas@fitechco.com
              </a>
            </p>
            <p className="text-[#2D2D2D]">
              <span className="text-[#8B7355]">{isRtl ? 'الهاتف: ' : 'Phone: '}</span>
              <a href="tel:+966531182200" className="text-[#C9A96E] hover:text-[#B89A5F] underline">
                +966531182200
              </a>
            </p>
            <p className="text-[#2D2D2D]">
              <span className="text-[#8B7355]">{isRtl ? 'WhatsApp: ' : 'WhatsApp: '}</span>
              <a
                href="https://wa.me/966531182200"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#C9A96E] hover:text-[#B89A5F] underline"
              >
                +966531182200
              </a>
            </p>
          </div>
        </div>

        {/* Home Button */}
        <div className="text-center">
          <Link
            href={`/${params.locale}`}
            className="inline-block bg-[#C9A96E] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#B89A5F] transition-colors"
          >
            {isRtl ? 'العودة للرئيسية' : 'Back to Home'}
          </Link>
        </div>
      </div>
    </div>
  );
}
