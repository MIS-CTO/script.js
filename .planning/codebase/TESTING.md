# Culture Over Money - Testing Guide
**Stand: 2026-01-10 | Version: 3.1117**

---

## Test-Strategie

Manuelles Testing + strukturierte Checklisten (keine automatisierten Tests)

---

## Kritische Test-Flows

### Flow 1: Request Erstellen
1. Requests Tab öffnen
2. "Neuer Request" Button klicken
3. Pflichtfelder ausfüllen
4. Request speichern
5. Datenbank prüfen

### Flow 2: Payment Link Senden
1. Request öffnen
2. "Payment Link senden" klicken
3. Stripe Link wird generiert
4. Email wird versendet
5. payment_link_sent_at gesetzt

### Flow 3: Playwright Test
```bash
# RLS Fix verifizieren
npx playwright test
```

---

## Stripe Test-Karten

| Nummer | Beschreibung |
|--------|---------------|
| 4242 4242 4242 4242 | Erfolgreiche Zahlung |
| 4000 0000 0000 0002 | Declined |

---

*Erstellt am 2026-01-10 mit Claude Code*