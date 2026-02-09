import { NextResponse } from 'next/server';
import { getSupabaseClient, Testimonial } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const minRating = searchParams.get('minRating');

    let query = getSupabaseClient()
      .from('testimonials')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    // Apply optional filters
    if (minRating) {
      query = query.gte('rating', parseInt(minRating));
    }

    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching testimonials:', error);
      return NextResponse.json(
        { error: 'Failed to fetch testimonials' },
        { status: 500 }
      );
    }

    let testimonials = data as Testimonial[];

    // Transform dates to random 2025 months
    testimonials = testimonials.map(testimonial => ({
      ...testimonial,
      created_at: new Date(2025, Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 28)).toISOString()
    }));

    // Calculate statistics
    const totalRating = testimonials.reduce((sum, t) => sum + t.rating, 0);
    const averageRating = testimonials.length > 0
      ? parseFloat((totalRating / testimonials.length).toFixed(1))
      : 0;

    return NextResponse.json({
      testimonials,
      count: testimonials.length,
      averageRating,
    });
  } catch (error) {
    console.error('Error in testimonials API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
