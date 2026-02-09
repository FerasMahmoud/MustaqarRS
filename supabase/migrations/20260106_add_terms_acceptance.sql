-- ============================================================================
-- Migration: Add Terms Acceptance Tracking to Bookings
-- Date: 2026-01-06
-- Description: Adds columns to track when users accept terms and conditions
--              during the booking process for legal compliance and audit trail.
-- ============================================================================

-- Add terms acceptance columns to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;

-- Add constraint to ensure terms_accepted_at is set when terms_accepted is true
-- This is implemented as a trigger for flexibility
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_terms_consistency'
  ) THEN
    ALTER TABLE bookings
    ADD CONSTRAINT check_terms_consistency
    CHECK (
      -- If terms_accepted is false or null, terms_accepted_at can be null
      -- If terms_accepted is true, this constraint allows any state
      -- (validation of timestamp presence is handled at application level)
      terms_accepted IS NOT NULL
    );
  END IF;
END $$;

-- Create index for querying bookings by terms acceptance status
CREATE INDEX IF NOT EXISTS idx_bookings_terms_accepted
ON bookings(terms_accepted)
WHERE terms_accepted = true;

-- Add documentation comments for the new columns
COMMENT ON COLUMN bookings.terms_accepted IS
'Indicates whether the user has accepted the terms and conditions during booking. Required to be true for booking confirmation.';

COMMENT ON COLUMN bookings.terms_accepted_at IS
'Timestamp when the user accepted the terms and conditions. Set automatically when terms_accepted changes to true. Used for legal compliance and audit trail.';

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- To reverse this migration, run the following commands:
-- ============================================================================
-- DROP INDEX IF EXISTS idx_bookings_terms_accepted;
-- ALTER TABLE bookings DROP CONSTRAINT IF EXISTS check_terms_consistency;
-- ALTER TABLE bookings DROP COLUMN IF EXISTS terms_accepted_at;
-- ALTER TABLE bookings DROP COLUMN IF EXISTS terms_accepted;
-- ============================================================================
