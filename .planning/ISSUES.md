# Culture Over Money - Known Issues
**Stand: 2026-01-26 | Version: 3.1227**

---

## Issue Summary

| Severity | Count |
|----------|-------|
| KRITISCH | 0 |
| HOCH | 0 |
| MITTEL | 1 |
| NIEDRIG | 0 |

---

## OPEN Issues

### ISSUE-008: Overpermissive Policies (MITTEL)

Einige Tabellen haben RLS mit `qual = true` (erlaubt alles).

**Status**: BACKLOG - Review nötig

---

## RESOLVED Issues

- ~~ISSUE-010: Guest Spot Creation NULL Email~~ → **RESOLVED** (2026-01-26)
  - Guest artists without email caused dienstplan insert to fail
  - Trigger `sync_upcoming_to_dienstplan` now uses placeholder email
  - Migration: `fix_guest_spot_dienstplan_null_email`

- ~~ISSUE-009: Consultation Payment~~ → **RESOLVED** (2026-01-15)
  - Replaced Stripe Payment Links with Checkout Sessions
  - New edge function: `create-consultation-checkout` v5
  - Webhook now creates appointment from metadata
  - Email confirmation fixed (verify_jwt: false)

- ~~ISSUE-007: Kein Error Tracking~~ → **RESOLVED** (Phase 3)
  - Custom In-Memory Error Panel implemented
  - Error Badge + Modal in management-system.html

- ~~ISSUE-006: Security Audit~~ → **RESOLVED** (2026-01-15)
  - Frontend files scanned for dangerous keys
  - All keys verified as public (anon role)
  - No sensitive keys exposed

- ~~ISSUE-005: RLS Policies~~ → **RESOLVED** (RLS aktiviert, Policies gefixt)
- ~~ISSUE-004: Appointment Trigger~~ → **RESOLVED** (via create-payment-link)
- ~~ISSUE-003: Stripe Webhook~~ → **RESOLVED** (stripe-webhook v25 aktiv)
- ~~ISSUE-002: Auto-Cancel~~ → **RESOLVED** (Teil von payment-reminders)
- ~~ISSUE-001: Payment Reminders~~ → **RESOLVED** (payment-reminders v3 aktiv)

---

*Aktualisiert am 2026-01-26 mit Claude Code*