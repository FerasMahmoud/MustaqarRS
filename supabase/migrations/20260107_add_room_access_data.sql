-- Migration: Add room access information for reminder system
-- Adds door codes, WiFi credentials, studio guide, and check-in/out times to rooms table

ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS door_code VARCHAR(50),
ADD COLUMN IF NOT EXISTS wifi_network VARCHAR(100),
ADD COLUMN IF NOT EXISTS wifi_password VARCHAR(100),
ADD COLUMN IF NOT EXISTS studio_guide_url TEXT,
ADD COLUMN IF NOT EXISTS checkin_time VARCHAR(20) DEFAULT '15:00',
ADD COLUMN IF NOT EXISTS checkout_time VARCHAR(20) DEFAULT '12:00';

-- Add comments for documentation
COMMENT ON COLUMN rooms.door_code IS
'Access code or key information for entry (e.g., "123456#" or "digital key")';

COMMENT ON COLUMN rooms.wifi_network IS
'WiFi network name (SSID) for the studio';

COMMENT ON COLUMN rooms.wifi_password IS
'WiFi network password';

COMMENT ON COLUMN rooms.studio_guide_url IS
'URL to studio guide document (house rules, amenities, etc)';

COMMENT ON COLUMN rooms.checkin_time IS
'Default check-in time in HH:MM format (24-hour)';

COMMENT ON COLUMN rooms.checkout_time IS
'Default check-out time in HH:MM format (24-hour)';

-- Create index for efficient access data queries
CREATE INDEX IF NOT EXISTS idx_rooms_access_data
ON rooms(id, door_code, wifi_network);
