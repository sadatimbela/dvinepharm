-- Run this SQL in your Supabase SQL Editor to enable Staff Management

CREATE TABLE IF NOT EXISTS staffs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    passcode TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'staff', -- 'admin', 'staff', 'manager'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE staffs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (Admins) full access
CREATE POLICY "Admins have full access" ON staffs
    FOR ALL USING (true); -- Note: In production, filter by admin role if needed

-- Add a default admin account (replace with your email and desired passcode)
-- INSERT INTO staffs (full_name, email, passcode, role) 
-- VALUES ('Admin User', 'admin@example.com', '123456', 'admin');
