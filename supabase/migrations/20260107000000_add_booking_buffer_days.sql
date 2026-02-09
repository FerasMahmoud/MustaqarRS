-- Add buffer_days column to bookings table for cleaning/inspection period
-- This column tracks the number of days reserved after checkout for property maintenance

ALTER TABLE bookings
ADD COLUMN buffer_days INTEGER DEFAULT 2 NOT NULL;

-- Add documentation comment
COMMENT ON COLUMN bookings.buffer_days IS
'Number of days reserved after checkout for cleaning and inspection. Default is 2 days.';

-- Set buffer_days for any existing bookings
UPDATE bookings
SET buffer_days = 2
WHERE buffer_days IS NULL;
