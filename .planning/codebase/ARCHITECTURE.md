# Architecture Overview

**Analysis Date:** 2026-01-14
**Version:** 3.1175

## Architectural Pattern

**Serverless Monolith with Edge Functions**

A single-file HTML application (2.4MB) paired with Supabase backend and Deno Edge Functions. Fat client handles UI/logic with serverless functions for payment processing and automation.

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                       │
│  management-system.html (2.4 MB, 61,149 lines) - Single-File App        │
│  agreement-form.html (82 KB, 2,385 lines) - Consent Form PWA            │
│  Tabs: Requests | Calendar | Dienstplan | Artists | Customers           │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ HTTPS / @supabase/supabase-js@2
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          SUPABASE CLOUD                                  │
│  PostgREST | Auth | Storage | Realtime | Edge Functions (7 deployed)   │
│                                                                          │
│  PostgreSQL: 79 Tables/Views                                            │
│  - requests (34,808) | customers (27,587) | projects (25,543)          │
│  - appointments (16,551) | artists (900) | locations (5)               │
│  - 9 Active Cron Jobs                                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   │ Webhooks / API Calls
                                   ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       EXTERNAL SERVICES                                  │
│  STRIPE (Payments) | RESEND (Email) | WEBFLOW (Website)                 │
└─────────────────────────────────────────────────────────────────────────┘
```

## Layer Architecture

```
┌─────────────────────────────────────────────────┐
│        Presentation Layer                        │
│  (Single HTML: management-system.html)          │
│  - Tabs, Cards, Forms, Tables, Modals           │
│  - Desktop + Mobile Navigation                  │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│        Business Logic Layer                      │
│  (JavaScript functions embedded in HTML)        │
│  - Request CRUD, Appointment Scheduling         │
│  - Payment Workflow, Analytics                  │
│  - Session & Auth Hardening                     │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│        Data Access Layer                         │
│  - Supabase JS Client (@supabase/supabase-js@2) │
│  - Edge Functions (Deno TypeScript)             │
│  - Stripe Client (payment links)                │
└──────────────┬──────────────────────────────────┘
               │
┌──────────────▼──────────────────────────────────┐
│        Persistence Layer                         │
│  - PostgreSQL (Supabase Cloud)                  │
│  - RLS Policies (Row-Level Security)            │
│  - 9 Cron Jobs (automated tasks)                │
└─────────────────────────────────────────────────┘
```

## Edge Functions (7 Deployed)

| Function | Version | Lines | Purpose |
|----------|---------|-------|---------|
| create-payment-link | v29 | - | Stripe Payment Link + Appointment |
| stripe-webhook | v15 | 168 | Stripe event processing (constructEventAsync) |
| payment-page | v1 | 417 | Payment status page rendering |
| payment-reminders | v3 | - | Auto-reminder + auto-cancel |
| send-cancellation-email | v3 | - | Manual cancellation emails |
| send-manual-reminder | v2 | - | Manual payment reminders |
| create-wannado-checkout | v2 | - | Wannado booking checkout |

## Data Flow (Request Lifecycle)

```
1. CREATE REQUEST
   User submits form → handleAddRequest()
   → supabase.from('requests').insert()
   → RLS policy check → PostgreSQL

2. SEND PAYMENT LINK
   Team clicks "Send Payment" → executePaymentWorkflow()
   → Edge Function: create-payment-link (v29)
   → Stripe API → Payment link created
   → Edge Function: send-manual-reminder → Email sent

3. PROCESS PAYMENT
   Customer pays → Stripe Webhook
   → Edge Function: stripe-webhook (v15)
   → Uses constructEventAsync for Deno compatibility
   → Update: payment_status = 'deposit_paid'
   → Log to: request_activity_log

4. AUTO-CRON JOBS
   payment-reminders-daily    08:00 UTC
   auto-cancel-unpaid         06:00 UTC (6 days)
   auto-finish-appointments   */15 min
   auto-archive-old-requests  03:00 UTC
```

## Module Boundaries

| Module | Location | Responsibility |
|--------|----------|----------------|
| Auth | `auth-hardening.js` (269 lines) | Rate limiting, sessions |
| Requests | Lines ~7000-9000 | CRUD operations |
| Payments | Lines ~3000-5000 | Stripe integration |
| Calendar | Lines ~10000-15000 | Scheduling UI |
| Analytics | Lines ~1000-3000 | Chart.js dashboards |
| Admin | Lines ~500-1000 | System monitoring |

---

*Architecture analysis: 2026-01-14*
*Update when patterns change*
