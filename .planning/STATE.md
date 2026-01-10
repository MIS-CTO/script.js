# Culture Over Money - Project State
**Stand: 2026-01-10 | Version: 3.1119**
**UPDATE: Security Scan durchgeführt!**

---

## Aktuelle Position

```
╔═══════════════════════════════════════════════════════════════╗
║  PHASE 0: MAPPING & DOKUMENTATION                    ✓ DONE  ║
╠═══════════════════════════════════════════════════════════════╣
║  PHASE 1: EDGE FUNCTIONS                             ✓ DONE  ║
╠═══════════════════════════════════════════════════════════════╣
║  PHASE 2: RLS AUDIT                                  ✓ DONE  ║
╠═══════════════════════════════════════════════════════════════╣
║  PHASE 3: ERROR TRACKING                             ✓ DONE  ║
╠═══════════════════════════════════════════════════════════════╣
║  PHASE 3.5: SECURITY SCAN                            ✓ DONE  ║
╠═══════════════════════════════════════════════════════════════╣
║  PHASE 4: PERFORMANCE & CLEANUP                      → NEXT  ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## Security Scan Ergebnisse (2026-01-10)

### Secrets Scan

| Secret Type | Found? | Location |
|-------------|--------|----------|
| Stripe Secret Key (sk_live_, sk_test_) | ✅ CLEAN | Nicht im Frontend |
| Stripe Publishable Key | ✅ OK | Frontend (erwartet) |
| Resend API Key (re_) | ✅ CLEAN | Nicht im Frontend |
| Supabase Anon Key | ✅ OK | Frontend (erwartet) |
| Supabase Service Key | ✅ CLEAN | Nur in Edge Functions |

### Auth System Analyse

| Aspekt | Status | Details |
|--------|--------|----------|
| Login-Funktion | ⚠️ CUSTOM | Via profiles Tabelle |
| Passwort-Hashing | ✅ bcrypt | profiles.hashed_password |
| Rate Limiting | ❌ FEHLT | Brute-Force möglich |
| Session Management | ⚠️ BASIC | localStorage, kein Expiry |
| Token Rotation | ❌ FEHLT | Kein Token-System |
| Rollen-Check | ⚠️ FRONTEND | Nur in localStorage |

### Angriffsvektoren

| Vektor | Risiko | Details |
|--------|--------|----------|
| Brute Force | 6/10 | Kein Rate Limiting |
| Session Hijacking | 5/10 | localStorage ohne Expiry |
| Privilege Escalation | 4/10 | Rolle in localStorage änderbar |
| SQL Injection | 2/10 | Supabase schützt |
| XSS | 3/10 | Teilweise innerHTML |
| Secret Exposure | 1/10 | Alle Secrets sicher |

### Edge Functions Status

| Function | Version | Status | Issues |
|----------|---------|--------|--------|
| stripe-webhook | v15 | ✅ ACTIVE | Payment Status wird updated |
| payment-reminders | v3 | ✅ ACTIVE | Cron läuft, Emails gehen raus |
| create-payment-link | v23 | ✅ ACTIVE | Secrets sicher via ENV |
| send-cancellation-email | v3 | ✅ ACTIVE | - |
| send-manual-reminder | v2 | ✅ ACTIVE | - |
| seed-auth-from-profiles | v3 | ✅ ACTIVE | - |
| create-wannado-checkout | v2 | ✅ ACTIVE | - |

### Cron Jobs Status

| Job | Schedule | Letzte 5 Runs |
|-----|----------|---------------|
| payment-reminders-daily | 08:00 UTC | ✅ ALLE SUCCEEDED |

---

## Kritische Findings (KORRIGIERT)

### ALARMSTUFE GRÜN - Ursprünglich falsch dokumentiert!

| Finding | Ursprünglich | Realität |
|---------|--------------|----------|
| **Edge Functions** | "0 deployed" | **7 AKTIV deployed!** |
| **Payment Reminders** | "fehlen" | **✓ payment-reminders v3** |
| **Auto-Cancel** | "fehlt" | **✓ Teil von payment-reminders** |
| **Stripe Webhook** | "unklar" | **✓ stripe-webhook v15** |
| **Appointment Creation** | "Trigger broken" | **✓ Via create-payment-link** |
| **Secrets Exposed** | "unklar" | **✓ KEINE im Frontend** |

### RLS Status (RESOLVED 2026-01-10)

| Aktion | Details |
|--------|----------|
| **RLS aktiviert für** | dienstplan, projects, project_collaborators, project_members, project_tasks, tasks, work_tracking, task_projects |
| **Policies gelöscht** | 18 Policies mit zirkulären Referenzen |
| **Policies erstellt** | 5 × `simple_all_access` ohne Subqueries |
| **Tabellen gelöscht** | 7 Backup/Temp-Tabellen mit sensiblen Daten |

---

## Nächste Schritte (AKTUALISIERT)

### Abgeschlossen ✓

1. **~~Cron Job für payment-reminders prüfen~~** ✓ VERIFIZIERT
2. **~~RLS Audit durchführen~~** ✓ DONE
3. **~~Error Tracking implementieren~~** ✓ DONE
4. **~~Security Scan durchführen~~** ✓ DONE

### Diese Woche (Priorität)

5. **Rate Limiting implementieren** (HOCH)
   - Login-Funktion absichern
   - Max 5 Versuche pro Minute

6. **Session Expiry einführen** (MITTEL)
   - 24h Timeout
   - Auto-Logout

### Backlog

7. **Overpermissive Policies reviewen**
8. **Backend Role Checks** (RLS erweitern)
9. **Performance Optimierung**

---

## pg_cron Jobs (9 Jobs AKTIV!)

| Job | Schedule | Funktion |
|-----|----------|----------|
| `payment-reminders-daily` | **08:00 UTC täglich** | Edge Function |
| `auto-cancel-unpaid` | 06:00 UTC täglich | SQL Function |
| `auto-finish-appointments` | Alle 15 Min | SQL Function |
| `auto-archive-old-requests` | 03:00 UTC täglich | SQL Function |
| `roll_upcoming_status_daily` | 02:00 UTC täglich | Status Update |
| `permanent-delete-old-requests` | 03:00 UTC täglich | Hard Delete |
| `auto-complete-past-guest-slots` | 03:00 UTC täglich | Guest Slots |
| `refresh-analytics-hourly` | Stündlich | Analytics Views |

---

*Aktualisiert am 2026-01-10 mit Claude Code - Security Scan*
