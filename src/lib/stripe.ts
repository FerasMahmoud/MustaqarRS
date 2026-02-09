import { loadStripe } from '@stripe/stripe-js';
import Stripe from 'stripe';

// Client-side Stripe instance
let stripePromise: ReturnType<typeof loadStripe> | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

// Server-side Stripe instance (lazy-loaded)
let stripeInstance: Stripe | null = null;

export const getStripeServer = () => {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });
  }
  return stripeInstance;
};

// Legacy export for backward compatibility
export const stripe = {
  get checkout() {
    return getStripeServer().checkout;
  },
};

// Studio pricing in SAR
export const STUDIOS = {
  'room-1': {
    id: 'room-1',
    dbId: '11111111-1111-1111-1111-111111111111',
    name: 'Deluxe Studio',
    nameAr: 'ستوديو ديلوكس',
    monthlyPrice: 5500,
    yearlyPrice: 55000,
    size: 45,
  },
  'room-2': {
    id: 'room-2',
    dbId: '22222222-2222-2222-2222-222222222222',
    name: 'Comfort Studio',
    nameAr: 'ستوديو كومفورت',
    monthlyPrice: 4500,
    yearlyPrice: 45000,
    size: 35,
  },
};

// Map frontend room IDs to database UUIDs
export const ROOM_ID_MAP: Record<string, string> = {
  'room-1': '11111111-1111-1111-1111-111111111111',
  'room-2': '22222222-2222-2222-2222-222222222222',
};

// Reverse map: database UUIDs to frontend room IDs
export const DB_ID_TO_ROOM: Record<string, string> = {
  '11111111-1111-1111-1111-111111111111': 'room-1',
  '22222222-2222-2222-2222-222222222222': 'room-2',
};

export type StudioId = keyof typeof STUDIOS;
export type BillingPeriod = 'monthly' | 'yearly';

// Calculate price for day-based booking
export function calculateDayBasedPrice(
  monthlyRate: number,
  yearlyRate: number,
  days: number
): { total: number; savings: number; savingsPercent: number } {
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

  return { total: Math.round(total), savings: Math.round(savings), savingsPercent };
}

// Format date for display
export function formatDateDisplay(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  const months = {
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  };
  const monthNames = months[locale as keyof typeof months] || months.en;
  return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}

// Helper to create a checkout session for day-based studio rental
export async function createDayBasedCheckoutSession({
  roomId,
  roomName,
  roomNameAr,
  startDate,
  endDate,
  durationDays,
  totalAmount,
  successUrl,
  cancelUrl,
  locale = 'en',
}: {
  roomId: string;
  roomName: string;
  roomNameAr: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  totalAmount: number;
  successUrl: string;
  cancelUrl: string;
  locale?: string;
}) {
  const isArabic = locale === 'ar';
  const studioName = isArabic ? roomNameAr : roomName;
  const startDisplay = formatDateDisplay(startDate, locale);
  const endDisplay = formatDateDisplay(endDate, locale);

  const description = isArabic
    ? `إيجار ${durationDays} يوم - من ${startDisplay} إلى ${endDisplay}`
    : `${durationDays} Days Rental - ${startDisplay} to ${endDisplay}`;

  const session = await getStripeServer().checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'sar',
          product_data: {
            name: studioName,
            description: description,
          },
          unit_amount: Math.round(totalAmount * 100), // Convert to halalas (SAR cents)
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      roomId,
      startDate,
      endDate,
      durationDays: String(durationDays),
      totalAmount: String(totalAmount),
      locale,
    },
    locale: (locale === 'ar' ? 'ar' : 'en') as Stripe.Checkout.SessionCreateParams.Locale,
  });

  return session;
}

// Legacy helper for backward compatibility
export async function createStudioCheckoutSession({
  studioId,
  billingPeriod,
  startDate,
  customerEmail,
  customerName,
  customerPhone,
  idType,
  idNumber,
  nationality,
  successUrl,
  cancelUrl,
  locale = 'en',
}: {
  studioId: StudioId;
  billingPeriod: BillingPeriod;
  startDate: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  idType: 'passport' | 'saudi_id' | 'iqama';
  idNumber: string;
  nationality: string;
  successUrl: string;
  cancelUrl: string;
  locale?: string;
}) {
  const studio = STUDIOS[studioId];
  if (!studio) {
    throw new Error('Invalid studio ID');
  }

  const price = billingPeriod === 'yearly' ? studio.yearlyPrice : studio.monthlyPrice;
  const periodLabel = billingPeriod === 'yearly' ? '1 Year' : '1 Month';
  const periodLabelAr = billingPeriod === 'yearly' ? 'سنة واحدة' : 'شهر واحد';

  const session = await getStripeServer().checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'sar',
          product_data: {
            name: locale === 'ar' ? studio.nameAr : studio.name,
            description: locale === 'ar'
              ? `إيجار ${periodLabelAr} - يبدأ من ${startDate}`
              : `${periodLabel} Rental - Starting ${startDate}`,
          },
          unit_amount: price * 100, // Convert to halalas (SAR cents)
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: customerEmail,
    metadata: {
      studioId,
      billingPeriod,
      startDate,
      customerName,
      customerPhone,
      idType,
      idNumber,
      nationality,
      locale,
    },
    locale: (locale === 'ar' ? 'ar' : 'en') as Stripe.Checkout.SessionCreateParams.Locale,
  });

  return session;
}

// Convert SAR to USD for display
export function sarToUsd(sar: number): number {
  return Math.round((sar / 3.75) * 100) / 100;
}

// Format price with currency
export function formatPrice(amount: number, currency: 'SAR' | 'USD' = 'SAR'): string {
  if (currency === 'USD') {
    return `$${sarToUsd(amount).toLocaleString()}`;
  }
  return `${amount.toLocaleString()} SAR`;
}
