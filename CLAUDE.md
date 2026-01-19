# Culture Over Money - Claude Code Instructions

## Project Overview

Multi-location tattoo studio management system (5 locations, 900 artists, 27K+ customers).
Single-file HTML application (`management-system.html`, ~61K lines) with Supabase backend.

## Quick Start

```bash
# Local testing
python3 -m http.server 8000
# Open http://localhost:8000/management-system.html

# Check project state
cat .planning/STATE.md
```

## Key Files

| File | Purpose |
|------|---------|
| `management-system.html` | Main application (2.4MB, all JS/CSS inline) |
| `agreement-form.html` | Customer consent form PWA |
| `supabase/functions/*/index.ts` | Edge Functions (Deno) |
| `.planning/STATE.md` | Current project state and progress |
| `.planning/codebase/` | Architecture, conventions, stack docs |

## Code Patterns

### JavaScript Functions
- camelCase naming: `loadRequests()`, `handleAddRequest()`
- Prefix handlers with `handle`: `handleLogin()`
- Prefix loaders with `load`: `loadCustomers()`
- Error pattern: `const { data, error } = await supabase...`

### CSS
- Dark mode: `[data-theme="dark"] .class { ... }`
- Variables: `var(--ink)`, `var(--muted)`, `var(--border-color)`
- State classes: `.is-selected`, `.is-loading`, `.active`

### Database
- Tables: snake_case plural (`requests`, `customers`)
- Columns: snake_case (`created_at`, `payment_status`)
- Foreign keys: `{singular}_id` (`customer_id`, `artist_id`)

## Calendar Tab Structure (lines ~32900-33500)

The calendar renders appointments in a time grid with these key components:

### Data Sources
- `allAppointments` - Appointments from current location
- `allArtists` - Artist data including Instagram handles
- `window.dienstplanCache` - Availability data from dienstplan

### Availability Visualization
```javascript
// Load artist availability for current date
let artistAvailabilityMap = new Map(); // artistId -> { start, end }
dienstplanData.forEach(entry => {
  if (entry.state === 'Available' && entry.start_date <= dateStr && entry.end_date >= dateStr) {
    artistAvailabilityMap.set(entry.artist_id, { start: entry.working_start, end: entry.working_end });
  }
});
```

### Row Types
- **Regular rows**: Full height (100px), contain appointment cards
- **Availability-only rows**: Smaller height (44px), show artist availability without appointments
- **Empty rows**: Show "Empty" label

### CSS Classes
```css
.slot-row                          /* Grid row container */
.slot-row.availability-only-row    /* Smaller rows without appointments */
.slot-cell                         /* Time slot cell */
.event-bg-wrapper                  /* White/dark background behind event cards */
.event                             /* Appointment card */
```

## Common Tasks

### Adding CSS
Add to the `<style>` section (lines ~100-2000). For dark mode support:
```css
.my-class { color: #000; }
[data-theme="dark"] .my-class { color: #fff; }
```

### Modifying Calendar
Key function: `renderCalendar()` (line ~32900)
- Categories: `categoriesToRender` array
- Slot rendering: Loop starting ~33000
- Event containers: ~33350

### Testing Changes
1. Start local server: `python3 -m http.server 8000`
2. Use Playwright for browser automation
3. Toggle dark mode: `document.documentElement.setAttribute('data-theme', 'dark')`

## Git Workflow

```bash
# Commit format
git commit -m "$(cat <<'EOF'
feat(scope): short description

Longer explanation if needed.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"

# If push rejected (remote has changes)
git pull --rebase origin main && git push origin main
```

### Commit Types
- `feat:` New feature
- `fix:` Bug fix
- `chore:` Maintenance (hiding unused features, cleanup)
- `refactor:` Code restructuring
- `docs:` Documentation only

## Important Conventions

1. **Always read before editing** - Understand existing code patterns
2. **Test in both light and dark mode** - CSS changes need `[data-theme="dark"]` variants
3. **Use existing patterns** - Match the coding style already in the file
4. **Update STATE.md** - Document significant changes in `.planning/STATE.md`
5. **Minimal changes** - Don't refactor unrelated code

## Edge Functions

Located in `supabase/functions/`. Deploy with:
```bash
supabase functions deploy function-name
```

Key functions:
- `stripe-webhook` - Payment processing
- `create-payment-link` - Generate Stripe links
- `create-consultation-checkout` - Consultation bookings

## Supabase Queries

```javascript
// Standard pattern
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('column', value);

if (error) {
  console.error('Error:', error);
  return;
}
```

## Debugging

```javascript
// Console logging (remove before commit)
console.log('Debug:', variable);

// Check data state
console.log('Appointments:', allAppointments.length);
console.log('Artists:', allArtists.length);
```

## Recent Major Changes (2026-01-19)

### Phase 5.8: Payment Notifications & Webhook Fix
- Fixed Updates tab to show paid appointments from last 7 days
- Fixed Supabase query column names (customers, artists, appointments)
- "Bezahlt am" timestamp now uses correct `payment_received_at` from DB
- Removed dependency on broken `check-payment-link-status` Edge Function
- Realtime subscription passes `paidAt` for live payment updates

### Phase 5.7: Status Stripes & Click-to-Book (2026-01-16)
- Diagonal stripe patterns for rescheduled/canceled/no_show appointments
- Click-to-book modal when clicking green available slots
- Non-blocking appointments don't block availability

### Phase 5.6: Calendar Availability Visualization (2026-01-15)
- Slot labels show artist name + Instagram handle (vertical layout)
- Green background for available time slots from dienstplan
- Availability-only rows have smaller height (44px)
- Event cards have white/dark background wrapper for contrast

See `.planning/STATE.md` for full change history.

---

*Last updated: 2026-01-19*
