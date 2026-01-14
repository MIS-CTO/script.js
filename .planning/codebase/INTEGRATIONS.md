# External Integrations

**Analysis Date:** 2026-01-14
**Version:** 3.1175

## APIs & External Services

**Supabase (Primary Backend):**
- Project ID: `auxxyehgzkozdjylhqnx`
- Services: PostgreSQL, Auth, Storage, Realtime, Edge Functions
- SDK: `@supabase/supabase-js@2`
- Connection: HTTPS via PostgREST

**Stripe (Payment Processing):**
- SDK: `stripe@12.0.0` (Deno import)
- API Version: `2023-10-16`
- Auth: `STRIPE_SECRET_KEY` env var
- Endpoints: Checkout sessions, payment links, webhooks

**Resend (Transactional Email):**
- Integration: Via Edge Functions
- Functions: `payment-reminders`, `send-cancellation-email`, `send-manual-reminder`

## Edge Functions (7 Active)

| Function | Version | JWT | Purpose |
|----------|---------|-----|---------|
| create-payment-link | v29 | Yes | Stripe link + email + appointment |
| stripe-webhook | v15 | No | Process Stripe events (constructEventAsync) |
| payment-page | v1 | No | Payment status page rendering |
| payment-reminders | v3 | Yes | Auto-reminder (2/4 days) + auto-cancel (6 days) |
| send-cancellation-email | v3 | Yes | Manual cancellation + email |
| send-manual-reminder | v2 | Yes | Manual payment reminders |
| create-wannado-checkout | v2 | No | Wannado booking checkout |

## Cron Jobs (9 Active)

| Job | Schedule | Purpose |
|-----|----------|---------|
| payment-reminders-daily | 08:00 UTC | Send payment reminder emails |
| auto-cancel-unpaid | 06:00 UTC | Cancel unpaid requests after 6 days |
| auto-finish-appointments | */15 min | Mark past appointments as finished |
| auto-archive-old-requests | 03:00 UTC | Archive old requests |
| roll_upcoming_status_daily | 02:00 UTC | Update upcoming slot statuses |
| permanent-delete-old-requests | 03:00 UTC | Delete archived requests |
| auto-complete-past-guest-slots | 03:00 UTC | Complete past guest slots |
| refresh-analytics-hourly | Hourly | Refresh analytics views |

## Webhooks

**Incoming (Stripe):**
- Endpoint: `/functions/v1/stripe-webhook`
- Verification: `stripe.webhooks.constructEventAsync()`
- Events handled:
  - `checkout.session.completed` - Update payment status
  - `payment_intent.succeeded` - Log payment
  - `payment_intent.payment_failed` - Mark as failed
  - `charge.succeeded` - Process charge

## Authentication

**Supabase Auth:**
- Method: `signInWithPassword()`
- Session: localStorage + Supabase session
- Expiry: 24 hours with activity refresh

**Auth Hardening (`auth-hardening.js`):**
- Rate Limiting: 5 attempts/minute, 5-minute lockout
- Session Expiry: 24 hours
- Functions: `checkLoginRateLimit()`, `saveSession()`, `isSessionValid()`

## Environment Variables

**Edge Functions:**
```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
```

## Third-Party Embeds

**Webflow Integration:**
- 120+ HTML embed files for Webflow
- Generator: `generate_embeds.py`
- Output: `waitlist-carousel-*.html`

---

*Integration analysis: 2026-01-14*
*Update when adding/removing services*
