import { setRequestLocale } from 'next-intl/server';
import { Hero } from '@/components/hero/Hero';
import { Features } from '@/components/features/Features';
import { Amenities } from '@/components/amenities/Amenities';
import { Testimonials } from '@/components/testimonials/Testimonials';
import { BookingCalendar } from '@/components/calendar/BookingCalendar';
import { FAQ } from '@/components/faq/FAQ';
import { Contact } from '@/components/contact/Contact';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Hero />
      <Features />
      <Amenities />
      <Testimonials />
      <BookingCalendar />
      <FAQ />
      <Contact />
    </>
  );
}
