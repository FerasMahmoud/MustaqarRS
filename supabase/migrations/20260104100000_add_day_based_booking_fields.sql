-- Migration: Add day-based booking fields for payment-first system
-- Description: Adds duration_days, stripe fields, and payment status for day-based bookings

-- Add duration_days column (minimum 30 days)
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS duration_days INTEGER;

-- Add Stripe payment tracking columns
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent TEXT,
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';

-- Add confirmation timestamp
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

-- Add check constraint for duration_days (minimum 30 days)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_duration_days'
  ) THEN
    ALTER TABLE bookings
    ADD CONSTRAINT check_duration_days
    CHECK (duration_days IS NULL OR duration_days >= 30);
  END IF;
END $$;

-- Add check constraint for payment_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_payment_status'
  ) THEN
    ALTER TABLE bookings
    ADD CONSTRAINT check_payment_status
    CHECK (payment_status IS NULL OR payment_status IN ('pending', 'paid', 'failed', 'refunded'));
  END IF;
END $$;

-- Update status constraint to include 'pending_payment'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_status_check'
  ) THEN
    ALTER TABLE bookings DROP CONSTRAINT bookings_status_check;
  END IF;
END $$;

-- Add updated status constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_booking_status'
  ) THEN
    ALTER TABLE bookings
    ADD CONSTRAINT check_booking_status
    CHECK (status IS NULL OR status IN ('pending', 'pending_payment', 'confirmed', 'cancelled', 'completed'));
  END IF;
END $$;

-- Backfill duration_days from existing bookings
UPDATE bookings
SET duration_days = GREATEST(30, (end_date - start_date))
WHERE duration_days IS NULL AND start_date IS NOT NULL AND end_date IS NOT NULL;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_session ON bookings(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status_payment ON bookings(status, payment_status);
CREATE INDEX IF NOT EXISTS idx_bookings_pending_payment ON bookings(room_id, status) WHERE status = 'pending_payment';

-- Create function to auto-expire pending_payment bookings after 30 minutes
CREATE OR REPLACE FUNCTION expire_pending_bookings()
RETURNS void AS $$
BEGIN
  DELETE FROM bookings
  WHERE status = 'pending_payment'
    AND created_at < NOW() - INTERVAL '30 minutes';
END;
$$ LANGUAGE plpgsql;

-- Note: To auto-expire pending bookings, you can:
-- 1. Enable pg_cron extension in Supabase Dashboard > Database > Extensions
-- 2. Run: SELECT cron.schedule('expire-pending-bookings', '*/5 * * * *', 'SELECT expire_pending_bookings()');
