-- Add contract tracking fields to bookings table
ALTER TABLE bookings
ADD COLUMN contract_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN contract_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN contract_pdf_url TEXT DEFAULT NULL;

-- Add index for querying contracts
CREATE INDEX idx_bookings_contract_sent
ON bookings(contract_sent, contract_sent_at DESC);
