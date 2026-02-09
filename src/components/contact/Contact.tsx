'use client';

import { useTranslations, useLocale } from 'next-intl';
import { PointsOfInterest } from './PointsOfInterest';

export function Contact() {
  const t = useTranslations('contact');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  return (
    <section id="contact" className="py-20 bg-[#FAF7F2]">
      <div className="container-luxury">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-16 h-px bg-gold" />
            <span className="text-gold text-sm font-semibold tracking-[0.25em] uppercase">
              {isRtl ? 'موقعنا' : 'Our location'}
            </span>
            <div className="w-16 h-px bg-gold" />
          </div>
          <h2 className={`heading-serif text-4xl md:text-5xl lg:text-6xl mb-6 text-[#1A1A1A] tracking-tight ${
            isRtl ? 'text-right' : 'text-left'
          }`}>
            {isRtl ? 'هل لديك أسئلة؟ نحن هنا لمساعدتك في العثور على منزلك المثالي.' : 'Have questions? We\'re here to help you find your perfect stay.'}
          </h2>
        </div>

        {/* Map Section */}
        <div className="w-full mb-20">
          <div className="relative border border-gold/20 overflow-hidden min-h-[500px] md:min-h-[600px] rounded-lg hover:border-gold/40 hover:shadow-xl transition-all duration-300 group">
            <iframe
              src="https://maps.google.com/maps?q=24.811751313610728,46.739127321218575&t=&z=16&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0, filter: 'grayscale(100%) contrast(1.1)' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0"
            />
          </div>
        </div>

        {/* Points of Interest Section */}
        <PointsOfInterest />
      </div>
    </section>
  );
}
