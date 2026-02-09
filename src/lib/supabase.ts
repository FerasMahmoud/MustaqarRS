import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy load Supabase client to avoid errors during build when env vars might not be set
let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  // Always re-check environment variables instead of caching with dummy values
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  // Only cache if we have real credentials
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseInstance;
};

// For backward compatibility, provide a getter function
// This should only be called at runtime, not at module load time
export const getSupabase = (): SupabaseClient => {
  return getSupabaseClient();
};

// Types for database tables (to be expanded)
export interface Studio {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  price_per_hour: number;
  capacity: number;
  image_url: string;
  amenities: string[];
  created_at: string;
}

export interface Room {
  id: string;
  slug: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  monthly_rate: number;
  yearly_rate: number;
  amenities: string[];
  images: string[];
  size_sqm: number;
  capacity: number;
  featured: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Booking {
  id: string;
  room_id: string;
  guest_id: string;
  start_date: string;
  end_date: string;
  rental_type: 'monthly' | 'yearly';
  rate_at_booking: number;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  stripe_session_id?: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  created_at: string;
  confirmed_at?: string;
  cancelled_at?: string;
  // Month-based booking fields
  start_month?: string; // Format: "YYYY-MM" (e.g., "2025-01")
  duration_months?: number; // 1-36 months
  rate_model?: 'monthly' | 'yearly';
}

export interface Guest {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  id_type?: 'passport' | 'saudi_id' | 'iqama';
  id_number?: string;
  nationality?: string;
  created_at: string;
}

export interface AvailabilityBlock {
  id: string;
  room_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
  created_at: string;
}

export interface Testimonial {
  id: string;
  name_en: string;
  name_ar: string;
  text_en: string;
  text_ar: string;
  rating: number;
  avatar_url: string;
  is_approved: boolean;
  created_at: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  lead_score: number;
  source: string;
  created_at: string;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  lead_score: number;
  source: string;
  status: 'new' | 'contacted' | 'resolved' | 'spam';
  created_at: string;
  responded_at?: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribed_at: string;
  is_active: boolean;
  created_at?: string;
}
