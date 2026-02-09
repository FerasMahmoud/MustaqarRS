import { NextResponse } from 'next/server';
import { Testimonial } from '@/lib/supabase';

// Static testimonials data
const TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name_en: 'Abdullah Al-Rashid',
    name_ar: 'عبدالله الراشد',
    text_en: 'Absolutely wonderful stay! The suite was spotless, beautifully furnished, and had everything we needed. The smart lock made check-in seamless. Highly recommend for anyone visiting Riyadh.',
    text_ar: 'إقامة رائعة! الجناح كان نظيفاً جداً ومؤثث بشكل جميل وفيه كل شي نحتاجه. القفل الذكي سهّل الدخول بشكل كبير. أنصح فيه بشدة لكل من يزور الرياض.',
    rating: 5,
    avatar_url: '',
    is_approved: true,
    created_at: '2025-11-15T10:00:00.000Z',
  },
  {
    id: '2',
    name_en: 'Sara Mohammed',
    name_ar: 'سارة محمد',
    text_en: 'The dining area was perfect for our family gatherings. Two bedrooms with luxury beds made our month-long stay very comfortable. Great value for the price.',
    text_ar: 'منطقة الطعام كانت مثالية لتجمعاتنا العائلية. غرفتين نوم مع أسرّة فاخرة خلّت إقامتنا الشهرية مريحة جداً. قيمة ممتازة مقابل السعر.',
    rating: 5,
    avatar_url: '',
    is_approved: true,
    created_at: '2025-10-22T14:00:00.000Z',
  },
  {
    id: '3',
    name_en: 'Mohammed Al-Qahtani',
    name_ar: 'محمد القحطاني',
    text_en: 'Very clean and modern suite. The three bathrooms were a huge plus for our family. Location is convenient and the building has good security. Will definitely book again.',
    text_ar: 'جناح نظيف وعصري جداً. الثلاث حمامات كانت ميزة كبيرة لعائلتنا. الموقع مناسب والمبنى فيه أمان ممتاز. بالتأكيد بحجز مرة ثانية.',
    rating: 5,
    avatar_url: '',
    is_approved: true,
    created_at: '2025-09-08T09:00:00.000Z',
  },
  {
    id: '4',
    name_en: 'Noura Al-Otaibi',
    name_ar: 'نورة العتيبي',
    text_en: 'Loved the vanity dressing area and the marble floors. The suite feels luxurious yet homey. Fast WiFi and parking included - everything was well thought out.',
    text_ar: 'عجبتني منطقة التسريحة والأرضيات الرخامية. الجناح يحسسك بالفخامة والراحة بنفس الوقت. إنترنت سريع وموقف سيارة - كل شي مدروس.',
    rating: 4,
    avatar_url: '',
    is_approved: true,
    created_at: '2025-08-30T16:00:00.000Z',
  },
  {
    id: '5',
    name_en: 'Fahad Al-Dosari',
    name_ar: 'فهد الدوسري',
    text_en: 'Stayed for 3 months for a work assignment. The suite was my home away from home. Kitchen area, fast internet, and comfortable beds. The management team was very responsive.',
    text_ar: 'سكنت 3 أشهر بسبب مهمة عمل. الجناح كان بيتي الثاني. مطبخ وإنترنت سريع وأسرّة مريحة. فريق الإدارة كان متجاوب جداً.',
    rating: 5,
    avatar_url: '',
    is_approved: true,
    created_at: '2025-07-12T11:00:00.000Z',
  },
  {
    id: '6',
    name_en: 'Lama Al-Harbi',
    name_ar: 'لمى الحربي',
    text_en: 'Beautiful rain showers in all bathrooms and the ambient lighting creates such a relaxing atmosphere. Perfect for a couple or small family. The glass wardrobes are a nice touch.',
    text_ar: 'دش مطري جميل في كل الحمامات والإضاءة المحيطية تخلق أجواء مريحة. مثالي للأزواج أو العائلة الصغيرة. الخزائن الزجاجية لمسة حلوة.',
    rating: 5,
    avatar_url: '',
    is_approved: true,
    created_at: '2025-06-25T08:00:00.000Z',
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const minRating = searchParams.get('minRating');

    let testimonials = TESTIMONIALS.filter(t => t.is_approved);

    // Apply optional filters
    if (minRating) {
      testimonials = testimonials.filter(t => t.rating >= parseInt(minRating));
    }

    if (limit) {
      testimonials = testimonials.slice(0, parseInt(limit));
    }

    // Calculate statistics
    const totalRating = testimonials.reduce((sum, t) => sum + t.rating, 0);
    const averageRating = testimonials.length > 0
      ? parseFloat((totalRating / testimonials.length).toFixed(1))
      : 0;

    return NextResponse.json({
      testimonials,
      count: testimonials.length,
      averageRating,
    });
  } catch (error) {
    console.error('Error in testimonials API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
