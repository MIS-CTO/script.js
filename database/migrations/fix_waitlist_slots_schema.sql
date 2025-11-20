-- =====================================================
-- FIX WAITLIST SLOTS SCHEMA - Corrected Structure
-- =====================================================
-- This migration fixes the schema inconsistencies:
-- - waitlist_slots: NO date fields, HAS share_paid
-- - upcoming_slots: HAS date fields, HAS share_personal_data
-- =====================================================

-- =====================================================
-- 1. Fix upcoming_slots table structure
-- =====================================================

-- Drop the existing upcoming_slots table if it exists
-- WARNING: This will delete all data in upcoming_slots
-- Back up data first if needed!
DROP TABLE IF EXISTS upcoming_slots CASCADE;

-- Recreate upcoming_slots with correct schema
CREATE TABLE upcoming_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  slot_number INTEGER NOT NULL,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('active', 'upcoming', 'expired')),
  share_personal_data BOOLEAN DEFAULT false,  -- ✅ CORRECT: share_personal_data (not share_paid)
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Constraints
  UNIQUE(slot_number, location_id),
  CHECK (date_to >= date_from)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_upcoming_slots_artist_id ON upcoming_slots(artist_id);
CREATE INDEX IF NOT EXISTS idx_upcoming_slots_location_id ON upcoming_slots(location_id);
CREATE INDEX IF NOT EXISTS idx_upcoming_slots_slot_number ON upcoming_slots(slot_number);
CREATE INDEX IF NOT EXISTS idx_upcoming_slots_date_from ON upcoming_slots(date_from);
CREATE INDEX IF NOT EXISTS idx_upcoming_slots_status ON upcoming_slots(status);

-- =====================================================
-- 2. Ensure waitlist_slots has correct structure
-- =====================================================

-- Ensure date fields are removed from waitlist_slots
ALTER TABLE waitlist_slots DROP COLUMN IF EXISTS date_from;
ALTER TABLE waitlist_slots DROP COLUMN IF EXISTS date_to;

-- Ensure waitlist_slots has all required columns
ALTER TABLE waitlist_slots ADD COLUMN IF NOT EXISTS display_order INTEGER;
ALTER TABLE waitlist_slots ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE waitlist_slots ADD COLUMN IF NOT EXISTS share_paid BOOLEAN DEFAULT false;

-- =====================================================
-- 3. Remove Old Views (No longer needed - using direct table queries)
-- =====================================================

-- Drop existing views as we now use direct table queries with Supabase joins
-- The frontend now uses .from('waitlist_slots').select('*, artist:artists(*), location:locations(*)')
-- instead of views, which provides better performance and flexibility

DROP VIEW IF EXISTS active_waitlist_view CASCADE;
DROP VIEW IF EXISTS upcoming_waitlist_view CASCADE;
DROP VIEW IF EXISTS active_waitlist_slots CASCADE;
DROP VIEW IF EXISTS active_upcoming_view CASCADE;

-- Note: Views are no longer needed because:
-- 1. Frontend uses Supabase .select() with joins (e.g., artist:artists(*))
-- 2. Direct table queries provide better control and performance
-- 3. No need to maintain separate view definitions

-- =====================================================
-- 4. Create Triggers for updated_at
-- =====================================================

-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for waitlist_slots
DROP TRIGGER IF EXISTS waitlist_slots_updated_at ON waitlist_slots;
CREATE TRIGGER waitlist_slots_updated_at
BEFORE UPDATE ON waitlist_slots
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for upcoming_slots
DROP TRIGGER IF EXISTS upcoming_slots_updated_at ON upcoming_slots;
CREATE TRIGGER upcoming_slots_updated_at
BEFORE UPDATE ON upcoming_slots
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. Grant Permissions
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON waitlist_slots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON upcoming_slots TO authenticated;

-- Note: No view permissions needed as views have been removed

-- Enable Row Level Security
ALTER TABLE waitlist_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE upcoming_slots ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. Verification Queries
-- =====================================================

-- Run these to verify the migration:

-- Check waitlist_slots structure (should have NO date fields)
-- \d waitlist_slots

-- Check upcoming_slots structure (should have date_from, date_to, share_personal_data)
-- \d upcoming_slots

-- Test direct table queries (no views needed)
-- SELECT * FROM waitlist_slots LIMIT 1;
-- SELECT * FROM upcoming_slots LIMIT 1;

-- Verify views are removed
-- \dv  -- Should NOT show active_waitlist_view or upcoming_waitlist_view

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
--
-- SUMMARY OF CHANGES:
--
-- waitlist_slots:
--   ✅ NO date_from column
--   ✅ NO date_to column
--   ✅ HAS share_paid column
--
-- upcoming_slots:
--   ✅ HAS date_from column (NOT NULL)
--   ✅ HAS date_to column (NOT NULL)
--   ✅ HAS share_personal_data column (not share_paid!)
--
-- Views:
--   ✅ All views removed (active_waitlist_view, upcoming_waitlist_view, etc.)
--   ✅ Frontend now uses direct table queries with Supabase joins
--   ✅ Example: .from('waitlist_slots').select('*, artist:artists(*), location:locations(*)')
--
-- =====================================================
