# Culture Over Money - Claude Code Instructions

## ⚠️ CRITICAL: Repository & Working Mode

### Repository (ALWAYS use this!)
```
REPO:   https://github.com/MIS-CTO/script.js
BRANCH: main
MODE:   REMOTE (never work locally unless explicitly asked)
```

**NEVER:**
- Use other repositories as examples
- Work on local files without explicit instruction
- Assume a different repo structure

### Before EVERY Task
```
1. READ .planning/STATE.md → Current phase & progress
2. READ .planning/PROJECT.md → Project context
3. CONFIRM scope before implementing
```

### After EVERY Task
```
1. UPDATE .planning/STATE.md with progress
2. COMMIT with conventional format: feat|fix|chore(scope): description
```

---

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
| `consultation-booking.html` | Customer booking flow |
| `agreement-form.html` | Customer consent form PWA |
| `supabase/functions/*/index.ts` | Edge Functions (Deno) |
| `.planning/STATE.md` | **Current project state - READ THIS FIRST** |
| `.planning/PROJECT.md` | Project vision & requirements |
| `.planning/ROADMAP.md` | Phase structure |
| `.planning/codebase/` | Architecture, conventions, stack docs |

---

## ⛔ CRITICAL CONSTRAINTS (Blast Radius)

### Supabase / Database
```javascript
// ✅ CORRECT - Explicit FK specification (ALWAYS do this!)
const { data } = await supabase
  .from('upcoming_slots')
  .select(`*, artist:artists!upcoming_slots_artist_id_fkey(id, name)`)

// ❌ WRONG - Will cause PGRST201 error
const { data } = await supabase
  .from('upcoming_slots')
  .select(`*, artist:artists(id, name)`)
```

### Edge Functions (Deno)
```typescript
// ✅ CORRECT - Use async version
const event = await stripe.webhooks.constructEventAsync(body, sig, secret)

// ❌ WRONG - Causes Deno sync context error
const event = stripe.webhooks.constructEvent(body, sig, secret)
```

### Custom Auth
- Users appear as `anon` to Supabase (NOT as authenticated users)
- RLS policies must account for this
- Check `profiles` table for actual user identity

### Never Without Explicit Permission
- ❌ Remove or rename functions
- ❌ Change global variables
- ❌ Modify RLS policies
- ❌ Alter database schema
- ❌ Change auth logic
- ❌ Delete event listeners

### Always
- ✅ ADD new code (preferred over replacing)
- ✅ Expose functions to window: `window.functionName = functionName`
- ✅ Include error handling
- ✅ Add console.log for debugging

---

## Code Patterns

### JavaScript Functions
- Naming: `camelCase`
- Handlers: `handle` prefix (e.g., `handlePaymentClick`)
- Loaders: `load` prefix (e.g., `loadCustomerData`)
- Window exposure: Always add `window.X = X` after function definition
- Error pattern: `const { data, error } = await supabase...`

### CSS
- Dark mode: `[data-theme="dark"] .class { ... }`
- Variables: `var(--ink)`, `var(--muted)`, `var(--paper)`, `var(--border-color)`
- State classes: `.is-selected`, `.is-loading`, `.active`
- Mobile: Include responsive styles

### Database
- Tables: snake_case plural (`requests`, `customers`)
- Columns: snake_case (`created_at`, `payment_status`)
- Foreign keys: `{singular}_id` (`customer_id`, `artist_id`)
- Timestamps: `created_at`, `updated_at`

---

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

### Status Classes (Phase 5.7)
```css
.event.status-rescheduled          /* Gray diagonal stripes */
.event.status-canceled             /* Red diagonal stripes */
.event.status-no-show              /* Dark gray diagonal stripes */
```

---

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

---

## Git Workflow

### Commit Format
```bash
# Use HEREDOC for proper formatting
git commit -m "$(cat <<'EOF'
feat(scope): short description

Longer explanation if needed.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
```

### Commit Types
- `feat:` New feature
- `fix:` Bug fix
- `chore:` Maintenance (hiding unused features, cleanup)
- `refactor:` Code restructuring
- `docs:` Documentation only

### If Push Rejected
```bash
git pull --rebase origin main && git push origin main
```

---

## MCP Servers Available

| Server | Purpose |
|--------|---------|
| **Supabase** | Database queries, RLS, Edge Functions |
| **GitHub** | Repository operations (use for THIS repo only!) |
| **Stripe** | Payment operations |
| **Resend** | Email sending |
| **Playwright** | Browser automation & testing |

---

## GSD Workflow & Slash Commands

### Workflow
1. `/gsd:progress` - Check current state
2. `/gsd:plan-phase N` - Plan next phase
3. `/gsd:execute-plan` - Execute with subagent
4. Update STATE.md after completion

### Complete Slash Command Reference

| Command | Description |
|---------|-------------|
| `/gsd:help` | Show available GSD commands and usage guide |
| `/gsd:progress` | Check project progress, show context, route to next action |
| `/gsd:resume-work` | Resume work from previous session with full context |
| `/gsd:pause-work` | Create context handoff when pausing work mid-phase |
| `/gsd:plan-phase` | Create detailed execution plan for a phase (PLAN.md) |
| `/gsd:execute-plan` | Execute a PLAN.md file |
| `/gsd:research-phase` | Research how to implement a phase before planning |
| `/gsd:discuss-phase` | Gather phase context through adaptive questioning |
| `/gsd:list-phase-assumptions` | Surface assumptions about a phase approach before planning |
| `/gsd:verify-work` | Guide manual user acceptance testing of built features |
| `/gsd:plan-fix` | Plan fixes for UAT issues from verify-work |
| `/gsd:new-project` | Initialize new project with deep context gathering |
| `/gsd:new-milestone` | Create new milestone with phases for existing project |
| `/gsd:discuss-milestone` | Gather context for next milestone through questioning |
| `/gsd:complete-milestone` | Archive completed milestone and prepare for next |
| `/gsd:create-roadmap` | Create roadmap with phases for the project |
| `/gsd:add-phase` | Add phase to end of current milestone in roadmap |
| `/gsd:insert-phase` | Insert urgent work as decimal phase (e.g., 72.1) |
| `/gsd:remove-phase` | Remove a future phase and renumber subsequent phases |
| `/gsd:map-codebase` | Analyze codebase with parallel Explore agents |
| `/gsd:consider-issues` | Review deferred issues, close resolved, identify urgent |

---

## Quick Reference

### When Working on Payments
- Read: `.planning/context/PAYMENT_SYSTEM.md` (if exists)
- Stripe webhooks in: `supabase/functions/stripe-webhook/`
- Use `constructEventAsync()` always
- Check `payment_received_at` for payment timestamp

### When Working on Database
- Read: `.planning/codebase/ARCHITECTURE.md`
- FK pattern: `table:tables!explicit_fk_name(columns)`
- Custom auth = user is "anon"
- Column names: `first_name`, `last_name` (not `name`)

### When Working on UI
- Main file: `management-system.html`
- Booking: `consultation-booking.html`
- Dark mode: Use CSS variables
- Always test in both light and dark mode

### When Working on Calendar
- Key function: `renderCalendar()` (line ~32900)
- Availability: `artistAvailabilityMap` from dienstplan
- Status stripes: `getAppointmentStatusClass()` helper
- Non-blocking check: `isNonBlockingAppointment()` helper

---

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

---

## Edge Functions

Located in `supabase/functions/`. Deploy with:
```bash
supabase functions deploy function-name
```

Key functions:
- `stripe-webhook` - Payment processing (v29)
- `create-payment-link` - Generate Stripe links (v31)
- `create-consultation-checkout` - Consultation bookings (v5)
- `send-consultation-confirmation` - Email sending (v2)

---

## Debugging

```javascript
// Console logging (remove before commit)
console.log('Debug:', variable);

// Check data state
console.log('Appointments:', allAppointments.length);
console.log('Artists:', allArtists.length);
```

---

## Important Conventions

1. **Always read before editing** - Understand existing code patterns
2. **Test in both light and dark mode** - CSS changes need `[data-theme="dark"]` variants
3. **Use existing patterns** - Match the coding style already in the file
4. **Update STATE.md** - Document significant changes in `.planning/STATE.md`
5. **Minimal changes** - Don't refactor unrelated code
6. **Explicit FK** - Always specify foreign key names in Supabase queries

---

## Recent Major Changes

### Phase 5.8: Payment Notifications & Webhook Fix (2026-01-19)
- Fixed Updates tab to show paid appointments from last 7 days
- Fixed Supabase query column names (customers, artists, appointments)
- "Bezahlt am" timestamp now uses correct `payment_received_at` from DB
- Removed dependency on broken `check-payment-link-status` Edge Function
- Realtime subscription passes `paidAt` for live payment updates

### Phase 5.7: Status Stripes & Click-to-Book (2026-01-16)
- Diagonal stripe patterns for rescheduled/canceled/no_show appointments
- Click-to-book modal when clicking green available slots
- Non-blocking appointments don't block availability
- Hotfixes: Extra empty rows, artist assignment, zero price validation

### Phase 5.6: Calendar Availability Visualization (2026-01-15)
- Slot labels show artist name + Instagram handle (vertical layout)
- Green background for available time slots from dienstplan
- Availability-only rows have smaller height (44px)
- Event cards have white/dark background wrapper for contrast

### Phase 5.5: Calendar, Search, Attachments & Rank (2026-01-14)
- Consultation 100€ price display
- Calendar slot grouping by artist
- Request search (phone/instagram)
- Schwarzes Brett attachments
- Customer rank fix (Neukunde)

See `.planning/STATE.md` for full change history.

---

*Last updated: 2026-01-20*
