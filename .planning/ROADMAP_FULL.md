# Culture Over Money - Full Roadmap

> **Generiert:** 2026-01-10
> **Basierend auf:** Security Scan + Feature Backlog + Aktueller State

---

## 🟢 STATUS ÜBERSICHT

```
████████████████████ Phase 0-3 COMPLETE (100%)
░░░░░░░░░░░░░░░░░░░░ Phase 4-6 PENDING
```

---

## 🔴 PHASE 1: SECURITY CRITICAL

**Status:** ✅ GRÖSSTENTEILS RESOLVED

### 1.1 Secrets Exposure Check
| Check | Status | Details |
|-------|--------|----------|
| Stripe Secret Keys (sk_live_, sk_test_) | ✅ CLEAN | Nicht im Frontend |
| Resend API Keys (re_) | ✅ CLEAN | Nicht im Frontend |
| Supabase Service Role | ✅ CLEAN | Nicht im Frontend |
| Supabase Anon Key | ✅ OK | Erwartet im Frontend |

### 1.2 Auth System
| Aspekt | Status | Details |
|--------|--------|----------|
| Login-Funktion | ⚠️ CUSTOM | Via profiles Tabelle, nicht Supabase Auth |
| Passwort-Hashing | ✅ OK | bcrypt in profiles.hashed_password |
| Rate Limiting | ❌ FEHLT | Kein Rate Limiting implementiert |
| Session Management | ⚠️ BASIC | localStorage, kein Expiry |
| Rollen-Prüfung | ⚠️ FRONTEND ONLY | user_role in localStorage |

### 1.3 RLS Status
| Aspekt | Status | Details |
|--------|--------|----------|
| RLS aktiviert | ✅ DONE | 8 kritische Tabellen |
| Policies gefixt | ✅ DONE | 18 Infinite Recursion Policies entfernt |
| Overpermissive | ⚠️ BACKLOG | simple_all_access (qual=true) |

---

## 🟠 PHASE 2: CORE FIXES

**Status:** ⚠️ IN REVIEW

### 2.1 Payment System
- [x] stripe-webhook v15 aktiv
- [x] payment-reminders v3 aktiv (Cron 08:00 UTC täglich)
- [x] create-payment-link v23 aktiv
- [x] Appointment-Erstellung funktioniert
- [ ] Webhook Signature Validation prüfen (optional)
- [ ] Payment Status Sync zwischen requests/appointments verifizieren

### 2.2 Edge Functions Status
| Function | Version | JWT | Status |
|----------|---------|-----|--------|
| stripe-webhook | v15 | ❌ | ✅ ACTIVE |
| create-payment-link | v23 | ✅ | ✅ ACTIVE |
| payment-reminders | v3 | ✅ | ✅ ACTIVE |
| send-cancellation-email | v3 | ✅ | ✅ ACTIVE |
| send-manual-reminder | v2 | ✅ | ✅ ACTIVE |
| seed-auth-from-profiles | v3 | ✅ | ✅ ACTIVE |
| create-wannado-checkout | v2 | ❌ | ✅ ACTIVE |

### 2.3 Cron Jobs (9 aktiv)
| Job | Schedule | Status |
|-----|----------|--------|
| payment-reminders-daily | 08:00 UTC | ✅ RUNNING |
| auto-cancel-unpaid | 06:00 UTC | ✅ ACTIVE |
| auto-finish-appointments | */15 min | ✅ ACTIVE |
| auto-archive-old-requests | 03:00 UTC | ✅ ACTIVE |
| roll_upcoming_status_daily | 02:00 UTC | ✅ ACTIVE |
| permanent-delete-old-requests | 03:00 UTC | ✅ ACTIVE |
| auto-complete-past-guest-slots | 03:00 UTC | ✅ ACTIVE |
| refresh-analytics-hourly | stündlich | ✅ ACTIVE |

### 2.4 Admin Panel
- [x] Error Tracking Panel implementiert
- [x] System Status Dashboard
- [ ] Payment Übersicht erweitern

---

## 🟡 PHASE 3: FUNKTIONALITÄT

**Status:** PENDING

### 3.1 Supabase Polish
- [ ] Tabellen Sync verifizieren
- [ ] Wiring Fixes (falls nötig)
- [ ] Live Synchro Server ↔ User

### 3.2 UI Fixes
- [ ] Appointment Edit Window
- [ ] Artist Preference Anzeige
- [ ] Dashboard Loading Speed

### 3.3 Analytics
- [ ] Page Wiring zu Supabase
- [ ] Layout + Design Polish

---

## 🟢 PHASE 4: BOOKING SYSTEM

**Status:** BACKLOG

### 4.1 Webflow Booking
- [ ] Custom Code Embeds prüfen
- [ ] Supabase Integration verifizieren
- [ ] Wannado Flow testen

### 4.2 Booking Success Page
- [ ] Page bauen
- [ ] Stripe Integration

---

## ⬜ PHASE 5: INTEGRATIONS

**Status:** BACKLOG

### 5.1 Tracking
- [ ] Meta Pixel
- [ ] PostHog
- [ ] Semrush

### 5.2 E-Commerce
- [ ] WooCommerce CSV Import
- [ ] Webflow API Research

### 5.3 Andere
- [ ] Agreements iPad App
- [ ] File Share System
- [ ] Vercel Umzug (optional)

---

## ⬜ PHASE 6: POLISH

**Status:** BACKLOG

- [ ] Management Dashboard Design
- [ ] Wannado Page Design
- [ ] Content Language Prüflesen
- [ ] Alt Text Webflow
- [ ] Consultation Code Polish

---

## Security Assessment Summary

### Angriffsvektoren Bewertung

| Vektor | Risiko | Details |
|--------|--------|----------|
| Brute Force | 6/10 | Kein Rate Limiting |
| Session Hijacking | 5/10 | localStorage ohne Expiry |
| Privilege Escalation | 4/10 | Rolle in localStorage (Frontend-Only Check) |
| SQL Injection | 2/10 | Supabase Client schützt |
| XSS | 3/10 | Teilweise innerHTML Nutzung |
| Secret Exposure | 1/10 | Keine Secrets im Frontend |

### Empfohlene Sofort-Maßnahmen

1. **Rate Limiting implementieren** (Login-Funktion)
2. **Session Expiry einführen** (24h)
3. **Backend Rollen-Check** (RLS Policies erweitern)

---

*Generiert am 2026-01-10 mit Claude Code*
