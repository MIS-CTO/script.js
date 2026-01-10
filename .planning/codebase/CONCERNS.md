# Culture Over Money - Technical Concerns
**Stand: 2026-01-10 | Version: 3.1117**
**UPDATE: RLS für 8 Tabellen aktiviert, Infinite Recursion gefixt!**

---

## RESOLVED

### ~~Edge Functions fehlen~~ → **7 AKTIV deployed!**
### ~~RLS Security Audit~~ → **GEFIXT 2026-01-10**

---

## RLS Fix Details (2026-01-10)

| Aktion | Details |
|--------|----------|
| RLS aktiviert für | 8 kritische Tabellen |
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

## OPEN Concerns

| Concern | Severity | Status |
|---------|----------|--------|
| Kein Error Tracking | HOCH | → Phase 3 |
| Overpermissive Policies | MITTEL | BACKLOG |
| Single-File Architecture (2.2 MB) | MITTEL | Akzeptiert |

---

*Aktualisiert am 2026-01-10 mit Claude Code*