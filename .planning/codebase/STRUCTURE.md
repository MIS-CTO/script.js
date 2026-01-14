# Codebase Structure

**Analysis Date:** 2026-01-14
**Version:** 3.1175

## Directory Layout

```
script-js-temp/
├── .github/                    # GitHub Actions
│   └── workflows/
│       └── auto-version.yml    # Version bumping
├── .planning/                  # Project documentation
│   ├── codebase/              # Architecture docs (this folder)
│   ├── PROJECT.md             # Project definition
│   ├── MASTER_CONTEXT.md      # System context & rules
│   ├── STATE.md               # Current state
│   ├── ROADMAP.md             # Short-term roadmap
│   ├── ROADMAP_FULL.md        # Complete roadmap
│   ├── TESTING.md             # Test documentation
│   └── ISSUES.md              # Known issues
├── database/                   # Secondary migrations
│   └── migrations/            # (consolidation needed)
├── icons/                      # UI icons & PWA assets
├── migrations/                 # Primary DB migrations
│   ├── add_auth_user_id_mapping.sql
│   ├── dienstplan_v79_migration.sql
│   ├── fix_existing_projects_owners.sql
│   └── todo_system_migration.sql
├── splash/                     # PWA splash screens
├── src/                        # Source (underutilized)
├── supabase/                   # Edge Functions
│   └── functions/
│       ├── stripe-webhook/    # Payment webhook (168 lines)
│       └── payment-page/      # Status pages (417 lines)
├── management-system.html      # PRIMARY: 61,149 lines, 2.4MB
├── agreement-form.html         # Consent form PWA: 2,385 lines
├── analytics-dashboard-final.html
├── auth-hardening.js           # Auth module: 269 lines
├── generate_embeds.py          # Webflow embed generator
├── SUPABASE_RLS_POLICY.sql     # RLS definitions
└── version.txt                 # Current: 1175 (v3.1175)
```

## Key File Locations

**Entry Points:**
- `management-system.html` - Main application (61,149 lines)
- `agreement-form.html` - Tattoo consent form PWA (2,385 lines)
- `auth-hardening.js` - Auth hardening module (269 lines)
- `supabase/functions/stripe-webhook/index.ts` - Webhook handler

**Configuration:**
- `version.txt` - Version tracking (auto-incremented)
- `manifest-agreement.json` - PWA manifest
- No `.env` file (secrets in Supabase dashboard)

**Core Logic:**
- `management-system.html:7000-9000` - Request CRUD
- `management-system.html:3000-5000` - Payment workflow
- `management-system.html:10000-15000` - Calendar/scheduling
- `supabase/functions/stripe-webhook/index.ts` - Payment processing

## Naming Conventions

**Files:**
- `kebab-case.html` - HTML files
- `kebab-case.js` - JavaScript modules
- `index.ts` - Edge Function entry points
- `snake_case.sql` - Database migrations
- `UPPER_CASE.md` - Documentation

**Directories:**
- `kebab-case` for most directories
- Function names for Edge Functions (`stripe-webhook/`)

## Where to Add New Code

| Type | Location |
|------|----------|
| Feature | Embedded in `management-system.html` |
| Edge Function | `supabase/functions/{name}/index.ts` |
| Migration | `migrations/{description}.sql` |
| Documentation | `.planning/{NAME}.md` |
| Utility | New `.js` file or `auth-hardening.js` |

## Special Directories

**`.planning/codebase/`**
- Auto-generated architecture docs
- Created by `/gsd:map-codebase`

**`supabase/functions/`**
- Deployed to Supabase Edge
- TypeScript with Deno runtime

**`migrations/` vs `database/migrations/`**
- Both exist (consolidation needed)
- Primary: `migrations/` (4 files)
- Secondary: `database/migrations/` (3 files)

---

*Structure analysis: 2026-01-14*
*Update when directory structure changes*
