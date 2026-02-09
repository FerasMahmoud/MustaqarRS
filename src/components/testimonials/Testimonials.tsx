'use client';

import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { Star, ChevronLeft, ChevronRight, Quote, Calendar, Loader2 } from 'lucide-react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { Testimonial } from '@/lib/supabase';
import { scrollToSection } from '@/lib/utils';

interface TestimonialsProps {
  displayMode?: 'grid' | 'carousel';
  limit?: number;
}

export function Testimonials({ displayMode = 'carousel', limit }: TestimonialsProps) {
  const t = useTranslations('testimonials');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLinkHovered, setIsLinkHovered] = useState(false);

  // Carousel state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Calculate items per view based on screen size
  const getItemsPerView = useCallback(() => {
    if (typeof window === 'undefined') return 3;
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  }, []);

  const [itemsPerView, setItemsPerView] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      setItemsPerView(getItemsPerView());
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getItemsPerView]);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (limit) params.set('limit', limit.toString());

        const response = await fetch(`/api/testimonials?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch testimonials');
        }

        const data = await response.json();
        const fetchedTestimonials = data.testimonials as Testimonial[];
        setTestimonials(fetchedTestimonials);
      } catch (err) {
        console.error('Error fetching testimonials:', err);
        setError(err instanceof Error ? err.message : 'Failed to load testimonials');
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, [limit]);

  // Auto-play carousel
  useEffect(() => {
    if (displayMode !== 'carousel' || !isAutoPlaying || testimonials.length <= itemsPerView) {
      return;
    }

    autoPlayRef.current = setInterval(() => {
      setCurrentIndex((prev) => {
        const maxIndex = Math.max(0, testimonials.length - itemsPerView);
        return prev >= maxIndex ? 0 : prev + 1;
      });
    }, 5000);

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [displayMode, isAutoPlaying, testimonials.length, itemsPerView]);

  const handlePrev = useCallback(() => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => {
      const maxIndex = Math.max(0, testimonials.length - itemsPerView);
      return prev <= 0 ? maxIndex : prev - 1;
    });
  }, [testimonials.length, itemsPerView]);

  const handleNext = useCallback(() => {
    setIsAutoPlaying(false);
    setCurrentIndex((prev) => {
      const maxIndex = Math.max(0, testimonials.length - itemsPerView);
      return prev >= maxIndex ? 0 : prev + 1;
    });
  }, [testimonials.length, itemsPerView]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (Math.abs(distance) < minSwipeDistance) return;

    if (distance > 0) {
      // Swiped left - go next (or prev for RTL)
      isRtl ? handlePrev() : handleNext();
    } else {
      // Swiped right - go prev (or next for RTL)
      isRtl ? handleNext() : handlePrev();
    }
  };

  const goToSlide = (index: number) => {
    setIsAutoPlaying(false);
    setCurrentIndex(index);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        size={18}
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
      month: 'short',
    };
    return date.toLocaleDateString(isRtl ? 'ar-SA' : 'en-US', options);
  };

  const TestimonialCard = ({ testimonial, index }: { testimonial: Testimonial; index: number }) => (
    <div
      className={`testimonial-card border border-charcoal-light hover:border-gold transition-all duration-500 group h-full flex flex-col ${
        displayMode === 'grid' ? `animate-fade-in-up animation-delay-${(index + 1) * 100}` : ''
      }`}
    >
      {/* Quote Icon & Stars Container */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex gap-1">
          {renderStars(testimonial.rating)}
        </div>
        <Quote
          size={28}
          className="text-gold opacity-40 group-hover:opacity-60 transition-opacity flex-shrink-0"
        />
      </div>

      {/* Review Text */}
      <p className="text-warm-white mb-6 text-base leading-relaxed opacity-95 flex-grow line-clamp-4">
        {isRtl ? testimonial.text_ar : testimonial.text_en}
      </p>

      {/* Divider */}
      <div className="w-12 h-0.5 bg-gradient-to-r from-gold to-transparent mb-4" />

      {/* Guest Info */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full flex-shrink-0 ring-2 ring-gold/60 group-hover:ring-gold transition-all bg-gold/20 flex items-center justify-center">
          <span className="text-gold font-bold text-lg">
            {(isRtl ? testimonial.name_ar : testimonial.name_en).charAt(0)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm truncate">
            {isRtl ? testimonial.name_ar : testimonial.name_en}
          </h3>
          <div className="flex items-center gap-1.5 text-warm-white/70 text-xs mt-1">
            <Calendar size={12} />
            <span>{formatDate(testimonial.created_at)}</span>
          </div>
        </div>
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
  );

  // Loading state skeleton
  if (loading) {
    return (
      <section id="testimonials" className="bg-charcoal py-16 md:py-24 lg:py-32">
        <div className="container-luxury">
          {/* Section Header */}
          <div className="text-center mb-12 md:mb-16">
            <p className="text-gold text-sm md:text-base font-semibold mb-3 tracking-wide uppercase">
              {isRtl ? 'آراء العملاء' : 'Client Reviews'}
            </p>
            <h2 className="heading-serif text-3xl md:text-4xl lg:text-5xl text-white mb-4">
              {isRtl ? 'ما يقول عملاؤنا' : 'What Our Guests Say'}
            </h2>
            <div className="flex justify-center mb-6">
              <div className="divider-gold" />
            </div>
          </div>

          {/* Loading Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="testimonial-card border border-charcoal-light animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <div key={s} className="w-5 h-5 bg-charcoal-light rounded" />
                    ))}
                  </div>
                  <div className="w-7 h-7 bg-charcoal-light rounded" />
                </div>
                <div className="space-y-2 mb-6">
                  <div className="h-4 bg-charcoal-light rounded w-full" />
                  <div className="h-4 bg-charcoal-light rounded w-5/6" />
                  <div className="h-4 bg-charcoal-light rounded w-4/6" />
                </div>
                <div className="w-12 h-0.5 bg-charcoal-light mb-4" />
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-charcoal-light flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-charcoal-light rounded mb-2 w-2/3" />
                    <div className="h-3 bg-charcoal-light rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section id="testimonials" className="bg-charcoal py-16 md:py-24 lg:py-32">
        <div className="container-luxury">
          <div className="text-center">
            <p className="text-gold text-sm md:text-base font-semibold mb-3 tracking-wide uppercase">
              {isRtl ? 'آراء العملاء' : 'Client Reviews'}
            </p>
            <h2 className="heading-serif text-3xl md:text-4xl lg:text-5xl text-white mb-4">
              {isRtl ? 'ما يقول عملاؤنا' : 'What Our Guests Say'}
            </h2>
            <div className="flex justify-center mb-6">
              <div className="divider-gold" />
            </div>
            <div className="bg-charcoal-light/30 rounded-lg p-8 max-w-md mx-auto">
              <p className="text-warm-white text-base md:text-lg mb-4">
                {isRtl ? 'حدث خطأ في تحميل التقييمات' : 'Failed to load testimonials'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary text-sm"
              >
                {isRtl ? 'حاول مرة أخرى' : 'Try Again'}
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Empty state
  if (testimonials.length === 0) {
    return (
      <section id="testimonials" className="bg-charcoal py-16 md:py-24 lg:py-32">
        <div className="container-luxury">
          <div className="text-center">
            <p className="text-gold text-sm md:text-base font-semibold mb-3 tracking-wide uppercase">
              {isRtl ? 'آراء العملاء' : 'Client Reviews'}
            </p>
            <h2 className="heading-serif text-3xl md:text-4xl lg:text-5xl text-white mb-4">
              {isRtl ? 'ما يقول عملاؤنا' : 'What Our Guests Say'}
            </h2>
            <div className="flex justify-center mb-6">
              <div className="divider-gold" />
            </div>
            <p className="text-warm-white text-base md:text-lg">
              {isRtl ? 'لا توجد تقييمات حالياً' : 'No testimonials available yet'}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const maxIndex = Math.max(0, testimonials.length - itemsPerView);
  const totalDots = maxIndex + 1;

  return (
    <section id="testimonials" className="bg-charcoal py-16 md:py-24 lg:py-32 overflow-hidden">
      <div className="container-luxury">
        {/* Section Header */}
        <div className="text-center mb-12 md:mb-20">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-16 h-px bg-gradient-to-r from-transparent to-gold" />
            <span className="text-gold text-sm font-semibold tracking-[0.25em] uppercase">
              {isRtl ? 'آراء العملاء' : 'Client Reviews'}
            </span>
            <div className="w-16 h-px bg-gradient-to-l from-transparent to-gold" />
          </div>
          <h2 className="heading-serif text-5xl md:text-6xl lg:text-7xl text-white mb-6">
            {isRtl ? 'ما يقول عملاؤنا' : 'What Our Guests Say'}
          </h2>
          <div className="flex justify-center mb-6">
            <div className="divider-gold w-24" />
          </div>
          <p className="text-white/80 text-xl md:text-2xl max-w-3xl mx-auto font-light leading-relaxed">
            {isRtl
              ? 'اكتشف تجارب الضيوف الحقيقية في ستوديوهاتنا الفاخرة'
              : 'Discover genuine guest experiences at our luxury studios'}
          </p>
        </div>

        {/* Testimonials Display */}
        {displayMode === 'carousel' ? (
          <div className="relative">
            {/* Navigation Buttons */}
            {testimonials.length > itemsPerView && (
              <>
                <button
                  onClick={isRtl ? handleNext : handlePrev}
                  className="absolute -left-4 md:left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-charcoal-light/80 hover:bg-gold text-white hover:text-charcoal transition-all duration-300 flex items-center justify-center shadow-lg backdrop-blur-sm group hover:scale-110 hover:shadow-xl hover:shadow-gold/20 active:scale-95"
                  aria-label="Previous testimonials"
                >
                  <ChevronLeft size={24} className="group-hover:scale-110 group-hover:-translate-x-0.5 transition-all" />
                </button>
                <button
                  onClick={isRtl ? handlePrev : handleNext}
                  className="absolute -right-4 md:right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-charcoal-light/80 hover:bg-gold text-white hover:text-charcoal transition-all duration-300 flex items-center justify-center shadow-lg backdrop-blur-sm group hover:scale-110 hover:shadow-xl hover:shadow-gold/20 active:scale-95"
                  aria-label="Next testimonials"
                >
                  <ChevronRight size={24} className="group-hover:scale-110 group-hover:translate-x-0.5 transition-all" />
                </button>
              </>
            )}

            {/* Carousel Container */}
            <div
              className="overflow-hidden mx-8 md:mx-16"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{
                  transform: `translateX(${isRtl ? currentIndex * (100 / itemsPerView) : -currentIndex * (100 / itemsPerView)}%)`,
                }}
              >
                {testimonials.map((testimonial, index) => (
                  <div
                    key={testimonial.id}
                    className="flex-shrink-0 px-3"
                    style={{ width: `${100 / itemsPerView}%` }}
                  >
                    <TestimonialCard testimonial={testimonial} index={index} />
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination Dots */}
            {totalDots > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: totalDots }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      currentIndex === index
                        ? 'bg-gold w-8 shadow-md shadow-gold/30'
                        : 'bg-charcoal-light w-2.5 hover:bg-gold/50 hover:scale-125'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Grid Display */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} index={index} />
            ))}
          </div>
        )}

        {/* View All Testimonials Button */}
        <div className="text-center mt-12">
          <Link
            href={`/${locale}/testimonials`}
            onMouseEnter={() => setIsLinkHovered(true)}
            onMouseLeave={() => setIsLinkHovered(false)}
            className={`inline-flex items-center gap-2 text-gold border rounded-lg px-6 py-3 transition-all duration-300 group ${
              isLinkHovered
                ? 'bg-gold/15 border-gold shadow-lg shadow-gold/20 scale-[1.02]'
                : 'border-gold/30 hover:bg-gold/10 hover:border-gold/60'
            }`}
          >
            <span className="font-medium">{isRtl ? 'عرض جميع التقييمات' : 'View All Testimonials'}</span>
            <ChevronRight
              size={18}
              className={`transition-all duration-300 ${
                isLinkHovered ? 'translate-x-1' : ''
              } ${isRtl ? 'rotate-180' : ''} ${isLinkHovered && isRtl ? '-translate-x-1' : ''}`}
            />
          </Link>
        </div>
      </div>
    </section>
  );
}
