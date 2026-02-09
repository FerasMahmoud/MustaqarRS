import { Metadata } from 'next';
import { getRoomBySlug } from '@/lib/db';
import { RoomProductJsonLd, LodgingJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mustaqar.vercel.app';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
  children: React.ReactNode;
}

/**
 * Dynamic metadata generation for room booking pages
 * Generates SEO-optimized title, description, and Open Graph tags
 * specific to each room for better search visibility
 */
export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const room = getRoomBySlug(slug);

  if (!room) {
    return {
      title: locale === 'ar' ? 'الغرفة غير موجودة' : 'Room Not Found',
    };
  }

  const name = locale === 'ar' ? room.name_ar : room.name;

  // Create SEO-optimized description for LLM GEO
  const seoDescription = locale === 'ar'
    ? `احجز ${room.name_ar} في شركة مستقر بالرياض. ${room.size_sqm} م² تتسع لـ ${room.capacity} ضيوف. من ${Math.round(room.monthly_rate / 30)} ريال/ليلة. واي فاي مجاني، مطبخ مجهز، تنظيف أسبوعي.`
    : `Book ${room.name} at شركة مستقر Riyadh. ${room.size_sqm}m² accommodates ${room.capacity} guests. From SAR ${Math.round(room.monthly_rate / 30)}/night. Free WiFi, equipped kitchen, weekly cleaning included.`;

  return {
    title: `${name} | شركة مستقر`,
    description: seoDescription,
    keywords: locale === 'ar'
      ? `${room.name_ar}, استوديو فاخر الرياض, إيجار قصير المدى, شقق مفروشة, شركة مستقر`
      : `${room.name}, luxury studio Riyadh, short term rental, furnished apartments, شركة مستقر`,
    openGraph: {
      type: 'website',
      locale: locale === 'ar' ? 'ar_SA' : 'en_US',
      alternateLocale: locale === 'ar' ? 'en_US' : 'ar_SA',
      url: `${BASE_URL}/${locale}/book/${slug}`,
      siteName: 'شركة مستقر',
      title: name,
      description: seoDescription,
      images: room.images.map((img, idx) => ({
        url: img.startsWith('http') ? img : `${BASE_URL}${img}`,
        width: 1200,
        height: 630,
        alt: `${name} - ${locale === 'ar' ? 'صورة' : 'Image'} ${idx + 1}`,
      })),
    },
    twitter: {
      card: 'summary_large_image',
      title: name,
      description: seoDescription,
      images: room.images[0]?.startsWith('http') ? [room.images[0]] : [`${BASE_URL}${room.images[0]}`],
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}/book/${slug}`,
      languages: {
        'en': `${BASE_URL}/en/book/${slug}`,
        'ar': `${BASE_URL}/ar/book/${slug}`,
        'x-default': `${BASE_URL}/en/book/${slug}`,
      },
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * Layout component for room booking pages
 * Adds room-specific JSON-LD structured data for rich search results
 */
export default async function RoomBookingLayout({ params, children }: Props) {
  const { locale, slug } = await params;
  const room = getRoomBySlug(slug);

  if (!room) {
    return <>{children}</>;
  }

  // Breadcrumb data for navigation schema
  const breadcrumbs = [
    { name: locale === 'ar' ? 'الرئيسية' : 'Home', url: `/${locale}` },
    { name: locale === 'ar' ? 'الاستوديوهات' : 'Studios', url: `/${locale}#rooms` },
    { name: locale === 'ar' ? room.name_ar : room.name },
  ];

  return (
    <>
      {/* Room-specific JSON-LD structured data */}
      <RoomProductJsonLd room={room} locale={locale} />
      <LodgingJsonLd room={room} locale={locale} />
      <BreadcrumbJsonLd items={breadcrumbs} />

      {children}
    </>
  );
}
