# Culture Over Money - Roadmap
**Stand: 2026-01-22 | Version: 3.1266**
**UPDATE: Phase 8 Dashboard Visual Polish IN PROGRESS**

---

## Übersicht (AKTUALISIERT)

```
Phase 0: Mapping & Dokumentation     ████████████████████ 100% ✓
Phase 1: Edge Functions              ████████████████████ 100% ✓
Phase 2: RLS Audit                   ████████████████████ 100% ✓
Phase 3: Error Tracking              ████████████████████ 100% ✓
Phase 3.5: Security Scan             ████████████████████ 100% ✓
Phase 4: Auth Hardening              ████████████████████ 100% ✓
Phase 4.5: Payment Status Fix        ████████████████████ 100% ✓
Phase 4.6: Auth Inline Integration   ████████████████████ 100% ✓
Phase 4.7: Admin Panel               ████████████████████ 100% ✓
Phase 5.1: Agreement Form UX         ████████████████████ 100% ✓
Phase 5.3: Consultation Payment      ████████████████████ 100% ✓
Phase 5.4: Security Audit            ████████████████████ 100% ✓
Phase 5.5: Calendar & Search         ████████████████████ 100% ✓
Phase 5.6: Calendar Availability     ████████████████████ 100% ✓
Phase 5.7: Status Stripes & Book     ████████████████████ 100% ✓
Phase 5.8: Payment Notifications     ████████████████████ 100% ✓
Phase 6: Dashboard Redesign          ████████████████████ 100% ✓
Phase 7: Events UI & Create Card     ████████████████████ 100% ✓
Phase 8: Dashboard Visual Polish     ██████████████████░░  90% ⏳
Phase 8.1: V1 View Permissions       ████████████████████ 100% ✓
Phase 5.2: Performance & Polish      ░░░░░░░░░░░░░░░░░░░░   0%
```

---

## Current: Phase 8 - Dashboard Visual Polish (2026-01-22) ⏳

**Status**: In Progress
**Priority**: HIGH

### Completed

| Feature | Description |
|---------|-------------|
| **Entry Animations** | Staggered slide-up animations (0.1s-0.4s delays) for dashboard columns |
| **Avatar Bug Fix** | Profile button resets to default icon when user has no avatar |
| **Event Participation** | RLS fix + events filtered to only show for participants |
| **Background Image** | Dashboard uses Supabase image, other pages use grey (#f5f5f7) |
| **Glassmorphism** | Frosted glass effect: 8px blur, light grey, 0.58 opacity |
| **Welcome Text** | Changed to white for contrast against background |
| **Hidden Scrollbars** | Neue Anfragen & Anstehende Termine scroll without visible bars |
| **Dark Mode Navbar** | Fixed color mismatch (#1c1c1e to match header) |
| **Mobile Testing** | Verified calendar and profile views on 375x812 viewport |

### Technical Summary

**CSS Variables (Light Mode):**
```css
--glass-bg: rgba(245, 245, 247, 0.58);
--glass-blur: blur(8px);
--glass-border: rgba(255, 255, 255, 0.4);
```

**CSS Variables (Dark Mode):**
```css
--glass-bg: rgba(60, 60, 67, 0.58);
```

**Dark Mode Navbar:**
```css
[data-theme="dark"] .navbar-container {
  background: #1c1c1e; /* Fixed: was #2c2c2e */
}
```

**Dashboard Background:**
```css
#dashboard-section {
  background: url('...Supabase.../Bildschirmfoto%202026-01-21%20um%2015.43.55.png');
  background-size: cover;
  background-attachment: fixed;
}
```

**Database Migration Applied:**
```sql
-- fix_event_participants_update_policy
CREATE POLICY event_participants_update_all ON event_participants
FOR UPDATE USING (true) WITH CHECK (true);
```

### Commits (Phase 8)

```
d73d1f8 feat(dashboard): add entry animations and fix avatar display bug
4c8fb2f style(dashboard): image background for dashboard only, grey glass cards
e32235f style(glass): update glassmorphism to match frosted reference
3a77bd9 style(glass): adjust opacity and add grey dark mode
cf35674 style(dashboard): increase glass opacity to 0.92, update background image
2a217fa style(dashboard): hide scrollbars, light grey glass at 0.95 opacity
260664a style(glass): increase opacity to 0.97 (10% less transparent)
ca79cc4 style(dashboard): increase glass transparency to 58%, reduce blur to 8px, fix dark navbar
```

### Remaining Tasks

- [ ] Further visual refinements (if needed)
- [ ] Dark mode background image (optional)

---

## Phase 8.1: V1 View Permission System (2026-01-22) ✓

**Status**: Complete
**Priority**: HIGH

### Summary

Restricted view permission system for specific artists (V1 users) who only see their own data.

### V1 Users (7)

Ata, Luka, Mary, Mela, Marina Art, toriatattooo, lily.shy

### What V1 Users See

| Feature | Visible | Hidden |
|---------|---------|--------|
| **Dashboard** | Pinned Events, Schwarzes Brett (50/50) | Neue Anfragen, Anstehende Termine |
| **Calendar** | Residents (own appointments only) | Guests, Hospitality |
| **Dienstplan** | Own schedule only | Other artists |
| **Appointment Details** | View only | Edit, Cancel, Delete buttons |
| **Payment Info** | - | All payment data hidden |

### Technical Details

- Database: `artists.view_permission = 'V1'`
- CSS: `body.view-restricted-v1` class hides elements
- JS: `hasRestrictedView()` helper filters data
- Calendar: `data-category` attribute on rows for CSS targeting

### Commits

```
8f9b9b5 feat(v1-permissions): add dashboard 50/50 layout and mobile filtering
e74555f feat(v1-permissions): hide guests, hospitality, stays and action buttons
c876722 fix(v1-permissions): fix calendar grid alignment for hidden sections
b2024bf chore(ui): disable auto-slide for Schwarzes Brett
```

---

## Recent Completions

### Phase 7: Events UI & Create Card (2026-01-21) ✓

| Feature | Description |
|---------|-------------|
| Grid Layout Adjustment | Schwarzes Brett width matches right column |
| Create Event Card | Plus icon placeholder, opens modal on click |
| Modal Rename | "Create New Event or Meeting" |

### Phase 6: Dashboard Redesign - Glassmorphism (2026-01-20) ✓

| Feature | Description |
|---------|-------------|
| **5-Column Grid Layout** | New CSS Grid with Schwarzes Brett, Events, Projects, Tasks, Right Column |
| **Glassmorphism Styling** | backdrop-filter blur, transparent backgrounds, glass borders |
| **Schwarzes Brett Slider** | Single-entry slider with glass indicators above Neue Nachricht button |
| **Events & Meetings** | Horizontal scroll cards, Pflicht badge aligned above avatars |
| **Neue Anfragen** | Grey container with white entries, relative time ("Heute", "Gestern") |
| **Anstehende Termine** | Grey container with white entries, matched padding |
| **Task Priority System** | DB column + UI dropdown (Low/Regular/Urgent) with colored flag icons |

### Commits (Phase 6)

```
8117c84 feat(dashboard): slider indicators above button, padding fixes, task priorities
2801e2e feat(events): align badge, title, description above avatars
1cfec76 style(dashboard): reduce container heading font-weight to 450
```

---

### Phase 5.8: Payment Notifications & Webhook Fix (2026-01-19) ✓

| Feature | Description |
|---------|-------------|
| Payment Notifications | Updates tab now shows paid appointments from last 7 days |
| DB Query Fix | Fixed column names (customers, artists, appointments) |
| Timestamp Fix | "Bezahlt am" now shows correct payment_received_at date |
| Edge Function Bypass | No longer depends on broken check-payment-link-status |

---

### Phase 5.7: Status Stripes & Click-to-Book (2026-01-16) ✓

| Feature | Description |
|---------|-------------|
| Status Stripes | Diagonal stripe patterns for rescheduled/canceled/no_show |
| Click-to-Book | Modal opens when clicking green available slots |
| Non-Blocking Logic | Canceled appointments don't block availability |

---

## Upcoming: Phase 5.2 Performance & Polish

**Status**: Not started
**Priority**: LOW

### Possible Tasks

1. **Performance Optimization**
   - Lazy loading for large data sets
   - Caching improvements

2. **Code Cleanup**
   - Remove unused console.log statements
   - Dead code removal

3. **UI Polish**
   - Minor visual refinements
   - Accessibility improvements

---

## Timeline

```
Januar 2026
├── KW 2: Phase 0-3 ✓ DONE
├── KW 2: Phase 3.5-4.7 ✓ DONE
├── KW 3: Phase 5.1-5.7 ✓ DONE (2026-01-14 to 2026-01-16)
├── KW 4: Phase 5.8 ✓ DONE (2026-01-19)
├── KW 4: Phase 6 Dashboard Redesign ✓ DONE (2026-01-20)
├── KW 4: Phase 7 Events UI ✓ DONE (2026-01-21)
├── KW 4: Phase 8 Visual Polish ⏳ IN PROGRESS (2026-01-22)
└── KW 4+: Phase 5.2 Performance & Polish (Optional)

Februar 2026
└── TBD based on business needs
```

---

*Last updated: 2026-01-22 with Claude Code*
