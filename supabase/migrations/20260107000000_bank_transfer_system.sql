-- Migration: Bank Transfer Payment System
-- Description: Add payment tracking, auto-expiry, and conflict detection for bank transfer bookings

-- Add payment_method column
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'bank_transfer';

-- Add constraint for payment_method
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_payment_method'
  ) THEN
    ALTER TABLE bookings
    ADD CONSTRAINT check_payment_method
    CHECK (payment_method IN ('stripe', 'bank_transfer', 'cash'));
  END IF;
END $$;

-- Add expires_at column for 1-hour payment deadline
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Add cancellation audit trail
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Add email notification tracking columns
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS booking_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS booking_email_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_reminder_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payment_reminder_sent_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancellation_email_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS cancellation_email_sent_at TIMESTAMPTZ;

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_bookings_expiry
ON bookings(expires_at, status, payment_method)
WHERE status = 'pending_payment';

CREATE INDEX IF NOT EXISTS idx_bookings_reminder
ON bookings(expires_at, payment_reminder_sent, status)
WHERE status = 'pending_payment' AND payment_reminder_sent = FALSE;

CREATE INDEX IF NOT EXISTS idx_bookings_pending_payment_expiry
ON bookings(expires_at, status)
WHERE status = 'pending_payment';

-- Function to auto-set expires_at on insert for bank transfers
CREATE OR REPLACE FUNCTION set_booking_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_method = 'bank_transfer' AND NEW.status = 'pending_payment' THEN
    NEW.expires_at := NEW.created_at + INTERVAL '1 hour';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_set_booking_expiry ON bookings;

-- Create trigger to auto-set expires_at on insert
CREATE TRIGGER trigger_set_booking_expiry
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_expiry();

-- Function to confirm booking payment with conflict detection
-- This uses row-level locking to prevent race conditions
CREATE OR REPLACE FUNCTION confirm_booking_payment(
  p_booking_id UUID,
  p_admin_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  booking JSONB,
  conflict JSONB
) AS $$
DECLARE
  v_booking bookings%ROWTYPE;
  v_conflict bookings%ROWTYPE;
BEGIN
  -- Lock and fetch booking (prevents concurrent confirmations)
  SELECT * INTO v_booking
  FROM bookings
  WHERE id = p_booking_id
  FOR UPDATE NOWAIT;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::JSONB, NULL::JSONB;
    RETURN;
  END IF;

  -- Check if booking is still in pending_payment status
  IF v_booking.status != 'pending_payment' THEN
    RETURN QUERY SELECT FALSE, NULL::JSONB, NULL::JSONB;
    RETURN;
  END IF;

  -- Check for conflicting confirmed bookings for the same room and dates
  SELECT * INTO v_conflict
  FROM bookings
  WHERE room_id = v_booking.room_id
    AND status = 'confirmed'
    AND (start_date <= v_booking.end_date AND end_date >= v_booking.start_date)
    AND id != p_booking_id
  FOR UPDATE NOWAIT;

  -- If conflict exists, cancel this booking
  IF FOUND THEN
    UPDATE bookings
    SET status = 'cancelled',
        cancellation_reason = 'conflict_detected',
        cancelled_at = NOW()
    WHERE id = p_booking_id;

    RETURN QUERY SELECT
      FALSE,
      NULL::JSONB,
      to_jsonb(v_conflict);
    RETURN;
  END IF;

  -- No conflict: Confirm booking and mark payment as received
  UPDATE bookings
  SET status = 'confirmed',
      payment_status = 'paid',
      confirmed_at = NOW()
  WHERE id = p_booking_id
  RETURNING * INTO v_booking;

  RETURN QUERY SELECT
    TRUE,
    to_jsonb(v_booking),
    NULL::JSONB;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-expire pending payment bookings after 1 hour
-- Modified from original 30 minute expiry to 1 hour
CREATE OR REPLACE FUNCTION expire_pending_bookings()
RETURNS void AS $$
BEGIN
  UPDATE bookings
  SET status = 'cancelled',
      cancellation_reason = 'payment_timeout',
      cancelled_at = NOW()
  WHERE status = 'pending_payment'
    AND created_at < NOW() - INTERVAL '1 hour'
    AND payment_method = 'bank_transfer';
END;
$$ LANGUAGE plpgsql;

-- Note: To auto-expire pending bookings via n8n, create a scheduled workflow
-- Or uncomment below to use pg_cron (requires pg_cron extension):
-- SELECT cron.schedule('expire-pending-bookings', '*/5 * * * *', 'SELECT expire_pending_bookings()');
