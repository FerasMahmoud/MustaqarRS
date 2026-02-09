import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateEmail(email: string): boolean {
  return emailRegex.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate email presence
    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const trimmedEmail = email.trim().toLowerCase();
    if (!validateEmail(trimmedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existingSubscriber } = await getSupabaseClient()
      .from('newsletter_subscribers')
      .select('id')
      .eq('email', trimmedEmail)
      .single();

    if (existingSubscriber) {
      // Email already subscribed
      return NextResponse.json(
        {
          success: true,
          message: 'Email already subscribed',
          isNewSubscriber: false
        },
        { status: 200 }
      );
    }

    // Insert new subscriber
    const { data, error } = await getSupabaseClient()
      .from('newsletter_subscribers')
      .insert([
        {
          email: trimmedEmail,
          subscribed_at: new Date().toISOString(),
          is_active: true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Newsletter subscription error:', error);
      return NextResponse.json(
        { error: 'Failed to subscribe to newsletter' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully subscribed to newsletter',
        isNewSubscriber: true,
        subscriber: data
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Newsletter API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
