# Culture Over Money - Project State
**Stand: 2026-01-28 | Version: 3.1390**
**UPDATE: Payment Email Text Fix & Paid Anzahlung Status**

---

## Aktuelle Position

```
╔═══════════════════════════════════════════════════════════════╗
║  PHASE 0: MAPPING & DOKUMENTATION                    ✓ DONE  ║
╠═══════════════════════════════════════════════════════════════╣
║  PHASE 1: EDGE FUNCTIONS                             ✓ DONE  ║
╠═══════════════════════════════════════════════════════════════╣
║  PHASE 2: RLS AUDIT                                  ✓ DONE  ║
╠═══════════════════════════════════════════════════════════════╣
║  PHASE 3: ERROR TRACKING                             ✓ DONE  ║
╠═══════════════════════════════════════════════════════════════╣
║  PHASE 3.5: SECURITY SCAN                            ✓ DONE  ║
╠═══════════════════════════════════════════════════════════════╣
║  PHASE 4: AUTH HARDENING                             ✓ DONE  ║
╠═══════════════════════════════════════════════════════════════╣
║  PHASE 4.5: PAYMENT STATUS FIX                       ✓ DONE  ║
╠═══════════════════════════════════════════════════════════════╣
║  PHASE 4.6: AUTH HARDENING INLINE INTEGRATION        ✓ DONE  ║
╠═══════════════════════════════════════════════════════════════╣
║  PHASE 4.7: ADMIN PANEL                              ✓ DONE  ║
╠═══════════════════════════════════════════════════════════════╣
║  PHASE 5.1: AGREEMENT FORM UX FIXES                  ✓ DONE  ║
╠═══════════════════════════════════════════════════════════════╣
║  PHASE 5.3: CONSULTATION PAYMENT FIX                 ✓ DONE  ║
╠═══════════════════════════════════════════════════════════════╣
║  PHASE 5.4: SECURITY AUDIT                           ✓ DONE  ║
╠═══════════════════════════════════════════════════════════════╣
║  PHASE 5.5: CALENDAR, SEARCH, ATTACHMENTS & RANK     ✓ DONE  ║
╠═══════════════════════════════════════════════════════════════╣
║  PHASE 5.6: CALENDAR AVAILABILITY VISUALIZATION      ✓ DONE  ║
╠═══════════════════════════════════════════════════════════════╣
║  PHASE 5.7: STATUS STRIPES & CLICK-TO-BOOK           ✓ DONE  ║
╠═══════════════════════════════════════════════════════════════╣
║  PHASE 5.8: PAYMENT NOTIFICATIONS & WEBHOOK FIX      ✓ DONE  ║
╠═══════════════════════════════════════════════════════════════╣
║  PHASE 5.9: REVENUE OVERVIEW FIX                     ✓ DONE  ║
╠═══════════════════════════════════════════════════════════════╣
║  PHASE 7: EVENTS UI & CREATE CARD                    ✓ DONE  ║
╠═══════════════════════════════════════════════════════════════╣
║  PHASE 8: DASHBOARD VISUAL POLISH               IN PROGRESS  ║
╠═══════════════════════════════════════════════════════════════╣
║  PHASE 8.1: V1 VIEW PERMISSIONS                      ✓ DONE  ║
╠═══════════════════════════════════════════════════════════════╣
║  PHASE 5.2: PERFORMANCE & POLISH                     BACKLOG  ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## Hotfix: Payment Email Text & Paid Anzahlung Status (2026-01-28) ✅ COMPLETE

### Changes

1. **Payment Email Option 1 Text**: Updated the bank transfer description in `create-payment-link` edge function
   - **Before**: `50% (X EUR) vorab überweisen, 50% am Termin bar`
   - **After**: `50% (X EUR) vorab überweisen, 50% am Termin bar und Antworte auf diese E-mail mit einem Screenshot der Überweisung zur Bestätigung deiner Zahlung.`

2. **Payment Status Options**: Added `paid_anzahlung` as new payment status in appointment edit modal
   - **Before**: unpaid, pending (Anzahlung), paid, canceled
   - **After**: unpaid, pending, paid_anzahlung, paid, canceled
   - `paid_anzahlung` has orange badge (same style as pending) with label "Anzahlung bezahlt"
   - `pending` label changed from "Pending (Anzahlung)" to just "Pending"
   - Both `pending` and `paid_anzahlung` are orange, indicating open balance

### Files Changed

- `supabase/functions/create-payment-link/index.ts` - Email template Option 1 text (Edge Function v33 deployed)
- `management-system.html` - `paymentStatusOptions` array (line ~41024), `getPaymentStatusBadge` badges (line ~40111)

### Edge Functions Deployed

```bash
create-payment-link  # v33
```

---

## Hotfix: Request Action Buttons Unclickable (2026-01-28) ✅ COMPLETE

### Problem

After switching between requests multiple times, the "Assign to User" and "Delete" buttons became unclickable. Cursor remained as default (no pointer), no console errors.

### Root Cause

1. **Async race condition**: `showRequestDetail()` is async and awaits `generateActivityCards()` (Supabase query). Rapid switching between requests caused multiple concurrent calls, where a stale older call could finish after a newer one and overwrite `detailEl.innerHTML` with outdated content.
2. **Fragile inline onclick handlers**: Buttons relied on inline `onclick` attributes generated via innerHTML, which could become detached or broken during async DOM overwrites.

### Solution

1. **Race condition guard**: Added version counter (`showRequestDetailVersion`) so stale async calls abort before setting innerHTML
2. **Event delegation**: Replaced inline `onclick` attributes with `data-action` / `data-request-id` attributes and a single delegated click listener on `#requestDetail`. This listener survives innerHTML replacements.
3. **Z-index elevation**: Added `position:relative;z-index:2` to action buttons and their container to ensure they stay above any potential overlay elements.

### Files Changed

- `management-system.html` - `generateActionButtons()`, `showRequestDetail()`, event delegation setup

---

## Feature: Appointment Payment Reminders & Email Config (2026-01-27) ✅ COMPLETE

### Changes

1. **Email Sender Address**: Changed from `booking@` / `noreply@` to `info@mommyimsorry.com` for all payment and reminder emails

2. **Payment Reminders Toggle**: Added ability to disable payment reminders per appointment
   - New DB column: `appointments.send_payment_reminders` (boolean, default: true)
   - Toggle switch in appointment edit modal
   - When disabled: no reminder emails, no automatic cancellation
   - Crossed-out mail icon shown in calendar when disabled

3. **Deposit Amount Field**: Added deposit tracking per appointment
   - New DB column: `appointments.deposit_amount` (numeric)
   - Input field in appointment edit modal (next to price)

### Files Changed

- **Database**: Added `send_payment_reminders` and `deposit_amount` columns
- `supabase/functions/payment-reminders/index.ts` - Email sender, reminder flag check
- `supabase/functions/create-payment-link/index.ts` - Email sender
- `supabase/functions/send-consultation-confirmation/index.ts` - Email sender
- `management-system.html` - Edit modal UI, save function, calendar rendering

### Edge Functions to Deploy

```bash
supabase functions deploy payment-reminders --no-verify-jwt
supabase functions deploy create-payment-link
supabase functions deploy send-consultation-confirmation
```

---

## Hotfix: Neukunde Rank Bug - Database Trigger Fix (2026-01-28) ✅ COMPLETE

### Problem

New customers were getting "Bronze" rank instead of "Neukunde" despite multiple previous fixes (Phase 5.5, etc.). This bug kept recurring and was marked as "fixed" at least 3 times before.

### Root Cause Analysis

**The bug had TWO layers that made it appear to "keep coming back":**

#### Layer 1: Database Trigger `update_customer_rank()` (PRIMARY CAUSE)

```sql
-- BUGGY CODE: The ELSE clause returned 'Bronze' for 0 completed bookings
IF booking_count >= 11 THEN new_rank := 'Platinum';
ELSIF booking_count >= 6 THEN new_rank := 'Gold';
ELSIF booking_count >= 3 THEN new_rank := 'Silver';
ELSE new_rank := 'Bronze';  -- ❌ BUG: 0 bookings = Bronze (should be Neukunde)
END IF;
```

**Why this was the REAL problem:**
- This trigger fires on EVERY `requests` table UPDATE
- Even simple status changes (open_request → pending) triggered it
- For customers with 0 completed bookings, it OVERWROTE their correct 'Neukunde' rank to 'Bronze'
- **This is why JavaScript fixes appeared to work initially but "broke" later**

**Timeline of a typical bug occurrence:**
1. Customer created via booking form → rank = 'Neukunde' ✅ (JS code correct)
2. Staff updates the request (assigns artist, changes status, etc.)
3. Trigger fires → counts 0 finished requests → sets rank = 'Bronze' ❌
4. Customer now has Bronze despite having no completed bookings

#### Layer 2: Add Customer Modal (MINOR)

```javascript
// Line 37009 - was sending null if no rank selected
rank: rank || null  // ❌ null overrides DB default
```

When staff added customers manually without selecting a rank, `null` was sent explicitly, which doesn't use the database default.

### Why Previous Fixes Failed

| Fix Attempt | What It Did | Why It Didn't Work |
|-------------|-------------|-------------------|
| Phase 5.5 (2026-01-14) | Fixed `findOrCreateCustomer()` to set 'Neukunde' | Trigger overwrote it on request UPDATE |
| Stripe webhook fix | Set 'Neukunde' in consultation checkout | Trigger overwrote it on request UPDATE |
| Database cleanup | Updated 13 rows to 'Neukunde' | Trigger overwrote them again on next request UPDATE |

**The fundamental mistake:** All fixes targeted the INSERT/creation of customers, but the database trigger was corrupting ranks on UPDATE operations. The trigger was never examined until now.

### Solution Applied (2026-01-28)

1. **Fixed database trigger** (Migration: `fix_update_customer_rank_neukunde`):
   ```sql
   -- Added condition: 0 bookings = Neukunde
   ELSIF booking_count >= 1 THEN new_rank := 'Bronze';
   ELSE new_rank := 'Neukunde';  -- ✅ FIX
   ```

2. **Fixed Add Customer modal** (`management-system.html:37021`):
   ```javascript
   rank: rank || 'Neukunde'  // ✅ Defaults to Neukunde
   ```

3. **Data cleanup** (Migration: `fix_customers_neukunde_rank_cleanup`):
   - Fixed 4,362 customers with incorrect Bronze rank
   - Additional cleanup on 2026-01-28: Fixed 6 more customers created before trigger fix propagated

### Verification

```sql
-- This query should return 0
SELECT COUNT(*) FROM customers
WHERE rank = 'Bronze'
  AND id NOT IN (
    SELECT DISTINCT customer_id FROM requests
    WHERE customer_id IS NOT NULL AND status = 'finished'
  );
-- Result: 0 ✅
```

### Lesson Learned

**When debugging "recurring" bugs, always check database triggers.** JavaScript fixes may be correct but can be overwritten by server-side trigger logic that runs on different events (INSERT vs UPDATE).

### Files Changed

- **Database**: `update_customer_rank()` function
- `management-system.html` - Line 37021

### Migrations Applied

```
fix_update_customer_rank_neukunde
fix_customers_neukunde_rank_cleanup
```

---

## Hotfix: Guest Spot Creation NULL Email Fix (2026-01-26) ✅ COMPLETE

### Problem

Creating a Guest Spot via the Create Guest Spot modal failed with error:
```
❌ Error creating Guest Spot: {"code":"23502","details":null,"hint":null,"message":"null value in column \"email\" of relation \"dienstplan\" violates not-null constraint"}
```

### Root Cause

The trigger `sync_upcoming_to_dienstplan` runs after inserting into `upcoming_slots`. It looks up the artist's email from the `artists` table:

```sql
SELECT email, is_guest
INTO v_artist_email, v_is_guest
FROM public.artists
WHERE id = NEW.artist_id;
```

Then inserts into `dienstplan` which has `email` as a **NOT NULL** column. Many guest artists don't have email addresses set (15+ artists found with `email = NULL`), causing the insert to fail.

### Solution

Applied migration `fix_guest_spot_dienstplan_null_email` to update the trigger function with a placeholder email fallback:

```sql
-- Use placeholder email if artist email is NULL
-- Format: guest-{artist_id}@placeholder.internal
IF v_artist_email IS NULL OR v_artist_email = '' THEN
  v_artist_email := 'guest-' || NEW.artist_id::text || '@placeholder.internal';
END IF;
```

### Files Changed

- **Database only** - No JavaScript changes required
- Migration: `fix_guest_spot_dienstplan_null_email`

### Testing

Guest Spot creation now works for artists without email addresses. The placeholder email ensures the `dienstplan` entry is created successfully.

---

## Hotfix: Event Edit Trigger Fix (2026-01-22) ✅ COMPLETE

### Problem

Editing/saving an event (meeting) in the calendar failed with error:
```
Error updating event: {"code":"42703","details":null,"hint":null,"message":"record \"new\" has no field \"agreement_file_url\""}
```

### Root Cause

A database trigger `trigger_set_agreement_uploaded_at` was attached to the `events` table, but the columns it referenced (`agreement_file_url`, `agreement_uploaded_at`) were **never created** in the table.

**The broken trigger function:**
```sql
-- This trigger ran on EVERY UPDATE to events table
CREATE OR REPLACE FUNCTION set_agreement_uploaded_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.agreement_file_url IS NOT NULL ...  -- Column doesn't exist!
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Solution

Applied migration `drop_broken_events_agreement_trigger` to remove:
1. The broken trigger `trigger_set_agreement_uploaded_at`
2. The unused function `set_agreement_uploaded_at()`

```sql
DROP TRIGGER IF EXISTS trigger_set_agreement_uploaded_at ON events;
DROP FUNCTION IF EXISTS set_agreement_uploaded_at();
```

### Files Changed

- **Database only** - No JavaScript changes required
- Migration: `drop_broken_events_agreement_trigger`

### Note

The file upload UI code in management-system.html (lines ~34809-34870) also references these non-existent columns. This dead code should be removed in a future cleanup phase, but it doesn't block functionality since users don't interact with that feature.

---

## Hotfix: Remove Gil from Consultation Booking (2026-01-22) ✅ COMPLETE

### Problem
Artist "Gil" was terminated and needed to be removed from consultation booking.

### Solution
1. Removed Gil's ID from `ARTIST_IDS` array
2. Adjusted CSS width for 4 artists (was 5)

**Artist IDs (verified from database):**
```javascript
const ARTIST_IDS = [
  '9c60a246-68f0-4d9a-968e-03f490f10e5f',  // Ata
  '98b63cd4-7e2e-409c-94cd-ac259a0a2635',  // Luca
  'a2b390b5-4898-4bd5-a6b3-8ea66878dcc9',  // Mary
  'eb67d5dc-2f6f-45e1-ba56-f8e513ef32ba'   // Mela
];
// Removed: 90cd70be-f1a4-409e-8570-7aa2699fc683 (Gil)
```

**CSS width adjustment:**
```css
/* Before: 5 artists */
width: calc((80vw - 64px) / 5);

/* After: 4 artists */
width: calc((80vw - 48px) / 4);
```

### Commits
```
1062437 fix(consultation): remove Gil from artist selection
2026c77 fix(consultation): adjust artist card width for 4 artists
```

---

## Phase 8.1: V1 View Permission System (2026-01-22) ✅ COMPLETE

### Overview

Implemented a restricted view permission system for specific artists who should only see their own data and limited UI elements.

### V1 Users (7 total)

| Artist | Email | Artist ID |
|--------|-------|-----------|
| Ata | atakand1995@gmail.com | 9c60a246-68f0-4d9a-968e-03f490f10e5f |
| Luka | luca@mommyimsorry.com | 98b63cd4-7e2e-409c-94cd-ac259a0a2635 |
| Mary | marie-sophie@truebswetter.com | a2b390b5-4898-4bd5-a6b3-8ea66878dcc9 |
| Mela | mela@mommyimsorry.com | eb67d5dc-2f6f-45e1-ba56-f8e513ef32ba |
| Marina Art | marina@example.com | 2fffbeca-0833-430b-b781-bade5235e17a |
| toriatattooo | toria@example.com | ed1e2b33-80d6-4f4e-972f-3d2b756746c8 |
| lily.shy | lily@example.com | ad5bb12d-abd6-4c98-ba3b-a886fc3d298b |

### What V1 Users CAN See

- **Dashboard**: Pinned Events + Schwarzes Brett (50/50 layout)
- **Calendar**: Only their own appointments (Residents section only)
- **Dienstplan**: Only their own schedule
- **Events/Meetings**: Can create and participate

### What V1 Users CANNOT See

- **Navigation tabs**: Requests, Guest Spots, Waitlist, Artists, Customers, Agreements, Analytics, Wannados
- **Dashboard columns**: Neue Anfragen, Anstehende Termine (right column hidden)
- **Calendar sections**: Guests, Hospitality
- **Payment info**: All payment badges, amounts, status everywhere
- **Action buttons**: Edit, Cancel, Delete in appointment details
- **Create buttons**: + Booking, + Stay

### Technical Implementation

**Database:**
```sql
-- Added view_permission column to artists table
ALTER TABLE artists ADD COLUMN view_permission TEXT DEFAULT NULL;

-- Set V1 for restricted users
UPDATE artists SET view_permission = 'V1' WHERE id IN (...);
```

**Frontend (CSS):**
```css
/* V1 elements hidden via body class */
body.view-restricted-v1 [data-category="guest"],
body.view-restricted-v1 [data-category="artist_info"],
body.view-restricted-v1 #createStayBtn,
body.view-restricted-v1 #modalEditBtn,
body.view-restricted-v1 #modalCancelBtn,
body.view-restricted-v1 #modalDeleteBtn,
body.view-restricted-v1 .payment-section,
/* ... etc */
```

**Frontend (JavaScript):**
```javascript
// Helper function
function hasRestrictedView() {
  return currentUserViewPermission === 'V1';
}

// Calendar filtering
if (hasRestrictedView() && currentUserArtistId) {
  categoryEvents = categoryEvents.filter(e => e.artistId === currentUserArtistId);
}
```

### Key Files Modified

- `management-system.html` - CSS hiding rules, JS filtering logic
- Database: `artists.view_permission` column

### Commits

```
8f9b9b5 feat(v1-permissions): add dashboard 50/50 layout and mobile filtering
e74555f feat(v1-permissions): hide guests, hospitality, stays and action buttons
c876722 fix(v1-permissions): fix calendar grid alignment for hidden sections
```

### Important Notes

1. **Email matching**: artists.email MUST match profiles.email for V1 detection to work
2. **Calendar grid**: Uses `data-category` attribute on rows (not wrapper divs) to avoid breaking CSS Grid
3. **Mobile**: Same restrictions apply via CSS and JS filtering
4. **Schwarzes Brett**: Auto-slide disabled, users navigate manually

---

## Phase 8: Dashboard Visual Polish (2026-01-22) 🔄 IN PROGRESS

### Completed Tasks

| Task | Description | Status |
|------|-------------|--------|
| Dashboard Entry Animations | Staggered slide-up animations for dashboard columns | ✅ |
| Avatar Display Bug Fix | Reset to default icon when user has no avatar_url | ✅ |
| Event Participation RLS Fix | Migration to allow event participation updates | ✅ |
| Events Filtering | Events only visible to participants/collaborators | ✅ |
| Dashboard Background Image | Supabase image for dashboard, grey for other pages | ✅ |
| Glass Container Styling | Frosted look with 8px blur, light grey, 0.58 opacity | ✅ |
| Welcome Message White | Dashboard welcome text changed to white | ✅ |
| Hidden Scrollbars | Neue Anfragen & Anstehende Termine scroll without visible bars | ✅ |
| Dark Mode Navbar Fix | Fixed color mismatch between header and navbar (#1c1c1e) | ✅ |
| Mobile Testing | Verified calendar and profile views on mobile viewport (375x812) | ✅ |
| Create Booking UX Improvements | Customer search, Add buttons, Anzahlung field, fixed slot error | ✅ |
| Schwarzes Brett Indicator Lines | Removed wrapper, thicker glass lines (6px), light grey in light mode | ✅ |
| Edit Artist Rank Selection | Changed R1-R5 to Friends/Crew/Fam/VIP with percentages | ✅ |
| Version Badge White | Changed version badge color to white for better contrast | ✅ |
| Dark Mode Text White | Brett author/text and project titles white in dark mode (via CSS classes) | ✅ |
| Dark Mode Navbar Sync | Navbar forced to match header (#1c1c1e) with !important | ✅ |
| Requests Page Horizontal Layout | Location → Create → State Tabs → Search in one row | ✅ |
| Remove Auto-Refresh | Removed auto-refresh toggle, button, and all related JS code | ✅ |
| Immediate Request Display | New requests show immediately after creation via loadRequests() | ✅ |
| Analytics Tab Styling (management-system.html) | Removed white background from time filter tabs, removed blue indicator on nav | ✅ |
| Modern Chart Design (management-system.html) | Updated pie/bar/line charts with gradients, modern tooltips, smooth animations | ✅ |
| Unified Pie Chart Design System | Created unified CSS classes for 17 pie charts, fixed missing legend styles | ✅ |
| Pie Chart Centered Layout | Updated all pie charts to center alignment with space-between, even padding | ✅ |
| Location Breakdown Merge | Location cards and charts merged into Analytics Dashboard | ✅ |
| Website Traffic Merge | PostHog web analytics merged into Analytics Dashboard (compact view) | ✅ |

### Technical Details

**Dashboard Analytics Consolidation (2026-01-26):**

Merged Location Breakdown and Website Traffic into the main Analytics Dashboard for a unified overview.

**Changes:**
1. **Pie Chart Layout Update**: Changed from `flex-start` to `center` with `space-between` for legend items
2. **Location Breakdown**: Added to Dashboard with location cards, revenue chart, and requests pie chart
3. **Website Traffic**: Added compact PostHog view to Dashboard with KPIs and top pages/referrers
4. **New HTML Elements**:
   - `dashboardLocationCardsContainer` - Location cards in dashboard
   - `dashboardLocationRevenueChart` - Bar chart for revenue by location
   - `dashboardLocationRequestsPie` - Pie chart for requests by location
   - `dashboardWebAnalyticsContent` - Compact web analytics view
5. **New JavaScript Function**: `renderDashboardWebAnalytics()` - Renders compact web analytics

**Unified Pie Chart Design System V2 (2026-01-26):**

Complete rewrite of pie chart styling for consistent design across all 17 analytics charts.

**1. Unified CSS System** (Single source of truth):
```css
/* All charts now use these classes */
.pie-chart-layout { display: flex; gap: 24px; padding: 8px 0; }
.pie-chart-wrapper { width: 140px; height: 140px; /* FIXED SIZE */ }
.pie-legend { flex: 1; max-height: 180px; overflow-y: auto; }
.pie-chart-layout.narrow { flex-direction: column; } /* For 4-col grids */
```

**2. New Legend Format** - `Percent% | Color | Name | Count`:
```html
<div class="pie-legend-item">
  <span class="pie-legend-percent">45.2%</span>
  <div class="pie-legend-dot" style="background: #0071e3"></div>
  <span class="pie-legend-name">Instagram</span>
  <span class="pie-legend-count">1.234</span>
</div>
```

**3. Size Variants**:
- **Standard**: 140×140px - all analytics views
- **Narrow**: 100×100px - 4-column layouts (Browsers, Devices)

**4. JavaScript Updates**:
- `createAnalyticsPieChart()` - updated legend template
- `createAnalyticsDoughnutChart()` - updated legend template

**Charts covered (17 total)**:
Request Origins, Conversion Funnel, Booking Sources, Conversion Breakdown,
Team Distribution, Traffic Sources, Device Breakdown, New vs Returning,
Customer Segmentation, Guest Spots by Studio, Booking Type Distribution,
Artists per Rank, Einnahmen nach Quelle, Category Distribution,
Umsatz nach Kategorie, Eingelöst vs. Offen, Requests by Location

**Create Booking Modal Improvements (2026-01-22):**

1. **Customer Selection** - Replaced text input with:
   - Live search dropdown (searches by name, email, phone, instagram)
   - "Add Customer" button to open existing Add Customer modal
   - Selected customer display card with remove option

2. **Artist Selection** - Added:
   - "Add Artist" button next to artist search

3. **Payment Section** - Added:
   - "Anzahlung" (deposit) field with € symbol
   - Changed grid from 2 to 3 columns (Price, Anzahlung, Status)
   - Deposit saved to `deposit_amount` column in appointments table

4. **Bug Fix** - Fixed "slot column not found" error:
   - Removed `slot: slot` from appointments insert (column doesn't exist in DB)
   - Removed slot calculation/validation code that was blocking bookings

**Dashboard Animations (CSS):**
```css
@keyframes dashboardFadeIn { from { opacity: 0; transform: translateY(20px); } }
@keyframes dashboardSlideUp { from { opacity: 0; transform: translateY(30px); } }

.dashboard-col-left { animation: dashboardSlideUp 0.5s ease-out 0.1s forwards; }
.dashboard-col-center-top { animation: dashboardSlideUp 0.5s ease-out 0.2s forwards; }
.dashboard-col-right { animation: dashboardSlideUp 0.5s ease-out 0.3s forwards; }
.dashboard-col-center-bottom { animation: dashboardSlideUp 0.5s ease-out 0.4s forwards; }
```

**Avatar Bug Fix:**
- Problem: One user's avatar (David's) showed for ALL users in profile button
- Cause: `updateUIForUser` only set avatar when `avatar_url` existed, never reset it
- Fix: Added else clause to reset profile button to default SVG icon
- Applied to: Desktop profile button, mobile nav avatar, mobile dashboard profile

**Event Participation RLS Fix:**
```sql
-- Migration: fix_event_participants_update_policy
DROP POLICY IF EXISTS event_participants_update_own ON event_participants;
CREATE POLICY event_participants_update_all ON event_participants
FOR UPDATE USING (true) WITH CHECK (true);
```
- Problem: RLS policy required `artist_id = auth.uid()` but app uses custom auth
- Fix: Created permissive update policy for event_participants table

**Glass Container Variables:**
```css
/* Light Mode */
--glass-bg: rgba(245, 245, 247, 0.58);
--glass-bg-elevated: rgba(245, 245, 247, 0.72);
--glass-blur: blur(8px);
--glass-border: rgba(255, 255, 255, 0.4);

/* Dark Mode */
--glass-bg: rgba(60, 60, 67, 0.58);
--glass-bg-elevated: rgba(70, 70, 77, 0.72);
```

**Dark Mode Navbar Fix:**
```css
[data-theme="dark"] .navbar-container {
  background: #1c1c1e; /* Match header section color - was #2c2c2e */
}
```

**Dashboard Background:**
```css
#dashboard-section {
  background: url('https://auxxyehgzkozdjylhqnx.supabase.co/storage/v1/object/public/Background/Bildschirmfoto%202026-01-21%20um%2015.43.55.png') no-repeat center center;
  background-size: cover;
  background-attachment: fixed;
}
```

**Hidden Scrollbars:**
```css
.right-column-section .glass-card-content {
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.right-column-section .glass-card-content::-webkit-scrollbar {
  display: none;
}
```

### Commits (Phase 8)

```
d73d1f8 feat(dashboard): add entry animations and fix avatar display bug
4c8fb2f style(dashboard): image background for dashboard only, grey glass cards
e32235f style(glass): update glassmorphism to match frosted reference
3a77bd9 style(glass): adjust opacity and add grey dark mode
cf35674 style(dashboard): increase glass opacity to 0.92, update background image
2a217fa style(dashboard): hide scrollbars, light grey glass at 0.95 opacity
260664a style(glass): increase opacity to 0.97 (10% less transparent)
ca79cc4 style(dashboard): increase glass transparency to 58%, reduce blur to 8px, fix dark navbar
```

### Known Context for Next Session

1. **Glass opacity is at 0.58** - 40% more transparent with 8px blur for glass-like texture
2. **Background image URL**: `https://auxxyehgzkozdjylhqnx.supabase.co/storage/v1/object/public/Background/Bildschirmfoto%202026-01-21%20um%2015.43.55.png`
3. **Welcome message is white** for contrast against background image
4. **Dark mode uses grey glass** (rgba 60, 60, 67, 0.58) instead of dark
5. **Dark mode navbar** uses #1c1c1e to match header (was #2c2c2e)
6. **Event participants RLS** now has permissive update policy
7. **Mobile tested** - Calendar and profile views verified on 375x812 viewport

### Remaining / Potential Tasks

- [ ] Further visual refinements based on user feedback
- [ ] Dark mode background image (optional)

---

## Hotfix: Appointment Cancel Button Fix (2026-01-21) ✅ COMPLETE

### Problem

Cancel button in appointment details popup:
1. Threw `ReferenceError: showToast is not defined` error
2. The appointment `status` was not being set to "canceled" (remained "unknown")

### Root Cause

**Two issues found:**

1. **JavaScript:** Code was calling `showToast()` which doesn't exist in `management-system.html`. The correct function is `showNotification()`.

2. **Database Trigger:** The `calculate_appointment_status()` function was missing 'Cancelled' in its state-to-status mapping:
   ```sql
   -- Original: 'Cancelled' fell through to ELSE 'unknown'
   WHEN 'Zugesagt' THEN 'scheduled'
   WHEN 'Ill/No Show' THEN 'canceled'
   WHEN 'Verschoben' THEN 'rescheduled'
   ELSE 'unknown'  -- 'Cancelled' ended up here!
   ```

   The `appointment_status_auto_update` trigger runs on every UPDATE and computes `status` from `state`. Since 'Cancelled' wasn't mapped, it returned 'unknown'.

### Solution

**1. JavaScript Fix:** Replaced all 15 occurrences of `showToast()` with `showNotification()`.

**2. Database Migration:** Updated `calculate_appointment_status()` to include 'Cancelled' → 'canceled' mapping:

```sql
-- Migration: fix_appointment_status_cancelled_mapping
CREATE OR REPLACE FUNCTION calculate_appointment_status(p_state TEXT, p_end_time TIMESTAMPTZ)
RETURNS TEXT AS $$
BEGIN
    -- Added 'Cancelled' -> 'canceled' in all three CASE branches
    RETURN CASE p_state
        WHEN 'Zugesagt' THEN 'scheduled'
        WHEN 'Cancelled' THEN 'canceled'  -- NEW
        WHEN 'Ill/No Show' THEN 'canceled'
        WHEN 'Verschoben' THEN 'rescheduled'
        ...
    END;
END;
$$ LANGUAGE plpgsql;
```

### Files Changed

- `management-system.html` - Replaced `showToast(` → `showNotification(` (15 occurrences)
- `management-system.html` - Simplified cancel button (status auto-computed by trigger)
- **Database** - Migration `fix_appointment_status_cancelled_mapping` applied

### Commits

```
c6a81a4 fix(appointments): replace undefined showToast with showNotification
ca482fd fix(appointments): simplify cancel button after DB trigger fix
```

---

## Nächste Schritte

### Phase 8: Dashboard Visual Polish (CONTINUE)

- Complete any remaining visual refinements
- Test on different screen sizes
- Verify dark mode appearance

### Phase 5.2: Performance & Polish (BACKLOG)

1. **Overpermissive RLS Policies reviewen**
   - `qual=true` Policies durch rollenbasierte ersetzen

2. **Code Cleanup**
   - Unused console.log entfernen
   - Dead Code entfernen (inkl. agreement file upload UI für events)

3. **Error Tracking V2** (Optional)
   - Persistente Errors in Supabase
   - Email-Alerts bei kritischen Fehlern

---

*Aktualisiert am 2026-01-22 mit Claude Code (Phase 8.1 V1 Permissions)*
