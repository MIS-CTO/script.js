# Culture Over Money - Integrations
**Stand: 2026-01-10 | Version: 3.1117**

---

## Edge Functions (7 AKTIV)

| Function | Version | JWT | Beschreibung |
|----------|---------|-----|---------------|
| create-payment-link | v23 | ✓ | Stripe Payment Link + Email + Appointment |
| stripe-webhook | v14 | ✗ | Verarbeitet Stripe Events |
| payment-reminders | v3 | ✓ | Auto-Reminder (2/4 Tage) + Auto-Cancel (6 Tage) |
| send-cancellation-email | v3 | ✓ | Manuelle Stornierung + Email |
| send-manual-reminder | v2 | ✓ | Manuelle Reminder |
| create-wannado-checkout | v2 | ✗ | Wannado-Buchung Checkout |
| seed-auth-from-profiles | v3 | ✓ | Auth User Seeding |

---

## Stripe Integration

| Check | Status |
|-------|--------|
| Account | ✓ AKTIV (acct_1P0rTRCC8GKd9NS9) |
| Webhook URL | ✓ KONFIGURIERT |
| Events | checkout.session.completed, payment_intent.* |

---

## pg_cron Jobs (9 AKTIV)

| Job | Schedule |
|-----|----------|
| payment-reminders-daily | 08:00 UTC täglich |
| auto-cancel-unpaid | 06:00 UTC täglich |
| auto-finish-appointments | Alle 15 Min |
| auto-archive-old-requests | 03:00 UTC täglich |

---

*Erstellt am 2026-01-10 mit Claude Code*