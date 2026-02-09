-- Migration: Add missing cancelled_at column to bookings table
-- This column was referenced in 20260107000000_bank_transfer_system.sql but never created

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Add index for efficient queries on cancelled bookings
CREATE INDEX IF NOT EXISTS idx_bookings_cancelled_at
ON bookings(cancelled_at)
WHERE cancelled_at IS NOT NULL;

-- Add documentation
COMMENT ON COLUMN bookings.cancelled_at IS
'Timestamp when the booking was cancelled. Used for audit trail and reporting.';
