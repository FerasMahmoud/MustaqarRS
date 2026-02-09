'use client';

import { ShoppingBag, UtensilsCrossed, Building2, Landmark, Train, Grid, ChevronLeft, ChevronRight } from 'lucide-react';
import { POICategory } from './PointsOfInterest';
import { useRef, useState, useEffect } from 'react';

interface POICategoryFilterProps {
  selected: string;
  onSelect: (category: POICategory | 'all') => void;
  isRtl: boolean;
}

const categoryConfigs: Array<{
  key: POICategory;
  icon: typeof ShoppingBag;
  label: { en: string; ar: string };
  iconColor: string;
}> = [
  {
    key: 'shopping',
    icon: ShoppingBag,
    label: { en: 'Shopping', ar: 'التسوق' },
    iconColor: 'bg-emerald-50 text-emerald-600'
  },
  {
    key: 'dining',
    icon: UtensilsCrossed,
    label: { en: 'Dining', ar: 'المطاعم' },
    iconColor: 'bg-amber-50 text-amber-600'
  },
  {
    key: 'business_services',
    icon: Building2,
    label: { en: 'Business & Services', ar: 'الأعمال والخدمات' },
    iconColor: 'bg-blue-50 text-blue-600'
  },
  {
    key: 'cultural_tourist',
    icon: Landmark,
    label: { en: 'Culture & Tourism', ar: 'الثقافة والسياحة' },
    iconColor: 'bg-purple-50 text-purple-600'
  },
  {
    key: 'transportation',
    icon: Train,
    label: { en: 'Transportation', ar: 'المواصلات' },
    iconColor: 'bg-orange-50 text-orange-600'
  }
];

export function POICategoryFilter({
  selected,
  onSelect,
  isRtl
}: POICategoryFilterProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const allFilter: {
    key: 'all';
    icon: typeof Grid;
    label: { en: string; ar: string };
  } = {
    key: 'all',
    icon: Grid,
    label: { en: 'All', ar: 'الكل' }
  };

  const filters: Array<{
    key: POICategory | 'all';
    icon: typeof Grid;
    label: { en: string; ar: string };
  }> = [allFilter, ...categoryConfigs];

  // Check if arrows are needed
  const checkArrows = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkArrows();
    window.addEventListener('resize', checkArrows);
    return () => window.removeEventListener('resize', checkArrows);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const newScroll = direction === 'left'
        ? currentScroll - scrollAmount
        : currentScroll + scrollAmount;

      scrollContainerRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });

      setTimeout(checkArrows, 300);
    }
  };

  return (
    <div className="relative mb-8 flex items-center gap-3">
      {/* Left Arrow */}
      {showLeftArrow && (
        <button
          onClick={() => scroll('left')}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-gold hover:bg-gold/90 text-white flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 z-10"
          aria-label="Scroll left"
        >
          <ChevronLeft size={20} className={isRtl ? 'rotate-180' : ''} />
        </button>
      )}

      {/* Filter Container */}
      <div
        ref={scrollContainerRef}
        onScroll={checkArrows}
        className="flex gap-3 overflow-x-auto flex-1 scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {filters.map((filter) => {
          const Icon = filter.icon;
          const isActive = selected === filter.key;

          return (
            <button
              key={filter.key}
              onClick={() => onSelect(filter.key)}
              className={`
                flex items-center gap-2 px-5 py-2.5 rounded-full border-2 transition-all duration-300 whitespace-nowrap flex-shrink-0
                ${isActive
                  ? 'bg-gold border-gold text-white shadow-lg shadow-gold/25'
                  : 'border-gold/30 text-[#1A1A1A] hover:border-gold hover:bg-gold/5'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">
                {isRtl ? filter.label.ar : filter.label.en}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right Arrow */}
      {showRightArrow && (
        <button
          onClick={() => scroll('right')}
          className="flex-shrink-0 w-10 h-10 rounded-full bg-gold hover:bg-gold/90 text-white flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95 z-10"
          aria-label="Scroll right"
        >
          <ChevronRight size={20} className={isRtl ? 'rotate-180' : ''} />
        </button>
      )}
    </div>
  );
}
