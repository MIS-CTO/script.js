# Culture Over Money - Master Context

> **Zuletzt aktualisiert:** 2026-01-10
> **Version:** 3.1200
> **Security Scan:** COMPLETE

---

## ⚠️ KRITISCHE WORKFLOW-REGEL

**NIEMALS lokales Git verwenden!**

| ❌ VERBOTEN | ✅ RICHTIG |
|-------------|-----------|
| `git add` | GitHub MCP `create_or_update_file` |
| `git commit` | GitHub MCP `push_files` |
| `git push` | GitHub MCP Tools |
| Lokale Temp-Repos erstellen | Direkt via API pushen |
| User bitten lokal zu pushen | Alles via GitHub MCP |

**Warum?**
- Konsistenz: Alle Änderungen gehen durch die API
- Keine lokalen Auth-Probleme
- Keine vergessenen Pushes
- management-system.html muss IMMER aus GitHub aufrufbar sein

**Für große Dateien (>1MB):**
- GitHub hat ein 1MB Limit für Contents API
- Bei größeren Dateien: User informieren + alternative Lösung finden

---

## 🚀 Quick Facts

| Aspekt | Details |
|--------|----------|
| **System** | Tattoo Studio Management System |
| **Architektur** | Single-File HTML (2.2 MB) |
| **Backend** | Supabase (PostgreSQL + Edge Functions) |
| **Auth** | Supabase Auth (signInWithPassword) |
| **Payments** | Stripe (via Edge Functions) |
| **Emails** | Resend (via Edge Functions) |
| **Hosting** | GitHub Pages / Webflow Embeds |
| **Projekt-ID** | `auxxyehgzkozdjylhqnx` (Supabase) |

---

## ⚠️ Kritische Constraints

### 1. Supabase Auth System
```
- Supabase Auth (NICHT Custom Auth)
- Login via supabase.auth.signInWithPassword()
- profiles Tabelle für User-Daten
- Session: Supabase Session + localStorage
```

### 2. Auth Hardening (INTEGRIERT)
```
- Rate Limiting: 5 Versuche/Min, 5 Min Lockout
- Session Expiry: 24h Timeout
- Activity Tracking: Refresh bei Interaktion
- Funktionen: checkLoginRateLimit(), saveSession(), etc.
```

### 3. Single-File Architecture
```
- Alles in management-system.html (2.2 MB)
- Keine Module, kein Build-Prozess
- Änderungen direkt in der Datei
- Vorsicht bei großen Änderungen (Blast Radius!)
```

---

## 🔒 Security Status (2026-01-10)

### Secrets Scan
| Check | Status |
|-------|--------|
| Stripe Secret Keys | ✅ CLEAN |
| Resend API Keys | ✅ CLEAN |
| Supabase Service Role | ✅ CLEAN |
| Supabase Anon Key | ✅ OK (erwartet) |

### Auth Security
| Check | Status |
|-------|--------|
| Password Hashing | ✅ Supabase Auth |
| Rate Limiting | ✅ IMPLEMENTIERT |
| Session Expiry | ✅ IMPLEMENTIERT |
| Backend Role Check | ⚠️ BACKLOG |

### RLS Status
| Check | Status |
|-------|--------|
| RLS Aktiviert | ✅ 8 Tabellen |
| Infinite Recursion | ✅ GEFIXT |
| Overpermissive | ⚠️ BACKLOG |

---

## 🔌 Edge Functions (7 aktiv)

| Function | Version | Purpose |
|----------|---------|----------|
| stripe-webhook | v15 | Stripe Events verarbeiten |
| create-payment-link | v23 | Payment Links erstellen |
| payment-reminders | v3 | Automatische Zahlungserinnerungen |
| send-cancellation-email | v3 | Stornierungsmails |
| send-manual-reminder | v2 | Manuelle Erinnerungen |
| seed-auth-from-profiles | v3 | Auth Sync |
| create-wannado-checkout | v2 | Wannado Buchungen |

---

## 📅 Cron Jobs (9 aktiv)

| Job | Schedule | Aktiv |
|-----|----------|-------|
| payment-reminders-daily | 08:00 UTC | ✅ |
| auto-cancel-unpaid | 06:00 UTC | ✅ |
| auto-finish-appointments | */15 min | ✅ |
| auto-archive-old-requests | 03:00 UTC | ✅ |
| roll_upcoming_status_daily | 02:00 UTC | ✅ |
| permanent-delete-old-requests | 03:00 UTC | ✅ |
| auto-complete-past-guest-slots | 03:00 UTC | ✅ |
| refresh-analytics-hourly | stündlich | ✅ |

---

## 🎛️ Admin Panel (IMPLEMENTIERT)

| Feature | Status |
|---------|--------|
| System Status | ✅ |
| Database Stats | ✅ |
| Payment Overview | ✅ |
| Cron Jobs Table | ✅ |
| Edge Functions Table | ✅ |
| Manual Actions | ✅ |
| Mobile Nav (Admin-only) | ✅ |

---

## 📜 Workflow-Regeln

### Git & GitHub
```
❌ NIEMALS lokal git push
❌ NIEMALS lokale Temp-Repos
✅ IMMER GitHub MCP Tools nutzen
✅ Dateien direkt via API pushen
✅ Commit Messages: type: description
✅ Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

### Unklarheiten
```
❌ NIEMALS imaginieren oder raten
✅ IMMER fragen wenn unklar
✅ Kontext aus Planning-Dateien laden
```

### Code & Kontext
```
✅ Code bevorzugt online in GitHub
✅ Alle Skills/MCPs nutzen wenn sinnvoll
✅ Blast Radius bei Änderungen beachten
```

---

## 🚀 Session-Start Anweisung

Bei jeder neuen Session:

```
1. MASTER_CONTEXT.md lesen (diese Datei)
2. STATE.md für aktuellen Stand
3. ROADMAP_FULL.md für Prioritäten
4. Bei Bedarf: Kontext-Fragen stellen
```

### Quick Commands
```
Supabase Projekt-ID: auxxyehgzkozdjylhqnx
GitHub Repo: MIS-CTO/script.js
Hauptdatei: management-system.html
Planning: .planning/
```

---

## 📁 Dateien Übersicht

```
.planning/
├── MASTER_CONTEXT.md   # Diese Datei
├── STATE.md            # Aktueller Projektstatus
├── ROADMAP.md          # Kurz-Roadmap
├── ROADMAP_FULL.md     # Vollständige Roadmap
├── ISSUES.md           # Bekannte Issues
├── TESTING.md          # Test-Dokumentation
└── codebase/
    ├── ARCHITECTURE.md
    ├── CONCERNS.md
    ├── CONVENTIONS.md
    ├── DATABASE.md
    ├── INTEGRATIONS.md
    ├── STACK.md
    └── TESTING.md
```

---

*Generiert am 2026-01-10 mit Claude Code*
