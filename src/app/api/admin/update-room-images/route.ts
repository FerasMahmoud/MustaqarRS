import { getSupabaseClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { roomSlug, images } = await request.json();

    if (!roomSlug || !Array.isArray(images)) {
      return NextResponse.json(
        { error: 'Missing roomSlug or images' },
        { status: 400 }
      );
    }

    const { data, error } = await getSupabaseClient()
      .from('rooms')
      .update({ images })
      .eq('slug', roomSlug)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update room', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Room ${roomSlug} updated with ${images.length} images`,
      room: data?.[0]
    });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
