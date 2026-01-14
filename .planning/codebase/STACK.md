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

## Version Control

- **Repository:** MIS-CTO/script.js
- **Primary branch:** main
- **Version file:** `version.txt` (auto-incremented)
- **Current version:** 3.1175

---

*Stack analysis: 2026-01-14*
*Update when dependencies change*
