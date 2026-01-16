# Culture Over Money - Project State
**Stand: 2026-01-16 | Version: 3.1214**
**UPDATE: Phase 5.7 Calendar Status Stripes & Click-to-Book ✓**

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
║  PHASE 5.2: PERFORMANCE & POLISH                     → NEXT  ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## Phase 5.7: Status Stripes & Click-to-Book (2026-01-16) ✅ COMPLETE

### Overview

Added visual status indicators for appointments and click-to-book functionality for available time slots.

### Features Implemented

| Feature | Description | Status |
|---------|-------------|--------|
| Status Stripes | Diagonal stripe patterns for rescheduled/canceled/no_show | ✅ |
| Click-to-Book | Modal opens when clicking green available slots | ✅ |
| Non-Blocking Logic | Canceled appointments don't block availability | ✅ |
| Artist ID Lookup Fix | Improved artist ID resolution for click handlers | ✅ |

### CSS Stripe Patterns

```css
/* Rescheduled - gray diagonal stripes */
.event.status-rescheduled {
  background-image: repeating-linear-gradient(
    45deg, transparent, transparent 10px,
    rgba(142, 142, 147, 0.3) 10px, rgba(142, 142, 147, 0.3) 20px
  ) !important;
  opacity: 0.75;
}

/* Canceled - red diagonal stripes */
.event.status-canceled {
  background-image: repeating-linear-gradient(
    45deg, transparent, transparent 10px,
    rgba(255, 59, 48, 0.25) 10px, rgba(255, 59, 48, 0.25) 20px
  ) !important;
  opacity: 0.75;
}

/* No Show - dark gray diagonal stripes */
.event.status-no-show {
  background-image: repeating-linear-gradient(
    45deg, transparent, transparent 10px,
    rgba(72, 72, 74, 0.3) 10px, rgba(72, 72, 74, 0.3) 20px
  ) !important;
  opacity: 0.75;
}
```

### Helper Functions

```javascript
// Get status class for appointment
function getAppointmentStatusClass(apt) {
  const status = (apt.status || '').toLowerCase();
  const state = (apt.state || '').toLowerCase();
  if (status === 'rescheduled' || state === 'verschoben') return 'status-rescheduled';
  if (status === 'canceled') return 'status-canceled';
  if (status === 'no_show' || state === 'ill/no show') return 'status-no-show';
  return '';
}

// Check if appointment is non-blocking
function isNonBlockingAppointment(apt) {
  const status = (apt.status || '').toLowerCase();
  const state = (apt.state || '').toLowerCase();
  return ['no_show', 'rescheduled', 'canceled'].includes(status) ||
         ['ill/no show', 'verschoben'].includes(state);
}
```

### Quick Booking Modal

- Opens when clicking green (available) time slots
- Pre-fills: Artist, Date, Start Time, End Time (+1 hour default)
- Customer search with dropdown selection
- Category selection (Neustechen, Weiterstechen, Beratung, etc.)

### Commits

```
6f38e45 feat(calendar): add status stripes and click-to-book functionality
8d93fd5 fix(calendar): improve artist ID lookup for click-to-book handlers
81362d9 fix(calendar): prevent extra empty rows from non-blocking appointments
972b4a8 fix(requests): allow artist assignment on non-blocking appointment slots
```

### Hotfix: Artist Assignment on Non-Blocking Slots (2026-01-16)

**Problem:** Time slots with canceled/rescheduled/no_show appointments were showing as "blocked" in request edit mode, preventing artist assignment.

**Fix Location:** `management-system.html` line ~30003

```javascript
// Filter out non-blocking appointments (canceled, rescheduled, no_show)
const appointmentsOnDate = (artistExistingAppointments || []).filter(apt => {
  if (!apt.start) return false;
  const aptDate = apt.start.split('T')[0];
  if (aptDate !== dateStr) return false;
  // Skip non-blocking appointments - they don't block time slots
  if (window.isNonBlockingAppointment && window.isNonBlockingAppointment(apt)) return false;
  return true;
});
```

---

### Hotfix: Extra Empty Rows Bug (2026-01-16)

**Problem:** Extra empty rows appeared between artist rows when viewing non-blocking appointments (canceled/rescheduled/no_show).

**Root Cause:** The calendar uses CSS Grid with `display: contents` on slot rows. Non-blocking appointments were not marking their spanned cells as `occupied`, causing the CSS Grid to render extra cells that appeared as visual gaps between rows.

**Fix Location:** `management-system.html` line ~33443

```javascript
// Before: Only blocking appointments marked cells as occupied
const isBlocking = !isNonBlockingAppointment(evt.fullData || evt);
if (isBlocking) {
  for (let i = startIndex + 1; i < endIndex && i < cells.length; i++) {
    cells[i].occupied = true;
  }
}

// After: All appointments mark cells as occupied (for rendering)
// Non-blocking status only affects availability display, not cell occupation
for (let i = startIndex + 1; i < endIndex && i < cells.length; i++) {
  cells[i].occupied = true;
}
```

---

## Phase 5.6: Calendar Availability Visualization (2026-01-15) ✅ COMPLETE

### Overview

Complete refactoring of the calendar tab to show artist availability from dienstplan and improve slot labeling.

### Changes Implemented

| Feature | Description | PR/Commit |
|---------|-------------|-----------|
| Slot Labels | Artist name + Instagram handle (vertical layout) | PR #595 |
| Green Availability | Background coloring for available time slots | PR #595 |
| Guest Spots Removal | Category removed (replaced by availability coloring) | PR #595 |
| Underline Removal | Removed from customer and artist name links | PR #595 |
| Availability-Only Rows | Smaller height (44px) for rows without appointments | `2e03f57` |
| Event Background Wrapper | White/dark background behind appointment containers | `2e03f57` |
| Hidden Tabs | Termine/Work Tracking tabs hidden (not in use) | `8c83f62` |

### Technical Details

**Slot Label Structure (line ~33033):**
```javascript
const slotLabelContent = artistName
  ? `<div style="display:flex; flex-direction:column; align-items:flex-start; gap:2px;">
      <span style="font-weight:600; font-size:12px;">${artistName}</span>
      ${artistInstagram ? `<a href="https://instagram.com/${artistInstagram.replace('@', '')}" ...>@${artistInstagram}</a>` : ''}
    </div>`
  : `<span style="font-size:12px; color:var(--muted);">Empty</span>`;
```

**Availability Map Loading (line ~32943):**
```javascript
let artistAvailabilityMap = new Map(); // artistId -> { start, end }
dienstplanData.forEach(entry => {
  if (entry.state === 'Available' && entry.start_date <= currentDateStr && entry.end_date >= currentDateStr) {
    artistAvailabilityMap.set(entry.artist_id, {
      start: entry.working_start || '09:00',
      end: entry.working_end || '21:00'
    });
  }
});
```

**CSS Classes Added:**
```css
.slot-row.availability-only-row .slot-cell { min-height: 44px; }
.event-bg-wrapper { position: absolute; top: 4px; left: 4px; right: 4px; bottom: 4px; background: #fff; border-radius: 8px; }
[data-theme="dark"] .event-bg-wrapper { background: #2c2c2e; }
```

### Commits

```
19c1fe9 feat(calendar): add availability visualization and refactor slot labels (#595)
2e03f57 feat(calendar): improve availability visualization
8c83f62 chore(calendar): hide unused Termine/Work Tracking tabs
```

---

## Phase 5.5: Calendar, Search, Attachments & Rank (2026-01-15) ✅ COMPLETE

### Task Overview

| Task | Description | Status |
|------|-------------|--------|
| Task 1 | Consultation 100€ price display | ✅ |
| Task 2 | Calendar slot grouping by artist | ✅ |
| Task 3 | Request search (phone/instagram) | ✅ |
| Task 4 | Schwarzes Brett attachments | ✅ |
| Task 5 | Customer rank fix (Neukunde) | ✅ |

### Task 1: Consultation Price Display

Calendar now shows "100 €" for consultation appointments in the booking card.

**Location:** `management-system.html` line ~33109-33110

### Task 2: Calendar Slot Grouping by Artist

Non-overlapping appointments from the same artist now share a single row, reducing vertical space.

**Algorithm:**
1. Group events by artistId
2. For each artist, pack non-overlapping events into slots
3. Each slot becomes a row with the artist name
4. Multiple events can share a row if they don't overlap

**Location:** `management-system.html` lines 32995-33147

### Task 3: Request Search Fix

Added `customer_phone` and `instagram` to searchable fields in request filter.

**Location:** `management-system.html` line ~27617

```javascript
const searchableFields = [
  r.first_name || '', r.last_name || '',
  r.customer?.first_name || '', r.customer?.last_name || '',
  r.customer?.email || '', r.email || '',
  r.phone || '', r.customer_phone || '',  // ADDED
  r.instagram || '', r.customer?.instagram || '',  // ADDED
  ...
].join(' ').toLowerCase();
```

### Task 4: Schwarzes Brett Attachments

Full image/PDF upload support for bulletin board messages.

**Database Migration:**
```sql
ALTER TABLE schwarzes_brett ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';
```

**Features:**
- File input UI with image/PDF preview
- Upload to `board-attachments` storage bucket
- Images render inline, PDFs as linked buttons
- Form reset on close/submit

**Locations:**
- HTML popup: line ~14482-14487
- Upload function: line ~24719-24754
- Render attachments: line ~24449-24471

### Task 5: Customer Rank Fix

New customers created via Stripe webhook now get `rank: 'Neukunde'` instead of null.

**Database Fix:**
```sql
UPDATE customers SET rank = 'Neukunde'
WHERE rank = 'Bronze' AND id NOT IN (
  SELECT DISTINCT customer_id FROM appointments WHERE customer_id IS NOT NULL
);
-- Fixed 13 rows
```

**Code Fix:** `supabase/functions/stripe-webhook/index.ts` line 143:
```typescript
.insert({
  first_name: m.customer_first_name,
  ...
  rank: 'Neukunde'  // ADDED
})
```

**Deployed:** stripe-webhook v26

### PR & Commits

**PR #590:** `feat(phase-5.5): Calendar grouping, search fix, attachments & rank fix`

```
445be51 feat(phase-5.5): calendar grouping, search fix, attachments & rank fix
3b05976 fix(calendar): restore proper event container design
```

---

## Phase 5.5 Hotfixes (2026-01-15) ✅ COMPLETE

### Hotfix 1: Appointment Edit Timezone Shift (PR #592)

**Problem:** When opening appointment edit popup, times shifted +1 hour (e.g., 12:00-14:00 became 13:00-15:00).

**Cause:** `new Date()` interpreted ISO strings as UTC, then `toTimeString()` converted to local time.

**Fix:** Extract date/time directly from ISO string without Date parsing.

**Location:** `management-system.html` lines 37299-37305

```javascript
// Before: const timeStr = startDate.toTimeString().slice(0, 5);
// After:
const startStr = appointment.start_time || appointment.start || '';
const timeStr = startStr && startStr.includes('T') ? startStr.split('T')[1].substring(0, 5) : '09:00';
```

### Hotfix 2: Appointment Details Timezone Shift (PR #593)

**Problem:** Time displayed in appointment details modal also shifted +1 hour.

**Fix:** Updated `formatModalTime` function to extract time directly from ISO string.

**Location:** `management-system.html` lines 36473-36480

```javascript
window.formatModalTime = function(dateStr) {
  if (!dateStr) return '-';
  if (dateStr.includes('T')) {
    return dateStr.split('T')[1].substring(0, 5);
  }
  return new Date(dateStr).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
};
```

### Hotfix 3: Artist Profile Popup Restoration (PR #594)

**Problem:** Artist profile popup (with background image, profile picture, edit button) was replaced by a slide-in side panel on Artists page and Guest Spot page.

**Cause:** A second `viewArtistProfile` function definition at line 36755 was overriding the original popup function and redirecting to `openArtistSidePanel`.

**Fix:** Renamed the override to `viewArtistFromModal` so it only applies when clicking from the appointment detail modal.

**Location:** `management-system.html` lines 36755 and 19645

```javascript
// Renamed: window.viewArtistProfile → window.viewArtistFromModal
// Updated button: onclick="viewArtistFromModal()"
```

### Hotfix PRs

| PR | Description | Commit |
|----|-------------|--------|
| #592 | Appointment edit timezone fix | `514a626` |
| #593 | Appointment details timezone fix | `2950e73` |
| #594 | Artist profile popup restoration | `88a8553` |

---

## Phase 5.3: Consultation Payment Fix (2026-01-15) ✅ COMPLETE

### Problem (WAS)

After paying for consultation via Stripe, the booking page showed "Waiting for payment confirmation" indefinitely because Stripe Payment Links don't properly pass `client_reference_id` to webhooks.

### Solution (IMPLEMENTED)

**Replaced Stripe Payment Links with Checkout Sessions:**

| Old Flow | New Flow |
|----------|----------|
| User fills form → Creates appointment → Opens Payment Link → Waits | User fills form → Creates Checkout Session → Pays → Webhook creates appointment |

**Key Change:** Appointments are now created **ONLY AFTER** successful payment (via webhook), not before.

### New Edge Functions

| Function | Version | Purpose |
|----------|---------|---------|
| `create-consultation-checkout` | v5 | Creates Stripe Checkout Session with metadata |
| `stripe-webhook` | v26 | Creates appointment from checkout metadata |
| `verify-checkout-session` | v1 | Verifies payment status on success page |
| `send-consultation-confirmation` | v2 | Sends email (verify_jwt: false) |

---

## Phase 5.4: Security Audit (2026-01-15) ✅ COMPLETE

### Results

| Key Type | Status |
|----------|--------|
| `sk_live_` / `sk_test_` (Stripe Secret) | ✅ Not found |
| `service_role` (Supabase Service Key) | ✅ Not found |
| `re_` (Resend API Key) | ✅ Not found |
| `whsec_` (Webhook Secret) | ✅ Not found |

**Confirmed:** All frontend keys have `role: "anon"` → Public keys, SAFE

---

## Nächste Schritte

### Phase 5.2: Performance & Polish (NEXT)

1. **Overpermissive RLS Policies reviewen**
   - `qual=true` Policies durch rollenbasierte ersetzen

2. **Code Cleanup**
   - Unused console.log entfernen
   - Dead Code entfernen

3. **Error Tracking V2** (Optional)
   - Persistente Errors in Supabase
   - Email-Alerts bei kritischen Fehlern

---

## Recent Session (2026-01-15) - Phase 5.6 Calendar Availability

**Completed:**
- Calendar slot labels refactored to show artist name + Instagram handle
- Green availability background from dienstplan data
- Removed Guest Spots category (replaced by availability coloring)
- Removed underline styling from clickable names
- Smaller availability-only rows (44px min-height)
- White/dark background wrapper behind appointment containers
- Hidden unused Termine/Work Tracking tabs

**PRs Merged:** #595

**Commits:**
- `19c1fe9` feat(calendar): add availability visualization and refactor slot labels
- `2e03f57` feat(calendar): improve availability visualization
- `8c83f62` chore(calendar): hide unused Termine/Work Tracking tabs

---

*Aktualisiert am 2026-01-15 mit Claude Code*
