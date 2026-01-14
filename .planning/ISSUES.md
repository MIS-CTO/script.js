# Culture Over Money - Known Issues
**Stand: 2026-01-14 | Version: 3.1180**

---

## Issue Summary

| Severity | Count |
|----------|-------|
| KRITISCH | 1 (Consultation Payment) |
| HOCH | 1 (Error Tracking) |
| MITTEL | 1 |
| NIEDRIG | 0 |

---

## OPEN Issues

### ISSUE-009: Consultation Payment Confirmation Not Working (KRITISCH) 🔴

**Reported:** 2026-01-14
**Status:** OPEN - Next Priority

**Symptom:** After successful Stripe payment for consultation, the booking page (`consultation-booking.html`) continues showing "Waiting for payment confirmation" indefinitely.

**Affected Flow:**
1. User books consultation → Creates appointment with `payment_status: 'pending'`
2. Opens Stripe Payment Link → User pays successfully
3. Page polls DB for `payment_status === 'paid'`
4. **BUG:** Status never changes, user stuck on waiting screen

**Root Cause:** Stripe Payment Links don't properly pass `client_reference_id` to webhook. The webhook receives the payment event but cannot identify which appointment to update.

**Files:**
- `consultation-booking.html:742-1215` - Payment flow
- `supabase/functions/stripe-webhook/index.ts:117-203` - Webhook handler

**Recommended Fix:** Switch from Stripe Payment Link to Stripe Checkout API (create session via Edge Function).

---

### ISSUE-007: Kein Error Tracking (HOCH)

Kein Error Tracking implementiert. Frontend-Fehler und Edge Function Fehler bleiben unbemerkt.

**Lösung**: Sentry, LogRocket, oder Custom Logging implementieren

### ISSUE-008: Overpermissive Policies (MITTEL)

Einige Tabellen haben RLS mit `qual = true` (erlaubt alles).

**Status**: BACKLOG - Review nötig

---

## RESOLVED Issues

- ~~ISSUE-001: Payment Reminders~~ → **RESOLVED** (payment-reminders v3 aktiv)
- ~~ISSUE-002: Auto-Cancel~~ → **RESOLVED** (Teil von payment-reminders)
- ~~ISSUE-003: Stripe Webhook~~ → **RESOLVED** (stripe-webhook v14 aktiv)
- ~~ISSUE-004: Appointment Trigger~~ → **RESOLVED** (via create-payment-link)
- ~~ISSUE-005: RLS Policies~~ → **RESOLVED** (RLS aktiviert, Policies gefixt)

---

*Aktualisiert am 2026-01-14 mit Claude Code*