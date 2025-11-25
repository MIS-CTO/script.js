-- =====================================================
-- FIX WAITLIST VIEWS - Add artist_name from artists table
-- =====================================================
-- This migration creates/replaces the ordered views with proper
-- JOINs to the artists table to display artist_name correctly.
--
-- Problem: Slots show "Unknown Artist" because views don't JOIN
-- the artists table to get the artist name.
-- =====================================================

-- =====================================================
-- 1. Create/Replace waitlist_slots_ordered VIEW
-- =====================================================
-- For waitlist_slots (artists available NOW - NO dates)
-- Includes all artist information via LEFT JOIN
-- =====================================================

CREATE OR REPLACE VIEW waitlist_slots_ordered AS
SELECT
  ws.id,
  ws.artist_id,
  ws.location_id,
  ws.slot_number,
  ws.notes,
  ws.status,
  ws.share_paid,
  ws.display_order,
  ws.created_at,
  ws.created_by,

  -- Calculate display_order: use stored value or fallback to slot_number
  COALESCE(ws.display_order, ws.slot_number,
    ROW_NUMBER() OVER (PARTITION BY ws.location_id ORDER BY ws.created_at ASC)::INTEGER
  ) AS calculated_display_order,

  -- Artist information (from artists table)
  a.name AS artist_name,
  a.email AS artist_email,
  a.instagram AS instagram,
  a.phone AS artist_phone,
  a.profile_picture_url AS profile_picture_url,
  a.background_image_url AS background_image_url,
  a.style AS style,
  a.short_description AS short_description,
  a.bio AS bio,
  a.is_guest AS is_guest,

  -- Location information (from locations table)
  l.name AS location_name,
  l.city AS location_city

FROM waitlist_slots ws
LEFT JOIN artists a ON ws.artist_id = a.id
LEFT JOIN locations l ON ws.location_id = l.id
WHERE ws.status IN ('active', 'waiting', 'upcoming')
ORDER BY COALESCE(ws.display_order, ws.slot_number, 999) ASC;

-- =====================================================
-- 2. Create/Replace upcoming_slots_ordered VIEW
-- =====================================================
-- For upcoming_slots (artists with SPECIFIC dates)
-- Includes all artist information via LEFT JOIN
-- =====================================================

CREATE OR REPLACE VIEW upcoming_slots_ordered AS
SELECT
  us.id,
  us.artist_id,
  us.location_id,
  us.slot_number,
  us.date_from,
  us.date_to,
  us.notes,
  us.status,
  us.share_personal_data,
  us.display_order,
  us.created_at,
  us.created_by,

  -- Calculate display_order: use stored value or fallback to slot_number
  COALESCE(us.display_order, us.slot_number,
    ROW_NUMBER() OVER (PARTITION BY us.location_id ORDER BY us.date_from ASC)::INTEGER
  ) AS calculated_display_order,

  -- Artist information (from artists table)
  a.name AS artist_name,
  a.email AS artist_email,
  a.instagram AS instagram,
  a.phone AS artist_phone,
  a.profile_picture_url AS profile_picture_url,
  a.background_image_url AS background_image_url,
  a.style AS style,
  a.short_description AS short_description,
  a.bio AS bio,
  a.is_guest AS is_guest,

  -- Location information (from locations table)
  l.name AS location_name,
  l.city AS location_city

FROM upcoming_slots us
LEFT JOIN artists a ON us.artist_id = a.id
LEFT JOIN locations l ON us.location_id = l.id
WHERE us.status IN ('active', 'waiting', 'upcoming')
ORDER BY us.date_from ASC;

-- =====================================================
-- 3. Grant SELECT permissions on views
-- =====================================================

GRANT SELECT ON waitlist_slots_ordered TO authenticated;
GRANT SELECT ON waitlist_slots_ordered TO anon;
GRANT SELECT ON upcoming_slots_ordered TO authenticated;
GRANT SELECT ON upcoming_slots_ordered TO anon;

-- =====================================================
-- 4. Verification queries (run to test)
-- =====================================================

-- Test waitlist_slots_ordered view
-- SELECT id, artist_name, artist_email, location_name, display_order
-- FROM waitlist_slots_ordered LIMIT 5;

-- Test upcoming_slots_ordered view
-- SELECT id, artist_name, date_from, date_to, location_name
-- FROM upcoming_slots_ordered LIMIT 5;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
--
-- SUMMARY:
-- ✅ waitlist_slots_ordered: Now includes artist_name from artists.name
-- ✅ upcoming_slots_ordered: Now includes artist_name from artists.name
-- ✅ Both views include all required artist fields:
--    - artist_name, artist_email, instagram, profile_picture_url,
--    - background_image_url, style, short_description, bio, is_guest
-- ✅ Both views include location fields:
--    - location_name, location_city
--
-- The management system and carousel embeds will now correctly
-- display artist names instead of "Unknown Artist".
-- =====================================================
