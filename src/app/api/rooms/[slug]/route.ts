import { NextResponse } from 'next/server';
import { getRoomById, getRoomBySlug } from '@/lib/db';

// Default placeholder image for rooms without images
const PLACEHOLDER_IMAGE = '/room-images/comfort-studio/01-main-bedroom.jpg';

// Rewrite image URLs for local development
function rewriteImageUrls(imageUrl: string, host: string): string {
  if (!imageUrl) return imageUrl;

  // If running locally, rewrite vercel URLs to localhost
  if (host?.includes('localhost') || host?.includes('127.0.0.1')) {
    return imageUrl.replace(
      'https://studio-rentals.vercel.app',
      `http://${host.split(':')[0]}:${host.split(':')[1] || '3000'}`
    );
  }

  return imageUrl;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // Check if it's a UUID (for backward compatibility) or a slug
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const isUUID = uuidRegex.test(slug);

    // Get room from JSON database
    let room;
    if (isUUID) {
      // Fetch by ID for backward compatibility
      room = getRoomById(slug);
    } else {
      // Fetch by slug
      room = getRoomBySlug(slug);
    }

    if (!room) {
      return NextResponse.json(
        { error: 'Room not found' },
        { status: 404 }
      );
    }

    const host = request.headers.get('host') || 'localhost:3000';

    // Process room to ensure proper data structure
    const processedRoom = {
      ...room,
      images: room.images && room.images.length > 0
        ? room.images.map((img: string) => rewriteImageUrls(img, host))
        : [PLACEHOLDER_IMAGE],
      amenities: Array.isArray(room.amenities)
        ? room.amenities
        : [],
      monthly_rate: room.monthly_rate || 0,
      yearly_rate: room.yearly_rate || 0,
      size_sqm: room.size_sqm || 0,
      capacity: room.capacity || 2,
      featured: room.featured || false,
    };

    return NextResponse.json(processedRoom, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
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
