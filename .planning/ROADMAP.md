# Culture Over Money - Roadmap
**Stand: 2026-01-19 | Version: 3.1215**
**UPDATE: Phase 5.8 Payment Notifications & Webhook Fix COMPLETE**

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
Phase 5.2: Performance & Polish      ░░░░░░░░░░░░░░░░░░░░   0% → NEXT
```

---

## Recent Completions

### Phase 5.8: Payment Notifications & Webhook Fix (2026-01-19) ✓

| Feature | Description |
|---------|-------------|
| Payment Notifications | Updates tab now shows paid appointments from last 7 days |
| DB Query Fix | Fixed column names (customers, artists, appointments) |
| Timestamp Fix | "Bezahlt am" now shows correct payment_received_at date |
| Edge Function Bypass | No longer depends on broken check-payment-link-status |

### Commits (Phase 5.8)

```
33faa31 fix(notifications): Fix Supabase query column names
f5f0e90 fix(notifications): Load paid appointments from DB instead of broken Edge Function
```

---

### Phase 5.7: Status Stripes & Click-to-Book (2026-01-16) ✓

| Feature | Description |
|---------|-------------|
| Status Stripes | Diagonal stripe patterns for rescheduled/canceled/no_show |
| Click-to-Book | Modal opens when clicking green available slots |
| Non-Blocking Logic | Canceled appointments don't block availability |

### Hotfixes (2026-01-16)

| Fix | Description |
|-----|-------------|
| Extra Empty Rows | Fixed CSS grid rendering for non-blocking appointments |
| Artist Assignment | Allow artist assignment on non-blocking appointment slots |
| Gesamtpreis Zero | Allow 0€ as valid price for free/complimentary bookings |

---

## Phase 5.6: Calendar Availability (2026-01-15) ✓

- Green background for available time slots from dienstplan
- Slot labels show artist name + Instagram handle (vertical layout)
- Availability-only rows have smaller height (44px)
- Event cards have white/dark background wrapper for contrast

---

## Phase 5.5: Calendar, Search & Rank (2026-01-14) ✓

- Calendar day view with artist rows
- Customer search improvements
- Artist ranking system
- Attachment handling

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
└── KW 4+: Phase 5.2 Performance & Polish (Optional)

Februar 2026
└── TBD based on business needs
```

---

## Commits (Phase 5.7)

```
6f38e45 feat(calendar): add status stripes and click-to-book functionality
8d93fd5 fix(calendar): improve artist ID lookup for click-to-book handlers
81362d9 fix(calendar): prevent extra empty rows from non-blocking appointments
972b4a8 fix(requests): allow artist assignment on non-blocking appointment slots
a381719 fix(payment): allow 0 as valid Gesamtpreis value
fa9898d fix(requests): allow 0 as valid price for scheduling check
```

---

*Last updated: 2026-01-19 with Claude Code*
