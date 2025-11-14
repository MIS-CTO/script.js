-- =====================================================
-- SUPABASE RLS POLICY FOR PROJECTS TABLE
-- =====================================================
--
-- PROBLEM: RLS was blocking SELECT access to projects table
-- SOLUTION: Create proper SELECT policy
--
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Run this script
-- 3. Enable RLS on projects table
-- 4. Test that analytics still works
--
-- =====================================================

-- Enable RLS on projects table (if not already enabled)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- OPTION 1: Allow SELECT for authenticated users only
-- Use this if users must be logged in
-- =====================================================
CREATE POLICY "projects_select_authenticated" ON projects
FOR SELECT
TO authenticated
USING (true);

-- =====================================================
-- OPTION 2: Allow SELECT for all users (authenticated + anonymous)
-- Use this if analytics should work for non-logged-in users
-- =====================================================
-- Uncomment this and comment out OPTION 1 if needed:
--
-- CREATE POLICY "projects_select_public" ON projects
-- FOR SELECT
-- TO anon, authenticated
-- USING (true);

-- =====================================================
-- OPTION 3: Restrict SELECT to specific location_id
-- Use this if users should only see their location's projects
-- =====================================================
-- Uncomment this and comment out OPTION 1 if needed:
--
-- CREATE POLICY "projects_select_by_location" ON projects
-- FOR SELECT
-- TO authenticated
-- USING (
--   location_id = auth.jwt() ->> 'location_id'
--   OR auth.jwt() ->> 'role' = 'admin'
-- );

-- =====================================================
-- VERIFY POLICY
-- =====================================================
-- Run this to check if policy was created:
-- SELECT * FROM pg_policies WHERE tablename = 'projects';

-- =====================================================
-- TEST QUERY
-- =====================================================
-- After creating policy, test with:
-- SELECT COUNT(*) FROM projects;
-- Should return: 13750
--
-- SELECT id, price, payment_state, created_at, location_id
-- FROM projects
-- LIMIT 5;
-- Should return: 5 rows with data

-- =====================================================
-- NOTES
-- =====================================================
-- - If analytics shows 0 projects after enabling RLS,
--   the policy is too restrictive or wrong
-- - For management-system.html to work, the user/session
--   accessing the page must match the policy conditions
-- - Use OPTION 2 (public access) if you want analytics
--   to work without authentication
