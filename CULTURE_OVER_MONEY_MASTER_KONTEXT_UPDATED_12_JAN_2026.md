# CULTURE OVER MONEY - MASTER KONTEXT DOKUMENTATION
## Single Source of Truth für Entwicklung
### Stand: 12. Januar 2026 (Update: Analytics, Agreement System, Admin Emails)

---

# ═══════════════════════════════════════════════════════════════════════════════
# TEIL 1: SYSTEM ÜBERSICHT
# ═══════════════════════════════════════════════════════════════════════════════

## 1.1 Projekt-Kern

| Aspekt | Details |
|--------|---------|
| **System** | Tattoo Studio Management System |
| **Marke** | Culture over Money |
| **Domain** | mommyimsorry.com |
| **Standorte** | 5 Studios in DE/FR |
| **Hauptdatei** | `management-system.html` (~55.000 Zeilen) |
| **Architektur** | Single-Page HTML/CSS/JavaScript |

### Standorte & Marken

| Stadt | Marke | Hospitality |
|-------|-------|-------------|
| Stuttgart | Mommy I'm Sorry | ✅ Ja |
| Stuttgart | Seventyone | ✅ Ja |
| Köln | Muttersöhne | ❌ Nein |
| München | Pardon Paris | ❌ Nein |
| Berlin | GON | ✅ Ja |

## 1.2 Technologie-Stack

```
Frontend:     Single-Page HTML/CSS/JavaScript (Vanilla)
Backend:      Supabase PostgreSQL
Payments:     Stripe Integration
Email:        Resend (Aesop-Style Templates)
Analytics:    PostHog Web Analytics API
Hosting:      GitHub → Webflow Embed
Charts:       Chart.js
Maps:         jQVMap (World Map)
Storage:      Supabase Storage (Buckets)
Dev Tool:     Claude Code CLI
```

## 1.3 Datenvolumen (Stand: 12. Januar 2026)

| Tabelle | Records | RLS |
|---------|---------|-----|
| requests | ~35,000 | ✅ ON |
| customers | ~27,600 | ✅ ON |
| appointments | ~16,600 | ✅ ON |
| artists | ~900 | ✅ ON |
| upcoming_slots | ~2,200 | ✅ ON |
| **agreements** | **NEU** | ✅ ON |

---

# ═══════════════════════════════════════════════════════════════════════════════
# TEIL 2: POSTHOG WEB ANALYTICS (NEU - 11. Januar 2026)
# ═══════════════════════════════════════════════════════════════════════════════

## 2.1 Integration

| Aspekt | Details |
|--------|---------|
| **Cloud** | EU (eu.posthog.com) |
| **API** | HogQL Query Endpoint |
| **Credentials** | localStorage |

## 2.2 Dashboard Features

- KPI Cards (Pageviews, Visitors, Sessions, Duration, Bounce Rate)
- Traffic Line Chart
- World Map (jQVMap + Fallback)
- Top Pages, Referrers, Browsers, Devices
- Period Filters (24h, 7d, 14d, 30d, 3m)

---

# ═══════════════════════════════════════════════════════════════════════════════
# TEIL 3: ADMIN EMAIL SYSTEM (NEU - 12. Januar 2026)
# ═══════════════════════════════════════════════════════════════════════════════

## 3.1 E-Mail Typen

| Typ | Trigger | Empfänger |
|-----|---------|-----------|
| New Request Admin | Neue Booking Request | info@mommyimsorry.com |
| Payment Link | Request → Scheduled | Kunde |
| Reminder 1 | 3 Tage nach Payment Link | Kunde |
| Reminder 2 | 7 Tage (dringend) | Kunde |

## 3.2 Design: Aesop-Style

- Minimalistisch, elegant, viel Weißraum
- Georgia für Headlines, System Font für Body
- Farben: #1a1a1a Text, #f7f6f5 Akzent, #e5e5e5 Linien

---

# ═══════════════════════════════════════════════════════════════════════════════
# TEIL 4: AGREEMENT SYSTEM (NEU - 12. Januar 2026)
# ═══════════════════════════════════════════════════════════════════════════════

## 4.1 Komponenten

1. **agreement-form.html** - iPad PWA für Kunden
2. **Agreements Tab** - Management System
3. **agreements Tabelle** - Supabase
4. **PDF Export** - jsPDF

## 4.2 Form Features

- Multi-Step (5 Schritte)
- DE/EN Toggle mit Flaggen
- Kunden-Suche + Vorausfüllung
- Canvas Unterschrift (Touch)
- Auto-Match mit heutigem Termin
- 5-Sek Success Countdown

## 4.3 PWA für iPad

- Standalone Mode (keine Safari UI)
- Kiosk CSS
- App Icons + Splash Screens

---

# ═══════════════════════════════════════════════════════════════════════════════
# TEIL 5: CUSTOMER RANG SYSTEM (UPDATE - 12. Januar 2026)
# ═══════════════════════════════════════════════════════════════════════════════

| Rang | Kriterium | Badge |
|------|-----------|-------|
| **Neukunde** | Kein Termin | 🆕 Blau |
| **Bronze** | ≥1 Termin | 🥉 Bronze |
| **Silver** | ≥3 Termine | 🥈 Silber |
| **Gold** | ≥5 Termine | 🥇 Gold |
| **Platinum** | ≥10 Termine | 💎 Lila |

Auto-Upgrade: Neukunde → Bronze bei erstem Termin

---

# ═══════════════════════════════════════════════════════════════════════════════
# TEIL 6: SESSION-HISTORIE
# ═══════════════════════════════════════════════════════════════════════════════

## 11. Januar 2026 - PostHog Analytics
- PostHog Web Analytics API integriert
- HogQL Queries für alle Metriken
- World Map mit jQVMap + Fallback
- Dashboard KPIs, Charts, Tables

## 12. Januar 2026 - Agreement System & Emails

### Request Modal Cleanup
- Appointment & Payment Section entfernt
- Blaue Balken entfernt
- Reference Images 150px
- View Customer Profile Button

### Neukunde Rang System
- 225 Kunden migriert
- Auto-Upgrade Logik

### Admin Email System
- Aesop-Style Templates
- Resend Integration

### Agreement System (Geplant)
- agreement-form.html (iPad PWA)
- agreements Tabelle
- DE/EN Sprachunterstützung
- PDF Export

---

# ═══════════════════════════════════════════════════════════════════════════════
# TEIL 7: OFFENE PUNKTE
# ═══════════════════════════════════════════════════════════════════════════════

## ✅ ERLEDIGT (11-12. Januar)
- [x] PostHog Analytics
- [x] Request Modal Cleanup
- [x] Neukunde Rang System
- [x] Admin Email Templates

## 🟡 In Arbeit
- [ ] Agreement Form HTML
- [ ] agreements Tabelle
- [ ] Agreements Tab

---

*Letzte Aktualisierung: 12. Januar 2026*
