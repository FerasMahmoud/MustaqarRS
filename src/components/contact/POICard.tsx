'use client';

import { ShoppingBag, UtensilsCrossed, Building2, Landmark, Train, MapPin } from 'lucide-react';
import { POICategory } from './PointsOfInterest';

interface PointOfInterest {
  id: string;
  category: POICategory;
  name: { en: string; ar: string };
  distance: { en: string; ar: string };
  timeEstimate: { en: string; ar: string };
  coordinates: { lat: number; lng: number };
}

interface POICardProps {
  poi: PointOfInterest;
  isRtl: boolean;
  index: number;
  studioCoordinates?: { lat: number; lng: number }; // Studio location for directions
}

const categoryIconMap = {
  shopping: {
    icon: ShoppingBag,
    color: 'bg-emerald-50 text-emerald-600',
    containerColor: 'bg-gradient-to-br from-emerald-500 to-emerald-600'
  },
  dining: {
    icon: UtensilsCrossed,
    color: 'bg-amber-50 text-amber-600',
    containerColor: 'bg-gradient-to-br from-amber-500 to-amber-600'
  },
  business_services: {
    icon: Building2,
    color: 'bg-blue-50 text-blue-600',
    containerColor: 'bg-gradient-to-br from-blue-500 to-blue-600'
  },
  cultural_tourist: {
    icon: Landmark,
    color: 'bg-purple-50 text-purple-600',
    containerColor: 'bg-gradient-to-br from-purple-500 to-purple-600'
  },
  transportation: {
    icon: Train,
    color: 'bg-orange-50 text-orange-600',
    containerColor: 'bg-gradient-to-br from-orange-500 to-orange-600'
  }
};

export function POICard({ poi, isRtl, index, studioCoordinates }: POICardProps) {
  const categoryConfig = categoryIconMap[poi.category];
  const Icon = categoryConfig.icon;

  // Generate Google Maps directions link FROM studio TO destination
  const openGoogleMaps = () => {
    // Use provided studio coordinates, fallback to Qurtubah studio if not provided
    const origin = studioCoordinates || { lat: 24.8118, lng: 46.7391 };
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${poi.coordinates.lat},${poi.coordinates.lng}`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <button
      onClick={openGoogleMaps}
      className={`
        flex items-start gap-4 p-6 ${categoryConfig.containerColor}
        hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1
        transition-all duration-300 rounded-2xl group animate-fade-in-up
        opacity-0 w-full text-left active:scale-95 relative overflow-hidden
        ${isRtl ? 'flex-row-reverse text-right' : ''}
      `}
      style={{ animationDelay: `${index * 50}ms` }}
      title={isRtl ? 'فتح في خرائط جوجل' : 'Open in Google Maps'}
    >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Category Icon */}
      <div className={`
        w-14 h-14 flex items-center justify-center rounded-xl flex-shrink-0
        group-hover:scale-110 transition-transform duration-300
        bg-white/20 backdrop-blur-sm z-10
      `}>
        <Icon className="w-7 h-7 text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 z-10">
        <div className="flex items-center gap-2 mb-2">
          <h4 className="text-white text-lg font-semibold group-hover:text-white/90 transition-colors duration-300">
            {isRtl ? poi.name.ar : poi.name.en}
          </h4>
          <MapPin className="w-4 h-4 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0" />
        </div>
        <p className="text-white/80 text-sm flex items-center gap-1.5">
          <span>{isRtl ? poi.distance.ar : poi.distance.en}</span>
          <span className="text-white/50">•</span>
          <span>{isRtl ? poi.timeEstimate.ar : poi.timeEstimate.en}</span>
        </p>
      </div>
    </button>
  );
}
