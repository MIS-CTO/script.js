# Culture Over Money - Project State
**Stand: 2026-01-15 | Version: 3.1203**
**UPDATE: Phase 5.5 Calendar, Search, Attachments & Rank - COMPLETE ✓**

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
║  PHASE 5.2: PERFORMANCE & POLISH                     → NEXT  ║
╚═══════════════════════════════════════════════════════════════╝
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

### PR & Commits

**PR #590:** `feat(phase-5.5): Calendar grouping, search fix, attachments & rank fix`

```
445be51 feat(phase-5.5): calendar grouping, search fix, attachments & rank fix
3b05976 fix(calendar): restore proper event container design
```

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

## Recent Session (2026-01-15) - Phase 5.5

**Completed:**
- Calendar slot grouping by artist (non-overlapping appointments share row)
- Consultation 100€ price display in calendar
- Request search now includes phone and instagram
- Schwarzes Brett attachments (upload images/PDFs)
- Customer rank fix (new customers get Neukunde)
- Restored proper calendar event container design

**PR:** #590 merged

---

*Aktualisiert am 2026-01-15 mit Claude Code*
