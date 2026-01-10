# Auth Hardening Integration Guide

> **Version:** 1.0.0
> **Erstellt:** 2026-01-10
> **Status:** Bereit zur Integration

---

## Übersicht

Die Datei `auth-hardening.js` enthält:

1. **Rate Limiting** - Max 5 Login-Versuche pro Minute, 5 Min Sperre
2. **Session Expiry** - 24h Timeout mit Activity-Based Refresh
3. **Auto-Logout** - Bei abgelaufener Session

---

## Schritt 1: Script einbinden

In `management-system.html`, füge diese Zeile **VOR** dem Haupt-Script ein:

```html
<!-- Auth Hardening (Rate Limiting + Session Expiry) -->
<script src="https://raw.githubusercontent.com/MIS-CTO/script.js/main/auth-hardening.js"></script>
```

**Oder** direkt von GitHub Pages (falls eingerichtet):
```html
<script src="auth-hardening.js"></script>
```

---

## Schritt 2: handleLogin anpassen

In der `handleLogin` Funktion (Zeilen 21579-21761 und 38761-38895):

### Am Anfang der Funktion hinzufügen:

```javascript
async handleLogin(e) {
  e.preventDefault();
  
  // === RATE LIMITING CHECK ===
  const rateCheck = checkLoginRateLimit();
  if (!rateCheck.allowed) {
    showNotification(rateCheck.message, 'error');
    return;
  }
  // === END RATE LIMITING CHECK ===
  
  // ... rest of existing code ...
```

### Nach erfolgreichem Login (vor showNotification "Willkommen"):

```javascript
// === AUTH HARDENING: Record success + Save session ===
recordLoginAttempt(true);
saveSession(fullProfile);
// === END AUTH HARDENING ===

showNotification(`Willkommen zurück, ${fullProfile.username}!`, 'success');
```

### Nach fehlgeschlagenem Login (in catch oder error handling):

```javascript
// === AUTH HARDENING: Record failure ===
recordLoginAttempt(false);
// === END AUTH HARDENING ===

showNotification('Passwort oder Benutzername falsch', 'error');
```

---

## Schritt 3: Session Check bei App-Start

In der `DOMContentLoaded` oder `init` Funktion, am Anfang:

```javascript
// === SESSION EXPIRY CHECK ===
if (!checkSessionOnLoad()) {
  // Session abgelaufen, Login-Screen zeigen
  showLoginModal();  // oder entsprechende Funktion
  return;
}
// === END SESSION CHECK ===
```

---

## Schritt 4: Logout anpassen

In der Logout-Funktion:

```javascript
function logout() {
  // === CLEAR AUTH HARDENING SESSION ===
  clearSession();
  // === END CLEAR ===
  
  // ... rest of existing logout code ...
}
```

---

## API Referenz

### Rate Limiting

```javascript
// Vor Login-Versuch prüfen
const result = checkLoginRateLimit();
if (!result.allowed) {
  console.log(result.message);  // "Zu viele Versuche..."
  console.log(result.remainingSeconds);  // 245
}

// Nach Login-Versuch aufrufen
recordLoginAttempt(true);   // Erfolg
recordLoginAttempt(false);  // Fehlschlag
```

### Session Management

```javascript
// Session speichern (nach Login)
saveSession(userData);

// Session prüfen
const valid = isSessionValid();  // true/false

// Session löschen (bei Logout)
clearSession();

// Bei App-Start prüfen
if (!checkSessionOnLoad()) {
  // Zum Login redirecten
}

// Manuell verlängern
refreshSessionOnActivity();
```

---

## Konfiguration

Die Standardwerte können in `auth-hardening.js` angepasst werden:

```javascript
const RATE_LIMIT_CONFIG = {
  maxAttempts: 5,       // Anzahl Versuche
  windowMs: 60000,      // Zeitfenster (1 Minute)
  lockoutMs: 300000     // Sperrzeit (5 Minuten)
};

const SESSION_CONFIG = {
  expiryMs: 24 * 60 * 60 * 1000,  // 24 Stunden
  refreshThrottleMs: 60000         // Max 1x pro Minute refreshen
};
```

---

## Debugging

```javascript
// Alle Auth Hardening Funktionen
console.log(window.AuthHardening);

// Login Attempts prüfen
console.log(localStorage.getItem('_loginAttempts'));

// Session Meta prüfen
console.log(localStorage.getItem('_sessionMeta'));

// Reset Rate Limiting (für Tests)
localStorage.removeItem('_loginAttempts');

// Reset Session (für Tests)
localStorage.removeItem('_sessionMeta');
```

---

*Erstellt am 2026-01-10 mit Claude Code*
