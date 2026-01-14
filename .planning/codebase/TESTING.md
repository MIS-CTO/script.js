# Testing Patterns

**Analysis Date:** 2026-01-14
**Version:** 3.1175

## Test Framework

**Runner:**
- Playwright MCP - Browser automation for UI testing
- Manual testing documented in `.planning/TESTING.md`
- No unit test framework (Jest, Vitest not configured)

**Run Commands:**
```bash
# Local development server
python3 -m http.server 8765

# No automated test commands
# Tests run via Playwright MCP in Claude Code
```

## Test Documentation

**Location:**
- `.planning/TESTING.md` - Complete test results
- `.planning/ROADMAP.md` - Phase tracking with test status
- No dedicated test files (`.test.ts`, `.spec.ts`)

**Test Archive Format:**
```markdown
## Test-Archiv

| Datum | Test | Status | Details |
|-------|------|--------|---------|
| 2026-01-10 | Phase 3 Error Tracking | ALL PASS | 5/5 Tests |
| 2026-01-09 | Phase 2 RLS Policies | PASS | No recursion |
```

## Critical Test Flows

**Flow 1: Request Creation**
1. Open Requests Tab
2. Click "Neuer Request" button
3. Fill required fields
4. Save request
5. Verify in database

**Flow 2: Payment Link**
1. Open request details
2. Click "Payment Link senden"
3. Verify Stripe link generated
4. Verify email sent
5. Check `payment_link_sent_at` set

**Flow 3: Stripe Webhook**
1. Use Stripe test card
2. Complete checkout
3. Verify webhook received
4. Check `payment_status = 'deposit_paid'`
5. Verify activity log entry

## Stripe Test Cards

| Number | Result |
|--------|--------|
| 4242 4242 4242 4242 | Success |
| 4000 0000 0000 0002 | Declined |
| 4000 0000 0000 9995 | Insufficient funds |

## Test Types

**UI Tests (Playwright MCP):**
- Full user flows in browser
- Setup: Start local server, navigate to page

**Database Tests:**
- RLS policies verification
- Direct SQL in Supabase SQL Editor

**Integration Tests:**
- Request → Payment → Webhook → Status update
- End-to-end manual testing

## Edge Function Testing

**Method:**
1. Deploy to Supabase
2. Test via HTTP requests or webhook simulation
3. Monitor logs in Supabase dashboard

**Tested Functions:**
- `stripe-webhook` - Payment event handling
- `payment-page` - Status page rendering
- `create-payment-link` - Stripe link generation

**Webhook Testing:**
```bash
# Local webhook testing (Stripe CLI)
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
```

## Test Coverage Gaps

| Area | Risk | Priority |
|------|------|----------|
| Edge Function error paths | Payment failures unnoticed | High |
| RLS policy edge cases | Unauthorized access | High |
| Auth hardening flows | Auth bypass issues | Medium |

---

*Testing analysis: 2026-01-14*
*Update when test patterns change*
