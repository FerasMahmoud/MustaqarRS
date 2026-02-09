'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Wifi,
  Wind,
  Tv,
  UtensilsCrossed,
  Car,
  Sparkles,
  PawPrint,
  Flame,
  Laptop,
  ShieldCheck,
  Lock,
  Cigarette,
  Bath,
  Shirt,
  Sofa,
  Table2,
} from 'lucide-react';

// Amenity data with actual room images
export const amenityData: Record<string, {
  icon: React.ElementType;
  label: string;
  labelAr: string;
  image: string;
  description: string;
  descriptionAr: string;
}> = {
  wifi: {
    icon: Wifi,
    label: 'High-Speed WiFi',
    labelAr: 'واي فاي سريع',
    image: '/amenities/Wifi.jpg',
    description: 'Fast and reliable internet connection throughout the studio',
    descriptionAr: 'اتصال إنترنت سريع وموثوق في جميع أنحاء الاستوديو'
  },
  ac: {
    icon: Wind,
    label: 'Air Conditioning',
    labelAr: 'تكييف',
    image: '/amenities/AC.jpg',
    description: 'Modern split AC system for perfect temperature control',
    descriptionAr: 'نظام تكييف سبليت حديث للتحكم المثالي في درجة الحرارة'
  },
  kitchen: {
    icon: UtensilsCrossed,
    label: 'Full Kitchen',
    labelAr: 'مطبخ كامل',
    image: '/amenities/cooker.jpg',
    description: 'Fully equipped kitchen with fridge, stove, microwave and utensils',
    descriptionAr: 'مطبخ مجهز بالكامل مع ثلاجة وموقد وميكروويف وأدوات'
  },
  tv: {
    icon: Tv,
    label: 'Samsung TV',
    labelAr: 'تلفاز سامسونج',
    image: '/amenities/Tv.jpg',
    description: 'Smart Samsung TV with Netflix and streaming apps',
    descriptionAr: 'تلفاز سامسونج ذكي مع نتفليكس وتطبيقات البث'
  },
  parking: {
    icon: Car,
    label: 'Free Parking',
    labelAr: 'موقف مجاني',
    image: '/amenities/Parking.jpg',
    description: 'Dedicated parking space included with your stay',
    descriptionAr: 'موقف سيارات مخصص مشمول مع إقامتك'
  },
  washer: {
    icon: Sparkles,
    label: 'Washer',
    labelAr: 'غسالة',
    image: '/amenities/Laundry.jpg',
    description: 'In-unit washer and dryer for your convenience',
    descriptionAr: 'غسالة ومجفف داخل الوحدة لراحتك'
  },
  pets: {
    icon: PawPrint,
    label: 'Pets Allowed',
    labelAr: 'حيوانات مسموح',
    image: '/amenities/Pets.jpg',
    description: 'Pet-friendly accommodation for your furry friends',
    descriptionAr: 'إقامة صديقة للحيوانات الأليفة لأصدقائك ذوي الفراء'
  },
  heating: {
    icon: Flame,
    label: 'Heating',
    labelAr: 'تدفئة',
    image: '/amenities/Heating.jpg',
    description: 'Central heating system for cold winter days',
    descriptionAr: 'نظام تدفئة مركزي لأيام الشتاء الباردة'
  },
  workspace: {
    icon: Laptop,
    label: 'Dedicated Workspace',
    labelAr: 'مكتب عمل',
    image: '/room-images/comfort-studio/02-entertainment-workspace.jpg',
    description: 'Comfortable desk and ergonomic chair for remote work',
    descriptionAr: 'مكتب مريح وكرسي مريح للعمل عن بعد'
  },
  security: {
    icon: ShieldCheck,
    label: 'Security System',
    labelAr: 'نظام أمان',
    image: '/amenities/Security.jpg',
    description: '24/7 security monitoring and secure building access',
    descriptionAr: 'مراقبة أمنية على مدار الساعة ودخول آمن للمبنى'
  },
  smart_lock: {
    icon: Lock,
    label: 'Self Check-in',
    labelAr: 'دخول ذاتي',
    image: '/amenities/SmartLock.jpg',
    description: 'Smart lock with keypad for easy self check-in',
    descriptionAr: 'قفل ذكي مع لوحة مفاتيح لتسجيل الدخول الذاتي السهل'
  },
  smoking: {
    icon: Cigarette,
    label: 'Smoking Allowed',
    labelAr: 'تدخين مسموح',
    image: '/amenities/Smoking.jpg',
    description: 'Designated smoking area available on balcony',
    descriptionAr: 'منطقة تدخين مخصصة متاحة على الشرفة'
  },
  hair_dryer: {
    icon: Bath,
    label: 'Hair Dryer',
    labelAr: 'مجفف الشعر',
    image: '/amenities/Drayer.jpg',
    description: 'Professional hair dryer for your convenience',
    descriptionAr: 'مجفف شعر احترافي لراحتك'
  },
  iron: {
    icon: Shirt,
    label: 'Iron',
    labelAr: 'مكواة',
    image: '/amenities/Iron.jpg',
    description: 'Professional iron and ironing board available',
    descriptionAr: 'مكواة واحترافية وطاولة كي متاحة'
  },
  sofa_bed: {
    icon: Sofa,
    label: 'Sofa Bed',
    labelAr: 'أريكة سرير',
    image: '/amenities/Sofa.jpg',
    description: 'Comfortable sofa that converts to a bed for extra guests',
    descriptionAr: 'أريكة مريحة تتحول إلى سرير للضيوف الإضافيين'
  },
  dining_table: {
    icon: Table2,
    label: 'Dining Table',
    labelAr: 'طاولة طعام',
    image: '/room-images/comfort-studio/02-entertainment-workspace.jpg',
    description: 'Dining table with seating for comfortable meals',
    descriptionAr: 'طاولة طعام مع مقاعد لوجبات مريحة'
  },
};

// Amenity Item with Hover Tooltip
export function AmenityItem({
  amenityKey,
  isRtl,
}: {
  amenityKey: string;
  isRtl: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const data = amenityData[amenityKey];
  if (!data) return null;

  const Icon = data.icon;

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Amenity Button */}
      <div
        className="flex items-center gap-3 text-charcoal w-full text-left hover:bg-gold/5 p-2 -m-2 rounded-lg transition-all duration-300 group cursor-pointer"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center group-hover:bg-gold/20 group-hover:scale-110 transition-all duration-300">
          <Icon className="w-4 h-4 text-gold" />
        </div>
        <span className="text-sm group-hover:text-gold transition-colors duration-300">
          {isRtl ? data.labelAr : data.label}
        </span>
      </div>

      {/* Hover Tooltip - Image Only */}
      <div
        className={`absolute z-50 w-56 rounded-xl shadow-2xl overflow-hidden pointer-events-none transition-all duration-300 ease-out ${
          isRtl ? 'right-0' : 'left-0'
        } bottom-full mb-3 ${
          isHovered
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-2 scale-95'
        }`}
      >
        <div className="relative aspect-[4/3] bg-cream-dark">
          <Image
            src={data.image}
            alt={isRtl ? data.labelAr : data.label}
            fill
            className="object-cover"
            sizes="224px"
          />
        </div>
      </div>
    </div>
  );
}

// Amenities Grid
export function AmenitiesGrid({
  amenities,
  isRtl,
}: {
  amenities: string[];
  isRtl: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {amenities.map((amenity) => (
        <AmenityItem
          key={amenity}
          amenityKey={amenity}
          isRtl={isRtl}
        />
      ))}
    </div>
  );
}
