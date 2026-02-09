-- Migration: Add month-based booking fields
-- Description: Adds start_month, duration_months, and rate_model columns to support month-based booking system

-- Add new columns for month-based bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS start_month VARCHAR(7),
ADD COLUMN IF NOT EXISTS duration_months INTEGER,
ADD COLUMN IF NOT EXISTS rate_model VARCHAR(10) DEFAULT 'monthly';

-- Add check constraint for duration_months (1-36 months)
ALTER TABLE bookings
ADD CONSTRAINT check_duration_months
CHECK (duration_months IS NULL OR (duration_months >= 1 AND duration_months <= 36));

-- Add check constraint for rate_model
ALTER TABLE bookings
ADD CONSTRAINT check_rate_model
CHECK (rate_model IS NULL OR rate_model IN ('monthly', 'yearly'));

-- Add check constraint for start_month format (YYYY-MM)
ALTER TABLE bookings
ADD CONSTRAINT check_start_month_format
CHECK (start_month IS NULL OR start_month ~ '^\d{4}-(0[1-9]|1[0-2])$');

-- Backfill existing bookings with month-based data
UPDATE bookings
SET
  start_month = TO_CHAR(start_date::date, 'YYYY-MM'),
  duration_months = GREATEST(1, CEIL(EXTRACT(EPOCH FROM (end_date::date - start_date::date)) / 2592000)),
  rate_model = COALESCE(rental_type, 'monthly')
WHERE start_month IS NULL AND start_date IS NOT NULL;

-- Create index for efficient month-based queries
CREATE INDEX IF NOT EXISTS idx_bookings_start_month ON bookings(start_month);
CREATE INDEX IF NOT EXISTS idx_bookings_room_month ON bookings(room_id, start_month);

-- Comment on columns for documentation
COMMENT ON COLUMN bookings.start_month IS 'Start month in YYYY-MM format (e.g., 2025-01)';
COMMENT ON COLUMN bookings.duration_months IS 'Booking duration in months (1-36)';
COMMENT ON COLUMN bookings.rate_model IS 'Rate model used: monthly or yearly';
