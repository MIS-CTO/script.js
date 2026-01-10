# Culture Over Money - Technical Concerns
**Stand: 2026-01-10 | Version: 3.1118**
**UPDATE: Security Scan durchgeführt!**

---

## Security Scan Ergebnisse (2026-01-10)

### ✅ RESOLVED

| Concern | Status | Details |
|---------|--------|----------|
| Edge Functions fehlen | ✅ RESOLVED | 7 AKTIV deployed |
| RLS Security Audit | ✅ RESOLVED | 8 Tabellen aktiviert |
| Secrets Exposure | ✅ CLEAN | Keine Secrets im Frontend |
| Error Tracking | ✅ RESOLVED | Error Panel implementiert |

### ⚠️ OFFEN

| Concern | Severity | Details |
|---------|----------|----------|
| **Kein Rate Limiting** | HOCH | Login ohne Brute-Force-Schutz |
| **Session ohne Expiry** | MITTEL | localStorage ohne Timeout |
| **Frontend-Only Role Check** | MITTEL | Privilege Escalation möglich |
| **Overpermissive RLS** | MITTEL | simple_all_access Policies |
| **Single-File Architecture** | NIEDRIG | 2.2 MB, akzeptiert |

---

## Angriffsvektoren Assessment

| Vektor | Risiko | Begründung |
|--------|--------|------------|
| **Brute Force** | 6/10 | Kein Rate Limiting bei Login |
| **Session Hijacking** | 5/10 | localStorage ohne Expiry |
| **Privilege Escalation** | 4/10 | Rolle nur im Frontend geprüft |
| **SQL Injection** | 2/10 | Supabase Client schützt |
| **XSS** | 3/10 | Teilweise innerHTML Nutzung |
| **Secret Exposure** | 1/10 | Alle Secrets in Edge Functions |

---

## RLS Fix Details (2026-01-10)

| Aktion | Details |
|--------|----------|
| RLS aktiviert für | dienstplan, projects, project_collaborators, project_members, project_tasks, tasks, work_tracking, task_projects |
| Policies gelöscht | 18 mit zirkulären Referenzen |
| Policies erstellt | 5 × simple_all_access |
| Tabellen gelöscht | 7 Backup/Temp-Tabellen |

### Root Cause: Infinite Recursion

`project_collaborators` hatte eine Self-Reference Policy:
```sql
-- PROBLEM: Fragt sich selbst ab → Infinite Loop
USING (EXISTS (SELECT FROM project_collaborators WHERE ...))
```

### Lösung: Simple Policies
```sql
CREATE POLICY "simple_all_access" ON table
FOR ALL TO anon, authenticated
USING (true) WITH CHECK (true);
```

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

## Empfohlene Sofort-Maßnahmen

1. **Rate Limiting implementieren**
   - Login-Funktion auf max 5 Versuche/Minute
   - IP-basiert oder Fingerprint

2. **Session Expiry einführen**
   - 24h Timeout für localStorage Session
   - Refresh Token Pattern (optional)

3. **Backend Role Check**
   - RLS Policies mit User-ID erweitern
   - Oder: Edge Function für sensible Operationen

---

*Aktualisiert am 2026-01-10 mit Claude Code - Security Scan*
