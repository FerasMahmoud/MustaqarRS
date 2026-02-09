'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  CreditCard,
  User,
  Shield,
  Maximize,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  CheckCircle,
  Loader2,
  Building2,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { Room } from '@/lib/supabase';
import {
  validateStep1,
  validateStep2,
  validateStep3,
  calculateBookingPriceByDays,
  calculateEndDateByDays,
  NATIONALITIES,
  type ValidationError,
} from '@/lib/validation';
import { BookingPageSkeleton } from '@/components/loading/BookingPageSkeleton';
import { useVisitorTracking } from '@/hooks/useVisitorTracking';

// Loading skeletons for dynamically loaded components
function CalendarSkeleton() {
  return (
    <div className="bg-white border border-[#E8E3DB] rounded-xl p-4 animate-pulse">
      <div className="flex items-center justify-between mb-4">
        <div className="w-8 h-8 bg-gray-200 rounded" />
        <div className="w-32 h-6 bg-gray-200 rounded" />
        <div className="w-8 h-8 bg-gray-200 rounded" />
      </div>
      <div className="grid grid-cols-7 gap-1 mb-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-8 bg-gray-100 rounded" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="aspect-square bg-gray-100 rounded" />
        ))}
      </div>
    </div>
  );
}

function DurationSelectorSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="text-center mb-2">
        <div className="w-32 h-4 bg-gray-200 rounded mx-auto mb-2" />
        <div className="w-24 h-3 bg-gray-100 rounded mx-auto" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 rounded-lg bg-gray-100 h-28" />
        ))}
      </div>
    </div>
  );
}

function AmenitiesGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 animate-pulse">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2">
          <div className="w-10 h-10 bg-gray-200 rounded-lg" />
          <div className="w-20 h-4 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

// Dynamically import heavy components to reduce initial bundle size
const DurationSelector = dynamic(
  () => import('@/components/calendar/DurationSelector').then(mod => ({ default: mod.DurationSelector })),
  {
    loading: () => <DurationSelectorSkeleton />,
    ssr: false
  }
);

const DatePicker = dynamic(
  () => import('@/components/calendar/DatePicker').then(mod => ({ default: mod.DatePicker })),
  {
    loading: () => <CalendarSkeleton />,
    ssr: false
  }
);

const AmenitiesGrid = dynamic(
  () => import('@/components/amenities/AmenityModal').then(mod => ({ default: mod.AmenitiesGrid })),
  {
    loading: () => <AmenitiesGridSkeleton />,
    ssr: false
  }
);

const TermsModal = dynamic(
  () => import('@/components/booking/TermsModal').then(mod => ({ default: mod.TermsModal })),
  {
    ssr: false
  }
);


function ImageGallery({ images, roomName }: { images: string[]; roomName: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-[16/9] bg-cream-dark flex items-center justify-center rounded-xl">
        <span className="text-muted-foreground text-sm uppercase tracking-widest">No images available</span>
      </div>
    );
  }

  return (
    <div className="relative aspect-[16/9] bg-cream-dark overflow-hidden rounded-xl group">
      <Image
        src={images[currentIndex]}
        alt={`${roomName} - Image ${currentIndex + 1}`}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 60vw"
        priority
      />

      {images.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gold hover:bg-white transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % images.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center text-gold hover:bg-white transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-gold w-6' : 'bg-white/70 hover:bg-white'
                }`}
              />
            ))}
          </div>
        </>
      )}

      <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-gold text-xs font-medium">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}

// Error message component for field validation
function FieldError({ error, isRtl }: { error?: ValidationError; isRtl: boolean }) {
  if (!error) return null;
  return (
    <p className="text-red-500 text-booking-body-sm mt-1 flex items-center gap-1">
      <AlertCircle className="w-3 h-3" />
      {isRtl ? error.messageAr : error.message}
    </p>
  );
}

// Error message component for global errors
function ErrorMessage({ message, messageAr, isRtl }: { message: string; messageAr?: string; isRtl: boolean }) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-red-600 text-booking-body font-medium">{isRtl ? (messageAr || message) : message}</p>
      </div>
    </div>
  );
}

export default function BookingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const slug = params.slug as string;

  // Get query params from Hero booking form
  const checkInParam = searchParams.get('checkIn');
  const checkOutParam = searchParams.get('checkOut');
  const dateFromCalendar = searchParams.get('date') || checkInParam;

  const [room, setRoom] = useState<Room | null>(null);
  const [roomLoading, setRoomLoading] = useState(true);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, ValidationError>>({});
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'bank_transfer'>('stripe');
  const [isRangeValid, setIsRangeValid] = useState(false);
  const [rangeConflict, setRangeConflict] = useState<string | null>(null);
  const [maxAvailableDays, setMaxAvailableDays] = useState<number>(Infinity);
  const [bookingMode, setBookingMode] = useState<'standard' | 'gap-filling' | 'auto-extended'>('standard');
  const [bookings, setBookings] = useState<{ start_date: string; end_date: string }[]>([]);

  const [formData, setFormData] = useState({
    durationDays: 30,
    startDate: dateFromCalendar || '',
    endDate: checkOutParam || '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    idType: 'passport' as 'passport' | 'saudi_id' | 'iqama',
    idNumber: '',
    nationality: 'SA', // Default to Saudi Arabia
    notes: '',
    weeklyCleaningService: false,
    termsAccepted: false,
    signature: '',
  });

  // Terms modal state
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);

  // Track visitor for real-time admin dashboard
  useVisitorTracking({
    roomSlug: slug,
    roomName: room?.name,
    enabled: !!slug && !bookingSuccess, // Stop tracking after successful booking
  });

  // Fetch room details - preload with roomId for parallel booking data fetch
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setRoomLoading(true);
        setRoomError(null);
        const response = await fetch(`/api/rooms/${slug}`);
        if (!response.ok) {
          throw new Error('Room not found');
        }
        const data = await response.json();
        setRoom(data);
        // Hint to DatePicker that it can now fetch bookings with roomId
        // DatePicker will fetch in parallel when component mounts
      } catch (err) {
        console.error('Error fetching room:', err);
        setRoomError(err instanceof Error ? err.message : 'Failed to load room');
      } finally {
        setRoomLoading(false);
      }
    };

    if (slug) {
      fetchRoom();
    }
  }, [slug]);

  // Fetch bookings for validation with gap-filling
  useEffect(() => {
    if (room?.id) {
      fetch(`/api/bookings?availability=true&roomId=${room.id}`)
        .then(res => {
          if (!res.ok) {
            throw new Error('Failed to fetch bookings');
          }
          return res.json();
        })
        .then(data => {
          if (data.bookings) {
            setBookings(data.bookings);
          }
        })
        .catch(err => console.error('Error fetching bookings:', err));
    }
  }, [room?.id]);

  // Update form data when search params change
  useEffect(() => {
    if (dateFromCalendar || checkOutParam) {
      setFormData((prev) => ({
        ...prev,
        startDate: dateFromCalendar || prev.startDate,
        endDate: checkOutParam || prev.endDate,
      }));
    }
  }, [dateFromCalendar, checkOutParam]);

  // Calculate pricing using room data from Supabase
  const priceInfo = room
    ? calculateBookingPriceByDays(room.monthly_rate, formData.durationDays, formData.weeklyCleaningService)
    : { totalPrice: 0, originalPrice: 0, days: 0, savings: 0, savingsPercent: 0 };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      const newErrors = { ...fieldErrors };
      delete newErrors[name];
      setFieldErrors(newErrors);
    }
  };

  // Handle range validation from DatePicker with gap-filling support
  const handleRangeValidation = (
    isValid: boolean,
    conflictDate: string | null,
    availability?: { maxAvailable: number; recommendedDays?: number; mode?: string }
  ) => {
    setIsRangeValid(isValid);
    setRangeConflict(conflictDate);

    if (availability) {
      setMaxAvailableDays(availability.maxAvailable);

      // Auto-adjust duration in auto-extend mode
      if (availability.mode === 'auto-extended' && availability.recommendedDays) {
        setFormData(prev => ({ ...prev, durationDays: availability.recommendedDays! }));
        setBookingMode('auto-extended');
      } else if (availability.mode === 'gap-filling') {
        setBookingMode('gap-filling');
      } else {
        setBookingMode('standard');
      }
    }
  };

  const validateCurrentStep = useCallback((): boolean => {
    let validation;
    switch (step) {
      case 1:
        validation = validateStep1({
          durationDays: formData.durationDays,
          startDate: formData.startDate,
          bookings: bookings,
        });

        // Add range conflict validation
        if (validation.valid && formData.startDate && !isRangeValid && rangeConflict) {
          validation.valid = false;
          validation.errors.push({
            field: 'startDate',
            message: 'Selected date range conflicts with existing booking',
            messageAr: 'الفترة المختارة تتعارض مع حجز موجود',
          });
        }
        break;
      case 2:
        validation = validateStep2({
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone,
        });
        break;
      case 3:
        validation = validateStep3({
          idType: formData.idType,
          idNumber: formData.idNumber,
          nationality: formData.nationality,
        });
        // Add terms acceptance validation
        if (!formData.termsAccepted) {
          validation.valid = false;
          validation.errors.push({
            field: 'termsAccepted',
            message: 'You must accept the Terms and Conditions to proceed',
            messageAr: 'يجب الموافقة على الشروط والأحكام للمتابعة',
          });
        }
        // Add signature validation
        if (!formData.signature || formData.signature.length < 2) {
          validation.valid = false;
          validation.errors.push({
            field: 'signature',
            message: 'Please provide your signature to proceed',
            messageAr: 'يرجى تقديم توقيعك للمتابعة',
          });
        }
        break;
      default:
        return true;
    }

    if (!validation.valid) {
      const errorMap: Record<string, ValidationError> = {};
      validation.errors.forEach((err) => {
        errorMap[err.field] = err;
      });
      setFieldErrors(errorMap);
      return false;
    }

    setFieldErrors({});
    return true;
  }, [step, formData]);

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setFieldErrors({});
    setStep((prev) => prev - 1);
  };

  // Submit booking via Stripe checkout
  const handleStripeCheckout = async () => {
    if (!validateCurrentStep()) return;

    setLoading(true);
    setBookingError(null);

    try {
      const endDate = calculateEndDateByDays(formData.startDate, formData.durationDays);

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room?.id,
          startDate: formData.startDate,
          endDate: endDate,
          durationDays: formData.durationDays,
          totalAmount: priceInfo.totalPrice,
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone,
          nationality: formData.nationality,
          idType: formData.idType,
          idNumber: formData.idNumber,
          notes: formData.notes,
          locale,
          termsAccepted: formData.termsAccepted,
          signature: formData.signature,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setBookingError(
        error instanceof Error ? error.message : 'Failed to start checkout. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Submit booking directly to Supabase (for bank transfer)
  const handleDirectBooking = async () => {
    if (!validateCurrentStep()) return;

    setLoading(true);
    setBookingError(null);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: room?.id,
          durationDays: formData.durationDays,
          startDate: formData.startDate,
          endDate: calculateEndDateByDays(formData.startDate, formData.durationDays),
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone,
          idType: formData.idType,
          idNumber: formData.idNumber,
          nationality: formData.nationality,
          paymentMethod: 'bank_transfer',
          notes: formData.notes,
          totalAmount: priceInfo.totalPrice,
          weeklyCleaningService: formData.weeklyCleaningService,
          termsAccepted: formData.termsAccepted,
          signature: formData.signature,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.errors) {
          const errorMap: Record<string, ValidationError> = {};
          data.errors.forEach((err: ValidationError) => {
            errorMap[err.field] = err;
          });
          setFieldErrors(errorMap);
        }
        throw new Error(data.errorAr && isRtl ? data.errorAr : data.error || 'Failed to create booking');
      }

      setBookingSuccess(true);
      setBookingId(data.booking.id);
    } catch (error) {
      console.error('Booking error:', error);
      setBookingError(
        error instanceof Error ? error.message : 'Failed to create booking. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (paymentMethod === 'stripe') {
      handleStripeCheckout();
    } else {
      handleDirectBooking();
    }
  };

  // Loading state - show skeleton UI instead of spinner for smoother experience
  if (roomLoading) {
    return <BookingPageSkeleton />;
  }

  // Error state - room not found
  if (roomError || !room) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="geometric-pattern" />
        <div className="text-center space-y-4 relative z-10">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-red-500">{isRtl ? 'الغرفة غير موجودة' : 'Room not found'}</p>
          <Link
            href={`/${locale}#rooms`}
            className="inline-flex items-center gap-2 text-gold hover:underline"
          >
            {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            {isRtl ? 'العودة للغرف' : 'Back to Rooms'}
          </Link>
        </div>
      </div>
    );
  }

  // Success state - booking created
  if (bookingSuccess) {
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
                <span className="text-charcoal font-medium">{isRtl ? room.name_ar : room.name}</span>
              </div>
              <div className="flex justify-between text-booking-body-sm">
                <span className="text-muted-foreground">{isRtl ? 'تاريخ البدء' : 'Start Date'}</span>
                <span className="text-charcoal">{formData.startDate}</span>
              </div>
              <div className="flex justify-between text-booking-body-sm">
                <span className="text-muted-foreground">{isRtl ? 'تاريخ الانتهاء' : 'End Date'}</span>
                <span className="text-charcoal">
                  {calculateEndDateByDays(formData.startDate, formData.durationDays)}
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
                      ? `⚠️ يرجى تحويل المبلغ خلال ساعة واحدة. أضف رقم الحجز (${bookingId?.slice(-8).toUpperCase()}) في وصف التحويل.`
                      : `⚠️ Please transfer within 1 hour. Include booking ID (${bookingId?.slice(-8).toUpperCase()}) in transfer description.`}
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

  const steps = [
    { icon: Calendar, label: isRtl ? 'الخطة' : 'Plan' },
    { icon: User, label: isRtl ? 'البيانات' : 'Details' },
    { icon: Shield, label: isRtl ? 'التحقق' : 'Verify' },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] pt-24 pb-12" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="geometric-pattern" />
      <div className="w-full px-[3%] relative z-10">
        {/* Back Link */}
        <Link
          href={`/${locale}#rooms`}
          className={`inline-flex items-center gap-2 text-muted-foreground hover:text-gold transition-colors mb-8 ${isRtl ? 'flex-row-reverse' : ''}`}
        >
          {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span className="text-sm font-medium">{isRtl ? 'العودة للغرف' : 'Back to Rooms'}</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Room Info */}
          <div className="space-y-6">
            {/* Image Gallery */}
            <ImageGallery images={room.images} roomName={isRtl ? room.name_ar : room.name} />

            {/* Room Details Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gold/10 rounded-full mb-4">
                  <Maximize className="w-3 h-3 text-gold" />
                  <span className="text-gold text-booking-label-lg font-semibold uppercase tracking-widest">{room.size_sqm} m²</span>
                </div>
                <h1 className="text-booking-section heading-serif text-charcoal mb-2">
                  {isRtl ? room.name_ar : room.name}
                </h1>
                <p className="text-booking-body text-muted-foreground leading-relaxed">
                  {isRtl ? room.description_ar : room.description}
                </p>
              </div>

              {/* Amenities - Hover to see photos */}
              <div className="border-t border-border pt-6">
                <h3 className="text-booking-label-lg text-gold font-semibold uppercase tracking-widest mb-4">
                  {isRtl ? 'المرافق' : 'Amenities'}
                </h3>
                <AmenitiesGrid amenities={room.amenities} isRtl={isRtl} />
              </div>

              {/* Price Summary - Always visible */}
              <div className="border-t border-border pt-6">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-booking-label-lg text-gold font-semibold uppercase tracking-widest mb-1">
                      {isRtl ? 'إجمالي السعر' : 'Total Price'} ({formData.durationDays} {isRtl ? 'يوم' : 'days'})
                    </div>
                    <div className="flex items-baseline gap-2">
                      {priceInfo.savings > 0 && (
                        <span className="text-booking-body text-muted-foreground line-through font-tabular">
                          {priceInfo.originalPrice.toLocaleString()}
                        </span>
                      )}
                      <span className="text-price-hero heading-serif text-charcoal font-tabular">
                        {priceInfo.totalPrice.toLocaleString()}
                      </span>
                      <span className="text-booking-label text-muted-foreground">SAR</span>
                    </div>
                  </div>
                  {priceInfo.savings > 0 && (
                    <div className="text-right">
                      <div className="badge-gold">
                        {isRtl ? `وفر ${priceInfo.savingsPercent}%` : `Save ${priceInfo.savingsPercent}%`}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Booking Form */}
          <div className="space-y-6">
            {/* Global Error Message */}
            {bookingError && (
              <ErrorMessage message={bookingError} isRtl={isRtl} />
            )}

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {steps.map((s, idx) => {
                const StepIcon = s.icon;
                const stepNum = idx + 1;
                const isActive = step === stepNum;
                const isCompleted = step > stepNum;

                return (
                  <div key={idx} className="flex items-center gap-2">
                    <div
                      className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all ${
                        isActive
                          ? 'bg-gold text-white shadow-lg shadow-gold/30'
                          : isCompleted
                          ? 'bg-gold/20 text-gold'
                          : 'bg-white border border-border text-muted-foreground'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`w-8 h-0.5 rounded ${step > stepNum ? 'bg-gold' : 'bg-border'}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step 1: Plan & Date */}
            {step === 1 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
                <div>
                  <h2 className="text-booking-section heading-serif text-charcoal mb-2">
                    {isRtl ? 'اختر خطتك' : 'Choose Your Plan'}
                  </h2>
                  <p className="text-booking-body-sm text-muted-foreground">
                    {isRtl ? 'اختر مدة الإيجار وتاريخ البدء' : 'Select rental period and start date'}
                  </p>
                </div>

                {/* Start Date - Visual Calendar */}
                <div className="space-y-3">
                  <Label className="text-booking-label-lg text-gold font-semibold uppercase tracking-widest">
                    {isRtl ? 'تاريخ البدء' : 'Check-in Date'} *
                  </Label>
                  <DatePicker
                    selectedDate={formData.startDate}
                    onDateSelect={(date) => {
                      setFormData({ ...formData, startDate: date });
                      if (fieldErrors.startDate) {
                        const newErrors = { ...fieldErrors };
                        delete newErrors.startDate;
                        setFieldErrors(newErrors);
                      }
                    }}
                    locale={locale as 'en' | 'ar'}
                    roomId={room.id}
                    durationDays={formData.durationDays}
                    onRangeValidation={handleRangeValidation}
                  />
                  <FieldError error={fieldErrors.startDate} isRtl={isRtl} />
                </div>

                {/* Duration Selector */}
                <DurationSelector
                  selectedDays={formData.durationDays}
                  onDurationChange={(days) => {
                    setFormData({ ...formData, durationDays: days });
                    // Reset range validation state when duration changes so DatePicker recalculates
                    setIsRangeValid(false);
                    setRangeConflict(null);
                  }}
                  locale={locale as 'en' | 'ar'}
                  monthlyRate={room.monthly_rate}
                  yearlyRate={room.yearly_rate}
                  hasConflict={!isRangeValid && rangeConflict !== null && formData.startDate.length > 0}
                  maxAvailableDays={maxAvailableDays}
                  bookingMode={bookingMode}
                  startDate={formData.startDate}
                  selectedCleaningService={formData.weeklyCleaningService}
                  onCleaningServiceChange={(enabled) => {
                    setFormData({ ...formData, weeklyCleaningService: enabled });
                  }}
                />
                <FieldError error={fieldErrors.durationDays} isRtl={isRtl} />

                {/* End Date (auto-calculated display) */}
                <div className="space-y-3">
                  <Label className="text-booking-label-lg text-gold font-semibold uppercase tracking-widest">
                    {isRtl ? 'تاريخ الخروج' : 'Check-out Date'}
                  </Label>
                  <div className="h-12 bg-cream rounded-lg border border-border flex items-center px-3">
                    <span className="text-muted-foreground">
                      {formData.startDate
                        ? calculateEndDateByDays(formData.startDate, formData.durationDays)
                        : (isRtl ? 'يعتمد على تاريخ البدء' : 'Based on start date')}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleNextStep}
                  className="w-full btn-primary rounded-xl h-12 text-base font-medium hover:shadow-lg hover:shadow-gold/30 active:scale-[0.98] transition-all duration-300"
                >
                  {isRtl ? 'التالي' : 'Continue'}
                </Button>
              </div>
            )}

            {/* Step 2: Contact Info */}
            {step === 2 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
                <div>
                  <h2 className="text-booking-section heading-serif text-charcoal mb-2">
                    {isRtl ? 'معلومات الاتصال' : 'Contact Information'}
                  </h2>
                  <p className="text-booking-body-sm text-muted-foreground">
                    {isRtl ? 'أدخل بياناتك للتواصل' : 'Enter your contact details'}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName" className="text-booking-label-lg text-gold font-semibold uppercase tracking-widest">
                      {isRtl ? 'الاسم الكامل' : 'Full Name'} *
                    </Label>
                    <Input
                      id="customerName"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      placeholder={isRtl ? 'الاسم الأول والأخير' : 'First and Last Name'}
                      className={`input-luxury h-12 ${
                        fieldErrors.customerName ? 'border-red-500' : ''
                      }`}
                    />
                    <FieldError error={fieldErrors.customerName} isRtl={isRtl} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail" className="text-xs text-gold font-semibold uppercase tracking-widest">
                      {isRtl ? 'البريد الإلكتروني' : 'Email'} *
                    </Label>
                    <Input
                      id="customerEmail"
                      name="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={handleInputChange}
                      placeholder={isRtl ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                      className={`input-luxury h-12 ${
                        fieldErrors.customerEmail ? 'border-red-500' : ''
                      }`}
                    />
                    <FieldError error={fieldErrors.customerEmail} isRtl={isRtl} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone" className="text-xs text-gold font-semibold uppercase tracking-widest">
                      {isRtl ? 'رقم الهاتف' : 'Phone Number'} *
                    </Label>
                    <Input
                      id="customerPhone"
                      name="customerPhone"
                      type="tel"
                      value={formData.customerPhone}
                      onChange={handleInputChange}
                      placeholder={isRtl ? '+966531182200 أو 0531182200' : '+966531182200 or 0531182200'}
                      dir="ltr"
                      className={`input-luxury h-12 ${
                        fieldErrors.customerPhone ? 'border-red-500' : ''
                      }`}
                    />
                    <FieldError error={fieldErrors.customerPhone} isRtl={isRtl} />
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={handlePrevStep}
                    className="flex-1 rounded-xl h-12 border-border text-charcoal hover:bg-cream font-medium"
                  >
                    {isRtl ? 'السابق' : 'Back'}
                  </Button>
                  <Button
                    onClick={handleNextStep}
                    className="flex-1 btn-primary rounded-xl h-12 font-medium"
                  >
                    {isRtl ? 'التالي' : 'Continue'}
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: ID Verification & Payment */}
            {step === 3 && (
              <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
                <div>
                  <h2 className="text-2xl heading-serif text-charcoal mb-2">
                    {isRtl ? 'التحقق من الهوية' : 'ID Verification'}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {isRtl ? 'مطلوب للحجز' : 'Required for booking'}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-xs text-gold font-semibold uppercase tracking-widest">
                      {isRtl ? 'نوع الهوية' : 'ID Type'} *
                    </Label>
                    <RadioGroup
                      value={formData.idType}
                      onValueChange={(value) => setFormData({ ...formData, idType: value as 'passport' | 'saudi_id' | 'iqama' })}
                      className="grid grid-cols-3 gap-2"
                    >
                      {[
                        { value: 'passport', label: isRtl ? 'جواز سفر' : 'Passport' },
                        { value: 'saudi_id', label: isRtl ? 'هوية سعودية' : 'Saudi ID' },
                        { value: 'iqama', label: isRtl ? 'إقامة' : 'Iqama' },
                      ].map((option) => (
                        <Label
                          key={option.value}
                          htmlFor={option.value}
                          className={`flex items-center justify-center p-3 cursor-pointer text-sm rounded-lg border-2 transition-all ${
                            formData.idType === option.value
                              ? 'border-gold bg-gold/5 text-gold'
                              : 'border-border text-muted-foreground hover:border-gold/50'
                          }`}
                        >
                          <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                          {option.label}
                        </Label>
                      ))}
                    </RadioGroup>
                    <FieldError error={fieldErrors.idType} isRtl={isRtl} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="idNumber" className="text-xs text-gold font-semibold uppercase tracking-widest">
                      {isRtl ? 'رقم الهوية' : 'ID Number'} *
                    </Label>
                    <Input
                      id="idNumber"
                      name="idNumber"
                      value={formData.idNumber}
                      onChange={handleInputChange}
                      placeholder={isRtl ? 'أدخل رقم الهوية' : 'Enter ID number'}
                      className={`input-luxury h-12 ${
                        fieldErrors.idNumber ? 'border-red-500' : ''
                      }`}
                    />
                    <FieldError error={fieldErrors.idNumber} isRtl={isRtl} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nationality" className="text-xs text-gold font-semibold uppercase tracking-widest">
                      {isRtl ? 'الجنسية' : 'Nationality'} *
                    </Label>
                    <select
                      id="nationality"
                      name="nationality"
                      value={formData.nationality}
                      onChange={handleInputChange}
                      className={`w-full h-12 px-3 rounded-lg border-2 transition-all bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-gold/50 ${
                        fieldErrors.nationality ? 'border-red-500' : 'border-border'
                      }`}
                    >
                      {NATIONALITIES.map((nationality) => (
                        <option key={nationality.code} value={nationality.code}>
                          {isRtl ? nationality.ar : nationality.en}
                        </option>
                      ))}
                    </select>
                    <FieldError error={fieldErrors.nationality} isRtl={isRtl} />
                  </div>

                  {/* Notes (optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-xs text-gold font-semibold uppercase tracking-widest">
                      {isRtl ? 'ملاحظات إضافية' : 'Additional Notes'} ({isRtl ? 'اختياري' : 'Optional'})
                    </Label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder={isRtl ? 'أي طلبات خاصة أو ملاحظات' : 'Any special requests or notes'}
                      rows={3}
                      className="w-full input-luxury p-3 resize-none"
                    />
                  </div>

                  {/* Terms and Conditions - View & Accept Button */}
                  <div className="space-y-3">
                    <Label className="text-xs text-gold font-semibold uppercase tracking-widest">
                      {isRtl ? 'الشروط والأحكام' : 'Terms & Conditions'} *
                    </Label>

                    {/* Status and Action */}
                    <div
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.termsAccepted && formData.signature
                          ? 'border-green-500 bg-green-50'
                          : fieldErrors.termsAccepted || fieldErrors.signature
                          ? 'border-red-500 bg-red-50'
                          : 'border-border bg-cream/50'
                      }`}
                    >
                      {formData.termsAccepted && formData.signature ? (
                        // Accepted state with signature preview
                        <div className="space-y-3">
                          <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <p className="text-green-700 font-medium text-sm">
                                {isRtl ? 'تم قبول الشروط والتوقيع' : 'Terms Accepted & Signed'}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsTermsModalOpen(true);
                              // Clear errors when opening modal
                              if (fieldErrors.termsAccepted || fieldErrors.signature) {
                                const newErrors = { ...fieldErrors };
                                delete newErrors.termsAccepted;
                                delete newErrors.signature;
                                setFieldErrors(newErrors);
                              }
                            }}
                            className="w-full py-2 px-4 rounded-lg border border-green-500 text-green-700 text-sm font-medium hover:bg-green-100 transition-all"
                          >
                            {isRtl ? 'تعديل التوقيع' : 'Edit Signature'}
                          </button>
                        </div>
                      ) : (
                        // Pending state
                        <div className="space-y-3">
                          <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              fieldErrors.termsAccepted || fieldErrors.signature
                                ? 'bg-red-100'
                                : 'bg-gold/10'
                            }`}>
                              <Shield className={`w-5 h-5 ${
                                fieldErrors.termsAccepted || fieldErrors.signature
                                  ? 'text-red-500'
                                  : 'text-gold'
                              }`} />
                            </div>
                            <div className="flex-1">
                              <p className={`font-medium text-sm ${
                                fieldErrors.termsAccepted || fieldErrors.signature
                                  ? 'text-red-600'
                                  : 'text-charcoal'
                              }`}>
                                {isRtl ? 'مطلوب قبول الشروط والتوقيع' : 'Terms acceptance & signature required'}
                              </p>
                              <p className="text-muted-foreground text-xs">
                                {isRtl ? 'اقرأ الشروط وقدم توقيعك' : 'Read terms and provide your signature'}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setIsTermsModalOpen(true);
                              // Clear errors when opening modal
                              if (fieldErrors.termsAccepted || fieldErrors.signature) {
                                const newErrors = { ...fieldErrors };
                                delete newErrors.termsAccepted;
                                delete newErrors.signature;
                                setFieldErrors(newErrors);
                              }
                            }}
                            className={`w-full py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                              fieldErrors.termsAccepted || fieldErrors.signature
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-gold hover:bg-gold/90 text-white hover:shadow-lg hover:shadow-gold/30'
                            } ${isRtl ? 'flex-row-reverse' : ''}`}
                          >
                            <Shield className="w-4 h-4" />
                            {isRtl ? 'عرض وقبول الشروط' : 'View & Accept Terms'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Error messages */}
                    <FieldError error={fieldErrors.termsAccepted} isRtl={isRtl} />
                    <FieldError error={fieldErrors.signature} isRtl={isRtl} />
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div className="border-t border-border pt-6 space-y-3">
                  <Label className="text-xs text-gold font-semibold uppercase tracking-widest">
                    {isRtl ? 'طريقة الدفع' : 'Payment Method'}
                  </Label>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(value) => setPaymentMethod(value as 'stripe' | 'bank_transfer')}
                    className="grid grid-cols-2 gap-4"
                  >
                    <Label
                      htmlFor="stripe"
                      className={`flex flex-col items-center justify-center p-4 cursor-pointer transition-all rounded-xl border-2 ${
                        paymentMethod === 'stripe'
                          ? 'border-gold bg-gold/5'
                          : 'border-border hover:border-gold/50'
                      }`}
                    >
                      <RadioGroupItem value="stripe" id="stripe" className="sr-only" />
                      <CreditCard className="w-6 h-6 text-gold mb-2" />
                      <span className="text-charcoal text-sm font-medium">{isRtl ? 'بطاقة ائتمان' : 'Credit Card'}</span>
                      <span className="text-muted-foreground text-xs mt-1">{isRtl ? 'دفع فوري' : 'Instant Payment'}</span>
                    </Label>
                    <Label
                      htmlFor="bank_transfer"
                      className={`flex flex-col items-center justify-center p-4 cursor-pointer transition-all rounded-xl border-2 ${
                        paymentMethod === 'bank_transfer'
                          ? 'border-gold bg-gold/5'
                          : 'border-border hover:border-gold/50'
                      }`}
                    >
                      <RadioGroupItem value="bank_transfer" id="bank_transfer" className="sr-only" />
                      <Building2 className="w-6 h-6 text-gold mb-2" />
                      <span className="text-charcoal text-sm font-medium">{isRtl ? 'تحويل بنكي' : 'Bank Transfer'}</span>
                      <span className="text-muted-foreground text-xs mt-1">{isRtl ? 'سنتواصل معك' : 'We\'ll contact you'}</span>
                    </Label>
                  </RadioGroup>
                </div>

                {/* Final Summary */}
                <div className="p-4 bg-cream rounded-xl space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{isRtl ? 'الغرفة' : 'Room'}</span>
                    <span className="text-charcoal font-medium">{isRtl ? room.name_ar : room.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{isRtl ? 'المدة' : 'Duration'}</span>
                    <span className="text-charcoal">
                      {formData.durationDays} {isRtl ? 'يوم' : 'days'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{isRtl ? 'تاريخ الدخول' : 'Check-in'}</span>
                    <span className="text-charcoal">{formData.startDate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{isRtl ? 'تاريخ الخروج' : 'Check-out'}</span>
                    <span className="text-charcoal">
                      {calculateEndDateByDays(formData.startDate, formData.durationDays)}
                    </span>
                  </div>
                  {formData.weeklyCleaningService && priceInfo.cleaningFee && (
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

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={handlePrevStep}
                    disabled={loading}
                    className="flex-1 rounded-xl h-12 border-border text-charcoal hover:bg-cream font-medium"
                  >
                    {isRtl ? 'السابق' : 'Back'}
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 btn-primary rounded-xl h-12 font-medium group"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : paymentMethod === 'stripe' ? (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        {isRtl ? 'ادفع الآن' : 'Pay Now'}
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        {isRtl ? 'تأكيد الحجز' : 'Confirm Booking'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Terms Modal */}
      <TermsModal
        isOpen={isTermsModalOpen}
        onClose={() => setIsTermsModalOpen(false)}
        onAccept={(signature: string) => {
          setFormData((prev) => ({
            ...prev,
            termsAccepted: true,
            signature: signature,
          }));
          // Clear any existing errors
          if (fieldErrors.termsAccepted || fieldErrors.signature) {
            const newErrors = { ...fieldErrors };
            delete newErrors.termsAccepted;
            delete newErrors.signature;
            setFieldErrors(newErrors);
          }
          setIsTermsModalOpen(false);
        }}
        locale={locale as 'en' | 'ar'}
      />
    </div>
  );
}
