# 🎨 Dual Waitlist System Documentation

## Overview

The **Dual Waitlist System** extends the existing tattoo studio management platform to support two separate artist lists within a single "Waitlist" tab:

1. **Waitlist** - Artists with confirmed booking dates
2. **Upcoming List** - Future artists without confirmed dates

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

### Waitlist (Existing - Enhanced)
- ✅ Artists with confirmed booking dates
- ✅ Date range display (Start Date / End Date)
- ✅ Active/Upcoming status calculations
- ✅ Days remaining/until start indicators
- ✅ Date-based filtering
- ✅ Share paid tracking

### Upcoming List (New)
- ✅ Artists without confirmed dates
- ✅ No date fields in UI or database
- ✅ Simple "Upcoming" status badge
- ✅ Location and style information
- ✅ Share paid tracking
- ✅ Slot number management (1-60)

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

#### `upcoming_slots` (New)
```sql
CREATE TABLE upcoming_slots (
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

**Key Differences from `waitlist_slots`:**
- ❌ No `date_from` field
- ❌ No `date_to` field
- ✅ Includes `slot_number` for manual ordering
- ✅ Same location, artist, and payment tracking

#### `waitlist_slots` (Existing)
```sql
-- Includes all fields from upcoming_slots PLUS:
-- date_from DATE NOT NULL
-- date_to DATE NOT NULL
```

### Views

#### `upcoming_waitlist_view` (New)
```sql
CREATE VIEW upcoming_waitlist_view AS
SELECT
  us.id, us.slot_number, us.artist_id, us.location_id,
  us.status, us.notes, us.share_paid, us.created_at, us.updated_at,

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
```

#### `active_waitlist_slots` (Existing)
- Similar structure but includes date fields
- Orders by `date_from` ascending

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

**Waitlist Card** (with dates):
```
┌─────────────────────────────────────┐
│ [1] Artist Name                     │
│     artist@email.com                │
│                                     │
│ Start: 15. Jan 2025 | End: 22. Jan │
│ Location: Studio Name               │
│ Style: Blackwork                    │
│                                     │
│ [🎨 Active (5 days left)]          │
│ [✅ Share Paid]                    │
└─────────────────────────────────────┘
```

**Upcoming Card** (no dates):
```
┌─────────────────────────────────────┐
│ [15] Artist Name                    │
│      artist@email.com               │
│                                     │
│ Location: Studio Name               │
│ Style: Traditional                  │
│                                     │
│ [📅 Upcoming]                      │
│ [❌ Share Not Paid]                │
└─────────────────────────────────────┘
```

### 3. Add Slot Modal

**Waitlist Modal** (with date fields):
```
┌─ Add Waitlist Artist Slot ─────────┐
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

**Upcoming Modal** (no date fields):
```
┌─ Add Upcoming Artist Slot ─────────┐
│                                     │
│ Artist *         [Search...]        │
│ Slot Number *    [1-60]            │
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
  const viewName = currentListType === 'waitlist'
    ? 'active_waitlist_slots'
    : 'upcoming_waitlist_view';

  let query = supabase.from(viewName).select('*');

  // Order by date_from for waitlist, slot_number for upcoming
  if (currentListType === 'waitlist') {
    query = query.order('date_from', { ascending: true });
  } else {
    query = query.order('slot_number', { ascending: true });
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
    // Date calculations only for waitlist
    if (currentListType === 'waitlist' && slot.date_from) {
      // Calculate dates, status, days remaining
    }

    // Conditional date range rendering
    const dateSection = currentListType === 'waitlist' ? `
      <div>Start: ${fromDate}</div>
      <div>End: ${toDate}</div>
    ` : '';

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

  // Add dates only for waitlist
  if (currentListType === 'waitlist') {
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

#### Adding an Artist to Waitlist (With Dates)
1. Click **Waitlist** tab in navigation
2. Ensure **"Waitlist"** toggle is selected
3. Click **"+ Add Slot"** button
4. Fill in:
   - Search and select artist
   - Enter slot number (1-60)
   - Select start date
   - Select end date
   - Choose location
   - Add optional notes
5. Click **"Add Slot"**

#### Adding an Artist to Upcoming List (No Dates)
1. Click **Waitlist** tab in navigation
2. Click **"Upcoming List"** toggle
3. Click **"+ Add Slot"** button
4. Fill in:
   - Search and select artist
   - Enter slot number (1-60)
   - Choose location
   - Add optional notes
5. Click **"Add Slot"**

#### Switching Between Lists
- Click **"Waitlist"** button to see artists with confirmed dates
- Click **"Upcoming List"** button to see future artists without dates

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

1. **Database**: Created `upcoming_slots` table and `upcoming_waitlist_view`
2. **HTML**: Added toggle component to waitlist section
3. **CSS**: Styled toggle with Apple design patterns
4. **JavaScript**: Implemented dual-list logic with conditional rendering
5. **CRUD**: Adapted all operations to support both tables

### Migration Checklist:

- [ ] Run `upcoming_slots_migration.sql` in Supabase
- [ ] Verify tables and views exist
- [ ] Configure RLS policies
- [ ] Test toggle functionality
- [ ] Test add/edit/delete operations
- [ ] Test location filtering
- [ ] Test payment status toggle
- [ ] Verify existing waitlist still works

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
