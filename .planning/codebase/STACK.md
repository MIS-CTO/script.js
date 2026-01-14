# Technology Stack

**Analysis Date:** 2026-01-14
**Version:** 3.1175

## Languages

| Language | Usage | Files |
|----------|-------|-------|
| JavaScript (ES6+) | Frontend logic, 95% | `management-system.html`, `auth-hardening.js` |
| TypeScript | Edge Functions | `supabase/functions/*/index.ts` |
| HTML5/CSS3 | UI, single-file architecture | `*.html` |
| SQL | Migrations, RLS policies | `migrations/*.sql` |
| Python | Code generation | `generate_embeds.py` |

## Runtime Environment

- **Frontend:** Browser (Chrome, Safari, Firefox)
- **Backend:** Supabase Cloud (PostgreSQL 15)
- **Edge Functions:** Deno runtime (Supabase Edge)
- **No build process:** Direct HTML/JS served via CDN

## Package Management

- **No package.json** - CDN-based dependencies
- **No lockfiles** - Version pinned in CDN URLs
- **Deno imports** - URL-based in Edge Functions

## CDN Dependencies

**Frontend Libraries:**
```
@supabase/supabase-js@2       - Database client
chart.js@4.4.0                - Analytics charts
bcryptjs@2.4.3                - Password hashing
jquery@3.6.0                  - DOM manipulation
jqvmap@1.5.1                  - World map visualization
```

**Edge Function Dependencies (Deno):**
```
deno.land/std@0.168.0         - HTTP server
esm.sh/@supabase/supabase-js@2 - Database client
esm.sh/stripe@12.0.0          - Payment processing
```

## Frameworks & Build Tools

- **No framework:** Vanilla JavaScript
- **No bundler:** Direct script loading
- **No transpilation:** Native ES6+ in modern browsers
- **GitHub Actions:** Auto-versioning only (`.github/workflows/auto-version.yml`)

## Key Files

| File | Size | Lines | Purpose |
|------|------|-------|---------|
| `management-system.html` | 2.4 MB | 61,149 | Main application |
| `agreement-form.html` | 82 KB | 2,385 | Tattoo consent form (PWA) |
| `analytics-dashboard-final.html` | 145 KB | 3,611 | Analytics dashboard |
| `auth-hardening.js` | 8 KB | 269 | Rate limiting, session mgmt |
| `stripe-webhook/index.ts` | 5 KB | 168 | Payment webhook handler |
| `payment-page/index.ts` | 11 KB | 417 | Payment status pages |

## management-system.html Details

**Function Count:**
- 675 regular functions
- 219 async functions
- ~894 total functions

**11 Main Tabs:**
1. Dashboard - Overview, pinned events, Schwarzes Brett
2. Requests - CRUD with status filtering (open, pending, scheduled, finished, canceled, archived)
3. Calendar - Appointment scheduling, event management
4. Guest Spots - Guest artist slot management
5. Waitlist - Waitlist slot management
6. Artists - Artist profiles, availability, projects
7. Customers - Customer database management
8. Dienstplan - Work schedule/shift planning
9. Agreements - Consent form records
10. Analytics - PostHog integration, revenue tracking
11. Wannados - Booking system

**External Integrations (470 payment refs):**
- Supabase SDK v2 (anon key embedded)
- PostHog analytics (16+ fetch functions)
- 4 Edge Function direct calls

## agreement-form.html Details

**PWA Features:**
- iPad/iPhone kiosk mode
- Splash screens for iPad Pro 12.9", 11", 10.5", Mini/Air
- Prevents zoom, pull-to-refresh, text selection
- Auto-resets after 5 seconds on success

**5-Step Form Flow:**
1. Customer Selection (existing search or new)
2. Personal Info (name, DOB, email)
3. Health Info (allergies, medications, conditions)
4. Terms & Social Media Consent
5. Signature (canvas-based, stores as base64)

**Bilingual Support:**
- German (DE) - default
- English (EN) - toggle
- Translation system via `t()` function

**Data Storage:**
- Saves to `agreements` table
- Auto-matches today's appointment for customer
- Updates customer health info after submission

## Version Control

- **Repository:** MIS-CTO/script.js
- **Primary branch:** main
- **Version file:** `version.txt` (auto-incremented)
- **Current version:** 3.1175

---

*Stack analysis: 2026-01-14*
*Update when dependencies change*
