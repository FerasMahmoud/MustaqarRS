'use client';

import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ChevronLeft, Quote, Calendar, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Testimonial } from '@/lib/supabase';

export default function TestimonialsPage() {
  const t = useTranslations('testimonials');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [averageRating, setAverageRating] = useState(0);
  const [filter, setFilter] = useState<'all' | number>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'highest' | 'lowest'>('newest');

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/testimonials');

        if (!response.ok) {
          throw new Error('Failed to fetch testimonials');
        }

        const data = await response.json();
        const fetchedTestimonials = data.testimonials as Testimonial[];
        setTestimonials(fetchedTestimonials);
        setAverageRating(data.averageRating || 0);
      } catch (err) {
        console.error('Error fetching testimonials:', err);
        setError(err instanceof Error ? err.message : 'Failed to load testimonials');
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  const filteredTestimonials = testimonials
    .filter((t) => filter === 'all' || t.rating === filter)
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'highest') {
        return b.rating - a.rating;
      } else {
        return a.rating - b.rating;
      }
    });

  const renderStars = (rating: number, size: number = 18) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        size={size}
        className={`${
          index < rating
            ? 'fill-gold text-gold'
            : 'text-charcoal-light'
        } transition-colors duration-300`}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', options);
  };

  const ratingCounts = testimonials.reduce((acc, t) => {
    acc[t.rating] = (acc[t.rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero Section */}
      <section className="relative bg-charcoal py-20 md:py-28">
        <div className="absolute inset-0">
          <Image
            src="/room-images/comfort-studio/01-main-bedroom.jpg"
            alt="Luxury hotel background"
            fill
            className="object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal/80 to-charcoal" />
        </div>

        <div className="container-luxury relative z-10">
          {/* Back Button */}
          <Link
            href={`/${locale}`}
            className={`inline-flex items-center gap-2 text-gold hover:text-gold-light transition-colors mb-8 group ${isRtl ? 'flex-row-reverse' : ''}`}
          >
            <ArrowLeft size={20} className={`group-hover:-translate-x-1 transition-transform ${isRtl ? 'rotate-180 group-hover:translate-x-1' : ''}`} />
            <span>{isRtl ? 'العودة للرئيسية' : 'Back to Home'}</span>
          </Link>

          <div className="text-center">
            <p className="text-gold text-sm md:text-base font-semibold mb-3 tracking-wide uppercase">
              {isRtl ? 'آراء وتقييمات الضيوف' : 'Guest Reviews & Ratings'}
            </p>
            <h1 className="heading-serif text-4xl md:text-5xl lg:text-6xl text-white mb-6">
              {isRtl ? 'جميع التقييمات' : 'All Testimonials'}
            </h1>
            <div className="flex justify-center mb-6">
              <div className="divider-gold" />
            </div>
            <p className="text-warm-white text-lg max-w-2xl mx-auto opacity-90">
              {isRtl
                ? 'اطلع على تجارب ضيوفنا الكرام في ستوديوهاتنا الفاخرة'
                : 'Read about our valued guests\' experiences at our luxury studios'}
            </p>

            {/* Stats Summary */}
            {!loading && testimonials.length > 0 && (
              <div className="flex flex-wrap justify-center gap-8 mt-10">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {renderStars(Math.round(averageRating), 24)}
                  </div>
                  <p className="text-gold text-3xl font-bold">{averageRating}</p>
                  <p className="text-warm-white/70 text-sm">{isRtl ? 'متوسط التقييم' : 'Average Rating'}</p>
                </div>
                <div className="text-center">
                  <p className="text-gold text-3xl font-bold">{testimonials.length}</p>
                  <p className="text-warm-white/70 text-sm">{isRtl ? 'إجمالي التقييمات' : 'Total Reviews'}</p>
                </div>
                <div className="text-center">
                  <p className="text-gold text-3xl font-bold">
                    {Math.round((testimonials.filter(t => t.rating >= 4).length / testimonials.length) * 100)}%
                  </p>
                  <p className="text-warm-white/70 text-sm">{isRtl ? 'معدل الرضا' : 'Satisfaction Rate'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Filters and Content */}
      <section className="py-12 md:py-16">
        <div className="container-luxury">
          {/* Filters */}
          {!loading && testimonials.length > 0 && (
            <div className={`flex flex-wrap gap-4 mb-10 ${isRtl ? 'flex-row-reverse' : ''}`}>
              {/* Rating Filter */}
              <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <span className="text-charcoal font-medium text-sm">
                  {isRtl ? 'تصفية حسب التقييم:' : 'Filter by rating:'}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      filter === 'all'
                        ? 'bg-gold text-white'
                        : 'bg-white border border-border text-charcoal hover:border-gold'
                    }`}
                  >
                    {isRtl ? 'الكل' : 'All'}
                  </button>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <button
                      key={rating}
                      onClick={() => setFilter(rating)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1 ${
                        filter === rating
                          ? 'bg-gold text-white'
                          : 'bg-white border border-border text-charcoal hover:border-gold'
                      }`}
                    >
                      {rating} <Star size={14} className={filter === rating ? 'fill-white' : 'fill-gold text-gold'} />
                      <span className="text-xs opacity-70">({ratingCounts[rating] || 0})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse mr-auto' : 'ml-auto'}`}>
                <span className="text-charcoal font-medium text-sm">
                  {isRtl ? 'ترتيب حسب:' : 'Sort by:'}
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'newest' | 'highest' | 'lowest')}
                  className="px-4 py-2 rounded-lg border border-border bg-white text-charcoal text-sm focus:outline-none focus:border-gold"
                >
                  <option value="newest">{isRtl ? 'الأحدث' : 'Newest First'}</option>
                  <option value="highest">{isRtl ? 'الأعلى تقييماً' : 'Highest Rated'}</option>
                  <option value="lowest">{isRtl ? 'الأقل تقييماً' : 'Lowest Rated'}</option>
                </select>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <div key={s} className="w-5 h-5 bg-gray-200 rounded" />
                      ))}
                    </div>
                    <div className="w-7 h-7 bg-gray-200 rounded" />
                  </div>
                  <div className="space-y-2 mb-6">
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-5/6" />
                    <div className="h-4 bg-gray-200 rounded w-4/6" />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2 w-2/3" />
                      <div className="h-3 bg-gray-200 rounded w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-16">
              <div className="bg-white rounded-xl p-8 max-w-md mx-auto shadow-sm">
                <p className="text-charcoal mb-4">{isRtl ? 'حدث خطأ في تحميل التقييمات' : 'Failed to load testimonials'}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="btn-primary"
                >
                  {isRtl ? 'حاول مرة أخرى' : 'Try Again'}
                </button>
              </div>
            </div>
          )}

          {/* Testimonials Grid */}
          {!loading && !error && (
            <>
              {filteredTestimonials.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground">
                    {isRtl ? 'لا توجد تقييمات تطابق الفلتر المحدد' : 'No testimonials match the selected filter'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTestimonials.map((testimonial, index) => (
                    <div
                      key={testimonial.id}
                      className={`bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-500 group animate-fade-in-up`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Quote Icon & Stars Container */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex gap-1">
                          {renderStars(testimonial.rating)}
                        </div>
                        <Quote
                          size={28}
                          className="text-gold opacity-30 group-hover:opacity-50 transition-opacity flex-shrink-0"
                        />
                      </div>

                      {/* Review Text */}
                      <p className="text-charcoal mb-6 text-base leading-relaxed">
                        {isRtl ? testimonial.text_ar : testimonial.text_en}
                      </p>

                      {/* Divider */}
                      <div className="w-12 h-0.5 bg-gradient-to-r from-gold to-transparent mb-4" />

                      {/* Guest Info */}
                      <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-gold/40 group-hover:ring-gold transition-all">
                          <Image
                            src={testimonial.avatar_url || '/images/default-avatar.jpg'}
                            alt={isRtl ? testimonial.name_ar : testimonial.name_en}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className={`flex-1 min-w-0 ${isRtl ? 'text-right' : ''}`}>
                          <h3 className="text-charcoal font-semibold text-sm truncate">
                            {isRtl ? testimonial.name_ar : testimonial.name_en}
                          </h3>
                          <div className={`flex items-center gap-1.5 text-muted-foreground text-xs mt-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <Calendar size={12} />
                            <span>{formatDate(testimonial.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-charcoal py-16">
        <div className="container-luxury text-center">
          <h2 className="heading-serif text-3xl md:text-4xl text-white mb-4">
            {isRtl ? 'هل أنت مستعد لتجربة الفخامة؟' : 'Ready to Experience Luxury?'}
          </h2>
          <p className="text-warm-white/80 mb-8 max-w-2xl mx-auto">
            {isRtl
              ? 'انضم إلى ضيوفنا السعداء واحجز إقامتك في ستوديوهاتنا الفاخرة اليوم'
              : 'Join our happy guests and book your stay at our luxury studios today'}
          </p>
          <Link
            href={`/${locale}#booking`}
            className="btn-primary inline-flex items-center gap-2"
          >
            {isRtl ? 'احجز الآن' : 'Book Now'}
            <span className={isRtl ? 'rotate-180' : ''}>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
