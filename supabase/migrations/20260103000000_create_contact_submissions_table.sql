-- Create contact_submissions table for storing contact form entries
CREATE TABLE IF NOT EXISTS public.contact_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    message TEXT NOT NULL,
    lead_score INTEGER DEFAULT 50,
    source TEXT DEFAULT 'contact_form',
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'resolved', 'spam')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    responded_at TIMESTAMPTZ
);

-- Enable Row Level Security
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous inserts (for the contact form)
CREATE POLICY "Allow anonymous inserts" ON public.contact_submissions
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Create policy to allow service role full access
CREATE POLICY "Allow service role full access" ON public.contact_submissions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_contact_submissions_email ON public.contact_submissions(email);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON public.contact_submissions(status);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON public.contact_submissions(created_at DESC);
