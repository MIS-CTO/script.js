# Culture Over Money - Database Schema
**Stand: 2026-01-10 | Supabase Project: auxxyehgzkozdjylhqnx**

---

## Übersicht

| Metrik | Wert |
|--------|------|
| Tabellen/Views | 72 (nach Cleanup) |
| Locations | 5 |
| Total Requests | 34.808 |
| Total Projects | 25.543 |
| Total Customers | 27.587 |
| Total Artists | 900 |
| Total Appointments | 16.551 |
| Dienstplan Einträge | 19.138 |

---

## Locations (5 Standorte)

| Name | Stadt |
|------|-------|
| Mommy I'm Sorry | Stuttgart |
| Muttersöhne | Köln |
| seventyone | Stuttgart |
| GON | Berlin |
| Pardon Paris | München |

---

## Core Tables

### requests (34.808 Rows)
Zentrale Tattoo-Anfragen mit Status-Tracking, Payment-Felder, Stripe-Integration

### customers (27.587 Rows)
Kundendaten und Kontaktinfo

### artists (900 Rows)
Team-Mitglieder mit Location-Bindung

### appointments (16.551 Rows)
Gebuchte Termine mit Artist-Zuordnung

### projects (25.543 Rows)
Zahlungsprojekte mit Stripe-Integration

### dienstplan (19.138 Rows)
Dienstplan mit Artist-Arbeitszeiten

---

## RLS Status (nach Fix)

| Status | Anzahl |
|--------|--------|
| Tabellen MIT RLS | 43 ✅ |
| Tabellen OHNE RLS (System) | 5 |
| Gelöschte Temp-Tabellen | 7 |

---

*Generiert am 2026-01-10 mit Claude Code*