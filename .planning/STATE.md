# Culture Over Money - Project State
**Stand: 2026-01-10 | Version: 3.1117**
**KORRIGIERT: Edge Functions sind DEPLOYED und AKTIV!**
**UPDATE: RLS Audit DONE, Infinite Recursion GEFIXT!**

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
║  PHASE 3: ERROR TRACKING                             → NEXT  ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## Kritische Findings (KORRIGIERT)

### ALARMSTUFE GRÜN - Ursprünglich falsch dokumentiert!

| Finding | Ursprünglich | Realität |
|---------|--------------|----------|
| **Edge Functions** | "0 deployed" | **7 AKTIV deployed!** |
| **Payment Reminders** | "fehlen" | **✓ payment-reminders v3** |
| **Auto-Cancel** | "fehlt" | **✓ Teil von payment-reminders** |
| **Stripe Webhook** | "unklar" | **✓ stripe-webhook v14** |
| **Appointment Creation** | "Trigger broken" | **✓ Via create-payment-link** |

### RLS Fix Details (2026-01-10)

| Aktion | Details |
|--------|----------|
| **RLS aktiviert für** | dienstplan, projects, project_collaborators, project_members, project_tasks, tasks, work_tracking, task_projects |
| **Policies gelöscht** | 18 Policies mit zirkulären Referenzen |
| **Policies erstellt** | 5 × `simple_all_access` ohne Subqueries |
| **Tabellen gelöscht** | 7 Backup/Temp-Tabellen mit sensiblen Daten |
| **Playwright Test** | ✅ BESTANDEN - System funktioniert |

### pg_cron Jobs (VERIFIZIERT - 9 Jobs AKTIV!)

| Job | Schedule | Funktion |
|-----|----------|----------|
| `payment-reminders-daily` | **08:00 UTC täglich** | **Edge Function payment-reminders** |
| `auto-cancel-unpaid` | 06:00 UTC täglich | SQL: `auto_cancel_unpaid_requests()` |
| `auto-finish-appointments` | Alle 15 Min | SQL: `auto_finish_past_appointments()` |
| `auto-archive-old-requests` | 03:00 UTC täglich | SQL: `auto_archive_old_requests()` |

---

*Aktualisiert am 2026-01-10 mit Claude Code*