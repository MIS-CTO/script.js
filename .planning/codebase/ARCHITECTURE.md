# Culture Over Money - Architecture
**Stand: 2026-01-10 | Version: 3.1117**

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                       │
│  management-system.html (2.2 MB) - Single-File App                      │
│  Tabs: Requests | Calendar | Dienstplan | Artists | Customers           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          SUPABASE CLOUD                                  │
│  PostgREST | Auth | Storage | Realtime | Edge Functions (7 deployed)   │
│                                                                          │
│  PostgreSQL: 79 Tabellen/Views                                          │
│  - requests (34.808) | customers (27.587) | projects (25.543)           │
│  - dienstplan (19.138) | appointments (16.551) | artists (900)          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Webhooks
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       EXTERNE SERVICES                                   │
│  STRIPE (Payments) | RESEND (Email) | WEBFLOW (Website)                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Edge Functions (7 deployed)

| Function | Version | Beschreibung |
|----------|---------|---------------|
| create-payment-link | v23 | Stripe Payment Link + Appointment |
| stripe-webhook | v14 | Verarbeitet Stripe Events |
| payment-reminders | v3 | Auto-Reminder + Auto-Cancel |
| send-cancellation-email | v3 | Manuelle Stornierung |
| send-manual-reminder | v2 | Manuelle Reminder |
| create-wannado-checkout | v2 | Wannado Buchung |
| seed-auth-from-profiles | v3 | Auth User Seeding |

---

*Erstellt am 2026-01-10 mit Claude Code*