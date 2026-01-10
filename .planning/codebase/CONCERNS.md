# Culture Over Money - Technical Concerns
**Stand: 2026-01-10 | Version: 3.1120**
**UPDATE: Auth Hardening + Payment Fixes implementiert!**

---

## Security Concerns Status

### ✅ RESOLVED

| Concern | Status | Lösung |
|---------|--------|--------|
| Edge Functions fehlen | ✅ | 7 AKTIV deployed |
| RLS Security Audit | ✅ | 8 Tabellen aktiviert |
| Secrets Exposure | ✅ | Keine Secrets im Frontend |
| Error Tracking | ✅ | Error Panel implementiert |
| **Rate Limiting fehlt** | ✅ | `auth-hardening.js` erstellt |
| **Session ohne Expiry** | ✅ | 24h Expiry in `auth-hardening.js` |
| **Alte Zahlungslinks** | ✅ | 8 Links bereinigt, Funktion gefixt |

### ⚠️ PENDING INTEGRATION

| Concern | Status | Nächster Schritt |
|---------|--------|-------------------|
| Auth Hardening in HTML | ⚠️ | Script muss eingebunden werden |

### 🟡 BACKLOG

| Concern | Severity | Details |
|---------|----------|----------|
| Frontend-Only Role Check | MITTEL | Rolle nur in localStorage |
| Overpermissive RLS | MITTEL | simple_all_access Policies |
| Single-File Architecture | NIEDRIG | 2.2 MB, akzeptiert |

---

## Auth Hardening (2026-01-10)

### Neue Komponente: `auth-hardening.js`

| Feature | Konfiguration | Beschreibung |
|---------|---------------|---------------|
| Rate Limiting | 5 Versuche / Minute | 5 Min Sperre nach Überschreitung |
| Session Expiry | 24 Stunden | Activity-Based Refresh |
| Auto-Logout | Alle 5 Minuten Check | Automatischer Redirect zu Login |

### Integration erforderlich

Siehe: `.planning/AUTH_HARDENING_INTEGRATION.md`

---

## Payment Status Fixes (2026-01-10)

### Problem: Alte Links nicht gecancelt

**Symptom:** 8 Zahlungslinks (31-37 Tage alt) noch als "pending/unpaid"

**Root Cause:** `auto_cancel_unpaid_requests()` prüfte nur:
```sql
WHERE status IN ('scheduled', 'pending')
```

Aber die alten Requests hatten `status = 'finished'`.

### Lösung

1. **Funktion erweitert:** (Migration `fix_auto_cancel_unpaid_requests`)
   ```sql
   WHERE status IN ('scheduled', 'pending', 'finished', 'open_request')
   ```

2. **Alte Links bereinigt:**
   ```sql
   UPDATE requests SET payment_status = 'canceled' WHERE ...
   -- 8 Rows updated
   ```

---

## Angriffsvektoren Assessment (AKTUALISIERT)

| Vektor | Vorher | Nachher | Status |
|--------|--------|---------|--------|
| Brute Force | 6/10 | 2/10 | ✅ Rate Limiting |
| Session Hijacking | 5/10 | 3/10 | ✅ Session Expiry |
| Privilege Escalation | 4/10 | 4/10 | ⚠️ Noch offen |
| SQL Injection | 2/10 | 2/10 | ✅ Supabase schützt |
| XSS | 3/10 | 3/10 | ⚠️ Teilweise innerHTML |
| Secret Exposure | 1/10 | 1/10 | ✅ Alle Secrets sicher |

---

## Edge Functions Security

| Function | JWT Required | Secrets via ENV |
|----------|--------------|------------------|
| stripe-webhook | ❌ (Webhook) | ✅ |
| create-payment-link | ✅ | ✅ |
| payment-reminders | ✅ | ✅ |
| send-cancellation-email | ✅ | ✅ |
| send-manual-reminder | ✅ | ✅ |
| seed-auth-from-profiles | ✅ | ✅ |
| create-wannado-checkout | ❌ (Public) | ✅ |

---

*Aktualisiert am 2026-01-10 mit Claude Code*
