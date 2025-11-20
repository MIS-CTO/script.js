-- ============================================
-- DIENSTPLAN SYSTEM OVERHAUL - v79
-- Migration Script for Supabase
-- ============================================
-- EXECUTE THIS SCRIPT IN SUPABASE SQL EDITOR FIRST
-- Before updating the HTML frontend
-- ============================================

-- Step 1: Rename Column in working_times table
-- ============================================
ALTER TABLE working_times
RENAME COLUMN artist_email TO email;

-- Step 2: Create working_time_requests table
-- ============================================
CREATE TABLE IF NOT EXISTS working_time_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    category TEXT NOT NULL,
    notes TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_working_time_requests_email ON working_time_requests(email);
CREATE INDEX IF NOT EXISTS idx_working_time_requests_status ON working_time_requests(status);
CREATE INDEX IF NOT EXISTS idx_working_time_requests_created_at ON working_time_requests(created_at);

-- Step 3: Enable Row Level Security on working_times
-- ============================================
ALTER TABLE working_times ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing policies if any (safe to run even if they don't exist)
-- ============================================
DROP POLICY IF EXISTS "Management sieht alle Einträge" ON working_times;
DROP POLICY IF EXISTS "User sehen nur eigene Einträge" ON working_times;
DROP POLICY IF EXISTS "User können eigene Einträge erstellen" ON working_times;
DROP POLICY IF EXISTS "Management kann alle Einträge updaten" ON working_times;
DROP POLICY IF EXISTS "User können eigene Einträge updaten" ON working_times;
DROP POLICY IF EXISTS "Management kann Einträge löschen" ON working_times;

-- Step 5: Create RLS Policies for working_times table
-- ============================================

-- Policy 1: Management, Geschäftsführung, Admin see all entries
CREATE POLICY "Management sieht alle Einträge"
ON working_times
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('Management', 'Geschäftsführung', 'Admin')
    )
);

-- Policy 2: Other roles only see their own entries (matched via email)
CREATE POLICY "User sehen nur eigene Einträge"
ON working_times
FOR SELECT
USING (
    email IN (
        SELECT email FROM profiles WHERE id = auth.uid()
        UNION
        SELECT email FROM artists WHERE email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
);

-- Policy 3: Users can insert their own entries
CREATE POLICY "User können eigene Einträge erstellen"
ON working_times
FOR INSERT
WITH CHECK (
    email IN (
        SELECT email FROM profiles WHERE id = auth.uid()
        UNION
        SELECT email FROM artists WHERE email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
);

-- Policy 4: Only Management can update all entries
CREATE POLICY "Management kann alle Einträge updaten"
ON working_times
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('Management', 'Geschäftsführung', 'Admin')
    )
);

-- Policy 5: Users can update their own entries
CREATE POLICY "User können eigene Einträge updaten"
ON working_times
FOR UPDATE
USING (
    email IN (
        SELECT email FROM profiles WHERE id = auth.uid()
        UNION
        SELECT email FROM artists WHERE email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
);

-- Policy 6: Only Management can delete entries
CREATE POLICY "Management kann Einträge löschen"
ON working_times
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('Management', 'Geschäftsführung', 'Admin')
    )
);

-- Step 6: Enable RLS on working_time_requests
-- ============================================
ALTER TABLE working_time_requests ENABLE ROW LEVEL SECURITY;

-- Step 7: Drop existing policies for working_time_requests (safe to run)
-- ============================================
DROP POLICY IF EXISTS "User sehen eigene Requests" ON working_time_requests;
DROP POLICY IF EXISTS "Management sieht alle Requests" ON working_time_requests;
DROP POLICY IF EXISTS "User können Requests erstellen" ON working_time_requests;
DROP POLICY IF EXISTS "Management kann Requests verwalten" ON working_time_requests;

-- Step 8: Create RLS Policies for working_time_requests table
-- ============================================

-- Policy 1: Users see own requests, Management sees all pending requests
CREATE POLICY "User sehen eigene Requests"
ON working_time_requests
FOR SELECT
USING (
    email IN (
        SELECT email FROM profiles WHERE id = auth.uid()
        UNION
        SELECT email FROM artists WHERE email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
    OR
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('Management', 'Geschäftsführung', 'Admin')
    )
);

-- Policy 2: Everyone can create requests with their own email
CREATE POLICY "User können Requests erstellen"
ON working_time_requests
FOR INSERT
WITH CHECK (
    email IN (
        SELECT email FROM profiles WHERE id = auth.uid()
        UNION
        SELECT email FROM artists WHERE email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
);

-- Policy 3: Only Management can approve/reject requests (update)
CREATE POLICY "Management kann Requests verwalten"
ON working_time_requests
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('Management', 'Geschäftsführung', 'Admin')
    )
);

-- Step 9: Add comments for documentation
-- ============================================
COMMENT ON TABLE working_time_requests IS 'Stores pending requests for working time entries that require management approval';
COMMENT ON COLUMN working_time_requests.status IS 'Request status: pending, approved, rejected';
COMMENT ON COLUMN working_time_requests.category IS 'Category: Training, Vacation, Sick, Home office, Business trip, Convention, Guestspot, Other';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Next steps:
-- 1. Verify all policies are active
-- 2. Test with different user roles
-- 3. Update the HTML frontend with new features
-- ============================================
