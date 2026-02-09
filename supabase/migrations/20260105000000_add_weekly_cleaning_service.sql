-- Add weekly cleaning service columns to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS weekly_cleaning_service BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS cleaning_fee DECIMAL(10, 2) DEFAULT 0;

-- Create index for reporting queries
CREATE INDEX IF NOT EXISTS idx_bookings_cleaning_service
ON bookings(weekly_cleaning_service)
WHERE weekly_cleaning_service = true;

-- Add comments for documentation
COMMENT ON COLUMN bookings.weekly_cleaning_service IS
'Whether weekly cleaning service is included (50 SAR/week <30 days, 200 SAR/month ≥30 days)';

COMMENT ON COLUMN bookings.cleaning_fee IS
'Calculated cleaning service fee (50 SAR/week for <30 days, 200 SAR/month for ≥30 days)';
