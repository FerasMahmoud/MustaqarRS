-- ============================================================================
-- Migration: Add Digital Signature Support to Bookings
-- Date: 2026-01-06
-- Description: Adds columns to store digital signatures captured during the
--              booking process. Signatures are stored as base64-encoded canvas
--              data for legal compliance and verification purposes.
-- ============================================================================

-- Add signature columns to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS signature TEXT,
ADD COLUMN IF NOT EXISTS signature_accepted_at TIMESTAMPTZ;

-- Add constraint to ensure signature_accepted_at is set when signature is provided
-- This ensures data integrity: a signature without a timestamp is invalid
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_signature_consistency'
  ) THEN
    ALTER TABLE bookings
    ADD CONSTRAINT check_signature_consistency
    CHECK (
      -- If signature is NULL, signature_accepted_at can be anything (typically NULL)
      -- If signature is NOT NULL, signature_accepted_at MUST also be NOT NULL
      (signature IS NULL) OR (signature IS NOT NULL AND signature_accepted_at IS NOT NULL)
    );
  END IF;
END $$;

-- Create index on signature_accepted_at for querying signed bookings
-- This enables efficient filtering of bookings that have been signed
CREATE INDEX IF NOT EXISTS idx_bookings_signature_accepted_at
ON bookings(signature_accepted_at)
WHERE signature_accepted_at IS NOT NULL;

-- Add documentation comments for the new columns
COMMENT ON COLUMN bookings.signature IS
'Digital signature captured from the user during booking confirmation. Stored as base64-encoded PNG image data from HTML5 canvas. Validation of base64 format is performed at the application level. Used for legal compliance and booking verification.';

COMMENT ON COLUMN bookings.signature_accepted_at IS
'Timestamp when the digital signature was captured and accepted. This timestamp is set at the moment the user submits their signature. Required when signature is present (enforced by check_signature_consistency constraint). Used for audit trail and legal compliance.';

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================
-- To completely reverse this migration, execute the following SQL statements
-- in order:
--
-- -- Step 1: Drop the index on signature_accepted_at
-- DROP INDEX IF EXISTS idx_bookings_signature_accepted_at;
--
-- -- Step 2: Drop the consistency constraint
-- ALTER TABLE bookings DROP CONSTRAINT IF EXISTS check_signature_consistency;
--
-- -- Step 3: Remove the column comments (optional, columns will be dropped anyway)
-- COMMENT ON COLUMN bookings.signature IS NULL;
-- COMMENT ON COLUMN bookings.signature_accepted_at IS NULL;
--
-- -- Step 4: Drop the signature_accepted_at column
-- ALTER TABLE bookings DROP COLUMN IF EXISTS signature_accepted_at;
--
-- -- Step 5: Drop the signature column
-- ALTER TABLE bookings DROP COLUMN IF EXISTS signature;
--
-- Complete rollback in one statement:
-- DROP INDEX IF EXISTS idx_bookings_signature_accepted_at;
-- ALTER TABLE bookings DROP CONSTRAINT IF EXISTS check_signature_consistency;
-- ALTER TABLE bookings DROP COLUMN IF EXISTS signature_accepted_at;
-- ALTER TABLE bookings DROP COLUMN IF EXISTS signature;
-- ============================================================================
