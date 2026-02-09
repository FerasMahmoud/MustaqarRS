'use client';

import { useState } from 'react';
import { Play, ChevronRight, Users, Maximize2, Sparkles, Check, CheckCircle2, ArrowRight } from 'lucide-react';
import Image from 'next/image';

// Mock data for design preview
const mockRoom = {
  id: 'room-1',
  name: 'Luxury Studio',
  name_ar: 'استوديو فاخر',
  description: 'Premium studio with stunning city views',
  description_ar: 'استوديو فاخر مع إطلالات مدينة رائعة',
  size_sqm: 45,
  capacity: 2,
  monthly_rate: 5900,
  yearly_rate: 59000,
  featured: true,
  images: [
    '/room-images/mustaqar-suite/01-master-bedroom.webp',
    '/room-images/mustaqar-suite/02-bedroom-wardrobe.webp',
    '/room-images/mustaqar-suite/03-bedroom-full-view.webp',
    '/room-images/mustaqar-suite/04-second-bedroom.webp',
    '/room-images/mustaqar-suite/05-vanity-dressing.webp',
  ],
  amenities: ['WiFi', 'Smart TV', 'Kitchen', 'Parking', 'AC', 'Washing Machine'],
  slug: 'luxury-studio',
};

const amenityIconMap: Record<string, React.ReactNode> = {
  'WiFi': '📡',
  'Smart TV': '📺',
  'Kitchen': '🍽️',
  'Parking': '🚗',
  'AC': '❄️',
  'Washing Machine': '🧺',
  'Workspace': '💻',
  'Security': '🔒',
};

interface StudioCardDesignProps {
  isRtl?: boolean;
  selected?: boolean;
  hovering?: boolean;
}

export function StudioCardDesign({ isRtl = false, selected: initialSelected = false, hovering: initialHovering = false }: StudioCardDesignProps) {
  const [selected, setSelected] = useState(initialSelected);
  const [hovering, setHovering] = useState(initialHovering);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const savingsPercent = Math.round(((mockRoom.yearly_rate / 12 - mockRoom.monthly_rate) / (mockRoom.yearly_rate / 12)) * 100);

  const handleSelect = () => {
    setSelected(!selected);
  };

  return (
    <article
      className={`
        group relative rounded-2xl overflow-hidden border-2 transition-all duration-300 cursor-pointer
        ${selected
          ? 'border-[#C9A96E] bg-gradient-to-br from-[#C9A96E]/5 to-transparent shadow-xl shadow-[#C9A96E]/20 ring-2 ring-[#C9A96E] ring-offset-2'
          : 'border-transparent bg-white shadow-md hover:shadow-2xl hover:shadow-[#C9A96E]/10 hover:-translate-y-1'
        }
      `}
      onClick={handleSelect}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* 3-Column Layout: Video (50%) | Thumbnails (25%) | Text (25%) */}
      <div className="grid grid-cols-1 lg:grid-cols-[50%_25%_25%] gap-0 min-h-[320px]">

        {/* SECTION 1: VIDEO PLAYER (50% width on desktop) */}
        <div className="relative w-full aspect-video lg:aspect-auto lg:h-full overflow-hidden rounded-t-2xl lg:rounded-l-2xl lg:rounded-tr-none">
          {/* Video/Image */}
          <Image
            src={mockRoom.images[activeMediaIndex]}
            alt="Studio tour"
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/20" />

          {/* Play Button Overlay (on hover) */}
          <button className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                <Play className="w-6 h-6 text-[#C9A96E] fill-[#C9A96E]" />
              </div>
            </div>
          </button>

          {/* Featured Badge */}
          {mockRoom.featured && (
            <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-[#C9A96E] text-white text-xs font-bold shadow-lg shadow-[#C9A96E]/30 flex items-center gap-1.5 z-10">
              <Sparkles className="w-3 h-3" fill="white" />
              {isRtl ? 'مميز' : 'Featured'}
            </div>
          )}
        </div>

        {/* SECTION 2: THUMBNAIL GRID (25% width on desktop) */}
        <div className={`hidden lg:grid grid-cols-2 gap-2 p-3 bg-[#FAF7F2]/50 overflow-hidden ${isRtl ? 'direction-rtl' : ''}`}>
          {mockRoom.images.slice(0, 4).map((img, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setActiveMediaIndex(idx);
              }}
              className={`
                relative aspect-square overflow-hidden rounded-lg border-2 transition-all
                ${activeMediaIndex === idx
                  ? 'border-[#C9A96E]'
                  : 'border-transparent hover:border-[#C9A96E]/50'
                }
              `}
            >
              <Image
                src={img}
                alt={`View ${idx + 1}`}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
              {/* Active indicator */}
              {activeMediaIndex === idx && (
                <div className="absolute inset-0 bg-[#C9A96E]/10" />
              )}
            </button>
          ))}

          {/* +X More Indicator */}
          {mockRoom.images.length > 4 && (
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-[#1A1A1A]/80 backdrop-blur-sm rounded-full text-white text-xs font-semibold">
              +{mockRoom.images.length - 4}
            </div>
          )}
        </div>

        {/* Mobile: 4-column thumbnail strip */}
        <div className={`lg:hidden col-span-1 flex overflow-x-auto gap-2 p-3 bg-[#FAF7F2]/50 ${isRtl ? 'direction-rtl' : ''}`}>
          {mockRoom.images.slice(0, 4).map((img, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setActiveMediaIndex(idx);
              }}
              className={`
                relative aspect-square w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all
                ${activeMediaIndex === idx
                  ? 'border-[#C9A96E]'
                  : 'border-transparent'
                }
              `}
            >
              <Image
                src={img}
                alt={`View ${idx + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>

        {/* SECTION 3: TEXT CONTENT (25% width on desktop) */}
        <div className={`p-4 lg:p-6 flex flex-col justify-between ${isRtl ? 'text-right' : 'text-left'}`}>

          {/* Header */}
          <div className="space-y-3">
            <h3 className={`text-xl lg:text-2xl font-semibold transition-colors duration-300 ${
              selected ? 'text-[#C9A96E]' : 'text-[#1A1A1A] group-hover:text-[#C9A96E]'
            }`}>
              {isRtl ? mockRoom.name_ar : mockRoom.name}
            </h3>

            {/* Size + Capacity */}
            <div className={`flex items-center gap-4 text-xs lg:text-sm text-[#6B6B6B] ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Maximize2 className="w-4 h-4 text-[#C9A96E]" />
                <span>{mockRoom.size_sqm}m²</span>
              </div>
              <div className={`flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Users className="w-4 h-4 text-[#C9A96E]" />
                <span>{mockRoom.capacity} {isRtl ? 'ضيوف' : 'guests'}</span>
              </div>
            </div>

            {/* Amenities Preview (Top 3 default, all on hover) */}
            <div className={`flex items-center gap-2 flex-wrap py-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              {mockRoom.amenities.slice(0, hovering ? mockRoom.amenities.length : 3).map((amenity, idx) => (
                <div
                  key={idx}
                  className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg bg-[#C9A96E]/10 flex items-center justify-center transition-all duration-300 group-hover:bg-[#C9A96E]/20 group-hover:scale-105 text-lg lg:text-xl"
                  title={amenity}
                >
                  {amenityIconMap[amenity] || '✨'}
                </div>
              ))}
              {!hovering && mockRoom.amenities.length > 3 && (
                <span className="text-xs text-[#6B6B6B]">+{mockRoom.amenities.length - 3}</span>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="space-y-3">
            {/* Price */}
            <div className={`flex items-baseline gap-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <span className="text-xs lg:text-sm text-[#6B6B6B]">{isRtl ? 'من' : 'From'}</span>
              <span className={`text-2xl lg:text-3xl font-bold transition-colors ${
                selected ? 'text-[#C9A96E]' : 'text-[#1A1A1A]'
              }`}>
                {mockRoom.monthly_rate.toLocaleString()}
              </span>
              <span className="text-xs lg:text-sm text-[#6B6B6B]">{isRtl ? '/شهر' : '/mo'}</span>
            </div>

            {/* Hover: Show yearly price + savings */}
            {hovering && (
              <div className={`text-xs text-emerald-600 transition-opacity ${isRtl ? 'flex-row-reverse' : ''}`}>
                {mockRoom.yearly_rate.toLocaleString()}{isRtl ? '/سنة' : '/yr'} · {isRtl ? 'وفّر' : 'Save'} {savingsPercent}%
              </div>
            )}

            {/* View Details Button */}
            <button
              className="w-full py-2.5 px-3 rounded-lg border-2 border-[#C9A96E] text-[#C9A96E] font-medium text-sm hover:bg-[#C9A96E]/10 transition-colors flex items-center justify-center gap-2 group/btn"
              onClick={(e) => e.stopPropagation()}
            >
              {isRtl ? 'عرض التفاصيل' : 'View Details'}
              <ArrowRight className={`w-4 h-4 group-hover/btn:translate-x-1 transition-transform ${isRtl ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Selection Indicator (Checkmark in corner) */}
      {selected && (
        <div className="absolute top-4 right-4 lg:hidden w-10 h-10 rounded-full bg-[#C9A96E] flex items-center justify-center shadow-lg shadow-[#C9A96E]/40 z-20">
          <CheckCircle2 className="w-6 h-6 text-white" />
        </div>
      )}
    </article>
  );
}
