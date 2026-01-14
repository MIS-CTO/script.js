# Coding Conventions

**Analysis Date:** 2026-01-14
**Version:** 3.1175

## Naming Patterns

**Files:**
- `kebab-case.html` - HTML files (`management-system.html`)
- `kebab-case.js` - JavaScript files (`auth-hardening.js`)
- `index.ts` - Edge Function entry points
- `snake_case.sql` - Database migrations
- `UPPER_CASE.md` - Documentation files

**Functions:**
- camelCase for all functions: `loadRequests()`, `handleAddRequest()`
- Prefix handlers with `handle`: `handleLogin()`, `handleAddRequest()`
- Prefix loaders with `load`: `loadRequests()`, `loadCustomers()`
- No special prefix for async functions

**Variables:**
- camelCase for regular variables: `const stored = localStorage.getItem()`
- UPPER_SNAKE_CASE for constants: `const RATE_LIMIT_CONFIG = { ... }`
- Underscore prefix for private state: `_loginAttempts`, `_sessionMeta`

**Database:**
- Tables: snake_case plural (`requests`, `customers`, `artists`)
- Columns: snake_case (`created_at`, `payment_status`)
- Foreign Keys: `{singular}_id` (`customer_id`, `artist_id`)

## Code Style

**Formatting:**
- 2-space indentation
- Semicolons required
- Both single and double quotes (no strict preference)
- No ESLint/Prettier configured

**Import Organization (Edge Functions):**
```typescript
// 1. Deno std library
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// 2. Third-party (Stripe)
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";
// 3. Supabase
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
```

## Error Handling

**Pattern:**
```javascript
try {
  const { data, error } = await supabase.from('requests')...
  if (error || !data) {
    console.error('Error loading:', error);
    return;
  }
} catch (err) {
  console.error('Unexpected error:', err);
}
```

**Edge Functions:**
- Try-catch at handler level
- Log errors with `console.error()`
- Return 200 to Stripe webhooks (prevent retries)

## Comments

**Section Dividers:**
```javascript
// ========================================
// RATE LIMITING
// ========================================
```

**JSDoc:**
```javascript
/**
 * Check if login is allowed (rate limit not exceeded)
 * @returns {{ allowed: boolean, message?: string }}
 */
function checkLoginRateLimit() { ... }
```

**TODO Format:**
```javascript
// TODO: Implement command menu modal
```

## Git Conventions

**Commit Types:**
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code refactoring
- `perf:` Performance improvement

**Co-Author:**
```
Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

## CSS Conventions

- BEM-inspired: `.block__element--modifier`
- State classes: `.is-selected`, `.is-loading`, `.active`
- Utility classes: `.u-hidden`, `.u-text-center`

---

*Convention analysis: 2026-01-14*
*Update when patterns change*
