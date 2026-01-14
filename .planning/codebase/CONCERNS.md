# Codebase Concerns

**Analysis Date:** 2026-01-14
**Version:** 3.1175

## Security Status

### Resolved

| Concern | Solution |
|---------|----------|
| Edge Functions missing | 7 ACTIVE deployed |
| RLS Security Audit | 8 tables protected |
| Rate Limiting | `auth-hardening.js` (5 attempts/min) |
| Session Expiry | 24h expiry with activity refresh |
| Old Payment Links | Auto-cancel after 6 days |
| Error Tracking | Error panel implemented |

### Backlog

| Concern | Severity | Details |
|---------|----------|---------|
| Frontend-Only Role Check | MEDIUM | Role in localStorage only |
| Overpermissive RLS | MEDIUM | `auth.uid() IS NOT NULL` fallbacks |
| Single-File Architecture | LOW | 2.4 MB, accepted tradeoff |
| Permissive CORS | MEDIUM | `Access-Control-Allow-Origin: *` |

## Tech Debt

**Monolithic HTML File:**
- Issue: All code in single file (61,149 lines, 2.4MB)
- Impact: Slow IDE, high "blast radius" for changes
- Fix: Refactor to modular architecture (backlog)

**Duplicate Migration Directories:**
- `migrations/` (4 files)
- `database/migrations/` (3 files)
- Fix: Consolidate to single location

**Excessive Console Logging:**
- 770+ `console.log`, 298 `console.error`, 43 `console.warn`
- Fix: Implement conditional logging based on environment

## Known Bugs

**Assignment Field Bug:**
- `assigned_to` receives UUID instead of username
- Location: `management-system.html:assignRequest()` (~line 7953)
- Impact: Data integrity affected

## Performance Bottlenecks

**No Pagination:**
- `loadRequests()` loads all 34,000+ requests
- Impact: Initial load > 5 seconds
- Fix: Implement server-side pagination

**Heavy Query Joins:**
- Every request loads customer, artist, location relations
- Fix: Select only needed columns for specific views

## Edge Function Security

| Function | JWT Required | Secrets via ENV |
|----------|--------------|-----------------|
| stripe-webhook | No (Webhook) | Yes |
| create-payment-link | Yes | Yes |
| payment-reminders | Yes | Yes |
| send-manual-reminder | Yes | Yes |
| payment-page | No (Public) | Yes |

## Attack Vector Assessment

| Vector | Risk (1-10) | Status |
|--------|-------------|--------|
| Brute Force | 2 | Rate Limiting active |
| Session Hijacking | 3 | Session Expiry active |
| Privilege Escalation | 4 | Partial (localStorage) |
| SQL Injection | 2 | Supabase protects |
| XSS | 3 | Some innerHTML usage |

## Recent Fixes (Jan 13, 2026)

**PR #588 - Payment Status Fix:**
- `stripe-webhook` now uses `constructEventAsync` for Deno compatibility
- `create-payment-link` v29 with `payment_intent_data` metadata

**PR #589 - Resend Payment Email Fix:**
- Changed from `send-payment-reminder` to `send-manual-reminder`
- Added `reminder_type` and `action_by` parameters

---

*Concerns audit: 2026-01-14*
*Update as issues are fixed or discovered*
