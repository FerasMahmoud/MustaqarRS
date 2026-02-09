import React from 'react';

const AMENITY_ICONS: { [key: string]: React.ReactNode } = {
  wifi: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13zm15-5l2-2C16.93 2.93 7.08 2.93 1 9l2 2c4.97-4.97 13.03-4.97 18 0z" />
    </svg>
  ),
  'a/c': (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v4h2V7h12v2h2V5c0-1.1-.9-2-2-2zm0 6H5v8h14V9zm-5 7c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
    </svg>
  ),
  heating: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 13.5h2V16h-2zm0-4h2v2.5h-2zm0 8h2V22h-2zM5 13.5h2V16H5zm8-8h2v2.5h-2zM5 17.5h2V20H5zm0-8h2v2.5H5zm8-4h2v2.5h-2zm-4-1h2v3h-2zm0 12h2v3h-2z" />
    </svg>
  ),
  kitchen: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm0 16H5V8h14v11z" />
    </svg>
  ),
  'smart tv': (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z" />
    </svg>
  ),
  parking: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9h-8V3zm4 10h-4v4h-2v-4H7V9h10v4z" />
    </svg>
  ),
  wash: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 2h14c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm8 5c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
    </svg>
  ),
  pets: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM6 5.5c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
    </svg>
  ),
  workspace: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H4V4h14v10z" />
    </svg>
  ),
  security: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
    </svg>
  ),
  smart_lock: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5s-5 2.24-5 5v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
    </svg>
  ),
  smoking: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 7h-4v5h4V7zm-2 8c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm6-13h-4v2h4V2zm-3 18c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zM2 13h4v-2H2v2z" />
    </svg>
  ),
  hair_dryer: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.75 7L14 2.5l-3 3.54L9 6l3.25 3.77L9 13l2 1.5 3.75-4.54L18 17l2.25-2.54L23 15l-5.25-8zm.75 5l-1.5-2 1.5-1.73 1.5 2-1.5 1.73z" />
    </svg>
  ),
  iron: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 3h-4V1h-2v2H5c-1.1 0-2 .9-2 2v13c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 15H5V8h14v10z" />
    </svg>
  ),
  sofa: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H4V9h16v8z" />
    </svg>
  ),
  dining: (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
    </svg>
  ),
};

export function getAmenityIcon(amenity: string): React.ReactNode {
  const lowerAmenity = amenity.toLowerCase();

  // Direct matches
  if (AMENITY_ICONS[lowerAmenity]) return AMENITY_ICONS[lowerAmenity];

  // Partial matches
  if (lowerAmenity.includes('wifi')) return AMENITY_ICONS.wifi;
  if (lowerAmenity === 'a/c' || lowerAmenity === 'ac') return AMENITY_ICONS['a/c'];
  if (lowerAmenity.includes('heating')) return AMENITY_ICONS.heating;
  if (lowerAmenity.includes('kitchen')) return AMENITY_ICONS.kitchen;
  if (lowerAmenity.includes('tv') || lowerAmenity === 'smart tv') return AMENITY_ICONS['smart tv'];
  if (lowerAmenity.includes('parking')) return AMENITY_ICONS.parking;
  if (lowerAmenity.includes('wash')) return AMENITY_ICONS.wash;
  if (lowerAmenity.includes('pets')) return AMENITY_ICONS.pets;
  if (lowerAmenity.includes('workspace')) return AMENITY_ICONS.workspace;
  if (lowerAmenity.includes('security')) return AMENITY_ICONS.security;
  if (lowerAmenity.includes('smart_lock')) return AMENITY_ICONS.smart_lock;
  if (lowerAmenity.includes('smoking')) return AMENITY_ICONS.smoking;
  if (lowerAmenity.includes('hair_dryer')) return AMENITY_ICONS.hair_dryer;
  if (lowerAmenity.includes('iron')) return AMENITY_ICONS.iron;
  if (lowerAmenity.includes('sofa')) return AMENITY_ICONS.sofa;
  if (lowerAmenity.includes('dining')) return AMENITY_ICONS.dining;

  return null;
}
