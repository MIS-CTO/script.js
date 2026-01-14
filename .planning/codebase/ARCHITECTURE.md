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
│                                                                          │
│  11 TABS: Dashboard | Requests | Calendar | Guest Spots | Waitlist |    │
│           Artists | Customers | Dienstplan | Agreements | Analytics |   │
│           Wannados                                                       │
│                                                                          │
│  ~894 JavaScript Functions (675 regular + 219 async)                    │
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

## Module Boundaries (management-system.html)

| Module | Line Range | Key Functions | Responsibility |
|--------|------------|---------------|----------------|
| Navigation | ~14280-14430 | Tab switching, mobile nav | UI routing between 11 tabs |
| Booking/Calendar | ~20400-21500 | `createAppointmentFromRequest()` | Appointment creation, mappings |
| Auth | ~22000-22700 | Session check, login handlers | Secure Supabase auth |
| Dashboard | ~24000-24700 | `loadDashboard()`, `loadPinnedEvents()` | Overview, pinned events |
| To-Do System | ~24700-26300 | `loadTodoProjects()`, `saveTodoTask()` | Project task management |
| Requests | ~27300-31100 | `loadRequests()`, `loadArtistAvailability()` | Request CRUD, filtering |
| Entities | ~31100-35000 | `loadArtists()`, `loadCustomers()`, `loadAgreements()` | Entity management |
| Dienstplan | ~38000-40400 | `loadDienstplanData()`, `saveNewSlot()` | Work schedule management |
| Admin Panel | ~40700-41000 | `loadAdminPanelData()`, `updateSystemStatus()` | System monitoring, stats |
| Auth Login | ~40996-42300 | `handleLogin()` | Login flow, rate limiting |
| Analytics | ~43300-47100 | PostHog fetches, `loadAnalytics()` | 16+ analytics data loaders |
| Guest Spots | ~48900-50000 | `loadWaitlistSlots()`, `loadUpcomingGuestSpotsTab()` | Guest artist management |
| Payment Workflow | ~51500-51700 | `executePaymentWorkflow()` | Stripe payment links |

## agreement-form.html Modules

| Module | Line Range | Key Functions | Responsibility |
|--------|------------|---------------|----------------|
| PWA Config | ~1-70 | Meta tags, manifest | iPad/iPhone kiosk mode |
| Kiosk Styles | ~71-200 | CSS | Prevent zoom, selection |
| Form UI | ~200-1500 | Styles, HTML | 5-step form flow |
| Supabase Init | ~1690-1700 | Client setup | Database connection |
| i18n | ~1700-1870 | `t()`, `updateTranslations()` | DE/EN translations |
| Form Logic | ~1870-2100 | `validateStep()`, `initSignatureCanvas()` | Validation, signature |
| Submit | ~2220-2300 | `submitAgreement()`, `autoMatchAppointment()` | Save to agreements table |

## Edge Function Invocations (from frontend)

| Function | Called From | Line | Trigger |
|----------|-------------|------|---------|
| create-payment-link | management-system.html | 20966 | Payment workflow |
| send-cancellation-email | management-system.html | 30840 | Cancel request |
| send-manual-reminder | management-system.html | 30908 | Resend payment email |
| payment-reminders | management-system.html | 40922 | Admin panel trigger |

---

*Architecture analysis: 2026-01-14 (deep code analysis)*
*Update when patterns change*
