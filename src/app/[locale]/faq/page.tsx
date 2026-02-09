import { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, HelpCircle, Home, CreditCard, Calendar, Shield, Wifi, Car, PawPrint, Clock } from 'lucide-react';
import { FAQJsonLd, BreadcrumbJsonLd } from '@/components/seo/JsonLd';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mustaqar.vercel.app';

// FAQ data structure for both SEO and rendering
const faqData = {
  en: {
    title: 'Frequently Asked Questions',
    subtitle: 'Find answers to common questions about our luxury studio rentals in Riyadh',
    categories: [
      {
        name: 'Pricing & Booking',
        icon: CreditCard,
        questions: [
          {
            question: 'How much does it cost to rent a studio in Riyadh?',
            answer: 'Studios at Mustaqar RS start from SAR 163/night (SAR 4,900/month) for the Comfort Studio, and SAR 197/night (SAR 5,900/month) for the Spacious Modern Studio. We offer discounts for weekly (10% off) and monthly stays (best rates).',
          },
          {
            question: 'What is the minimum stay requirement?',
            answer: 'Our minimum stay is 1 night. However, we offer better rates for longer stays: 10% discount for 7+ nights, 15% discount for 14+ nights, and our best monthly rates for 30+ nights.',
          },
          {
            question: 'What payment methods are accepted?',
            answer: 'We accept credit and debit cards (Visa, Mastercard) via Stripe for instant payment, as well as bank transfers to Al Rajhi Bank, Saudi French Bank, or STC Pay.',
          },
          {
            question: 'Is a deposit required?',
            answer: 'No separate deposit is required. Full payment is made at the time of booking for card payments, or within 1 hour for bank transfers to secure your reservation.',
          },
        ],
      },
      {
        name: 'Check-in & Access',
        icon: Calendar,
        questions: [
          {
            question: 'What are the check-in and check-out times?',
            answer: 'Check-in time is 4:00 PM (16:00) and check-out time is 12:00 PM (noon). Early check-in or late check-out may be available upon request, subject to availability.',
          },
          {
            question: 'How does self check-in work?',
            answer: 'After your booking is confirmed, you will receive a unique door access code via email and WhatsApp. Simply enter the code on the smart lock to access your studio. No key pickup required!',
          },
          {
            question: 'Can I extend my stay?',
            answer: 'Yes! You can extend your stay subject to availability. Simply contact us via WhatsApp at +966-531182200, and we will check availability and process the extension.',
          },
        ],
      },
      {
        name: 'Amenities & Services',
        icon: Wifi,
        questions: [
          {
            question: 'What amenities are included?',
            answer: 'All studios include: high-speed WiFi, air conditioning and heating, fully equipped kitchen/kitchenette, Smart TV with streaming, free parking, workspace/desk, 24/7 security, smart lock entry, hair dryer, and iron.',
          },
          {
            question: 'Is WiFi included and how fast is it?',
            answer: 'Yes, high-speed WiFi is free and included in all studios. Our connection is suitable for video calls, streaming, and remote work.',
          },
          {
            question: 'Is there parking available?',
            answer: 'Yes, free parking is included with all studio rentals. Each studio has a designated parking space.',
          },
          {
            question: 'Is cleaning included?',
            answer: 'Weekly cleaning service is available as an add-on during booking. The studio is professionally cleaned before your arrival.',
          },
        ],
      },
      {
        name: 'Policies',
        icon: Shield,
        questions: [
          {
            question: 'Are pets allowed?',
            answer: 'Yes, our studios are pet-friendly on request. Please mention that you are bringing a pet in your booking notes so we can prepare accordingly.',
          },
          {
            question: 'Is smoking allowed?',
            answer: 'Smoking is permitted in designated outdoor areas only. Smoking inside the studios is not allowed to maintain air quality for all guests.',
          },
          {
            question: 'What is the cancellation policy?',
            answer: 'Cancellations made 48+ hours before check-in receive a full refund. Cancellations within 48 hours may be subject to a one-night charge. Please contact us for special circumstances.',
          },
        ],
      },
      {
        name: 'Location & Contact',
        icon: Home,
        questions: [
          {
            question: 'Where is Mustaqar RS located?',
            answer: 'We are located in Riyadh, Saudi Arabia. The exact address and directions will be provided after booking confirmation.',
          },
          {
            question: 'How can I contact you?',
            answer: 'You can reach us via WhatsApp at +966-531182200, or through our website contact form. We respond within a few hours during business hours.',
          },
        ],
      },
    ],
  },
  ar: {
    title: 'الأسئلة الشائعة',
    subtitle: 'اعثر على إجابات للأسئلة الشائعة حول استوديوهاتنا الفاخرة للإيجار في الرياض',
    categories: [
      {
        name: 'الأسعار والحجز',
        icon: CreditCard,
        questions: [
          {
            question: 'كم تكلفة إيجار استوديو في الرياض؟',
            answer: 'تبدأ أسعار الاستوديوهات في شرمة مستقر من 163 ريال/ليلة (4,900 ريال/شهر) لستوديو كومفورت، و197 ريال/ليلة (5,900 ريال/شهر) للاستوديو العصري الواسع. نقدم خصومات للإقامات الأسبوعية (10%) والشهرية (أفضل الأسعار).',
          },
          {
            question: 'ما هي مدة الإقامة الأدنى؟',
            answer: 'الحد الأدنى للإقامة هو ليلة واحدة. نقدم أسعاراً أفضل للإقامات الأطول: خصم 10% لـ 7 ليالٍ أو أكثر، وخصم 15% لـ 14 ليلة أو أكثر، وأفضل الأسعار الشهرية لـ 30 ليلة أو أكثر.',
          },
          {
            question: 'ما هي طرق الدفع المقبولة؟',
            answer: 'نقبل بطاقات الائتمان والخصم (فيزا، ماستركارد) عبر Stripe للدفع الفوري، وكذلك التحويلات البنكية إلى بنك الراجحي أو البنك السعودي الفرنسي أو STC Pay.',
          },
          {
            question: 'هل يتطلب الأمر تأميناً؟',
            answer: 'لا يتطلب الأمر تأميناً منفصلاً. يتم الدفع الكامل وقت الحجز لمدفوعات البطاقات، أو خلال ساعة واحدة للتحويلات البنكية لتأكيد حجزك.',
          },
        ],
      },
      {
        name: 'تسجيل الوصول والدخول',
        icon: Calendar,
        questions: [
          {
            question: 'ما هي أوقات تسجيل الوصول والمغادرة؟',
            answer: 'وقت تسجيل الوصول هو 4:00 مساءً ووقت المغادرة هو 12:00 ظهراً. قد يتوفر تسجيل وصول مبكر أو مغادرة متأخرة عند الطلب وحسب التوفر.',
          },
          {
            question: 'كيف يعمل تسجيل الوصول الذاتي؟',
            answer: 'بعد تأكيد حجزك، ستتلقى رمز دخول فريد للباب عبر البريد الإلكتروني والواتساب. ما عليك سوى إدخال الرمز على القفل الذكي للدخول إلى استوديوك. لا حاجة لاستلام مفتاح!',
          },
          {
            question: 'هل يمكنني تمديد إقامتي؟',
            answer: 'نعم! يمكنك تمديد إقامتك حسب التوفر. تواصل معنا عبر واتساب على +966-531182200، وسنتحقق من التوفر ونعالج التمديد.',
          },
        ],
      },
      {
        name: 'المرافق والخدمات',
        icon: Wifi,
        questions: [
          {
            question: 'ما هي المرافق المتضمنة؟',
            answer: 'تشمل جميع الاستوديوهات: واي فاي عالي السرعة، تكييف وتدفئة، مطبخ مجهز بالكامل، تلفزيون ذكي مع خدمات البث، موقف سيارات مجاني، مكتب عمل، أمن على مدار الساعة، قفل ذكي، مجفف شعر، ومكواة.',
          },
          {
            question: 'هل الواي فاي متضمن وما سرعته؟',
            answer: 'نعم، الواي فاي عالي السرعة مجاني ومتضمن في جميع الاستوديوهات. اتصالنا مناسب لمكالمات الفيديو والبث والعمل عن بُعد.',
          },
          {
            question: 'هل يوجد موقف للسيارات؟',
            answer: 'نعم، موقف السيارات مجاني ومتضمن مع جميع إيجارات الاستوديوهات. لكل استوديو مكان مخصص للسيارة.',
          },
          {
            question: 'هل التنظيف متضمن؟',
            answer: 'خدمة التنظيف الأسبوعية متاحة كإضافة أثناء الحجز. يتم تنظيف الاستوديو احترافياً قبل وصولك.',
          },
        ],
      },
      {
        name: 'السياسات',
        icon: Shield,
        questions: [
          {
            question: 'هل الحيوانات الأليفة مسموح بها؟',
            answer: 'نعم، استوديوهاتنا صديقة للحيوانات الأليفة عند الطلب. يرجى ذكر أنك ستجلب حيواناً أليفاً في ملاحظات الحجز حتى نستعد وفقاً لذلك.',
          },
          {
            question: 'هل التدخين مسموح؟',
            answer: 'التدخين مسموح في المناطق الخارجية المخصصة فقط. لا يسمح بالتدخين داخل الاستوديوهات للحفاظ على جودة الهواء لجميع الضيوف.',
          },
          {
            question: 'ما هي سياسة الإلغاء؟',
            answer: 'تحصل الإلغاءات التي تتم قبل 48 ساعة أو أكثر من تسجيل الوصول على استرداد كامل. قد تخضع الإلغاءات خلال 48 ساعة لرسوم ليلة واحدة. يرجى التواصل معنا للحالات الخاصة.',
          },
        ],
      },
      {
        name: 'الموقع والتواصل',
        icon: Home,
        questions: [
          {
            question: 'أين تقع شرمة مستقر؟',
            answer: 'نقع في الرياض، المملكة العربية السعودية. سيتم توفير العنوان الدقيق والاتجاهات بعد تأكيد الحجز.',
          },
          {
            question: 'كيف يمكنني التواصل معكم؟',
            answer: 'يمكنك التواصل معنا عبر واتساب على +966-531182200، أو من خلال نموذج الاتصال على موقعنا. نرد خلال ساعات قليلة أثناء ساعات العمل.',
          },
        ],
      },
    ],
  },
};

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const data = faqData[locale as keyof typeof faqData] || faqData.en;

  const title = locale === 'ar'
    ? 'الأسئلة الشائعة | شرمة مستقر'
    : 'FAQ | Mustaqar RS';

  const description = locale === 'ar'
    ? 'اعثر على إجابات للأسئلة الشائعة حول إيجار الاستوديوهات الفاخرة في الرياض. الأسعار، تسجيل الوصول، المرافق، السياسات والمزيد.'
    : 'Find answers to frequently asked questions about luxury studio rentals in Riyadh. Pricing, check-in, amenities, policies and more.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}/faq`,
      type: 'website',
    },
    alternates: {
      canonical: `${BASE_URL}/${locale}/faq`,
      languages: {
        'en': `${BASE_URL}/en/faq`,
        'ar': `${BASE_URL}/ar/faq`,
        'x-default': `${BASE_URL}/en/faq`,
      },
    },
  };
}

export default async function FAQPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isRtl = locale === 'ar';
  const data = faqData[locale as keyof typeof faqData] || faqData.en;

  // Flatten all questions for FAQ schema
  const allQuestions = data.categories.flatMap(cat =>
    cat.questions.map(q => ({ question: q.question, answer: q.answer }))
  );

  // Breadcrumb data
  const breadcrumbs = [
    { name: isRtl ? 'الرئيسية' : 'Home', url: `/${locale}` },
    { name: isRtl ? 'الأسئلة الشائعة' : 'FAQ' },
  ];

  return (
    <>
      {/* JSON-LD for FAQ and Breadcrumb schemas */}
      <FAQJsonLd questions={allQuestions} />
      <BreadcrumbJsonLd items={breadcrumbs} />

      <div className="min-h-screen bg-[#FAF7F2] pt-24 pb-16" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="geometric-pattern" />
        <div className="container mx-auto px-4 max-w-4xl relative z-10">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link href={`/${locale}`} className="hover:text-gold transition-colors">
              {isRtl ? 'الرئيسية' : 'Home'}
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-charcoal font-medium">
              {isRtl ? 'الأسئلة الشائعة' : 'FAQ'}
            </span>
          </nav>

          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gold/10 rounded-2xl mb-6">
              <HelpCircle className="w-8 h-8 text-gold" />
            </div>
            <h1 className="text-4xl md:text-5xl heading-serif text-charcoal mb-4">
              {data.title}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {data.subtitle}
            </p>
          </div>

          {/* FAQ Categories */}
          <div className="space-y-8">
            {data.categories.map((category, catIndex) => {
              const IconComponent = category.icon;
              return (
                <div key={catIndex} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  {/* Category Header */}
                  <div className="bg-gradient-to-r from-gold/10 to-gold/5 px-6 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-gold/20 rounded-xl flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-gold" />
                    </div>
                    <h2 className="text-xl font-semibold text-charcoal">
                      {category.name}
                    </h2>
                  </div>

                  {/* Questions */}
                  <div className="divide-y divide-border">
                    {category.questions.map((qa, qaIndex) => (
                      <details
                        key={qaIndex}
                        className="group"
                        open={catIndex === 0 && qaIndex === 0}
                      >
                        <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-cream/50 transition-colors list-none">
                          <h3 className="text-charcoal font-medium pr-4 text-left">
                            {qa.question}
                          </h3>
                          <ChevronRight className="w-5 h-5 text-gold flex-shrink-0 transition-transform group-open:rotate-90" />
                        </summary>
                        <div className="px-6 pb-6 pt-0">
                          <p className="text-muted-foreground leading-relaxed" data-llm="faq-answer">
                            {qa.answer}
                          </p>
                        </div>
                      </details>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Contact CTA */}
          <div className="mt-12 bg-gradient-to-br from-gold/20 to-gold/10 rounded-2xl p-8 text-center">
            <h2 className="text-2xl heading-serif text-charcoal mb-3">
              {isRtl ? 'لم تجد إجابتك؟' : 'Didn\'t find your answer?'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isRtl
                ? 'تواصل معنا مباشرة وسنسعد بمساعدتك'
                : 'Contact us directly and we\'ll be happy to help'}
            </p>
            <a
              href="https://wa.me/966531182200"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 btn-primary px-8 py-3 rounded-xl font-medium"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              {isRtl ? 'تواصل عبر واتساب' : 'Contact via WhatsApp'}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
