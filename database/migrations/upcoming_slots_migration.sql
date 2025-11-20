-- =====================================================
-- DUAL WAITLIST SYSTEM - DATABASE MIGRATION
-- =====================================================
-- This migration creates the upcoming_slots table and view
-- for managing artists without confirmed booking dates
-- =====================================================

-- =====================================================
-- 1. CREATE upcoming_slots TABLE
-- =====================================================
-- Similar to waitlist_slots but WITHOUT date fields
-- =====================================================

CREATE TABLE IF NOT EXISTS upcoming_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_number INTEGER NOT NULL,
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'upcoming', 'expired')),
  notes TEXT,
  share_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure slot numbers are unique per location
  UNIQUE(slot_number, location_id)
);

-- =====================================================
-- 2. CREATE INDEXES for upcoming_slots
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_upcoming_slots_artist_id ON upcoming_slots(artist_id);
CREATE INDEX IF NOT EXISTS idx_upcoming_slots_location_id ON upcoming_slots(location_id);
CREATE INDEX IF NOT EXISTS idx_upcoming_slots_slot_number ON upcoming_slots(slot_number);
CREATE INDEX IF NOT EXISTS idx_upcoming_slots_status ON upcoming_slots(status);

-- =====================================================
-- 3. CREATE upcoming_waitlist_view
-- =====================================================
-- View that joins upcoming_slots with artists and locations
-- Similar to active_waitlist_slots but without date fields
-- =====================================================

CREATE OR REPLACE VIEW upcoming_waitlist_view AS
SELECT
  us.id,
  us.slot_number,
  us.artist_id,
  us.location_id,
  us.status,
  us.notes,
  us.share_paid,
  us.created_at,
  us.updated_at,

  -- Artist information
  a.name AS artist_name,
  a.email AS artist_email,
  a.instagram AS artist_instagram,
  a.image_url AS artist_image_url,
  a.style AS artist_style,

  -- Location information
  l.name AS location_name,
  l.city AS location_city

FROM upcoming_slots us
LEFT JOIN artists a ON us.artist_id = a.id
LEFT JOIN locations l ON us.location_id = l.id
WHERE us.status IN ('active', 'upcoming')
ORDER BY us.slot_number ASC;

-- =====================================================
-- 4. CREATE TRIGGER for updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_upcoming_slots_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER upcoming_slots_updated_at
BEFORE UPDATE ON upcoming_slots
FOR EACH ROW
EXECUTE FUNCTION update_upcoming_slots_updated_at();

-- =====================================================
-- 5. GRANT PERMISSIONS
-- =====================================================
-- Adjust based on your RLS policies and user roles
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON upcoming_slots TO authenticated;
GRANT SELECT ON upcoming_waitlist_view TO authenticated;

-- Enable Row Level Security (adjust policies as needed)
ALTER TABLE upcoming_slots ENABLE ROW LEVEL SECURITY;

-- Example RLS Policy (modify based on your security requirements)
-- CREATE POLICY "Allow authenticated users full access to upcoming_slots"
--   ON upcoming_slots
--   FOR ALL
--   TO authenticated
--   USING (true)
--   WITH CHECK (true);

-- =====================================================
-- 6. SAMPLE DATA (Optional - for testing)
-- =====================================================
-- Uncomment to insert sample data for testing
-- =====================================================

/*
INSERT INTO upcoming_slots (slot_number, artist_id, location_id, status, notes)
SELECT
  1,
  a.id,
  l.id,
  'active',
  'Sample upcoming artist - no confirmed dates yet'
FROM artists a
CROSS JOIN locations l
WHERE a.name LIKE '%test%'
  AND l.name LIKE '%Berlin%'
LIMIT 1;
*/

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Tables created:
--   - upcoming_slots
-- Views created:
--   - upcoming_waitlist_view
-- Indexes created:
--   - idx_upcoming_slots_artist_id
--   - idx_upcoming_slots_location_id
--   - idx_upcoming_slots_slot_number
--   - idx_upcoming_slots_status
-- =====================================================
