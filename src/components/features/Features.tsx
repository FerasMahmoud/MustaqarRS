'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Star, Users, MapPin, Clock, Sparkles, Shield, Wifi, Car } from 'lucide-react';
import { scrollToSection } from '@/lib/utils';
import Image from 'next/image';

export function Features() {
  const t = useTranslations('features');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  return (
    <section id="features" className="py-20 md:py-32 bg-gradient-to-b from-[#FAF7F2] via-[#F5F0E8] to-[#FAF7F2] relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-gold/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold/3 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-3 mb-6">
            <Sparkles className="w-5 h-5 text-gold" />
            <span className="text-gold text-sm font-semibold tracking-[0.3em] uppercase">
              {isRtl ? 'لماذا نحن' : 'Why Choose Us'}
            </span>
            <Sparkles className="w-5 h-5 text-gold" />
          </div>
          <h2 className="heading-serif text-4xl md:text-5xl lg:text-6xl text-[#1A1A1A] mb-4">
            {t('title')}
          </h2>
          <p className="text-[#6B6B6B] text-lg max-w-2xl mx-auto">
            {t('description')}
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-12 gap-4 md:gap-6 max-w-7xl mx-auto">

          {/* Card 1 - Premium Amenities (Large - spans 7 cols) */}
          <div className={`col-span-12 lg:col-span-7 relative group ${isRtl ? 'lg:order-2' : ''}`}>
            <div className="relative h-[400px] rounded-3xl overflow-hidden">
              {/* Background Image */}
              <Image
                src="/room-images/mustaqar-suite/01-master-bedroom.webp"
                alt="Luxury Interior"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

              {/* Content */}
              <div className={`absolute bottom-0 left-0 right-0 p-8 ${isRtl ? 'text-right' : 'text-left'}`}>
                <div className={`flex items-center gap-3 mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div className="w-14 h-14 rounded-2xl bg-gold/90 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-gold/30">
                    <Star className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <span className="text-gold text-lg font-bold tracking-widest uppercase">01</span>
                    <h3 className="text-white text-2xl md:text-3xl font-semibold">
                      {t('items.premium.title')}
                    </h3>
                  </div>
                </div>
                <p className="text-white/80 text-base mb-4 max-w-md">
                  {t('items.premium.description')}
                </p>
                <div className={`flex flex-wrap gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  {['Egyptian Cotton', 'Smart Home', 'Luxury Bedding'].map((tag, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-white text-xs font-medium border border-white/20">
                      {isRtl ? ['قطن مصري', 'منزل ذكي', 'فراش فاخر'][i] : tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Floating Badge */}
              <div className={`absolute top-6 ${isRtl ? 'left-6' : 'right-6'}`}>
                <div className="px-4 py-2 rounded-full bg-gold text-white text-sm font-bold shadow-lg shadow-gold/30 flex items-center gap-2">
                  <Star className="w-4 h-4 fill-white" />
                  {isRtl ? 'الأكثر طلباً' : 'Most Popular'}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 - Concierge (Medium - spans 5 cols) */}
          <div className={`col-span-12 lg:col-span-5 ${isRtl ? 'lg:order-1' : ''}`}>
            <div className="h-[400px] rounded-3xl bg-gradient-to-br from-[#1A1A1A] to-[#2D2D2D] p-8 relative overflow-hidden group">
              {/* Decorative circle */}
              <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gold/10 blur-2xl group-hover:bg-gold/20 transition-all duration-500" />

              {/* Large Number */}
              <span className={`absolute top-6 ${isRtl ? 'left-6' : 'right-6'} text-[120px] font-bold text-white/5 leading-none`}>
                02
              </span>

              <div className={`relative z-10 h-full flex flex-col ${isRtl ? 'text-right items-end' : ''}`}>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold to-gold/70 flex items-center justify-center mb-6 shadow-lg shadow-gold/30 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-white text-2xl md:text-3xl font-semibold mb-3">
                  {t('items.concierge.title')}
                </h3>
                <p className="text-white/60 text-base mb-6 flex-1">
                  {t('items.concierge.description')}
                </p>

                <div className="space-y-3">
                  {[
                    {
                      icon: (
                        <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="9" strokeWidth="1.5"/>
                          <path d="M12 6v6l4 2" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      ),
                      text: isRtl ? 'متوفر 24/7' : 'Available 24/7'
                    },
                    {
                      icon: (
                        <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
                          <path d="M12 2L2 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" strokeWidth="1.5"/>
                        </svg>
                      ),
                      text: isRtl ? 'خدمة الصيانة' : 'Maintenance Service'
                    },
                    {
                      icon: (
                        <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ),
                      text: isRtl ? 'دعم الضيوف' : 'Guest Support'
                    },
                  ].map((item, i) => (
                    <div key={i} className={`flex items-center gap-3 text-white/80 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-gold">
                        {item.icon}
                      </div>
                      <span className="text-sm">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3 - Location (Medium - spans 5 cols) */}
          <div className={`col-span-12 lg:col-span-5 ${isRtl ? 'lg:order-4' : ''}`}>
            <div className="h-[320px] rounded-3xl relative overflow-hidden group">
              {/* Glass background */}
              <div className="absolute inset-0 bg-white/70 backdrop-blur-xl border border-white/50 shadow-xl" />

              {/* Map pattern overlay */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A96E' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }} />
              </div>

              <div className={`relative z-10 h-full p-8 flex flex-col ${isRtl ? 'text-right items-end' : ''}`}>
                <div className={`flex items-start justify-between w-full mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold to-gold/70 flex items-center justify-center shadow-lg shadow-gold/30 group-hover:scale-110 transition-transform duration-300">
                    <MapPin className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-[80px] font-bold text-gold/10 leading-none">03</span>
                </div>

                <h3 className="text-[#1A1A1A] text-2xl font-semibold mb-2">
                  {t('items.location.title')}
                </h3>
                <p className="text-[#6B6B6B] text-sm mb-4 flex-1">
                  {t('items.location.description')}
                </p>

                {/* Location tags */}
                <div className={`flex flex-wrap gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  {[
                    {
                      icon: (
                        <svg className="w-5 h-5 fill-current text-gold" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
                        </svg>
                      ),
                      text: isRtl ? 'وسط المدينة' : 'City Center'
                    },
                    {
                      icon: (
                        <svg className="w-5 h-5 fill-current text-gold" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      ),
                      text: isRtl ? 'قرب المترو' : 'Near Metro'
                    },
                    {
                      icon: (
                        <svg className="w-5 h-5 fill-current text-gold" viewBox="0 0 24 24">
                          <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-0.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l0.03-.12 0.9-1.63h7.45c0.75 0 1.41-.41 1.75-1.03l3.58-6.49c0.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s0.89 2 1.99 2 2-0.9 2-2-0.9-2-2-2z"/>
                        </svg>
                      ),
                      text: isRtl ? 'التسوق' : 'Shopping'
                    },
                  ].map((tag, i) => (
                    <span key={i} className="px-4 py-2.5 rounded-xl bg-white border-2 border-[#E8E3DB] text-[#1A1A1A] text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg hover:border-gold hover:bg-gold/5 transition-all cursor-default">
                      {tag.icon}
                      {tag.text}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 4 - Flexible Booking (Large - spans 7 cols) */}
          <div className={`col-span-12 lg:col-span-7 ${isRtl ? 'lg:order-3' : ''}`}>
            <div className="h-[320px] rounded-3xl bg-gradient-to-r from-gold via-[#D4B87A] to-gold p-8 relative overflow-hidden group">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute bottom-0 left-0 w-60 h-60 bg-black/10 rounded-full blur-3xl" />

              {/* Large Number */}
              <span className={`absolute bottom-4 ${isRtl ? 'left-8' : 'right-8'} text-[150px] font-bold text-white/10 leading-none`}>
                04
              </span>

              <div className={`relative z-10 h-full flex flex-col ${isRtl ? 'text-right' : ''}`}>
                <div className={`flex items-center gap-4 mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white text-2xl md:text-3xl font-semibold">
                      {t('items.flexible.title')}
                    </h3>
                    <p className="text-white/70 text-sm">
                      {t('items.flexible.description')}
                    </p>
                  </div>
                </div>

                {/* Feature pills */}
                <div className={`grid grid-cols-3 gap-2 sm:gap-4 mt-auto ${isRtl ? 'direction-rtl' : ''}`}>
                  {[
                    {
                      icon: (
                        <svg className="w-5 h-5 sm:w-8 sm:h-8 fill-none stroke-current text-white" viewBox="0 0 24 24">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                          <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2"/>
                        </svg>
                      ),
                      title: isRtl ? 'مواعيد مرنة' : 'Flexible Dates',
                      desc: isRtl ? 'دخول/خروج مرن' : 'Flexible check-in/out'
                    },
                    {
                      icon: (
                        <svg className="w-5 h-5 sm:w-8 sm:h-8 fill-none stroke-current text-white" viewBox="0 0 24 24">
                          <rect x="1" y="4" width="22" height="16" rx="2" ry="2" strokeWidth="2"/>
                          <path d="M1 10h22" strokeWidth="2"/>
                        </svg>
                      ),
                      title: isRtl ? 'دفع سهل' : 'Easy Payment',
                      desc: isRtl ? 'خيارات دفع متعددة' : 'Multiple payment options'
                    },
                    {
                      icon: (
                        <svg className="w-5 h-5 sm:w-8 sm:h-8 fill-none stroke-current text-white" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      ),
                      title: isRtl ? 'بدون تعقيد' : 'No Hassle',
                      desc: isRtl ? 'إلغاء سهل' : 'Easy cancellation'
                    },
                  ].map((item, i) => (
                    <div key={i} className="p-2.5 sm:p-5 rounded-xl sm:rounded-2xl bg-white/25 backdrop-blur-sm border-2 border-white/50 hover:bg-white/35 hover:border-white/70 transition-all shadow-lg">
                      <div className="mb-1.5 sm:mb-3 block">{item.icon}</div>
                      <h4 className="text-white font-bold text-xs sm:text-base mb-0.5 sm:mb-1">{item.title}</h4>
                      <p className="text-white/90 text-[10px] sm:text-sm leading-tight">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <button
            onClick={() => scrollToSection('rooms')}
            className="group relative px-10 py-5 bg-[#1A1A1A] text-white rounded-2xl font-semibold text-lg overflow-hidden transition-all hover:shadow-2xl hover:shadow-black/20"
          >
            <span className="relative z-10 flex items-center gap-3">
              {t('cta')}
              <span className={`transition-transform group-hover:translate-x-2 ${isRtl ? 'rotate-180 group-hover:-translate-x-2' : ''}`}>
                →
              </span>
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-gold to-gold/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </div>
      </div>
    </section>
  );
}
