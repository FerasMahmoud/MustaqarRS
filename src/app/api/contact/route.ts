import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  message: string;
}

// Validation schema
function validateContactData(data: unknown): data is ContactFormData {
  if (!data || typeof data !== 'object') return false;

  const obj = data as Record<string, unknown>;

  return (
    typeof obj.name === 'string' &&
    obj.name.trim().length > 0 &&
    obj.name.trim().length <= 100 &&
    typeof obj.email === 'string' &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(obj.email) &&
    obj.email.length <= 255 &&
    typeof obj.phone === 'string' &&
    obj.phone.trim().length > 0 &&
    obj.phone.trim().length <= 20 &&
    typeof obj.message === 'string' &&
    obj.message.trim().length > 0 &&
    obj.message.trim().length <= 2000
  );
}

// Calculate lead score based on message content (0-100)
function calculateLeadScore(name: string, email: string, message: string): number {
  let score = 50; // Base score

  // Bonus for longer messages (indicates serious inquiry)
  if (message.length > 100) score += 15;
  if (message.length > 200) score += 10;

  // Bonus for professional email domains
  const domain = email.split('@')[1]?.toLowerCase() || '';
  const freeEmailDomains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'live.com', 'icloud.com'];
  if (domain && !freeEmailDomains.includes(domain)) {
    score += 10;
  }

  // Bonus if message contains specific keywords indicating rental intent
  const keywords = ['rent', 'booking', 'studio', 'apartment', 'lease', 'month', 'year', 'available', 'price', 'move'];
  const messageLower = message.toLowerCase();
  const relevantKeywords = keywords.filter((kw) => messageLower.includes(kw));
  score += Math.min(relevantKeywords.length * 5, 15);

  return Math.min(score, 100); // Cap at 100
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Validate input
    if (!validateContactData(body)) {
      return NextResponse.json(
        { error: 'Invalid input. Please ensure all fields are properly filled.' },
        { status: 400 }
      );
    }

    const { name, email, phone, message } = body as ContactFormData;

    // Sanitize inputs
    const sanitizedData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      message: message.trim(),
    };

    // Calculate lead score
    const lead_score = calculateLeadScore(sanitizedData.name, sanitizedData.email, sanitizedData.message);

    // Store in Supabase contact_submissions table
    const { data: insertedSubmission, error: dbError } = await getSupabaseClient()
      .from('contact_submissions')
      .insert([
        {
          name: sanitizedData.name,
          email: sanitizedData.email,
          phone: sanitizedData.phone,
          message: sanitizedData.message,
          lead_score,
          source: 'contact_form',
          status: 'new',
        },
      ])
      .select();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save your message. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Your message has been received. We will contact you shortly.',
        submissionId: insertedSubmission?.[0]?.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
