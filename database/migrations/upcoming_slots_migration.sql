-- =====================================================
-- DUAL WAITLIST SYSTEM - DATABASE MIGRATION (CORRECTED)
-- =====================================================
-- waitlist_slots: Artists available NOW (NO dates)
-- upcoming_slots: Artists with SPECIFIC dates (WITH dates)
-- =====================================================

-- =====================================================
-- 1. MODIFY waitlist_slots TABLE (REMOVE date fields)
-- =====================================================
-- Remove date_from and date_to columns if they exist
-- =====================================================

-- First, drop dependent views that might use these columns
DROP VIEW IF EXISTS active_waitlist_slots CASCADE;

-- Remove date columns from waitlist_slots
ALTER TABLE waitlist_slots DROP COLUMN IF EXISTS date_from;
ALTER TABLE waitlist_slots DROP COLUMN IF EXISTS date_to;

-- Add slot_number if it doesn't exist
ALTER TABLE waitlist_slots ADD COLUMN IF NOT EXISTS slot_number INTEGER;

-- Add unique constraint for slot_number per location
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'waitlist_slots_slot_number_location_id_key'
  ) THEN
    ALTER TABLE waitlist_slots ADD CONSTRAINT waitlist_slots_slot_number_location_id_key
    UNIQUE(slot_number, location_id);
  END IF;
END $$;

-- =====================================================
-- 2. CREATE upcoming_slots TABLE (WITH date fields)
-- =====================================================
-- For artists with SPECIFIC booking dates
-- =====================================================

CREATE TABLE IF NOT EXISTS upcoming_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_number INTEGER NOT NULL,
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'upcoming', 'expired')),
  notes TEXT,
  share_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure slot numbers are unique per location
  UNIQUE(slot_number, location_id),

  -- Ensure date_to is after date_from
  CHECK (date_to >= date_from)
);

-- =====================================================
-- 2. CREATE INDEXES for upcoming_slots
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_upcoming_slots_artist_id ON upcoming_slots(artist_id);
CREATE INDEX IF NOT EXISTS idx_upcoming_slots_location_id ON upcoming_slots(location_id);
CREATE INDEX IF NOT EXISTS idx_upcoming_slots_slot_number ON upcoming_slots(slot_number);
CREATE INDEX IF NOT EXISTS idx_upcoming_slots_status ON upcoming_slots(status);

-- =====================================================
-- 3. CREATE waitlist_view (WITHOUT dates)
-- =====================================================
-- View for waitlist_slots - Artists available NOW
-- =====================================================

CREATE OR REPLACE VIEW active_waitlist_view AS
SELECT
  ws.id,
  ws.slot_number,
  ws.artist_id,
  ws.location_id,
  ws.status,
  ws.notes,
  ws.share_paid,
  ws.created_at,
  ws.updated_at,

  -- Artist information
  a.name AS artist_name,
  a.email AS artist_email,
  a.instagram AS artist_instagram,
  a.image_url AS artist_image_url,
  a.style AS artist_style,

  -- Location information
  l.name AS location_name,
  l.city AS location_city

FROM waitlist_slots ws
LEFT JOIN artists a ON ws.artist_id = a.id
LEFT JOIN locations l ON ws.location_id = l.id
WHERE ws.status IN ('active', 'upcoming')
ORDER BY ws.slot_number ASC;

-- =====================================================
-- 4. CREATE upcoming_waitlist_view (WITH dates)
-- =====================================================
-- View for upcoming_slots - Artists with SPECIFIC dates
-- =====================================================

CREATE OR REPLACE VIEW upcoming_waitlist_view AS
SELECT
  us.id,
  us.slot_number,
  us.artist_id,
  us.location_id,
  us.date_from,
  us.date_to,
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
ORDER BY us.date_from ASC;

-- =====================================================
-- 5. CREATE TRIGGERS for updated_at timestamp
-- =====================================================

-- Trigger function (reusable)
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
-- 6. GRANT PERMISSIONS
-- =====================================================
-- Adjust based on your RLS policies and user roles
-- =====================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON waitlist_slots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON upcoming_slots TO authenticated;
GRANT SELECT ON active_waitlist_view TO authenticated;
GRANT SELECT ON upcoming_waitlist_view TO authenticated;

-- Enable Row Level Security (adjust policies as needed)
ALTER TABLE waitlist_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE upcoming_slots ENABLE ROW LEVEL SECURITY;

-- Example RLS Policies (modify based on your security requirements)
-- CREATE POLICY "Allow authenticated users full access to waitlist_slots"
--   ON waitlist_slots FOR ALL TO authenticated
--   USING (true) WITH CHECK (true);

-- CREATE POLICY "Allow authenticated users full access to upcoming_slots"
--   ON upcoming_slots FOR ALL TO authenticated
--   USING (true) WITH CHECK (true);

-- =====================================================
-- 7. SAMPLE DATA (Optional - for testing)
-- =====================================================

/*
-- Sample waitlist_slots entry (NO dates)
INSERT INTO waitlist_slots (slot_number, artist_id, location_id, status, notes)
SELECT 1, a.id, l.id, 'active', 'Available now'
FROM artists a, locations l
WHERE a.name LIKE '%test%' AND l.name LIKE '%Berlin%' LIMIT 1;

-- Sample upcoming_slots entry (WITH dates)
INSERT INTO upcoming_slots (slot_number, artist_id, location_id, date_from, date_to, status, notes)
SELECT 1, a.id, l.id, CURRENT_DATE + 7, CURRENT_DATE + 14, 'upcoming', 'Scheduled visit'
FROM artists a, locations l
WHERE a.name LIKE '%test%' AND l.name LIKE '%Berlin%' LIMIT 1;
*/

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- Tables modified:
--   - waitlist_slots (REMOVED date_from, date_to)
--   - upcoming_slots (CREATED with date_from, date_to NOT NULL)
-- Views created:
--   - active_waitlist_view (for waitlist_slots WITHOUT dates)
--   - upcoming_waitlist_view (for upcoming_slots WITH dates)
--
-- STRUCTURE:
--   waitlist_slots: Artists available NOW (no dates)
--   upcoming_slots: Artists with SPECIFIC dates (dates required)
-- =====================================================
