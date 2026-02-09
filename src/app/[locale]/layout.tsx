import { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Inter } from 'next/font/google';
import { Noto_Sans_Arabic } from 'next/font/google';
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { locales, localeDirection, type Locale } from '@/i18n/config';
import { Header } from '@/components/layout/Header';
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { OrganizationJsonLd, LocalBusinessJsonLd, WebSiteJsonLd } from '@/components/seo/JsonLd';
import '../globals.css';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mustaqar.vercel.app';

// Metadata translations
const metadataByLocale = {
  en: {
    title: 'شركة مستقر لإدارة الشقق الفندقية',
    description: 'Looking for luxury hotel apartments in Riyadh? شركة مستقر لإدارة الشقق الفندقية offers premium furnished suites with WiFi, parking, and security. Marketing - Renting - Furnishing. Book online or via WhatsApp.',
    keywords: 'luxury studio rental Riyadh, furnished apartments Riyadh, short term rental Saudi Arabia, serviced apartments Riyadh, monthly rental Riyadh',
  },
  ar: {
    title: 'شركة مستقر لإدارة الشقق الفندقية',
    description: 'تبحث عن شقق فندقية فاخرة في الرياض؟ شركة مستقر لإدارة الشقق الفندقية تقدم أجنحة مفروشة بالكامل مع واي فاي ومواقف وأمان. تسويق - تأجير - تأثيث. احجز عبر الإنترنت أو واتساب.',
    keywords: 'إيجار استوديو فاخر الرياض، شقق مفروشة الرياض، إيجار قصير المدى السعودية، شقق فندقية الرياض، إيجار شهري الرياض',
  },
};

// Dynamic metadata generation based on locale
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const meta = metadataByLocale[locale as keyof typeof metadataByLocale] || metadataByLocale.en;

  return {
    title: {
      default: meta.title,
      template: locale === 'ar' ? `%s | شركة مستقر لإدارة الشقق الفندقية` : `%s | شركة مستقر لإدارة الشقق الفندقية`,
    },
    description: meta.description,
    keywords: meta.keywords,
    authors: [{ name: 'شركة مستقر لإدارة الشقق الفندقية' }],
    creator: 'شركة مستقر لإدارة الشقق الفندقية',
    publisher: 'شركة مستقر لإدارة الشقق الفندقية',
    metadataBase: new URL(BASE_URL),
    icons: {
      icon: [
        { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      ],
      shortcut: '/favicon-32x32.png',
      apple: '/apple-touch-icon.png',
    },
    // Open Graph for social sharing
    openGraph: {
      type: 'website',
      locale: locale === 'ar' ? 'ar_SA' : 'en_US',
      alternateLocale: locale === 'ar' ? 'en_US' : 'ar_SA',
      url: `${BASE_URL}/${locale}`,
      siteName: 'شركة مستقر لإدارة الشقق الفندقية',
      title: meta.title,
      description: meta.description,
      images: [
        {
          url: `${BASE_URL}/images/og-image.jpg`,
          width: 1200,
          height: 630,
          alt: 'شركة مستقر لإدارة الشقق الفندقية - تسويق تأجير تأثيث',
        },
      ],
    },
    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.description,
      images: [`${BASE_URL}/images/og-image.jpg`],
      creator: '@mustaqar_rs',
    },
    // Alternate language versions (hreflang)
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: {
        'ar': `${BASE_URL}/ar`,
        'en': `${BASE_URL}/en`,
        'x-default': `${BASE_URL}/ar`,
      },
    },
    // Robots directives
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    // Verification (add your verification codes)
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION,
      // yandex: 'your-yandex-verification',
      // bing: 'your-bing-verification',
    },
    // Category for search engines
    category: 'Real Estate',
  };
}

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const notoSansArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  variable: '--font-noto-sans-arabic',
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate the locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  const messages = await getMessages();
  const direction = localeDirection[locale as Locale];
  const fontClass = locale === 'ar' ? notoSansArabic.variable : inter.variable;

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />

        {/* JSON-LD Structured Data for SEO */}
        <OrganizationJsonLd />
        <LocalBusinessJsonLd />
        <WebSiteJsonLd />

        {/* Performance: Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Performance: DNS prefetch for API domains */}
        <link rel="dns-prefetch" href="https://lfmkowkflhxtecoaffrs.supabase.co" />

        {/* Performance: Preload hero image for Hero section */}
        <link
          rel="preload"
          href="/room-images/mustaqar-suite/01-master-bedroom.webp"
          as="image"
          fetchPriority="high"
        />
      </head>
      <body className={`${inter.variable} ${notoSansArabic.variable} font-sans antialiased`} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
          </div>
          <Toaster
            position={direction === 'rtl' ? 'top-left' : 'top-right'}
            richColors
            closeButton
            duration={4000}
          />
        </NextIntlClientProvider>

        {/* Analytics */}
        <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
