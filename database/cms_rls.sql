-- Row Level Security (RLS) Policies for CMS Tables
-- This script enables RLS and creates policies for CMS tables

-- Enable Row Level Security on all CMS tables
ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_page_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_amenities ENABLE ROW LEVEL SECURITY;

-- ============================================
-- global_settings table policies
-- ============================================

-- SELECT policy: allow both anonymous and authenticated users to read settings
CREATE POLICY "Allow SELECT for all users on global_settings"
ON global_settings
FOR SELECT
USING (true);

-- INSERT policy: only authenticated users (admins) can insert
CREATE POLICY "Allow INSERT for authenticated users on global_settings"
ON global_settings
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- UPDATE policy: only authenticated users (admins) can update
CREATE POLICY "Allow UPDATE for authenticated users on global_settings"
ON global_settings
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- DELETE policy: only authenticated users (admins) can delete (though we likely never delete)
CREATE POLICY "Allow DELETE for authenticated users on global_settings"
ON global_settings
FOR DELETE
USING (auth.role() = 'authenticated');

-- ============================================
-- landing_page_content table policies
-- ============================================

-- SELECT policy: allow both anonymous and authenticated users to read landing page content
CREATE POLICY "Allow SELECT for all users on landing_page_content"
ON landing_page_content
FOR SELECT
USING (true);

-- INSERT policy: only authenticated users (admins) can insert
CREATE POLICY "Allow INSERT for authenticated users on landing_page_content"
ON landing_page_content
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- UPDATE policy: only authenticated users (admins) can update
CREATE POLICY "Allow UPDATE for authenticated users on landing_page_content"
ON landing_page_content
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- DELETE policy: only authenticated users (admins) can delete
CREATE POLICY "Allow DELETE for authenticated users on landing_page_content"
ON landing_page_content
FOR DELETE
USING (auth.role() = 'authenticated');

-- ============================================
-- amenities table policies
-- ============================================

-- SELECT policy: allow both anonymous and authenticated users to read amenities
CREATE POLICY "Allow SELECT for all users on amenities"
ON amenities
FOR SELECT
USING (true);

-- INSERT policy: only authenticated users (admins) can insert
CREATE POLICY "Allow INSERT for authenticated users on amenities"
ON amenities
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- UPDATE policy: only authenticated users (admins) can update
CREATE POLICY "Allow UPDATE for authenticated users on amenities"
ON amenities
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- DELETE policy: only authenticated users (admins) can delete
CREATE POLICY "Allow DELETE for authenticated users on amenities"
ON amenities
FOR DELETE
USING (auth.role() = 'authenticated');

-- ============================================
-- room_amenities table policies
-- ============================================

-- SELECT policy: allow both anonymous and authenticated users to read room amenities
CREATE POLICY "Allow SELECT for all users on room_amenities"
ON room_amenities
FOR SELECT
USING (true);

-- INSERT policy: only authenticated users (admins) can insert
CREATE POLICY "Allow INSERT for authenticated users on room_amenities"
ON room_amenities
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- UPDATE policy: only authenticated users (admins) can update
CREATE POLICY "Allow UPDATE for authenticated users on room_amenities"
ON room_amenities
FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- DELETE policy: only authenticated users (admins) can delete
CREATE POLICY "Allow DELETE for authenticated users on room_amenities"
ON room_amenities
FOR DELETE
USING (auth.role() = 'authenticated');

-- ============================================
-- Additional notes:
-- 1. These policies assume Supabase Auth is being used
-- 2. The auth.role() function returns 'anon' for unauthenticated users and 'authenticated' for logged-in users
-- 3. For more granular control, you can use auth.uid() to check specific user IDs
-- 4. These policies should be applied after creating the tables and inserting initial data
-- ============================================
