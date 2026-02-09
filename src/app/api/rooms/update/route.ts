import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(url, key);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Simple auth check - use a secret header
    const authHeader = request.headers.get('x-update-secret');
    if (authHeader !== 'update-rooms-2025') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id, slug, description, description_ar, images, amenities } = body;

    if (!slug && !id) {
      return NextResponse.json(
        { error: 'Missing slug or id' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    const updateData: Partial<{
      description: string;
      description_ar: string;
      images: string[];
      amenities: string[];
    }> = {};
    if (description) updateData.description = description;
    if (description_ar) updateData.description_ar = description_ar;
    if (images) updateData.images = images;
    if (amenities) updateData.amenities = amenities;

    let query = supabase
      .from('rooms')
      .update(updateData);

    if (id) {
      query = query.eq('id', id);
    } else {
      query = query.eq('slug', slug);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update room', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
