# Culture Over Money - Project State
**Stand: 2026-01-14 | Version: 3.1180**
**UPDATE: Phase 5.3 Consultation Payment Bug - NEXT UP**

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
║  PHASE 5.3: CONSULTATION PAYMENT FIX                 → NEXT  ║
╠═══════════════════════════════════════════════════════════════╣
║  PHASE 5.2: PERFORMANCE & POLISH                     ○ LATER ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## Phase 5.3: Consultation Payment Fix (NEXT UP) 🔴 BUG

### Problem Description

After paying for consultation via Stripe, the consultation booking page (`consultation-booking.html`) continues showing "Waiting for payment confirmation" even though the payment was successful.

### Current Payment Flow

```
1. User selects artist, date, time → Fills contact info
2. Click "Jetzt bezahlen" → Creates appointment in DB:
   - status: 'pending_payment'
   - payment_status: 'pending'
3. Opens Stripe Payment Link in new tab:
   URL: https://buy.stripe.com/xxx?prefilled_email=...&client_reference_id={apt.id}
4. Shows "Waiting for payment" spinner
5. Polls DB every 3 seconds checking: payment_status === 'paid'
6. PROBLEM: payment_status never changes to 'paid'
```

### Root Cause Analysis

**Stripe Payment Links vs Checkout Sessions:**
- The code uses a **Stripe Payment Link** (line 743: `https://buy.stripe.com/...`)
- Payment Links have LIMITED metadata support compared to Checkout Sessions
- The `client_reference_id` URL parameter may NOT be passed to the webhook as `session.client_reference_id`

**Webhook Handler** (`supabase/functions/stripe-webhook/index.ts`):
```javascript
// Line 121 - Tries to get appointment ID:
const appointmentId = session.metadata?.appointment_id || session.client_reference_id;

// Line 124-151 - If appointmentId found, updates:
// payment_status: 'paid', status: 'scheduled'
```

**Likely Issue:** The webhook receives the event but `appointmentId` is null/undefined because Payment Links don't pass `client_reference_id` the same way.

### Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `consultation-booking.html` | Booking UI & polling | 742-1215 |
| `supabase/functions/stripe-webhook/index.ts` | Webhook handler | 117-203 |
| `supabase/functions/send-consultation-confirmation/index.ts` | Email after payment | Full file |

### Code Locations

**consultation-booking.html:**
- Stripe Payment Link constant: line 743
- Appointment creation: lines 1177-1195
- Payment URL construction: line 1203
- Polling function: lines 805-842
- Success check: line 824 (`payment_status === 'paid'`)

**stripe-webhook/index.ts:**
- Consultation payment handling: lines 117-203
- Appointment ID extraction: line 121
- Appointment update: lines 142-151

### Potential Solutions

1. **Switch to Stripe Checkout API** (Recommended)
   - Create Checkout Session via Edge Function
   - Full control over metadata and client_reference_id
   - Requires new Edge Function: `create-consultation-checkout`

2. **Use Success URL Redirect**
   - After payment, Stripe redirects to success_url
   - Pass appointment_id in URL, update locally
   - Less reliable (user might close browser)

3. **Lookup by Customer Email**
   - Webhook finds most recent pending appointment by email
   - Works but less precise (multiple pending appointments)

4. **Store in Stripe Metadata via API**
   - Use Stripe API to update Payment Link metadata per transaction
   - Complex, not recommended

### Database Schema Context

**appointments table:**
```sql
id UUID PRIMARY KEY
customer_id UUID REFERENCES customers(id)
artist_id UUID REFERENCES artists(id)
date DATE
time TEXT
status TEXT ('pending_payment', 'scheduled', 'completed', 'canceled')
payment_status TEXT ('pending', 'paid', 'refunded')
stripe_payment_id TEXT
paid_at TIMESTAMPTZ
```

### Artist Assignment Context

The consultation booking also involves artist assignment:
- User selects artist in step 1 (artist selection UI)
- Artist ID stored in `appointments.artist_id`
- Artist availability checked via `artist_availability` table
- Time slots restricted to 11:00-12:00 Berlin time (consultation slots)

---

## Phase 5.1: Agreement Form UX Fixes (2026-01-14) ✅ COMPLETE

### Änderungen in agreement-form.html

| Feature | Status | Beschreibung |
|---------|--------|--------------|
| Artist Selection (Step 0) | ✅ LIVE | Neuer erster Schritt: Artist-Suche nach Name/@instagram |
| Birthdate Auto-Format | ✅ LIVE | Automatische Formatierung: 15031990 → 15.03.1990 |
| Health Questions Wording | ✅ LIVE | Persönlichere Formulierung der Gesundheitsfragen |
| Last Page Scroll Fix | ✅ LIVE | 100vh Constraint entfernt, Submit-Button sichtbar |
| Artist Query Fix | ✅ LIVE | `is_active` → `active` Column-Name korrigiert |

### Änderungen in management-system.html

| Feature | Status | Beschreibung |
|---------|--------|--------------|
| Artist Column | ✅ LIVE | Agreements-Tabelle zeigt jetzt Artist-Spalte |
| Direct Artist Join | ✅ LIVE | Query joined `artist:artists!agreements_artist_id_fkey` |

### Database Migration

| Migration | Status | Beschreibung |
|-----------|--------|--------------|
| add_artist_id_to_agreements | ✅ APPLIED | `artist_id UUID REFERENCES artists(id)` hinzugefügt |

### Commits

```
d52106b fix(agreement): remove 100vh constraints for iPad scroll
aaf1b33 fix(agreement): use correct column name 'active' for artists
4a59a81 feat(management): add artist column to agreements table
f246154 feat(agreement): add artist selection as first step
9ac9412 fix(agreement): resolve last page scroll bug
8a64385 fix(agreement): make medical questions more personal
a177ed1 fix(agreement): improve health conditions wording
9a74772 feat(agreement): add birthdate auto-formatting
```

---

## Auth Hardening INLINE (2026-01-10) ✅ VOLLSTÄNDIG INTEGRIERT

### In management-system.html integriert (NICHT mehr als externe Datei)

| Feature | Status | Location |
|---------|--------|----------|
| Rate Limiting | ✅ LIVE | Zeile 38765-38812 |
| Session Expiry | ✅ LIVE | Zeile 38833-38907 |
| handleLogin Check | ✅ LIVE | Zeile 38940-38946 |
| Logout Session Clear | ✅ LIVE | Zeile 39405-39406 |

### Funktionen

| Funktion | Beschreibung |
|----------|--------------|
| `checkLoginRateLimit(id)` | Prüft Rate Limit vor Login |
| `recordLoginAttempt(id, success)` | Zeichnet Versuch auf |
| `saveSession(userData)` | Speichert Session (24h) |
| `isSessionValid()` | Prüft Session-Gültigkeit |
| `clearSession()` | Löscht Session |

---

## Admin Panel (2026-01-10) ✅ IMPLEMENTIERT

### HTML Section: `#admin-section`

| Card | Inhalt |
|------|--------|
| System Status | Supabase Connection, Auth Session, Last Refresh |
| Database Stats | Total Requests, Customers, Artists, Events |
| Payment Overview | Pending, Paid, Expired Links (>6d), Total Revenue |
| Cron Jobs | Tabelle aller Cron Jobs mit Status |
| Manual Actions | Payment Reminders, Cleanup Expired Links, Refresh All |
| Edge Functions | Tabelle aller Edge Functions mit Version |

### JavaScript Funktionen

| Funktion | Beschreibung |
|----------|--------------|
| `updateAdminNavVisibility()` | Zeigt Admin-Tab nur für Admins |
| `loadAdminPanelData()` | Lädt alle Admin-Daten |
| `updateSystemStatus()` | Supabase & Auth Status |
| `updateDatabaseStats()` | Zählt Datensätze |
| `updatePaymentStats()` | Payment-Statistiken |
| `triggerPaymentReminders()` | Manueller Reminder-Versand |
| `cleanupExpiredLinks()` | Bereinigt alte Payment Links |

### Mobile Navigation

Admin-Tab hinzugefügt:
- Gear/Settings Icon
- Nur sichtbar für `role === 'admin'` oder `role === 'superadmin'`
- Route: `handleMobileNav('admin')` -> `showAdminSection()`

### CSS Styles

Vollständiges Styling für:
- Admin Cards mit Header/Body
- Status Grid & Stats Grid
- Tabellen für Cron Jobs & Edge Functions
- Action Buttons mit Hover-Effekten
- Dark Mode Support
- Mobile Responsive

---

## Payment Status Fixes (2026-01-10) ✅ RESOLVED

### Problem

8 alte Zahlungslinks (31-37 Tage alt) waren noch "pending/unpaid" obwohl sie längst hätten gecancelt werden sollen.

**Root Cause:** Die `auto_cancel_unpaid_requests()` Funktion prüfte nur `status IN ('scheduled', 'pending')`, aber die alten Links hatten `status='finished'`.

### Fixes

| Fix | Status | Details |
|-----|--------|----------|
| `auto_cancel_unpaid_requests()` erweitert | ✅ | Prüft jetzt auch `finished` und `open_request` |
| 8 alte Links bereinigt | ✅ | payment_status auf 'canceled' gesetzt |

---

## Cron Jobs Status

| Job | Schedule | Letzte Prüfung | Status |
|-----|----------|----------------|--------|
| payment-reminders-daily | 08:00 UTC | 2026-01-10 | ✅ RUNNING |
| auto-cancel-unpaid | 06:00 UTC | 2026-01-10 | ✅ RUNNING (FIXED) |

---

## Nächste Schritte

### Phase 5.3: Consultation Payment Fix (PRIORITY 🔴)

**Problem:** Consultation payment confirmation not working - page waits indefinitely after Stripe payment.

**Action Items:**
1. Check Supabase Edge Function logs for webhook events
2. Verify if `client_reference_id` arrives in webhook payload
3. Implement fix (likely: switch to Stripe Checkout API)
4. Test full payment flow end-to-end

**Files to modify:**
- `consultation-booking.html` - payment initiation
- `supabase/functions/stripe-webhook/index.ts` - webhook handler
- NEW: `supabase/functions/create-consultation-checkout/index.ts` (if switching to Checkout API)

### Phase 5.2: Performance & Polish (LATER)

1. **Overpermissive RLS Policies reviewen**
   - `qual=true` Policies durch rollenbasierte ersetzen

2. **Code Cleanup**
   - Unused console.log entfernen
   - Dead Code entfernen

3. **Error Tracking V2** (Optional)
   - Persistente Errors in Supabase
   - Email-Alerts bei kritischen Fehlern

---

## Recent Session (2026-01-14) - Request Scheduling UI

Completed improvements to request scheduling funnel:
- Added 70px spacing between date picker and time picker
- Changed time slots from 2 to 3 columns for better overview
- Added artist name and time display in request cards
- Pre-selection of date/time when reopening edit mode (already implemented)

**Commit:** `997eedf feat(requests): show artist name and time in request cards`

---

*Aktualisiert am 2026-01-14 mit Claude Code*
