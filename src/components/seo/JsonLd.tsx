import { Room } from '@/lib/db';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mustaqar.vercel.app';

/**
 * JSON-LD Structured Data Components for SEO
 *
 * These schemas help search engines and AI assistants understand
 * the content and context of the website for rich snippets and
 * better visibility in search results and AI overviews.
 */

// Organization schema - shows company info in search results
export function OrganizationJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'شركة مستقر لإدارة الشقق الفندقية',
    url: BASE_URL,
    logo: `${BASE_URL}/logo.webp`,
    description: 'Premium luxury studio rentals in Riyadh, Saudi Arabia with world-class amenities and service.',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Riyadh',
      addressRegion: 'Riyadh Province',
      addressCountry: 'SA',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+966-531182200',
      contactType: 'customer service',
      availableLanguage: ['en', 'ar'],
    },
    sameAs: [
      'https://instagram.com/mustaqar_rs',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// LocalBusiness schema - shows business info with reviews and location
export function LocalBusinessJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: 'شركة مستقر لإدارة الشقق الفندقية',
    image: `${BASE_URL}/images/og-image.webp`,
    url: BASE_URL,
    telephone: '+966-531182200',
    priceRange: 'SAR 200 - SAR 350',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Riyadh',
      addressLocality: 'Riyadh',
      addressRegion: 'Riyadh Province',
      postalCode: '12345',
      addressCountry: 'SA',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 24.7136,
      longitude: 46.6753,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00',
      closes: '23:59',
    },
    amenityFeature: [
      { '@type': 'LocationFeatureSpecification', name: 'Free WiFi', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Air Conditioning', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Fully Equipped Kitchen', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Smart TV', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Free Parking', value: true },
      { '@type': 'LocationFeatureSpecification', name: 'Weekly Cleaning', value: true },
    ],
    checkinTime: '15:00',
    checkoutTime: '12:00',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// Product schema for individual rooms - shows in shopping/product search
interface RoomProductJsonLdProps {
  room: Room;
  locale: string;
}

export function RoomProductJsonLd({ room, locale }: RoomProductJsonLdProps) {
  const name = locale === 'ar' ? room.name_ar : room.name;
  const description = locale === 'ar' ? room.description_ar : room.description;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: name,
    description: description,
    image: room.images.map(img => `${BASE_URL}${img}`),
    brand: {
      '@type': 'Brand',
      name: 'شركة مستقر لإدارة الشقق الفندقية',
    },
    offers: {
      '@type': 'Offer',
      url: `${BASE_URL}/${locale}/book/${room.slug}`,
      priceCurrency: 'SAR',
      price: room.monthly_rate / 30, // Daily rate approximation
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'شركة مستقر لإدارة الشقق الفندقية',
      },
    },
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Size', value: `${room.size_sqm} sqm` },
      { '@type': 'PropertyValue', name: 'Capacity', value: `${room.capacity} guests` },
      ...room.amenities.map(amenity => ({
        '@type': 'PropertyValue',
        name: 'Amenity',
        value: amenity,
      })),
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// LodgingReservation schema - for room/accommodation pages
interface LodgingJsonLdProps {
  room: Room;
  locale: string;
}

export function LodgingJsonLd({ room, locale }: LodgingJsonLdProps) {
  const name = locale === 'ar' ? room.name_ar : room.name;
  const description = locale === 'ar' ? room.description_ar : room.description;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: name,
    description: description,
    image: room.images.map(img => `${BASE_URL}${img}`),
    url: `${BASE_URL}/${locale}/book/${room.slug}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Riyadh',
      addressCountry: 'SA',
    },
    priceRange: `SAR ${Math.round(room.monthly_rate / 30)}/night`,
    amenityFeature: room.amenities.map(amenity => ({
      '@type': 'LocationFeatureSpecification',
      name: amenity,
      value: true,
    })),
    numberOfRooms: 1,
    floorSize: {
      '@type': 'QuantitativeValue',
      value: room.size_sqm,
      unitCode: 'MTK', // Square meters
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// BreadcrumbList schema - shows breadcrumb navigation in search results
interface BreadcrumbJsonLdProps {
  items: Array<{ name: string; url?: string }>;
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url && { item: `${BASE_URL}${item.url}` }),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// FAQPage schema - shows FAQ answers directly in search results
interface FAQJsonLdProps {
  questions: Array<{ question: string; answer: string }>;
}

export function FAQJsonLd({ questions }: FAQJsonLdProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

// WebSite schema with SearchAction - enables site search in Google
export function WebSiteJsonLd() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'شركة مستقر لإدارة الشقق الفندقية',
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
