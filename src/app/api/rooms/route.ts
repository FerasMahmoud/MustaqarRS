import { NextResponse } from 'next/server';
import { getAllRooms } from '@/lib/db';

// Default placeholder image for rooms without images
const PLACEHOLDER_IMAGE = '/room-images/mustaqar-suite/01-master-bedroom.webp';

// Rewrite image URLs for local development
function rewriteImageUrls(imageUrl: string, host: string): string {
  if (!imageUrl) return imageUrl;

  // If running locally, rewrite vercel URLs to localhost
  if (host?.includes('localhost') || host?.includes('127.0.0.1')) {
    return imageUrl.replace(
      'https://mustaqar.vercel.app',
      `http://${host.split(':')[0]}:${host.split(':')[1] || '3000'}`
    );
  }

  return imageUrl;
}

export async function GET(request: Request) {
  try {
    // Get all rooms from JSON database
    const rooms = getAllRooms();

    const host = request.headers.get('host') || 'localhost:3000';

    // Process rooms to ensure proper data structure
    const processedRooms = rooms.map((room) => ({
      ...room,
      // Ensure images is always an array with at least one placeholder
      images: room.images && room.images.length > 0
        ? room.images.map((img: string) => rewriteImageUrls(img, host))
        : [PLACEHOLDER_IMAGE],
      // Ensure amenities is always an array
      amenities: Array.isArray(room.amenities)
        ? room.amenities
        : [],
      // Ensure numeric fields have defaults
      monthly_rate: room.monthly_rate || 0,
      yearly_rate: room.yearly_rate || 0,
      size_sqm: room.size_sqm || 0,
      capacity: room.capacity || 2,
      featured: room.featured || false,
    }));

    // Cache headers - short cache to pick up room changes quickly
    return NextResponse.json(processedRooms, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300, max-age=30',
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
