# 🎨 Dual Waitlist System Documentation

## Overview

The **Dual Waitlist System** extends the existing tattoo studio management platform to support two separate artist lists within a single "Waitlist" tab:

1. **Waitlist** - Artists available NOW (no specific dates)
2. **Upcoming List** - Artists with SPECIFIC booking dates

This system maintains design consistency with the existing Apple-inspired interface while providing flexible artist management capabilities.

---

## 📋 Table of Contents

- [Features](#features)
- [Database Structure](#database-structure)
- [UI Components](#ui-components)
- [Implementation Details](#implementation-details)
- [Database Migration](#database-migration)
- [Usage Guide](#usage-guide)
- [Technical Architecture](#technical-architecture)
- [Troubleshooting](#troubleshooting)

---

## ✨ Features

### Waitlist (Modified)
- ✅ Artists available NOW (no specific dates)
- ✅ No date fields in UI or database
- ✅ Simple "🕒 Jetzt verfügbar" status badge
- ✅ Location and style information
- ✅ Share paid tracking
- ✅ Slot number management (1-60)

### Upcoming List (New)
- ✅ Artists with SPECIFIC booking dates
- ✅ Date range display (Start Date / End Date)
- ✅ Active/Upcoming status calculations
- ✅ Days remaining/until start indicators
- ✅ Date-based ordering
- ✅ Share paid tracking

### Shared Features
- 🔄 **Seamless Toggle**: Switch between lists with one click
- 📍 **Location Filtering**: Filter by studio location (both lists)
- 🎯 **Slot Management**: 60 slots per location
- 👤 **Artist Search**: Autocomplete artist selection
- ✏️ **CRUD Operations**: Add, view, edit, delete slots
- 💰 **Payment Tracking**: Mark share as paid/unpaid
- 🎨 **Apple Design**: Consistent frosted glass aesthetic

---

## 🗄️ Database Structure

### Tables

#### `waitlist_slots` (Modified)
```sql
CREATE TABLE waitlist_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_number INTEGER NOT NULL,
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active',
  notes TEXT,
  share_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(slot_number, location_id)
);
```

**Key Features:**
- ❌ NO `date_from` field (removed)
- ❌ NO `date_to` field (removed)
- ✅ For artists available NOW
- ✅ Includes `slot_number` for manual ordering
- ✅ Location, artist, and payment tracking

#### `upcoming_slots` (New)
```sql
-- Includes all fields from waitlist_slots PLUS:
-- date_from DATE NOT NULL
-- date_to DATE NOT NULL
-- CHECK (date_to >= date_from)
```

### Views

#### `active_waitlist_view` (Modified)
```sql
CREATE VIEW active_waitlist_view AS
SELECT
  ws.id, ws.slot_number, ws.artist_id, ws.location_id,
  ws.status, ws.notes, ws.share_paid, ws.created_at, ws.updated_at,

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
```

**Note:** NO date fields (artists available NOW)

#### `upcoming_waitlist_view` (New)
- Similar structure but INCLUDES `date_from` and `date_to` fields
- Orders by `date_from` ascending (date-based ordering)

---

## 🎨 UI Components

### 1. List Toggle Component

**Location**: Top of Waitlist section
**File**: `management-system.html` (Lines 5701-5714)

```html
<div id="waitlistTypeToggle">
  <button class="list-toggle-option active" data-list-type="waitlist">
    Waitlist
  </button>
  <button class="list-toggle-option" data-list-type="upcoming">
    Upcoming List
  </button>
</div>
<p id="listTypeDescription">
  Artists with confirmed booking dates
</p>
```

**Styling**:
```css
.list-toggle-option {
  padding: 8px 20px;
  border-radius: 8px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.list-toggle-option.active {
  background: white;
  color: #1d1d1f;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
}
```

### 2. Slot Cards

**Waitlist Card** (NO dates - available NOW):
```
┌─────────────────────────────────────┐
│ [1] Artist Name                     │
│     artist@email.com                │
│                                     │
│ Location: Studio Name               │
│ Style: Blackwork                    │
│                                     │
│ [🕒 Jetzt verfügbar]               │
│ [✅ Share Paid]                    │
└─────────────────────────────────────┘
```

**Upcoming Card** (WITH dates - scheduled):
```
┌─────────────────────────────────────┐
│ [15] Artist Name                    │
│      artist@email.com               │
│                                     │
│ Start: 15. Jan 2025 | End: 22. Jan │
│ Location: Studio Name               │
│ Style: Traditional                  │
│                                     │
│ [📅 Starts in 10 days]             │
│ [❌ Share Not Paid]                │
└─────────────────────────────────────┘
```

### 3. Add Slot Modal

**Waitlist Modal** (NO date fields - available NOW):
```
┌─ Add Waitlist Artist Slot ─────────┐
│                                     │
│ Artist *         [Search...]        │
│ Slot Number *    [1-60]            │
│ Location *       [Dropdown]        │
│ Notes (optional) [Text Area]       │
│                                     │
│            [Cancel]  [Add Slot]    │
└─────────────────────────────────────┘
```

**Upcoming Modal** (WITH date fields - scheduled):
```
┌─ Add Upcoming Artist Slot ─────────┐
│                                     │
│ Artist *         [Search...]        │
│ Slot Number *    [1-60]            │
│ Start Date *     [Date Picker]     │
│ End Date *       [Date Picker]     │
│ Location *       [Dropdown]        │
│ Notes (optional) [Text Area]       │
│                                     │
│            [Cancel]  [Add Slot]    │
└─────────────────────────────────────┘
```

---

## 💻 Implementation Details

### State Management

```javascript
// Global state variables
let currentWaitlistLocation = 'all';
let waitlistSlots = [];
let currentListType = 'waitlist'; // 'waitlist' or 'upcoming'
```

### Core Functions

#### 1. `switchListType(listType)`
**Purpose**: Toggle between Waitlist and Upcoming List

```javascript
function switchListType(listType) {
  currentListType = listType;

  // Update toggle UI
  // Update description text
  // Reload data
  loadWaitlistSlots(currentWaitlistLocation);
}
```

**Triggered by**: Toggle button clicks

#### 2. `loadWaitlistSlots(locationFilter)`
**Purpose**: Load data from appropriate table/view

```javascript
async function loadWaitlistSlots(locationFilter = 'all') {
  // WAITLIST = Artists available NOW (NO dates)
  // UPCOMING = Artists with SPECIFIC dates
  const viewName = currentListType === 'waitlist'
    ? 'active_waitlist_view'
    : 'upcoming_waitlist_view';

  let query = supabase.from(viewName).select('*');

  // Order by slot_number for waitlist (NO dates), date_from for upcoming (HAS dates)
  if (currentListType === 'waitlist') {
    query = query.order('slot_number', { ascending: true });
  } else {
    query = query.order('date_from', { ascending: true });
  }

  // Apply location filter
  if (locationFilter !== 'all') {
    query = query.eq('location_id', locationFilter);
  }

  const { data, error } = await query;
  renderWaitlistSlots(data);
}
```

#### 3. `renderWaitlistSlots(slots)`
**Purpose**: Render slot cards with conditional date display

```javascript
function renderWaitlistSlots(slots) {
  container.innerHTML = slots.map(slot => {
    // Date calculations ONLY for UPCOMING (has dates)
    // WAITLIST has NO dates (artists available NOW)
    if (currentListType === 'upcoming' && slot.date_from) {
      // Calculate dates, status, days remaining
    }

    // Conditional date range rendering
    const dateSection = currentListType === 'upcoming' ? `
      <div>Start: ${fromDate}</div>
      <div>End: ${toDate}</div>
    ` : '';

    // Status badge
    const statusBadge = currentListType === 'upcoming'
      ? `Active/Upcoming with dates`
      : `🕒 Jetzt verfügbar`;

    return `<div class="waitlist-slot-card">...</div>`;
  }).join('');
}
```

#### 4. `handleAddSlot()`
**Purpose**: Insert slot into appropriate table

```javascript
async function handleAddSlot() {
  const slotData = {
    slot_number: slotNumber,
    artist_id: artistId,
    location_id: locationId,
    notes: notes
  };

  // Add dates ONLY for UPCOMING (has dates, WAITLIST has NO dates)
  if (currentListType === 'upcoming') {
    slotData.date_from = dateFrom;
    slotData.date_to = dateTo;

    // Validate dates
    if (new Date(dateTo) < new Date(dateFrom)) {
      showNotification('End date must be after start date', 'error');
      return;
    }
  }

  const tableName = currentListType === 'waitlist'
    ? 'waitlist_slots'
    : 'upcoming_slots';

  await supabase.from(tableName).insert([slotData]);
}
```

#### 5. `deleteWaitlistSlot(slotId)` & `toggleSharePaid(slotId)`
**Purpose**: CRUD operations on appropriate table

```javascript
async function deleteWaitlistSlot(slotId) {
  const tableName = currentListType === 'waitlist'
    ? 'waitlist_slots'
    : 'upcoming_slots';

  await supabase.from(tableName).delete().eq('id', slotId);
}
```

---

## 🚀 Database Migration

### Step 1: Run Migration SQL

**File**: `database/migrations/upcoming_slots_migration.sql`

```bash
# Execute migration in Supabase SQL Editor or via CLI
psql -h your-db-host -U postgres -d your-database -f upcoming_slots_migration.sql
```

Or use Supabase Dashboard:
1. Go to **SQL Editor**
2. Paste contents of `upcoming_slots_migration.sql`
3. Click **Run**

### Step 2: Verify Tables and Views

```sql
-- Check table exists
SELECT * FROM upcoming_slots LIMIT 1;

-- Check view exists
SELECT * FROM upcoming_waitlist_view LIMIT 1;

-- Verify indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'upcoming_slots';
```

### Step 3: Configure Row Level Security (RLS)

Adjust RLS policies based on your authentication setup:

```sql
-- Example: Allow authenticated users full access
CREATE POLICY "Allow authenticated users full access"
  ON upcoming_slots
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

---

## 📖 Usage Guide

### For Studio Managers

#### Adding an Artist to Waitlist (NO Dates - Available NOW)
1. Click **Waitlist** tab in navigation
2. Ensure **"Waitlist"** toggle is selected
3. Click **"+ Add Slot"** button
4. Fill in:
   - Search and select artist
   - Enter slot number (1-60)
   - Choose location
   - Add optional notes
5. Click **"Add Slot"**

#### Adding an Artist to Upcoming List (WITH Dates - Scheduled)
1. Click **Waitlist** tab in navigation
2. Click **"Upcoming List"** toggle
3. Click **"+ Add Slot"** button
4. Fill in:
   - Search and select artist
   - Enter slot number (1-60)
   - **Select start date**
   - **Select end date**
   - Choose location
   - Add optional notes
5. Click **"Add Slot"**

#### Switching Between Lists
- Click **"Waitlist"** button to see artists available NOW (no dates)
- Click **"Upcoming List"** button to see artists with SPECIFIC dates

#### Filtering by Location
1. Select a list (Waitlist or Upcoming)
2. Click a location button (All Locations, Mommy I'm Sorry, etc.)
3. View filtered results

#### Managing Payment Status
- Click **"✅ Paid"** or **"❌ Unpaid"** button to toggle
- Status persists across both lists

---

## 🏗️ Technical Architecture

### Data Flow

```
┌─────────────────────────────────────────────────┐
│              User Interface                      │
│  [Waitlist Toggle] [Upcoming Toggle]            │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│          State Management                        │
│  currentListType: 'waitlist' | 'upcoming'       │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│         Data Loading Layer                       │
│  loadWaitlistSlots(locationFilter)              │
│  ├─ if waitlist → active_waitlist_slots         │
│  └─ if upcoming → upcoming_waitlist_view        │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│           Supabase Database                      │
│  ├─ waitlist_slots (with dates)                 │
│  ├─ upcoming_slots (no dates)                   │
│  ├─ active_waitlist_slots (view)                │
│  └─ upcoming_waitlist_view (view)               │
└─────────────────────────────────────────────────┘
```

### File Structure

```
script.js/
├── management-system.html          # Main application file
│   ├── Lines 5686-5742             # HTML: Waitlist section with toggle
│   ├── Lines 419-443               # CSS: Toggle component styles
│   └── Lines 21651-22591           # JavaScript: Dual list logic
│
├── database/
│   └── migrations/
│       └── upcoming_slots_migration.sql  # Database setup
│
└── DUAL_WAITLIST_SYSTEM_README.md  # This file
```

### Key Code Locations

| Component | File | Lines | Description |
|-----------|------|-------|-------------|
| Toggle UI | management-system.html | 5701-5714 | HTML for toggle buttons |
| Toggle CSS | management-system.html | 419-443 | Styles for toggle component |
| State Variables | management-system.html | 21655-21657 | Global state management |
| Switch Function | management-system.html | 21659-21694 | Toggle list type |
| Load Data | management-system.html | 21699-21742 | Fetch from DB |
| Render Slots | management-system.html | 21747-21949 | Display slot cards |
| Add Modal | management-system.html | 21963-22276 | Add slot form |
| Handle Add | management-system.html | 22382-22454 | Insert new slot |
| Delete | management-system.html | 22456-22487 | Remove slot |
| Toggle Paid | management-system.html | 22489-22515 | Update payment status |
| Initialize | management-system.html | 22550-22591 | Setup event listeners |

---

## 🐛 Troubleshooting

### Issue: Toggle button not working

**Symptoms**: Clicking toggle does nothing

**Solutions**:
1. Check browser console for errors
2. Verify event listeners are attached:
   ```javascript
   // In browser console
   document.querySelectorAll('.list-toggle-option').length // Should be 2
   ```
3. Ensure `initWaitlist()` is called on page load

### Issue: Upcoming list shows no data

**Symptoms**: Empty state appears when switching to Upcoming List

**Solutions**:
1. Verify database migration ran successfully:
   ```sql
   SELECT * FROM upcoming_slots;
   SELECT * FROM upcoming_waitlist_view;
   ```
2. Check RLS policies allow read access:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'upcoming_slots';
   ```
3. Add test data:
   ```sql
   INSERT INTO upcoming_slots (slot_number, artist_id, location_id)
   VALUES (1, 'artist-uuid', 'location-uuid');
   ```

### Issue: Date fields not hiding for Upcoming List

**Symptoms**: Date inputs still visible in modal for Upcoming List

**Solutions**:
1. Check `currentListType` value:
   ```javascript
   console.log(currentListType); // Should be 'upcoming'
   ```
2. Verify conditional rendering in `openAddSlotModal()`:
   ```javascript
   ${currentListType === 'waitlist' ? `date fields` : ''}
   ```
3. Clear browser cache and reload

### Issue: "Failed to add slot" error

**Symptoms**: Error when adding slot to Upcoming List

**Solutions**:
1. Check browser console for detailed error
2. Common causes:
   - Duplicate slot number for same location
   - Missing artist_id or location_id
   - Invalid slot number (not 1-60)
3. Verify table constraints:
   ```sql
   SELECT conname, contype, pg_get_constraintdef(oid)
   FROM pg_constraint
   WHERE conrelid = 'upcoming_slots'::regclass;
   ```

### Issue: Slots not rendering correctly

**Symptoms**: Blank cards or missing information

**Solutions**:
1. Check if view returns data:
   ```sql
   SELECT * FROM upcoming_waitlist_view;
   ```
2. Verify joins in view definition (artists and locations tables must exist)
3. Check `renderWaitlistSlots()` function for errors

---

## 📝 Summary

The Dual Waitlist System successfully extends the existing waitlist functionality to support:

✅ **Two distinct lists** with a unified interface
✅ **Conditional rendering** based on list type
✅ **Shared CRUD operations** across both tables
✅ **Consistent Apple-inspired design**
✅ **Backward compatibility** with existing waitlist

### Changes Made:

1. **Database**:
   - MODIFIED `waitlist_slots` table (REMOVED date_from, date_to)
   - CREATED `upcoming_slots` table (WITH date_from, date_to)
   - CREATED `active_waitlist_view` (for waitlist WITHOUT dates)
   - CREATED `upcoming_waitlist_view` (for upcoming WITH dates)
2. **HTML**: Added toggle component to waitlist section
3. **CSS**: Styled toggle with Apple design patterns
4. **JavaScript**: Implemented dual-list logic with conditional rendering
5. **CRUD**: Adapted all operations to support both tables

### Migration Checklist:

- [ ] Run `upcoming_slots_migration.sql` in Supabase
- [ ] Verify `waitlist_slots` has NO date_from/date_to columns
- [ ] Verify `upcoming_slots` table exists with date fields
- [ ] Verify both views exist and return data correctly
- [ ] Configure RLS policies for both tables
- [ ] Test toggle functionality
- [ ] Test add operations (waitlist WITHOUT dates, upcoming WITH dates)
- [ ] Test edit/delete operations
- [ ] Test location filtering
- [ ] Test payment status toggle

### IMPORTANT DATABASE STRUCTURE:

**WAITLIST_SLOTS**: Artists available NOW - NO date_from, NO date_to
**UPCOMING_SLOTS**: Artists with dates - HAS date_from, HAS date_to

---

## 🔗 Related Documentation

- [Waitlist Carousel System](WAITLIST_CAROUSEL_README.md)
- [Management System Architecture](docs/architecture.md)
- [Supabase Schema](database/schema.sql)

---

**Version**: 1.0
**Last Updated**: 2025-01-20
**Maintainer**: Development Team

For questions or issues, please open a GitHub issue or contact the development team.
