'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { Wifi, Car, Tv, Utensils, Sparkles, Wind, Sofa, Shirt, Table2, Lock, PawPrint, Laptop, Zap } from 'lucide-react';

// Amenities matching our database - using high-quality amenity-specific images
const amenities = [
  {
    key: 'ac',
    icon: Wind,
    title: { en: 'Air Conditioning', ar: 'تكييف هواء' },
    description: { en: 'Climate control for your comfort', ar: 'تحكم بالمناخ لراحتك' },
    image: '/amenities/AC.jpg'
  },
  {
    key: 'kitchen',
    icon: Utensils,
    title: { en: 'Fully Equipped Kitchen', ar: 'مطبخ مجهز بالكامل' },
    description: { en: 'Everything you need to cook at home', ar: 'كل ما تحتاجه للطبخ في المنزل' },
    image: '/amenities/cooker.jpg'
  },
  {
    key: 'microwave',
    icon: Utensils,
    title: { en: 'Microwave Oven', ar: 'فرن ميكروويف' },
    description: { en: 'Convenient cooking appliance', ar: 'جهاز طبخ مريح' },
    image: '/amenities/Maicrwave.jpg'
  },
  {
    key: 'refrigerator',
    icon: Sparkles,
    title: { en: 'Refrigerator', ar: 'ثلاجة' },
    description: { en: 'Keep your food fresh and cool', ar: 'احتفظ بطعامك طازجًا وباردًا' },
    image: '/amenities/refrigerator.jpg'
  },
  {
    key: 'kettle',
    icon: Utensils,
    title: { en: 'Electric Kettle', ar: 'غلاية كهربائية' },
    description: { en: 'Quick hot water for tea and coffee', ar: 'ماء ساخن سريع للشاي والقهوة' },
    image: '/amenities/kettle.jpg'
  },
  {
    key: 'washer',
    icon: Sparkles,
    title: { en: 'Washing Machine', ar: 'غسالة ملابس' },
    description: { en: 'In-unit washer for convenience', ar: 'غسالة داخل الوحدة لراحتك' },
    image: '/amenities/Laundry.jpg'
  },
  {
    key: 'dryer',
    icon: Zap,
    title: { en: 'Hair Dryer', ar: 'مجفف الشعر' },
    description: { en: 'Professional hair dryer for your convenience', ar: 'مجفف شعر احترافي لراحتك' },
    image: '/amenities/Drayer.jpg'
  },
  {
    key: 'sofa_bed',
    icon: Sofa,
    title: { en: 'Sofa Bed', ar: 'أريكة سرير' },
    description: { en: 'Converts to comfortable second bed', ar: 'تتحول إلى سرير ثانٍ مريح' },
    image: '/amenities/Sofa.jpg'
  },
  {
    key: 'iron',
    icon: Shirt,
    title: { en: 'Iron', ar: 'مكواة' },
    description: { en: 'Professional iron and ironing board', ar: 'مكواة واحترافية وطاولة كي' },
    image: '/amenities/Iron.jpg'
  },
  {
    key: 'storage',
    icon: Lock,
    title: { en: 'Door Lock for Safety', ar: 'قفل الباب للأمان' },
    description: { en: 'Secure door lock for your safety and security', ar: 'قفل باب آمن لسلامتك وأمانك' },
    image: '/amenities/Locker.jpg'
  },
  {
    key: 'first_aid',
    icon: Sparkles,
    title: { en: 'First Aid Kit', ar: 'صندوق الإسعافات الأولية' },
    description: { en: 'Health and safety essentials', ar: 'مستلزمات الصحة والسلامة' },
    image: '/amenities/FirstAid.jpg'
  },
  {
    key: 'extras',
    icon: Sparkles,
    title: { en: 'Extra Amenities', ar: 'مزايا إضافية' },
    description: { en: 'Premium features and extras', ar: 'ميزات وإضافات متميزة' },
    image: '/amenities/ExtraAminities.jpg'
  },
];

// Amenity Card Component
function AmenityCard({
  amenity,
  isRtl,
  index,
}: {
  amenity: (typeof amenities)[0];
  isRtl: boolean;
  index: number;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const { key, icon: Icon, title, description, image } = amenity;

  return (
    <div
      key={key}
      className={`animate-fade-in-up opacity-0 group text-center p-6 rounded-xl transition-all duration-300 hover:bg-white hover:shadow-lg hover:shadow-gold/10 hover:-translate-y-2 cursor-default relative`}
      style={{ animationDelay: `${index * 100}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Icon Box with Gold Tint */}
      <div className="flex justify-center mb-6">
        <div
          className="w-20 h-20 flex items-center justify-center transition-all duration-300 rounded-lg group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-gold/20"
          style={{ backgroundColor: 'rgba(212, 175, 55, 0.08)' }}
        >
          <Icon className="w-8 h-8 text-[#D4AF37] transition-transform duration-300 group-hover:scale-110" />
        </div>
      </div>

      {/* Card Content */}
      <h3 className="text-xl md:text-2xl font-medium text-[#1a1a1a] mb-3 transition-colors duration-300 group-hover:text-gold">
        {isRtl ? title.ar : title.en}
      </h3>
      <p className="text-[#5A5A5A] text-base leading-relaxed">
        {isRtl ? description.ar : description.en}
      </p>

      {/* Hover Image Tooltip */}
      <div
        className={`absolute z-50 w-56 rounded-xl shadow-2xl overflow-hidden pointer-events-none transition-all duration-300 ease-out left-1/2 -translate-x-1/2 bottom-full mb-3 ${
          isHovered
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-2 scale-95'
        }`}
      >
        <div className="relative aspect-[4/3] bg-cream-dark">
          <Image
            src={image}
            alt={isRtl ? title.ar : title.en}
            fill
            className="object-cover"
            sizes="224px"
          />
        </div>
      </div>
    </div>
  );
}

export function Amenities() {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  return (
    <section id="amenities" className="py-24 bg-[#FAF7F2] relative overflow-hidden">
      {/* Geometric pattern overlay */}
      <div className="geometric-pattern-gold" />
      <div className="w-full px-[3%] relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-16 h-px bg-gradient-to-r from-transparent to-gold" />
            <span className="text-gold text-sm font-semibold tracking-[0.25em] uppercase">
              {isRtl ? 'المرافق' : 'Amenities'}
            </span>
            <div className="w-16 h-px bg-gradient-to-l from-transparent to-gold" />
          </div>
          <h2 className="heading-serif text-5xl md:text-6xl lg:text-7xl mb-6 text-[#1a1a1a]">
            {isRtl ? 'وسائل الراحة الفاخرة' : 'Premium Amenities'}
          </h2>
          <p className="text-xl md:text-2xl text-[#5A5A5A] max-w-3xl mx-auto font-light leading-relaxed">
            {isRtl ? 'جميع استوديوهاتنا مجهزة بالكامل بكل ما تحتاجه' : 'All our studios come fully equipped with everything you need'}
          </p>
        </div>

        {/* Amenities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {amenities.map((amenity, index) => (
            <AmenityCard key={amenity.key} amenity={amenity} isRtl={isRtl} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
