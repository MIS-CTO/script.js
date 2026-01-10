# Culture Over Money - Known Issues
**Stand: 2026-01-10 | Version: 3.1117**

---

## Issue Summary

| Severity | Count |
|----------|-------|
| KRITISCH | 0 (alle resolved) |
| HOCH | 1 (Error Tracking) |
| MITTEL | 3 |
| NIEDRIG | 2 |

---

## RESOLVED Issues

- ~~ISSUE-001: Payment Reminders~~ → **RESOLVED** (payment-reminders v3 aktiv)
- ~~ISSUE-002: Auto-Cancel~~ → **RESOLVED** (Teil von payment-reminders)
- ~~ISSUE-003: Stripe Webhook~~ → **RESOLVED** (stripe-webhook v14 aktiv)
- ~~ISSUE-004: Appointment Trigger~~ → **RESOLVED** (via create-payment-link)
- ~~ISSUE-005: RLS Policies~~ → **RESOLVED** (RLS aktiviert, Policies gefixt)

## OPEN Issues

### ISSUE-007: Kein Error Tracking (HOCH)

Kein Error Tracking implementiert. Frontend-Fehler und Edge Function Fehler bleiben unbemerkt.

**Lösung**: Sentry, LogRocket, oder Custom Logging implementieren

### ISSUE-008: Overpermissive Policies (MITTEL)

Einige Tabellen haben RLS mit `qual = true` (erlaubt alles).

**Status**: BACKLOG - Review nötig

---

*Aktualisiert am 2026-01-10 mit Claude Code*