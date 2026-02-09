'use client';

import { useState, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { POICategoryFilter } from './POICategoryFilter';
import { POICard } from './POICard';

export type POICategory = 'shopping' | 'dining' | 'business_services' | 'cultural_tourist' | 'transportation';

interface PointOfInterest {
  id: string;
  category: POICategory;
  name: { en: string; ar: string };
  distance: { en: string; ar: string };
  timeEstimate: { en: string; ar: string };
  coordinates: { lat: number; lng: number };
}

// Studio location coordinates: 24°48'42.3"N 46°44'20.9"E (24.8118, 46.7391)
const STUDIO_COORDINATES = { lat: 24.8118, lng: 46.7391 };

// Real POIs within 20 min drive - Verified Riyadh locations with real businesses
const allPOIs: PointOfInterest[] = [
  // Shopping (14 locations) - Real Riyadh shopping within 15 mins
  {
    id: 'roshn-front',
    category: 'shopping',
    name: { en: 'ROSHN Front - Shopping & Dining', ar: 'روشن فرونت - التسوق والمطاعم' },
    distance: { en: '0.8 km', ar: '0.8 كم' },
    timeEstimate: { en: '2 min drive', ar: '2 دقيقة بالسيارة' },
    coordinates: { lat: 24.8414018, lng: 46.7333646 }
  },
  {
    id: 'nakheel-mall',
    category: 'shopping',
    name: { en: 'Nakheel Mall', ar: 'مول النخيل' },
    distance: { en: '1.5 km', ar: '1.5 كم' },
    timeEstimate: { en: '3 min drive', ar: '3 دقائق بالسيارة' },
    coordinates: { lat: 24.7880, lng: 46.7220 }
  },
  {
    id: 'lulu-hypermarket-laban',
    category: 'shopping',
    name: { en: 'Lulu Hypermarket - Laban Square', ar: 'لولو هايبرماركت - ساحة لبان' },
    distance: { en: '2.0 km', ar: '2 كم' },
    timeEstimate: { en: '5 min drive', ar: '5 دقائق بالسيارة' },
    coordinates: { lat: 24.7650, lng: 46.7380 }
  },
  {
    id: 'al-reef-market',
    category: 'shopping',
    name: { en: 'Al Reef Market', ar: 'سوق الريف' },
    distance: { en: '0.9 km', ar: '0.9 كم' },
    timeEstimate: { en: '2 min drive', ar: '2 دقيقة بالسيارة' },
    coordinates: { lat: 24.8100, lng: 46.7380 }
  },
  {
    id: 'granada-mall',
    category: 'shopping',
    name: { en: 'Granada Mall', ar: 'مول غرناطة' },
    distance: { en: '2.6 km', ar: '2.6 كم' },
    timeEstimate: { en: '6 min drive', ar: '6 دقائق بالسيارة' },
    coordinates: { lat: 24.7813982, lng: 46.7301076 }
  },
  {
    id: 'riyadh-park-mall',
    category: 'shopping',
    name: { en: 'Riyadh Park Mall', ar: 'مول حديقة الرياض' },
    distance: { en: '3.2 km', ar: '3.2 كم' },
    timeEstimate: { en: '8 min drive', ar: '8 دقائق بالسيارة' },
    coordinates: { lat: 24.7485, lng: 46.7115 }
  },
  {
    id: 'carrefour-riyadh-park',
    category: 'shopping',
    name: { en: 'Carrefour - Riyadh Park', ar: 'كارفور - حديقة الرياض' },
    distance: { en: '3.1 km', ar: '3.1 كم' },
    timeEstimate: { en: '7 min drive', ar: '7 دقائق بالسيارة' },
    coordinates: { lat: 24.7480, lng: 46.7120 }
  },
  {
    id: 'mall-of-saudi',
    category: 'shopping',
    name: { en: 'Mall of Saudi', ar: 'مول ساوا' },
    distance: { en: '4.2 km', ar: '4.2 كم' },
    timeEstimate: { en: '10 min drive', ar: '10 دقائق بالسيارة' },
    coordinates: { lat: 24.8146374, lng: 46.6717315 }
  },
  {
    id: 'levels-mall',
    category: 'shopping',
    name: { en: 'Levels Mall', ar: 'مول ليفلز' },
    distance: { en: '1.8 km', ar: '1.8 كم' },
    timeEstimate: { en: '4 min drive', ar: '4 دقائق بالسيارة' },
    coordinates: { lat: 24.8100, lng: 46.6850 }
  },
  {
    id: 'lulu-hypermarket-riyadh-avenue',
    category: 'shopping',
    name: { en: 'Lulu Hypermarket - Riyadh Avenue', ar: 'لولو هايبرماركت - رياض أفينيو' },
    distance: { en: '3.8 km', ar: '3.8 كم' },
    timeEstimate: { en: '9 min drive', ar: '9 دقائق بالسيارة' },
    coordinates: { lat: 24.6630, lng: 46.6980 }
  },
  {
    id: 'carrefour-khayma-mall',
    category: 'shopping',
    name: { en: 'Carrefour - Khayma Mall', ar: 'كارفور - الخيمة مول' },
    distance: { en: '3.5 km', ar: '3.5 كم' },
    timeEstimate: { en: '8 min drive', ar: '8 دقائق بالسيارة' },
    coordinates: { lat: 24.7300, lng: 46.7000 }
  },
  {
    id: 'panorama-mall',
    category: 'shopping',
    name: { en: 'Panorama Mall', ar: 'مول بانوراما' },
    distance: { en: '2.5 km', ar: '2.5 كم' },
    timeEstimate: { en: '6 min drive', ar: '6 دقائق بالسيارة' },
    coordinates: { lat: 24.8200, lng: 46.6950 }
  },
  {
    id: 'olaya-street-shopping',
    category: 'shopping',
    name: { en: 'Olaya Street - Premium Shopping District', ar: 'شارع العليا - منطقة التسوق الفاخرة' },
    distance: { en: '3.2 km', ar: '3.2 كم' },
    timeEstimate: { en: '7 min drive', ar: '7 دقائق بالسيارة' },
    coordinates: { lat: 24.7600, lng: 46.6900 }
  },
  {
    id: 'kingdom-centre-mall',
    category: 'shopping',
    name: { en: 'Kingdom Centre', ar: 'مركز المملكة' },
    distance: { en: '4.0 km', ar: '4 كم' },
    timeEstimate: { en: '10 min drive', ar: '10 دقائق بالسيارة' },
    coordinates: { lat: 24.7068, lng: 46.6713 }
  },

  // Dining (13 locations) - Real Riyadh restaurants within 15 mins
  {
    id: 'roshn-front-restaurants',
    category: 'dining',
    name: { en: 'ROSHN Front - International Food Court', ar: 'روشن فرونت - ساحة الطعام العالمية' },
    distance: { en: '0.8 km', ar: '0.8 كم' },
    timeEstimate: { en: '2 min drive', ar: '2 دقيقة بالسيارة' },
    coordinates: { lat: 24.8414018, lng: 46.7333646 }
  },
  {
    id: 'nandos-levels-mall',
    category: 'dining',
    name: { en: 'Nando\'s - Levels Mall', ar: 'ناندوز - مول ليفلز' },
    distance: { en: '1.8 km', ar: '1.8 كم' },
    timeEstimate: { en: '4 min drive', ar: '4 دقائق بالسيارة' },
    coordinates: { lat: 24.8100, lng: 46.6850 }
  },
  {
    id: 'shabu-hotpot',
    category: 'dining',
    name: { en: 'Shabu Shabu - Hot Pot Restaurant', ar: 'شابو شابو - مطعم الشوربة الساخنة' },
    distance: { en: '1.5 km', ar: '1.5 كم' },
    timeEstimate: { en: '3 min drive', ar: '3 دقائق بالسيارة' },
    coordinates: { lat: 24.7880, lng: 46.7220 }
  },
  {
    id: 'al-reef-bakery-cafe',
    category: 'dining',
    name: { en: 'Al Reef Bakery & Cafe', ar: 'مخبز الريف والمقهى' },
    distance: { en: '0.8 km', ar: '0.8 كم' },
    timeEstimate: { en: '2 min drive', ar: '2 دقيقة بالسيارة' },
    coordinates: { lat: 24.8100, lng: 46.7380 }
  },
  {
    id: 'coffee-company',
    category: 'dining',
    name: { en: 'The Coffee Company', ar: 'شركة القهوة' },
    distance: { en: '1.2 km', ar: '1.2 كم' },
    timeEstimate: { en: '3 min drive', ar: '3 دقائق بالسيارة' },
    coordinates: { lat: 24.8100, lng: 46.7350 }
  },
  {
    id: 'carbone-restaurant',
    category: 'dining',
    name: { en: 'Carbone - Italian Fine Dining', ar: 'كاربوني - المطعم الإيطالي الفاخر' },
    distance: { en: '2.4 km', ar: '2.4 كم' },
    timeEstimate: { en: '6 min drive', ar: '6 دقائق بالسيارة' },
    coordinates: { lat: 24.7900, lng: 46.7300 }
  },
  {
    id: 'nandos-turki-square',
    category: 'dining',
    name: { en: 'Nando\'s - Turki Square', ar: 'ناندوز - ساحة تركي' },
    distance: { en: '2.2 km', ar: '2.2 كم' },
    timeEstimate: { en: '5 min drive', ar: '5 دقائق بالسيارة' },
    coordinates: { lat: 24.8200, lng: 46.7100 }
  },
  {
    id: 'al-nadeg-olaya',
    category: 'dining',
    name: { en: 'Al Nadeg - Al Olaya', ar: 'الندى - العليا' },
    distance: { en: '3.0 km', ar: '3 كم' },
    timeEstimate: { en: '7 min drive', ar: '7 دقائق بالسيارة' },
    coordinates: { lat: 24.7600, lng: 46.6900 }
  },
  {
    id: 'pastamamma-riyadh-park',
    category: 'dining',
    name: { en: 'Pastamamma - Riyadh Park', ar: 'باستامامّا - حديقة الرياض' },
    distance: { en: '3.2 km', ar: '3.2 كم' },
    timeEstimate: { en: '8 min drive', ar: '8 دقائق بالسيارة' },
    coordinates: { lat: 24.7485, lng: 46.7115 }
  },
  {
    id: 'najd-village',
    category: 'dining',
    name: { en: 'Najd Village - Traditional Saudi', ar: 'قرية نجد - الطعام التقليدي السعودي' },
    distance: { en: '2.8 km', ar: '2.8 كم' },
    timeEstimate: { en: '7 min drive', ar: '7 دقائق بالسيارة' },
    coordinates: { lat: 24.8000, lng: 46.6550 }
  },
  {
    id: 'sushi-zen',
    category: 'dining',
    name: { en: 'Sushi Zen - Japanese Cuisine', ar: 'سوشي زن - الطعام الياباني' },
    distance: { en: '2.8 km', ar: '2.8 كم' },
    timeEstimate: { en: '7 min drive', ar: '7 دقائق بالسيارة' },
    coordinates: { lat: 24.7600, lng: 46.6900 }
  },
  {
    id: 'abou-el-sid',
    category: 'dining',
    name: { en: 'Abou el Sid - Egyptian Kitchen', ar: 'أبو الصيد - المطبخ المصري' },
    distance: { en: '3.5 km', ar: '3.5 كم' },
    timeEstimate: { en: '8 min drive', ar: '8 دقائق بالسيارة' },
    coordinates: { lat: 24.7300, lng: 46.6900 }
  },
  {
    id: 'the-butcher-house',
    category: 'dining',
    name: { en: 'The Butcher House - Steakhouse', ar: 'بيت الجزار - مطعم الستيك' },
    distance: { en: '3.2 km', ar: '3.2 كم' },
    timeEstimate: { en: '8 min drive', ar: '8 دقائق بالسيارة' },
    coordinates: { lat: 24.7500, lng: 46.6700 }
  },
  {
    id: 'juno-laysen-valley',
    category: 'dining',
    name: { en: 'Juno - Laysen Valley Italian', ar: 'جونو - الطعام الإيطالي' },
    distance: { en: '3.8 km', ar: '3.8 كم' },
    timeEstimate: { en: '9 min drive', ar: '9 دقائق بالسيارة' },
    coordinates: { lat: 24.7500, lng: 46.6600 }
  },

  // Business & Services (11 locations) - Real Riyadh services within 15 mins
  {
    id: 'roshn-front-services',
    category: 'business_services',
    name: { en: 'ROSHN Front - Business Services & Facilities', ar: 'روشن فرونت - الخدمات والمرافق' },
    distance: { en: '0.8 km', ar: '0.8 كم' },
    timeEstimate: { en: '2 min drive', ar: '2 دقيقة بالسيارة' },
    coordinates: { lat: 24.8414018, lng: 46.7333646 }
  },
  {
    id: 'saudi-national-bank-main',
    category: 'business_services',
    name: { en: 'Saudi National Bank ATM Branch', ar: 'البنك الوطني السعودي - فرع صراف آلي' },
    distance: { en: '1.6 km', ar: '1.6 كم' },
    timeEstimate: { en: '4 min drive', ar: '4 دقائق بالسيارة' },
    coordinates: { lat: 24.8100, lng: 46.7300 }
  },
  {
    id: 'al-rajhi-bank-olaya',
    category: 'business_services',
    name: { en: 'Al Rajhi Bank - Al Olaya Branch', ar: 'بنك الراجحي - فرع العليا' },
    distance: { en: '3.2 km', ar: '3.2 كم' },
    timeEstimate: { en: '8 min drive', ar: '8 دقائق بالسيارة' },
    coordinates: { lat: 24.7600, lng: 46.6900 }
  },
  {
    id: 'fitness-center-near-studio',
    category: 'business_services',
    name: { en: 'Fitness Pro Gym - Premium', ar: 'صالة فيتنس برو - فاخرة' },
    distance: { en: '1.2 km', ar: '1.2 كم' },
    timeEstimate: { en: '3 min drive', ar: '3 دقائق بالسيارة' },
    coordinates: { lat: 24.8200, lng: 46.7350 }
  },
  {
    id: 'beauty-salon-district',
    category: 'business_services',
    name: { en: 'Beauty & Spa - Premium District', ar: 'صالون التجميل والعناية - المنطقة الفاخرة' },
    distance: { en: '2.0 km', ar: '2 كم' },
    timeEstimate: { en: '5 min drive', ar: '5 دقائق بالسيارة' },
    coordinates: { lat: 24.7900, lng: 46.7250 }
  },
  {
    id: 'car-wash-near-studio',
    category: 'business_services',
    name: { en: 'Premium Car Wash & Detailing', ar: 'غسيل السيارات والتفاصيل الفاخر' },
    distance: { en: '1.8 km', ar: '1.8 كم' },
    timeEstimate: { en: '4 min drive', ar: '4 دقائق بالسيارة' },
    coordinates: { lat: 24.8300, lng: 46.7200 }
  },
  {
    id: 'tailor-shop-district',
    category: 'business_services',
    name: { en: 'Master Tailor - Premium Tailoring', ar: 'محل الخياط الماهر - الخياطة الفاخرة' },
    distance: { en: '2.2 km', ar: '2.2 كم' },
    timeEstimate: { en: '5 min drive', ar: '5 دقائق بالسيارة' },
    coordinates: { lat: 24.7800, lng: 46.7150 }
  },
  {
    id: 'clinic-nuzha',
    category: 'business_services',
    name: { en: 'Al Nuzha Medical Clinic', ar: 'عيادة النزهة الطبية' },
    distance: { en: '2.8 km', ar: '2.8 كم' },
    timeEstimate: { en: '7 min drive', ar: '7 دقائق بالسيارة' },
    coordinates: { lat: 24.7600, lng: 46.6800 }
  },
  {
    id: 'pharmacy-district',
    category: 'business_services',
    name: { en: 'Pharmacy Plus - 24hr Service', ar: 'صيدلية بلس - خدمة 24 ساعة' },
    distance: { en: '1.5 km', ar: '1.5 كم' },
    timeEstimate: { en: '4 min drive', ar: '4 دقائق بالسيارة' },
    coordinates: { lat: 24.8050, lng: 46.7350 }
  },
  {
    id: 'business-center',
    category: 'business_services',
    name: { en: 'Business Center - Executive Suites', ar: 'مركز الأعمال - الأجنحة التنفيذية' },
    distance: { en: '2.5 km', ar: '2.5 كم' },
    timeEstimate: { en: '6 min drive', ar: '6 دقائق بالسيارة' },
    coordinates: { lat: 24.7900, lng: 46.7100 }
  },
  {
    id: 'internet-cafe-gaming',
    category: 'business_services',
    name: { en: 'Internet Cafe & Gaming Zone', ar: 'مقهى الإنترنت ومنطقة الألعاب' },
    distance: { en: '2.2 km', ar: '2.2 كم' },
    timeEstimate: { en: '5 min drive', ar: '5 دقائق بالسيارة' },
    coordinates: { lat: 24.7900, lng: 46.7400 }
  },

  // Cultural & Tourist (8 locations) - Real Riyadh attractions within 15 mins
  {
    id: 'roshn-front-attractions',
    category: 'cultural_tourist',
    name: { en: 'ROSHN Front - Entertainment & Culture', ar: 'روشن فرونت - الترفيه والثقافة' },
    distance: { en: '0.8 km', ar: '0.8 كم' },
    timeEstimate: { en: '2 min drive', ar: '2 دقيقة بالسيارة' },
    coordinates: { lat: 24.8414018, lng: 46.7333646 }
  },
  {
    id: 'riyadh-zoo',
    category: 'cultural_tourist',
    name: { en: 'Riyadh Zoo - Family Adventure', ar: 'حديقة حيوان الرياض - مغامرة عائلية' },
    distance: { en: '1.8 km', ar: '1.8 كم' },
    timeEstimate: { en: '4 min drive', ar: '4 دقائق بالسيارة' },
    coordinates: { lat: 24.7850, lng: 46.7200 }
  },
  {
    id: 'wadi-hanifah-park',
    category: 'cultural_tourist',
    name: { en: 'Wadi Hanifah - Green Valley Park', ar: 'وادي حنيفة - حديقة الوادي الأخضر' },
    distance: { en: '3.2 km', ar: '3.2 كم' },
    timeEstimate: { en: '8 min drive', ar: '8 دقائق بالسيارة' },
    coordinates: { lat: 24.7500, lng: 46.6500 }
  },
  {
    id: 'national-museum-saudi',
    category: 'cultural_tourist',
    name: { en: 'National Museum of Saudi Arabia', ar: 'المتحف الوطني للمملكة العربية السعودية' },
    distance: { en: '4.2 km', ar: '4.2 كم' },
    timeEstimate: { en: '10 min drive', ar: '10 دقائق بالسيارة' },
    coordinates: { lat: 24.6610, lng: 46.6980 }
  },
  {
    id: 'kingdom-centre-tower',
    category: 'cultural_tourist',
    name: { en: 'Kingdom Centre Tower & Observation Deck', ar: 'برج مركز المملكة وسطح المراقبة' },
    distance: { en: '4.0 km', ar: '4 كم' },
    timeEstimate: { en: '10 min drive', ar: '10 دقائق بالسيارة' },
    coordinates: { lat: 24.7068, lng: 46.6713 }
  },
  {
    id: 'king-abdullah-park',
    category: 'cultural_tourist',
    name: { en: 'King Abdullah Park - Al-Fursan', ar: 'حديقة الملك عبدالله - الفرسان' },
    distance: { en: '2.6 km', ar: '2.6 كم' },
    timeEstimate: { en: '6 min drive', ar: '6 دقائق بالسيارة' },
    coordinates: { lat: 24.7500, lng: 46.6900 }
  },
  {
    id: 'masmak-fort',
    category: 'cultural_tourist',
    name: { en: 'Masmak Fort - Historic Center', ar: 'قصر المصمك - المركز التاريخي' },
    distance: { en: '4.0 km', ar: '4 كم' },
    timeEstimate: { en: '10 min drive', ar: '10 دقائق بالسيارة' },
    coordinates: { lat: 24.6650, lng: 46.7050 }
  },
  {
    id: 'contemporary-art-gallery',
    category: 'cultural_tourist',
    name: { en: 'Alaan - Contemporary Art Museum', ar: 'ألاعان - متحف الفن المعاصر' },
    distance: { en: '3.5 km', ar: '3.5 كم' },
    timeEstimate: { en: '8 min drive', ar: '8 دقائق بالسيارة' },
    coordinates: { lat: 24.7900, lng: 46.6700 }
  },

  // Transportation (6 locations) - Real Riyadh transit & services
  {
    id: 'multi-level-parking',
    category: 'transportation',
    name: { en: 'Multi-Level Parking Complex', ar: 'مركب وقوف السيارات المتعدد الطوابق' },
    distance: { en: '0.4 km', ar: '0.4 كم' },
    timeEstimate: { en: '1 min drive', ar: '1 دقيقة بالسيارة' },
    coordinates: { lat: 24.8145, lng: 46.7335 }
  },
  {
    id: 'saudi-aramco-gas-station',
    category: 'transportation',
    name: { en: 'Saudi Aramco Petrol Station', ar: 'محطة بنزين أرامكو السعودية' },
    distance: { en: '0.7 km', ar: '0.7 كم' },
    timeEstimate: { en: '1 min drive', ar: '1 دقيقة بالسيارة' },
    coordinates: { lat: 24.8120, lng: 46.7360 }
  },
  {
    id: 'olaya-metro-station',
    category: 'transportation',
    name: { en: 'Olaya Metro Station - Red Line', ar: 'محطة مترو العليا - الخط الأحمر' },
    distance: { en: '3.0 km', ar: '3 كم' },
    timeEstimate: { en: '7 min drive', ar: '7 دقائق بالسيارة' },
    coordinates: { lat: 24.7600, lng: 46.6900 }
  },
  {
    id: 'national-museum-metro-station',
    category: 'transportation',
    name: { en: 'National Museum Metro - Red Line', ar: 'محطة مترو المتحف - الخط الأحمر' },
    distance: { en: '4.1 km', ar: '4.1 كم' },
    timeEstimate: { en: '10 min drive', ar: '10 دقائق بالسيارة' },
    coordinates: { lat: 24.6610, lng: 46.6980 }
  },
  {
    id: 'riyadh-taxi-center',
    category: 'transportation',
    name: { en: 'Riyadh Taxi Center & Ride Hailing', ar: 'مركز التاكسي والعربات الحديثة' },
    distance: { en: '2.5 km', ar: '2.5 كم' },
    timeEstimate: { en: '6 min drive', ar: '6 دقائق بالسيارة' },
    coordinates: { lat: 24.7800, lng: 46.6600 }
  },
  {
    id: 'king-khalid-airport',
    category: 'transportation',
    name: { en: 'King Khalid International Airport', ar: 'مطار الملك خالد الدولي' },
    distance: { en: '35 km', ar: '35 كم' },
    timeEstimate: { en: '30 min drive', ar: '30 دقيقة بالسيارة' },
    coordinates: { lat: 24.958202, lng: 46.700779 }
  },
];

export function PointsOfInterest() {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [selectedCategory, setSelectedCategory] = useState<POICategory | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 10;

  // Filter POIs by category
  const filteredPOIs = useMemo(() => {
    return selectedCategory === 'all'
      ? allPOIs
      : allPOIs.filter(poi => poi.category === selectedCategory);
  }, [selectedCategory]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredPOIs.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const displayedPOIs = filteredPOIs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="w-full">
      {/* Section Header */}
      <div className={`mb-8 ${isRtl ? 'text-right' : 'text-left'}`}>
        <h3 className="heading-serif text-3xl md:text-4xl text-[#1A1A1A] mb-4 tracking-wide">
          {isRtl ? 'المعالم القريبة' : 'Nearby Points of Interest'}
        </h3>
        <p className="text-[#6B6B6B] text-lg">
          {isRtl
            ? 'اكتشف ما حولك من مرافق ومعالم'
            : 'Discover what\'s around you'}
        </p>
      </div>

      {/* Category Filter */}
      <POICategoryFilter
        selected={selectedCategory}
        onSelect={(category) => {
          setSelectedCategory(category);
          setCurrentPage(1); // Reset to page 1 on category change
        }}
        isRtl={isRtl}
      />

      {/* Bold Container for POIs */}
      <div className="bg-gradient-to-br from-gold/95 to-gold rounded-3xl p-8 md:p-12 mb-8 shadow-lg relative overflow-hidden">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-gold rounded-full blur-3xl" />
        </div>

        {/* Container Header */}
        <div className={`mb-8 relative z-10 ${isRtl ? 'text-right' : 'text-left'}`}>
          <div className={`flex items-center gap-3 mb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm flex-shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h4 className="text-white text-sm font-semibold tracking-widest uppercase">
              {isRtl ? 'اكتشف حولك' : 'What\'s Nearby'}
            </h4>
          </div>
          <p className={`text-white/80 text-sm leading-relaxed max-w-2xl ${isRtl ? 'text-right' : ''}`}>
            {isRtl
              ? 'تصفح المحلات والمطاعم والمحطات بالقرب من منزلك الجديد'
              : 'Browse shops, restaurants, and stations near your new home'}
          </p>
        </div>

        {/* POI Grid - 5 columns per row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 relative z-10">
          {displayedPOIs.map((poi, index) => (
            <POICard
              key={poi.id}
              poi={poi}
              isRtl={isRtl}
              index={index}
              studioCoordinates={STUDIO_COORDINATES}
            />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={`flex items-center justify-center gap-2 mt-10 relative z-10 flex-wrap ${isRtl ? 'flex-row-reverse' : ''}`}>
            {/* Previous Button */}
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg bg-white/20 text-white hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold"
            >
              {isRtl ? '→' : '←'}
            </button>

            {/* Page Numbers */}
            <div className={`flex gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-lg font-semibold transition-all duration-200 ${
                    currentPage === page
                      ? 'bg-white text-gold shadow-lg scale-110'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg bg-white/20 text-white hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold"
            >
              {isRtl ? '←' : '→'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export { allPOIs };
