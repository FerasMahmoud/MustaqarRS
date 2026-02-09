'use client';

import { useLocale } from 'next-intl';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Room } from '@/lib/supabase';
import { ChevronLeft, ChevronRight, X, Sparkles } from 'lucide-react';
import { getAmenityIcon } from './AmenityIcon';


// Hero Section Skeleton - shows while rooms data loads
function HeroSkeleton({ isRtl }: { isRtl: boolean }) {
  return (
    <div className="grid grid-cols-1 max-w-4xl mx-auto gap-8 pb-16">
      {[0].map((i) => (
        <div key={i} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
          {/* Video skeleton */}
          <div className="h-80 md:h-96 bg-gray-200" />
          {/* Gallery skeleton */}
          <div className="px-4 py-4 border-b border-[#E8E3DB]">
            <div className="h-4 w-32 bg-gray-200 rounded mb-3" />
            <div className="flex gap-3">
              {[0, 1, 2, 3].map((j) => (
                <div key={j} className="w-32 h-32 md:w-40 md:h-40 bg-gray-200 rounded-xl flex-shrink-0" />
              ))}
            </div>
          </div>
          {/* Content skeleton */}
          <div className="p-6">
            <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
            <div className="h-4 w-full bg-gray-200 rounded mb-2" />
            <div className="h-4 w-3/4 bg-gray-200 rounded mb-5" />
            <div className="flex gap-2 mb-5">
              {[0, 1, 2, 3].map((j) => (
                <div key={j} className="w-16 h-16 bg-gray-200 rounded-lg" />
              ))}
            </div>
            <div className="border-t border-[#E8E3DB] pt-5">
              <div className="h-8 w-32 bg-gray-200 rounded mb-3" />
              <div className="h-10 w-full bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}


// Calculate discount percentage based on duration in months
function getDiscountPercent(months: number): number {
  if (months <= 2) return 0;
  if (months <= 5) return 5;
  if (months <= 8) return 7;
  if (months <= 11) return 9;
  if (months <= 14) return 11;
  if (months <= 17) return 13;
  if (months <= 20) return 15;
  if (months <= 23) return 17;
  if (months <= 26) return 19;
  if (months <= 29) return 21;
  if (months <= 32) return 23;
  return 25;
}

export function Hero() {
  const locale = useLocale();
  const router = useRouter();
  const isRtl = locale === 'ar';

  // Rooms data from API with loading state
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<{ roomId: string; imageUrl: string; index: number } | null>(null);
  const [showVirtualTour, setShowVirtualTour] = useState(false);
  const [amenityScrollPositions, setAmenityScrollPositions] = useState<{ [key: string]: number }>({});

  // Description overrides for rooms with short database descriptions
  const descriptionOverrides: { [slug: string]: { en: string; ar: string } } = {};

  // Fetch rooms from API with caching
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        // Use cache headers for faster subsequent loads
        const response = await fetch('/api/rooms', {
          next: { revalidate: 300 }, // Cache for 5 minutes
        });
        if (!response.ok) throw new Error('Failed to fetch rooms');
        const data: Room[] = await response.json();
        setRooms(data);
      } catch (err) {
        console.error('Error fetching rooms:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRooms();
  }, []);

  // Find current room and image for navigation
  const getCurrentRoom = () => {
    if (!selectedImage) return null;
    return rooms.find(r => r.id === selectedImage.roomId);
  };

  const handleNextImage = () => {
    const room = getCurrentRoom();
    if (!room || !selectedImage) return;
    const nextIndex = (selectedImage.index + 1) % room.images.length;
    setSelectedImage({ roomId: room.id, imageUrl: room.images[nextIndex], index: nextIndex });
  };

  const handlePrevImage = () => {
    const room = getCurrentRoom();
    if (!room || !selectedImage) return;
    const prevIndex = (selectedImage.index - 1 + room.images.length) % room.images.length;
    setSelectedImage({ roomId: room.id, imageUrl: room.images[prevIndex], index: prevIndex });
  };

  return (
    <section className="relative pt-20 bg-[#FAF7F2] overflow-hidden">
      {/* Geometric pattern overlay */}
      <div className="geometric-pattern" />
      <div className="container-luxury relative z-10">
        {/* Hero Header - Image 1 Style */}
        <div className={`pt-8 pb-12 ${isRtl ? 'text-right' : 'text-left'}`}>
          <h1 className="heading-serif text-5xl md:text-6xl lg:text-7xl text-[#1A1A1A] mb-6 animate-fade-in-up leading-[1.1]">
            {isRtl ? 'استمتع بأفضل تجربة سكن فاخرة' : 'Experience the best modern living luxury'}
          </h1>

          {/* Gold underline */}
          <div className={`w-24 h-1.5 bg-gold mb-8 ${isRtl ? 'mr-0 ml-auto' : ''}`} />

          <p className="text-booking-section text-[#4A4A4A] animate-fade-in animation-delay-200 font-light leading-relaxed max-w-3xl">
            {isRtl
              ? 'اختر مساحتك المثالية للإيجار الشهري أو السنوي. جميع المرافق مشمولة.'
              : 'Choose your perfect space for monthly or yearly rental. All utilities included.'}
          </p>
        </div>

        {/* Room Preview Cards - Detailed Style */}
        {isLoading && <HeroSkeleton isRtl={isRtl} />}
        {!isLoading && rooms.length > 0 && (
          <div className={`grid gap-8 pb-16 ${rooms.length === 1 ? 'grid-cols-1 max-w-4xl mx-auto' : 'grid-cols-1 md:grid-cols-2'}`}>
            {rooms.slice(0, 2).reverse().map((room, index) => (
              <div
                key={room.id}
                className={`bg-white rounded-2xl shadow-lg overflow-hidden hover-room-card group animate-fade-in-up ${
                  index === 0 ? 'animation-delay-300' : 'animation-delay-400'
                }`}
              >
                {/* Video Section - First video loads with priority for faster LCP */}
                <div className="relative h-80 md:h-96 overflow-hidden bg-black group">
                  <Image
                    src={room.images?.[0] || '/room-images/mustaqar-suite/01-master-bedroom.webp'}
                    alt={isRtl ? room.name_ar : room.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    priority={index === 0}
                  />

                  {index === 0 && (
                    <span className="absolute top-4 left-4 bg-gold/90 text-white text-xs font-medium px-3 py-1.5 rounded z-20">
                      {isRtl ? 'مميز' : 'FEATURED'}
                    </span>
                  )}
                </div>

                {/* Horizontal Scrollable Image Gallery - Larger Thumbnails */}
                {room.images && room.images.length > 0 && (
                  <div className="px-4 py-4 border-b border-[#E8E3DB] bg-gradient-to-r from-white to-[#FAF7F2]">
                    <div className="relative group/gallery">
                      {/* Left Arrow */}
                      <button
                        onClick={() => {
                          const container = document.getElementById(`gallery-${room.id}`);
                          if (container) container.scrollBy({ left: isRtl ? 160 : -160, behavior: 'smooth' });
                        }}
                        className={`absolute ${isRtl ? 'right-0' : 'left-0'} top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 shadow-md rounded-full flex items-center justify-center opacity-0 group-hover/gallery:opacity-100 transition-opacity hover:bg-gold hover:text-white`}
                      >
                        <ChevronLeft className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                      </button>

                      <div
                        id={`gallery-${room.id}`}
                        className={`flex gap-3 overflow-x-auto pb-2 scrollbar-hide ${isRtl ? 'flex-row-reverse' : ''}`}
                      >
                        {/* Virtual Tour Button - First in gallery */}
                        <button
                          onClick={() => setShowVirtualTour(true)}
                          className="flex-shrink-0 relative w-32 h-32 md:w-40 md:h-40 rounded-xl overflow-hidden border-2 border-gold/50 hover:border-gold hover:shadow-lg transition-all cursor-pointer group/tour bg-gradient-to-br from-[#1A1A1A] to-[#2D2D2D]"
                          aria-label={isRtl ? 'جولة افتراضية' : 'Virtual Tour'}
                        >
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
                            <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center group-hover/tour:bg-gold/40 group-hover/tour:scale-110 transition-all">
                              <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 9a3 3 0 016 0v6a3 3 0 01-6 0V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12h6M3 12h6" />
                              </svg>
                            </div>
                            <span className="text-xs font-bold text-gold tracking-wide">
                              {isRtl ? 'جولة افتراضية' : 'Virtual Tour'}
                            </span>
                            <span className="text-[10px] text-white/60">3D</span>
                          </div>
                        </button>
                        {room.images.map((img, imgIdx) => (
                          <button
                            key={imgIdx}
                            onClick={() => setSelectedImage({ roomId: room.id, imageUrl: img, index: imgIdx })}
                            className="flex-shrink-0 relative w-32 h-32 md:w-40 md:h-40 rounded-xl overflow-hidden border-2 border-transparent hover:border-gold hover:shadow-lg transition-all cursor-pointer group/thumb"
                            aria-label={`${isRtl ? 'عرض الصورة' : 'View image'} ${imgIdx + 1} ${isRtl ? 'من' : 'of'} ${room.images.length}`}
                          >
                            <Image
                              src={img}
                              alt={`${isRtl ? room.name_ar : room.name} - ${imgIdx + 1}`}
                              fill
                              className="object-cover group-hover/thumb:scale-110 transition-transform duration-300"
                              loading={imgIdx === 0 ? 'eager' : 'lazy'}
                              sizes="(max-width: 768px) 128px, 160px"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/thumb:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>

                      {/* Right Arrow */}
                      <button
                        onClick={() => {
                          const container = document.getElementById(`gallery-${room.id}`);
                          if (container) container.scrollBy({ left: isRtl ? -160 : 160, behavior: 'smooth' });
                        }}
                        className={`absolute ${isRtl ? 'left-0' : 'right-0'} top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 shadow-md rounded-full flex items-center justify-center opacity-0 group-hover/gallery:opacity-100 transition-opacity hover:bg-gold hover:text-white`}
                      >
                        <ChevronRight className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Card Content */}
                <div className="p-6">
                  {/* Title with capacity and size */}
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="room-name text-booking-section text-[#1A1A1A]">
                      {isRtl ? room.name_ar : room.name}
                    </h3>
                    <div className="flex items-center gap-3 text-booking-body text-[#5A5A5A]">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{room.capacity || 2}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{room.size_sqm || 45}m²</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-booking-body text-[#5A5A5A] mb-5 line-clamp-2 leading-relaxed">
                    {isRtl
                      ? (descriptionOverrides[room.slug]?.ar || room.description_ar)
                      : (descriptionOverrides[room.slug]?.en || room.description)
                    }
                  </p>

                  {/* Amenities - Scrollable Single Row */}
                  <div className="mb-5">
                    <div className="relative group">
                      {/* Left Arrow */}
                      <button
                        onClick={() => {
                          const container = document.getElementById(`amenities-${room.id}`);
                          if (container) {
                            container.scrollBy({ left: -150, behavior: 'smooth' });
                          }
                        }}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-gold rounded-full p-2 shadow-lg opacity-50 group-hover:opacity-100 transition-opacity duration-300"
                        aria-label="Scroll left"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      {/* Amenities Container */}
                      <div
                        id={`amenities-${room.id}`}
                        className="flex gap-2.5 overflow-x-auto scrollbar-hide scroll-smooth relative px-12"
                      >
                        {/* Right Fade Indicator */}
                        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white via-white/50 to-transparent pointer-events-none z-5" />
                      {(room.amenities || ['WiFi', 'A/C', 'Kitchen', 'Smart TV']).map((amenity, i) => {
                        const formatAmenityText = (text: string) => {
                          const formatted = text
                            .replace(/_/g, ' ')
                            .split(' ')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(' ');
                          return formatted
                            .replace(/wifi/i, 'WiFi')
                            .replace(/a\/c/i, 'A/C')
                            .replace(/tv/i, 'TV')
                            .replace(/smart tv/i, 'Smart TV')
                            .replace(/smart lock/i, 'Smart Lock')
                            .replace(/hair dryer/i, 'Hair Dryer')
                            .replace(/sofa bed/i, 'Sofa Bed')
                            .replace(/dining table/i, 'Dining Table')
                            .replace(/washing machine/i, 'Washing Machine');
                        };

                        return (
                          <div
                            key={i}
                            className="inline-flex flex-col items-center gap-1.5 px-3 py-2 bg-[#FAF7F2] rounded-lg border border-[#E8E3DB] hover:border-gold hover:bg-gold/5 transition-all duration-300 cursor-default group"
                          >
                            <div className="w-6 h-6 flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                              {getAmenityIcon(amenity)}
                            </div>
                            <span className="text-booking-label-lg font-bold text-[#1A1A1A] text-center whitespace-nowrap">
                              {formatAmenityText(amenity)}
                            </span>
                          </div>
                        );
                      })}
                      </div>

                      {/* Right Arrow */}
                      <button
                        onClick={() => {
                          const container = document.getElementById(`amenities-${room.id}`);
                          if (container) {
                            container.scrollBy({ left: 150, behavior: 'smooth' });
                          }
                        }}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white text-gold rounded-full p-2 shadow-lg opacity-50 group-hover:opacity-100 transition-opacity duration-300"
                        aria-label="Scroll right"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Price Section */}
                  <div className="border-t border-[#E8E3DB] pt-5">
                    <div className={`flex items-center gap-2 mb-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <p className="text-booking-label-lg text-[#8B7355] uppercase tracking-wider font-medium">
                        {isRtl ? 'السعر يبدأ من' : 'STARTING PRICE'}
                      </p>
                      <div className="inline-flex bg-emerald-500 text-white !text-white px-3 py-1.5 rounded-lg text-booking-label-lg font-bold w-fit">
                        {isRtl ? 'وفر 500 ر.س' : 'Save 500 SAR'}
                      </div>
                    </div>

                    {/* Price Comparison with Badge */}
                    <div className="space-y-3">
                      {/* Prices Row */}
                      <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                        {/* Original Price (Struck Through) - 500 SAR MORE */}
                        <div className={`flex flex-col items-center gap-1 ${isRtl ? 'text-right' : ''}`}>
                          <p className="text-booking-body text-[#999999] line-through font-medium font-tabular">
                            {(room.monthly_rate! + 500).toLocaleString()}
                          </p>
                          <p className="text-booking-label text-[#999999]">
                            SAR/{isRtl ? 'شهر' : 'month'}
                          </p>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-14 bg-[#E8E3DB]" />

                        {/* Current Price */}
                        <div className="flex items-baseline gap-2">
                          <span className="text-price-hero font-semibold text-[#1A1A1A] font-tabular">
                            {room.monthly_rate?.toLocaleString()}
                          </span>
                          <span className="text-booking-label font-normal text-[#6B6B6B]">
                            SAR/{isRtl ? 'شهر' : 'month'}
                          </span>
                        </div>
                      </div>

                      {/* Gold Best Rate Badge - Below price on its own row */}
                      {(() => {
                        const bestDealDiscount = getDiscountPercent(12);
                        const discountedMonthlyRate = Math.round(room.monthly_rate! * (1 - bestDealDiscount / 100));
                        return (
                          <div className={`flex ${isRtl ? 'justify-end' : 'justify-start'}`}>
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#C9A96E] via-[#D4B896] to-[#C9A96E] text-white font-semibold shadow-lg shadow-[#C9A96E]/40 hover:scale-105 transition-transform duration-300 animate-pulse-subtle ${isRtl ? 'flex-row-reverse' : ''}`}>
                              <Sparkles className="w-4 h-4 flex-shrink-0" />
                              <span className="text-xs sm:text-sm font-semibold leading-tight">
                                {isRtl
                                  ? `وفر حتى ${discountedMonthlyRate.toLocaleString()} ر.س/شهر عند حجز 12 شهر`
                                  : `Save up to ${discountedMonthlyRate.toLocaleString()}/mo when booking 12 months`
                                }
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-5">
                    <button
                      onClick={() => router.push(`/${locale}/book/${room.slug}`)}
                      onMouseEnter={() => router.prefetch(`/${locale}/book/${room.slug}`)}
                      className="w-full py-3 bg-gold text-white rounded-lg font-medium hover:bg-gold-dark hover-shine transition-all duration-300 flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-gold/30 active-scale"
                    >
                      {isRtl ? 'احجز الاستوديو الخاص بك' : 'Book Now'}
                      <svg className="w-4 h-4 transition-transform hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center backdrop-blur-sm p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative w-auto h-auto max-w-4xl max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gold transition-colors z-20 p-2"
              aria-label={isRtl ? 'إغلاق معرض الصور' : 'Close image gallery'}
            >
              <X className="w-8 h-8" />
            </button>

            {/* Image Container */}
            <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl">
              <Image
                src={selectedImage.imageUrl}
                alt="Preview"
                width={800}
                height={600}
                className="object-contain"
                priority
              />
            </div>

            {/* Navigation Arrows */}
            {getCurrentRoom() && getCurrentRoom()!.images.length > 1 && (
              <>
                {/* Previous Button */}
                <button
                  onClick={handlePrevImage}
                  className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gold rounded-full p-3 transition-all shadow-lg z-20"
                  aria-label={isRtl ? 'الصورة السابقة' : 'Previous image'}
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>

                {/* Next Button */}
                <button
                  onClick={handleNextImage}
                  className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gold rounded-full p-3 transition-all shadow-lg z-20"
                  aria-label={isRtl ? 'الصورة التالية' : 'Next image'}
                >
                  <ChevronRight className="w-6 h-6" />
                </button>

                {/* Image Counter */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium z-20">
                  {selectedImage.index + 1} / {getCurrentRoom()?.images.length}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Virtual Tour Modal */}
      {showVirtualTour && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-sm p-4"
          onClick={() => setShowVirtualTour(false)}
        >
          <div
            className="relative w-full max-w-6xl h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowVirtualTour(false)}
              className="absolute -top-10 right-0 text-white hover:text-gold transition-colors z-20 p-2 flex items-center gap-2"
              aria-label={isRtl ? 'إغلاق الجولة الافتراضية' : 'Close virtual tour'}
            >
              <span className="text-sm font-medium">{isRtl ? 'إغلاق' : 'Close'}</span>
              <X className="w-8 h-8" />
            </button>

            {/* Matterport iframe */}
            <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl bg-black">
              <iframe
                src="https://my.matterport.com/show/?m=hycWQHnQ4cZ"
                className="w-full h-full"
                allowFullScreen
                allow="fullscreen; xr-spatial-tracking"
                title={isRtl ? 'جولة افتراضية ثلاثية الأبعاد' : '3D Virtual Tour'}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
