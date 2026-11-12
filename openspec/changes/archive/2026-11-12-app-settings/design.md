# Design

## Context

- **Ausgangslage nach `opening-snap-points`** (Formatversion 8):
  - Räume haben `wallThicknessCm` und `color`.
  - Öffnungen sind Tür, Fenster oder Durchgang. Es gibt Rastpunkte.
- **Fest eingebaute Werte**:

  | Wert | Ort |
  | --- | --- |
  | `DEFAULT_WALL_THICKNESS_CM = 15` | `room-geometry.ts`, beim Raum aus dem Zeichen-Entwurf |
  | `color: null` für neue Räume | `app-store.ts` |
  | `WALL_COLOR = "#3F3F46"` | `RoomsLayer` |
  | `GRID_STEP_CM = 100` | `grid.ts` → `GridLayer` |
  | `SNAP_STEP_CM = 5`, `FINE_SNAP_STEP_CM = 1` über `snapStepCm(alt)` | `ShapeNode`, `SelectionTransformer`, `RoomsLayer`, `OpeningsLayer` |
  | `DEFAULT_DOOR_WIDTH_CM`, `DEFAULT_WINDOW_WIDTH_CM`, `DEFAULT_PASSAGE_WIDTH_CM` über `defaultOpeningWidthCm(kind)` | `opening-placement.ts` |

- **Vorbild für den Dialog**: `FloorsDialog` (shadcn `Dialog`, jede Änderung wirkt sofort und ist ein Schritt, Rückgängig auch nach dem Schließen). Felder: `NumberField`/`useCommitField`, Farben: `ColorField` und die Farbfelder aus `room-color`.
- **Verlauf**: `history.ts` setzt nach Rückgängig/Wiederholen immer die Auswahl aus `resolveHistoryFocus` und schaltet auf „Auswählen“. Ändert sich keine Etage, ist der Fokus heute „nichts ausgewählt“.
- **Entscheidung des Nutzers**: Die Einstellungen gehören zum Plan und kommen mit in die Exportdatei. `docs/design/README.md` sagt bisher „Einstellungen im Browser“; das gilt künftig nur für Ansichts- und Bedienzustände (`raumplaner.ui.*`).

## Goals / Non-Goals

**Goals:**
- Eine Quelle für alle Standardwerte: `plan.settings`, mit Werkseinstellungen als Konstante. Die Logik in `src/lib/` bekommt Werte als Parameter und liest keinen Store.
- Ältere Pläne verhalten sich nach der Migration genau wie vorher.

**Non-Goals:**
- Kein Speicher für Einstellungen außerhalb des Plans.
- Keine rückwirkende Änderung vorhandener Räume oder Öffnungen.

## Decisions

### 1. Datenmodell und Formatversion 9: `src/lib/plan-settings.ts`

```ts
PlanSettingsSchema = z.object({
  defaultWallThicknessCm: z.number().positive().max(MAX_WALL_THICKNESS_CM),   // 100
  wallColor: HexColorSchema,
  defaultRoomColor: HexColorSchema.nullable(),
  gridStepCm: z.number().min(10).max(1000),
  snapStepCm: z.number().min(0.1).max(100),
  fineSnapStepCm: z.number().min(0.1),
  doorWidthCm: z.number().positive().max(1000),
  windowWidthCm: z.number().positive().max(1000),
  passageWidthCm: z.number().positive().max(1000),
}).refine(s => s.fineSnapStepCm <= s.snapStepCm, { path: ["fineSnapStepCm"] })

FACTORY_SETTINGS = { 15, "#3F3F46", null, 100, 5, 1, 80, 120, 100 }   // eingefroren
PlanSchema: settings: PlanSettingsSchema
```

- **Auswirkung auf `schemaVersion`**: 8 → 9. `PLAN_MIGRATIONS[8]` setzt `settings: { ...FACTORY_SETTINGS }`, falls das Feld fehlt.
  - Die Migration nimmt eine Kopie der Werte zur Zeit von Version 9 und nicht die Konstante. So verändert eine spätere Änderung der Werkseinstellungen alte Migrationen nicht.
- `createEmptyPlan` setzt `settings: { ...FACTORY_SETTINGS }`.
- Die bisherigen Konstanten (`DEFAULT_WALL_THICKNESS_CM`, `SNAP_STEP_CM`, …) bleiben als Werte von `FACTORY_SETTINGS` erhalten oder werden durch Verweise darauf ersetzt.
- **Alternative**: Einstellungen nur im Browser (`raumplaner.settings`). Vom Nutzer verworfen: Sie sollen mit dem Plan exportiert werden.
- **Alternative**: Einstellungen je Etage. Verworfen: Es gibt ein Haus und einen Satz Standardwerte.

### 2. Plan-Operationen

- `updateSettings(plan, patch, now)`: Merge, Prüfung mit `PlanSettingsSchema`, bei Fehler oder ohne Änderung das gleiche Objekt. Sonst neues `settings`-Objekt und `updatedAt`.
- `resetSettings(plan, now)` = `updateSettings(plan, FACTORY_SETTINGS, now)`. Das ist ein Schritt. `settingsAreFactory(settings)` sperrt die Schaltfläche.
- Store-Aktionen `updateSettings(patch)`, `resetSettings()` mit `boolean`-Rückgabe wie bei anderen Aktionen.

### 3. Wirkung im Code

- **Neue Räume**: Die Stelle in `app-store.ts`, an der ein gezeichneter Raum entsteht, nimmt `settings.defaultWallThicknessCm` und `settings.defaultRoomColor`.
- **Neue Öffnungen**: `defaultOpeningWidthCm(kind, settings)` bzw. `createOpening(..., widthCm)`. `insertOpening` und die Hover-Markierung aus `opening-snap-points` übergeben die Breite aus den Einstellungen.
- **Fangschritt**: `snapStepCm(alt, settings)` liefert `alt ? settings.fineSnapStepCm : settings.snapStepCm`. Alle vier Aufrufer lesen `settings` aus dem Store (Selektor `selectSettings`).
- **Raster**: `GridLayer` übergibt `settings.gridStepCm` an `gridLines(visible, stepCm)`. Die kräftigere Linie bei 0 cm bleibt.
  - Bei sehr kleinem Abstand und kleinem Zoom würden zu viele Linien entstehen. `GridLayer` blendet deshalb Linien aus, die näher als 4 Bildschirmpixel beieinander lägen, und zeigt dann jede 2., 5., 10. … Linie (siehe Risiken).
- **Wandfarbe**: `RoomsLayer` füllt die Bänder mit `settings.wallColor`.

### 4. Specs mit festen Werten

- Die bestehenden Anforderungen nennen konkrete Zahlen, z. B. „Tür ist 80 cm breit“, „5-cm-Schritte“, „Raster alle 100 cm“, „15 cm Wanddicke“. Statt alle diese Anforderungen zu ändern, legt `app-settings` → „Werkseinstellungen“ fest, dass diese Zahlen Werkseinstellungen sind und ein eingestellter Wert an ihre Stelle tritt.
  - Die Szenarien der anderen Specs bleiben damit richtig, denn sie gelten bei Werkseinstellungen.
  - Das hält diesen Change klein und vermeidet 8 bis 10 MODIFIED-Blöcke über 5 Capabilities.
- **Alternative**: jede betroffene Anforderung ändern („Standardbreite aus den Einstellungen, ab Werk 80 cm“). Verworfen wegen Umfang und Konfliktgefahr mit den vorangehenden Changes. Kann beim Archivieren nachgezogen werden, wenn gewünscht.

### 5. Dialog `SettingsDialog`

- `HeaderBar`: Icon-Schaltfläche (lucide `Settings`, `aria-label`/`title` „Einstellungen“) ganz rechts nach „Exportieren“, innerhalb des Blocks, der im Kalibrier-Modus ausgeblendet ist.
- `Dialog` wie `FloorsDialog` (Breite ca. 440 px, Titel „Einstellungen“):
  - **Wände**: `NumberField` „Wanddicke neuer Räume“ (cm), Farbe „Wandfarbe“ (`ColorField`)
  - **Räume**: „Farbe neuer Räume“ mit den Farbfeldern aus `room-colors.ts` (inkl. „Standard“) und `ColorField`
  - **Raster und Fangen**: „Rasterabstand“, „Fangschritt“, „Feiner Fangschritt (Alt)“ (cm)
  - **Öffnungen**: „Tür“, „Fenster“, „Durchgang“ (cm)
  - **Fuß**: „Auf Werkseinstellungen zurücksetzen“ (links, `variant="outline"`), „Schließen“ (rechts)
- **Feldlogik** `src/lib/settings-fields.ts`: `applySettingsNumberField(settings, key, text)` → `{ ok, patch } | { ok: false, error }`.
  - `parseDecimal` und Rundung auf 0,1 cm
  - Grenzen je Schlüssel aus einer Tabelle, Hinweise:
    - „Muss zwischen 10 cm und 1 000 cm liegen“ (Rasterabstand), „Muss zwischen 0,1 cm und 100 cm liegen“ (Fangschritt)
    - „Muss größer als 0 cm sein“, „Darf höchstens 100 cm sein“ (Wanddicke), „Darf höchstens 1 000 cm sein“ (Breiten)
    - feiner Fangschritt: „Darf höchstens 5 cm sein“ (aktueller Fangschritt), „Muss mindestens 0,1 cm sein“
  - Senkt der Nutzer den Fangschritt unter den feinen Fangschritt, wird das abgelehnt: „Muss mindestens 1 cm sein (feiner Fangschritt)“. Er senkt dann zuerst den feinen Schritt.

### 6. Verlauf

- `resolveHistoryFocus` bekommt einen weiteren Fall: Hat sich keine Etage geändert, aber `settings`, lautet das Ergebnis `{ keep: true }`.
- `history.ts` lässt dann `activeFloorId`, die drei Auswahl-Felder und `activeTool` unverändert. Das erfüllt „Einstellungen als Schritte“.
- Ändern sich in einem Schritt Etagen und Einstellungen (nur beim Import), gilt die bisherige Regel.

### 7. Import

- `readSettings(raw)` in `plan-import.ts`:
  - Fehlt `settings` (nur bei v9-Dateien möglich, ältere werden migriert), gelten ohne Hinweis die Werkseinstellungen.
  - Sonst wird jeder Schlüssel einzeln mit seinem Teilschema geprüft. Ungültige oder fehlende Werte nehmen die Werkseinstellung und erzeugen einen Eintrag in `settingsIssues: { label }[]`. Ist danach die Regel „fein ≤ Fangschritt“ verletzt, wird der feine Schritt auf die Werkseinstellung bzw. auf den Fangschritt gesetzt und gemeldet.
- Der Dialog zeigt „Einstellung „Rasterabstand“: ungültig, Werkseinstellung verwendet“. `hasWarnings` berücksichtigt das.
- Die deutschen Namen der Schlüssel liegen in einer Tabelle in `plan-settings.ts` (`SETTING_LABELS`) und werden von Dialog und Import genutzt.

## Risks / Trade-offs

- [Ein kleiner Rasterabstand (10 cm) bei kleinem Zoom erzeugt sehr viele Linien] → `GridLayer` dünnt auf mindestens 4 Bildschirmpixel Abstand aus (nur Darstellung). Ein Test von `gridLines` mit ausgedünntem Schritt sichert das.
- [Importieren ersetzt die eigenen Einstellungen mit denen der Datei] → Das ist so gewollt, weil sie zum Plan gehören. Der Import ist wie bisher ein Rückgängig-Schritt.
- [Werkseinstellungen als Querverweis statt geänderter Einzel-Anforderungen] → Wer eine Anforderung mit fester Zahl liest, muss `app-settings` kennen. Die Zeilen in `docs/design/README.md` nennen deshalb „Werkseinstellung“ bei jeder Zahl.
- [Formatversion 9 ist für ältere App-Stände unlesbar] → wie bei jeder Erhöhung.

## Migration Plan

- `PLAN_MIGRATIONS[8]` ergänzt die Werkseinstellungen beim Start und beim Import.
- Fixture `__fixtures__/plan-v8.json` (eingefärbte Räume, Durchgang, Wanddicken) wird eingefroren.
- Zurückrollen: Ein v8-Stand liest v9 nicht. Ohne `settings` und mit Version 8 lässt sich eine Exportdatei von Hand zurückführen.
