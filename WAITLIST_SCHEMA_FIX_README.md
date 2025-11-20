# 🔧 Waitlist & Upcoming Slots Schema Fix

## Problem

Nach der Datenbank-Migration gab es Schema-Inkonsistenzen zwischen den Tabellen `waitlist_slots` und `upcoming_slots`, die dazu führten, dass die Daten nicht korrekt geladen wurden. Außerdem versuchte der Code, auf Views zuzugreifen, die nicht mehr existierten.

## Gelöste Probleme

### 1. ❌ Falsches Schema in upcoming_slots

**Problem:**
- Die ursprüngliche Migration verwendete `share_paid` für beide Tabellen
- `upcoming_slots` sollte aber `share_personal_data` verwenden (nicht `share_paid`)

**Lösung:**
- Neue Migration erstellt: `database/migrations/fix_waitlist_slots_schema.sql`
- `upcoming_slots` verwendet jetzt `share_personal_data`
- View `upcoming_waitlist_view` aliasiert `share_personal_data AS share_paid` für Frontend-Konsistenz

### 2. ❌ toggleSharePaid Funktion Update-Fehler

**Problem:**
- Die Funktion versuchte, `share_paid` in beiden Tabellen zu aktualisieren
- `upcoming_slots` hat aber `share_personal_data`

**Lösung:**
- Funktion verwendet jetzt das richtige Feld basierend auf der Tabelle:
  - **waitlist_slots**: `share_paid`
  - **upcoming_slots**: `share_personal_data`

### 3. ❌ Views existieren nicht mehr

**Problem:**
- Code versuchte auf `active_waitlist_view` und `upcoming_waitlist_view` zuzugreifen
- Diese Views existieren nicht (mehr) in der Datenbank
- Fehler: "relation 'active_waitlist_view' does not exist"

**Lösung:**
- Kompletter Wechsel von Views zu direkten Tabellen-Queries
- Verwendet Supabase Joins: `.select('*, artist:artists(*), location:locations(*)')`
- `loadWaitlistSlots()` nutzt jetzt direkte Queries auf `waitlist_slots` und `upcoming_slots`
- Bessere Performance und Flexibilität durch direkte Tabellen-Zugriffe

### 4. ❌ Fehlendes detailliertes Error Logging

**Problem:**
- Fehler waren schwer zu debuggen, da Details fehlten

**Lösung:**
- Detailliertes Error Logging in allen CRUD-Funktionen:
  - `loadWaitlistSlots()`
  - `handleAddSlot()`
  - `deleteWaitlistSlot()`
  - `toggleSharePaid()`
- Logging enthält: Tabelle, Felder, Error Message, Details, Hint, Code

---

## Korrektes Schema

### ✅ waitlist_slots Tabelle

```sql
CREATE TABLE waitlist_slots (
  id UUID PRIMARY KEY,
  artist_id UUID NOT NULL,
  location_id UUID NOT NULL,
  slot_number INTEGER NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'active',
  share_paid BOOLEAN DEFAULT false,  -- ✅ RICHTIG
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,

  -- ❌ KEINE date_from Spalte
  -- ❌ KEINE date_to Spalte

  UNIQUE(slot_number, location_id)
);
```

**Zweck:** Artists die JETZT verfügbar sind (ohne festes Datum)

### ✅ upcoming_slots Tabelle

```sql
CREATE TABLE upcoming_slots (
  id UUID PRIMARY KEY,
  artist_id UUID NOT NULL,
  location_id UUID NOT NULL,
  slot_number INTEGER NOT NULL,
  date_from DATE NOT NULL,              -- ✅ RICHTIG
  date_to DATE NOT NULL,                -- ✅ RICHTIG
  notes TEXT,
  status TEXT DEFAULT 'upcoming',
  share_personal_data BOOLEAN DEFAULT false,  -- ✅ RICHTIG (nicht share_paid!)
  display_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,

  UNIQUE(slot_number, location_id),
  CHECK (date_to >= date_from)
);
```

**Zweck:** Artists mit FESTEN Terminen

---

## Neue Query-Struktur (Keine Views mehr!)

### Direkte Tabellen-Queries mit Supabase Joins

Statt Views zu verwenden, nutzen wir jetzt direkte Tabellen-Queries mit Supabase-Joins:

**❌ ALTE Methode (mit Views):**
```javascript
await supabase
  .from('active_waitlist_view')  // ❌ View existiert nicht mehr
  .select('*')
```

**✅ NEUE Methode (direkte Tabelle mit Joins):**
```javascript
// Waitlist Query
await supabase
  .from('waitlist_slots')  // ✅ Direkte Tabelle
  .select(`
    id,
    artist_id,
    location_id,
    slot_number,
    notes,
    status,
    share_paid,
    artist:artists(id, name, email, instagram, image_url, style, is_guest),
    location:locations(id, name, city)
  `)
  .in('status', ['waiting', 'active'])
  .order('slot_number', { ascending: true });

// Upcoming Query
await supabase
  .from('upcoming_slots')  // ✅ Direkte Tabelle
  .select(`
    id,
    artist_id,
    location_id,
    slot_number,
    date_from,
    date_to,
    notes,
    status,
    share_personal_data,
    artist:artists(id, name, email, instagram, image_url, style, is_guest),
    location:locations(id, name, city)
  `)
  .gte('date_from', today)
  .order('date_from', { ascending: true });
```

### Vorteile der neuen Methode:

1. **Keine View-Abhängigkeiten** - Direkter Zugriff auf Tabellen
2. **Bessere Performance** - Supabase optimiert Joins automatisch
3. **Mehr Flexibilität** - Einfacher anzupassen ohne Migration
4. **Weniger Maintenance** - Keine separaten View-Definitionen pflegen
5. **Besseres Debugging** - Klare Fehler bei fehlenden Feldern

---

## Migration durchführen

### Option 1: Supabase SQL Editor (Empfohlen)

1. Öffne Supabase Dashboard
2. Gehe zu **SQL Editor**
3. Öffne die Datei: `database/migrations/fix_waitlist_slots_schema.sql`
4. Kopiere den gesamten Inhalt
5. Füge ihn in den SQL Editor ein
6. Klicke auf **Run**

⚠️ **WICHTIG:** Diese Migration löscht die Tabelle `upcoming_slots` und erstellt sie neu!
Wenn Daten in `upcoming_slots` vorhanden sind, erstelle zuerst ein Backup:

```sql
-- Backup erstellen
CREATE TABLE upcoming_slots_backup AS SELECT * FROM upcoming_slots;
```

### Option 2: psql CLI

```bash
psql -h your-db-host \
     -U postgres \
     -d your-database \
     -f database/migrations/fix_waitlist_slots_schema.sql
```

---

## Verification

Nach der Migration überprüfe das Schema:

```sql
-- 1. Prüfe waitlist_slots Spalten (sollte KEINE date_from/date_to haben)
\d waitlist_slots

-- 2. Prüfe upcoming_slots Spalten (sollte date_from, date_to, share_personal_data haben)
\d upcoming_slots

-- 3. Prüfe dass Views NICHT mehr existieren
\dv  -- Sollte KEINE active_waitlist_view oder upcoming_waitlist_view zeigen

-- 4. Teste direkte Tabellen-Queries
SELECT * FROM waitlist_slots LIMIT 1;
SELECT * FROM upcoming_slots LIMIT 1;

-- 5. Teste Supabase Join-Query (wie im Frontend verwendet)
-- Dies würde im Frontend so aussehen:
-- .from('waitlist_slots').select('*, artist:artists(*), location:locations(*)')
```

---

## Geänderte Funktionen

### 1. loadWaitlistSlots()

**Vorher:**
```javascript
// Verwendete Views
const viewName = currentListType === 'waitlist'
  ? 'active_waitlist_view'  // ❌ View existiert nicht mehr
  : 'upcoming_waitlist_view';

const { data, error } = await supabase
  .from(viewName)
  .select('*');
```

**Nachher:**
```javascript
// Verwendet direkte Tabellen mit Joins
const tableName = currentListType === 'waitlist'
  ? 'waitlist_slots'
  : 'upcoming_slots';

// Conditional select based on table (waitlist has NO dates, upcoming has dates)
let selectQuery;
if (currentListType === 'waitlist') {
  selectQuery = `
    id, artist_id, location_id, slot_number, notes, status,
    share_paid,  // ✅ waitlist_slots field
    artist:artists(id, name, email, instagram, image_url, style, is_guest),
    location:locations(id, name, city)
  `;
} else {
  selectQuery = `
    id, artist_id, location_id, slot_number,
    date_from, date_to,  // ✅ upcoming_slots fields
    notes, status,
    share_personal_data,  // ✅ upcoming_slots field
    artist:artists(id, name, email, instagram, image_url, style, is_guest),
    location:locations(id, name, city)
  `;
}

const { data, error } = await supabase
  .from(tableName)
  .select(selectQuery);

// Transform data to flatten nested objects
waitlistSlots = data.map(slot => ({
  ...slot,
  artist_name: slot.artist?.name,
  location_name: slot.location?.name,
  // Map share_personal_data to share_paid for consistency
  share_paid: currentListType === 'upcoming'
    ? slot.share_personal_data
    : slot.share_paid
}));
```

### 2. toggleSharePaid()

**Vorher:**
```javascript
const { error } = await supabase
  .from(tableName)
  .update({ share_paid: newStatus })  // ❌ Falsch für upcoming_slots
  .eq('id', slotId);
```

**Nachher:**
```javascript
// Richtige Feld-Zuordnung
const fieldName = currentListType === 'waitlist'
  ? 'share_paid'           // ✅ für waitlist_slots
  : 'share_personal_data';  // ✅ für upcoming_slots

const updateData = { [fieldName]: newStatus };

const { error } = await supabase
  .from(tableName)
  .update(updateData)
  .eq('id', slotId);
```

### 2. loadWaitlistSlots()

**Verbessert:**
- Detailliertes Error Logging
- Zeigt View-Name und Location Filter
- Loggt Struktur des ersten Slots
- Zeigt Empty State bei Fehler

### 3. handleAddSlot()

**Verbessert:**
- Detailliertes Error Logging
- Spezifische Fehlermeldungen:
  - `23505`: "Slot number already taken"
  - Date-Fehler: "Invalid date values"
- Loggt vollständige slotData

### 4. deleteWaitlistSlot()

**Verbessert:**
- Detailliertes Error Logging
- Zeigt Tabelle und Slot-ID

---

## Error Logging Format

Alle Funktionen loggen jetzt Fehler im folgenden Format:

```javascript
console.error('❌ Database Error:', {
  table: 'waitlist_slots',
  field: 'share_paid',
  slotId: 'abc-123',
  error: 'column "share_paid" does not exist',
  details: 'The column share_paid is missing in table upcoming_slots',
  hint: 'Use share_personal_data instead',
  code: '42703'
});
```

---

## Testing Checklist

Nach der Migration und Code-Änderungen teste:

### Waitlist (ohne Datum)

- [ ] Waitlist Slots laden ohne Fehler
- [ ] Waitlist Slot erstellen (OHNE date_from/date_to Felder)
- [ ] Slot löschen
- [ ] Share Paid Toggle (update `share_paid` Feld)
- [ ] Keine date_from/date_to Fehler in Console
- [ ] UI zeigt "🕒 Jetzt verfügbar" Badge
- [ ] UI zeigt KEINE Datums-Felder

### Upcoming (mit Datum)

- [ ] Upcoming Slots laden ohne Fehler
- [ ] Upcoming Slot erstellen (MIT date_from/date_to Felder - PFLICHT)
- [ ] Slot löschen
- [ ] Share Paid Toggle (update `share_personal_data` Feld)
- [ ] UI zeigt Start Date und End Date
- [ ] UI zeigt "📅 Starts in X days" oder "🎨 Active (X days left)"
- [ ] Datums-Validierung funktioniert (End Date >= Start Date)

### Error Handling

- [ ] Browser Console zeigt detaillierte Error Logs
- [ ] Error Messages enthalten Tabelle, Feld, Details
- [ ] Spezifische Fehlermeldungen für bekannte Fehler (z.B. duplicate slot_number)

---

## Dateien geändert

### Neu erstellt:
- `database/migrations/fix_waitlist_slots_schema.sql` - Korrigierte Datenbank-Migration
- `WAITLIST_SCHEMA_FIX_README.md` - Diese Datei

### Geändert:
- `management-system.html`
  - `toggleSharePaid()` - Zeilen ~22522-22567
  - `loadWaitlistSlots()` - Zeilen ~21725-21795
  - `handleAddSlot()` - Zeilen ~22486-22533
  - `deleteWaitlistSlot()` - Zeilen ~22514-22554

---

## Wichtige Unterschiede

| Feature | waitlist_slots | upcoming_slots |
|---------|---------------|----------------|
| **Datums-Felder** | ❌ KEINE | ✅ date_from, date_to (NOT NULL) |
| **Share-Feld** | ✅ share_paid | ✅ share_personal_data |
| **Zweck** | Artists JETZT verfügbar | Artists mit FESTEN Terminen |
| **UI Badge** | 🕒 Jetzt verfügbar | 📅 Starts in X days / 🎨 Active |
| **Sortierung** | slot_number | date_from |
| **View** | active_waitlist_view | upcoming_waitlist_view |

---

## Troubleshooting

### Problem: "column 'share_paid' does not exist in upcoming_slots"

**Lösung:** Migration noch nicht durchgeführt oder Frontend-Code nicht aktualisiert
```bash
# 1. Migration durchführen
# 2. Cache leeren
# 3. Seite neu laden
```

### Problem: "column 'date_from' does not exist in waitlist_slots"

**Lösung:** Code versucht date_from in waitlist_slots zu verwenden
```javascript
// ❌ Falsch
if (slot.date_from) { ... }  // Für waitlist

// ✅ Richtig
if (currentListType === 'upcoming' && slot.date_from) { ... }
```

### Problem: Toggle Share Paid funktioniert nicht

**Lösung:**
1. Prüfe Browser Console auf Error Details
2. Stelle sicher, dass Migration durchgeführt wurde
3. Prüfe ob `toggleSharePaid()` das richtige Feld verwendet:
   ```javascript
   // In Console:
   console.log('Field name:', fieldName);  // Sollte 'share_personal_data' für upcoming sein
   ```

### Problem: Keine Daten sichtbar nach Migration

**Lösung:**
1. Prüfe ob Views existieren:
   ```sql
   SELECT * FROM active_waitlist_view;
   SELECT * FROM upcoming_waitlist_view;
   ```
2. Prüfe RLS Policies:
   ```sql
   SELECT * FROM pg_policies WHERE tablename IN ('waitlist_slots', 'upcoming_slots');
   ```
3. Prüfe Browser Console auf detaillierte Error Logs

---

## Zusammenfassung

✅ **Alle Änderungen implementiert:**
1. Korrigierte Migration erstellt
2. **Views komplett entfernt** - Verwendet jetzt direkte Tabellen-Queries
3. loadWaitlistSlots() nutzt Supabase Joins statt Views
4. toggleSharePaid() verwendet jetzt richtige Felder
5. Detailliertes Error Logging in allen CRUD-Funktionen
6. Schema-Dokumentation aktualisiert

✅ **Nächste Schritte:**
1. Migration in Supabase durchführen
2. Frontend neu laden
3. Testing Checklist durchgehen
4. Browser Console auf Fehler prüfen

---

**Version:** 1.1
**Datum:** 2025-01-20
**Status:** Ready for deployment
