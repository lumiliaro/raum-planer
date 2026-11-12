# Design

## Context

- Ausgangslage: `useAppStore` (`src/store/app-store.ts`) hält nur UI-Zustand: `activeFloorId`, `viewports` (nur Sitzung) und `propertiesPanelOpen` (über `src/lib/ui-prefs.ts` im `localStorage` unter `raumplaner.ui.*`). `createAppStore(storage)` bekommt den Speicher übergeben, Tests nutzen `memoryStorage()`/`throwingStorage()` aus `src/test/memory-storage.ts`.
- `activeFloorId` wird von `FloorSwitcher`, `FloorCanvas`, `StatusBar` und dem Kalibrier-Code gelesen.
- `FloorId`/`FLOOR_IDS` stehen in `src/config/house.ts`.
- Zod 4.6 und Zustand 5 sind installiert. Geprüft: In Zod 4 bleiben Objekte mit `.refine()` in `z.discriminatedUnion` verwendbar, `z.record(z.enum(FLOOR_IDS), …)` verlangt alle drei Etagen und lehnt fremde Schlüssel ab, `z.number()` lehnt `Infinity`/`NaN` ab.
- `floor-calibration` ist umgesetzt: `src/lib/calibration-schema.ts` (`CalibrationSchema`, Typen `Calibration`/`ImagePoint`), `src/lib/calibration-storage.ts` (`readCalibrations`/`writeCalibrations`, Schlüssel `raumplaner.calibration`, Wert `{ version: 1, byFloor }`), im Store `calibrations` (beim Start geladen) und `calibrationDraft` (mit `saveFailed`) sowie `saveCalibration()`, das direkt in den eigenen Schlüssel schreibt. `AppShell` ist eine Spalte mit `CalibrationBanner` unter der Kopfleiste. `StatusBar` liest `calibrations[activeFloorId]`.
- Entscheidung des Nutzers: Die Kalibrierung ist Teil des Plans (`calibrationByFloor`), wird mit ihm gespeichert und später exportiert; der eigene Schlüssel war nur eine Zwischenlösung bis zu diesem Change.
- Anforderungen: siehe `specs/plan-data`, `specs/plan-persistence`, `specs/floor-plan-view`.

## Goals / Non-Goals

**Goals:**
- Ein Zod-Schema als einzige Quelle für Plan- und Form-Typen, das später unverändert vom Import genutzt wird.
- Alle Plan-Änderungen als reine, getestete Funktionen in `src/lib/`; der Store ruft sie nur auf.
- Speicherformat im Browser = späteres Exportformat (reines Plan-JSON einschließlich Kalibrierung), damit Export/Import nichts Neues erfinden müssen.
- Eine einzige Quelle für den Maßstab einer Etage: `plan.calibrationByFloor`.

**Non-Goals:**
- Kein Undo/Redo, aber die Struktur soll es nicht verbauen (Plan als eigenes, unveränderlich ersetztes Objekt im Store, sodass zundo später nur `plan` verfolgen kann).
- Keine Geometrie-Berechnung und keine Darstellung von Formen.

## Decisions

### 1. Module

| Datei | Inhalt |
| --- | --- |
| `src/lib/plan-schema.ts` | `PLAN_SCHEMA_VERSION = 1`, Zod-Schemas `ShapeStyleSchema`, je Formtyp ein Schema, `ShapeSchema` (diskriminierte Union über `kind`), `PlanSchema` (nutzt `CalibrationSchema` aus `calibration-schema.ts`); abgeleitete Typen `Plan`, `Shape`, `ShapeKind`, `ShapeStyle`, `PointCm` per `z.infer`. |
| `src/lib/plan.ts` | Reine Funktionen: `createEmptyPlan(now)`, `addShape`, `updateShape`, `removeShape`, `reorderShape`, `setActiveFloor`, `setCalibration`. |
| `src/lib/plan-storage.ts` | `PLAN_STORAGE_KEY = "raumplaner.plan"`, `PLAN_BACKUP_KEY = "raumplaner.plan.backup"`, `loadPlan(storage, now)` (inkl. Übernahme der bisherigen Kalibrierung), `savePlan(storage, plan)`. |
| `src/lib/calibration-storage.ts` | Wird auf `LEGACY_CALIBRATION_KEY = "raumplaner.calibration"`, `readLegacyCalibrations(storage)` (bisheriges `readCalibrations`) und `removeLegacyCalibrations(storage)` reduziert; `writeCalibrations` entfällt. |
| `src/store/plan-autosave.ts` | `startPlanAutosave(store, storage, { delayMs })` → `{ flush, stop }`. |
| `src/components/layout/PlanRecoveryBanner.tsx` | Hinweisleiste. |

Alle `src/lib/`-Module ohne React/Konva; `now` wird als `Date` übergeben, damit Tests feste Zeitpunkte nutzen.

### 2. Datenmodell und `schemaVersion`

Das Format ist die erste Fassung: **`schemaVersion` 1**. Es folgt dem verbindlichen Datenmodell aus der Projektkonfiguration; folgende Festlegungen werden mit Version 1 Teil des Formats (eine spätere Änderung daran erhöht `schemaVersion`):

- **Flache Formfelder**: Die Maße liegen direkt auf der Form (`{ id, kind: "rect", x, y, …, widthCm, depthCm, cornerRadiusCm }`), nicht in einem verschachtelten `geometry`-Objekt. Grund: TypeScript verengt den Typ direkt über `kind`, Änderungen sind ein einfaches Zusammenführen von Feldern. Alternative verschachtelt: zusätzliche Ebene bei jedem Zugriff und jedem Formular, kein Gewinn.
- **Plan-Felder**: `schemaVersion: 1` (Literal), `name` (nicht leer), `createdAt`/`updatedAt` als ISO-8601-Zeitstempel (`z.iso.datetime()`), `activeFloorId` aus `FLOOR_IDS`, `calibrationByFloor` als `z.partialRecord(z.enum(FLOOR_IDS), CalibrationSchema)` (Pflichtfeld, darf leer sein; geprüft: unbekannte Etage → ungültig), `shapesByFloor` als vollständiger Record über `FLOOR_IDS`.
- **Kalibrierung** (`CalibrationSchema` aus `floor-calibration`, unverändert übernommen): `p1`, `p2` mit `x`, `y` ≥ 0 (Bildpixel), `realLengthCm` > 0, `pxPerCm` > 0. Fehlt der Eintrag einer Etage, gilt sie als nicht kalibriert. Kein eigenes Feld für „nicht kalibriert“ (`null`), damit es nur eine Darstellung gibt.
- **Gemeinsame Formfelder**: `id` UUID (`z.uuid()`), `x`, `y` in cm (endlich), `rotationDeg` in [0, 360), `mirrored` boolean, `label?` string, `locked?` boolean, `style { fill: "#RRGGBB" | null, stroke: "#RRGGBB", strokeWidth, opacity ∈ [0, 1] }`.
- **`strokeWidth` in Bildschirmpixeln**, unabhängig vom Zoom, Bereich > 0 bis 20. Begründung: Randstärke ist kein Möbelmaß; ein in cm skalierter Rand würde beim Herauszoomen verschwinden. Die spätere Darstellung nutzt dafür `strokeScaleEnabled = false`.
- **Farbformat** `#RRGGBB` (Regex `^#[0-9A-Fa-f]{6}$`): eindeutig, passt zu `<input type="color">`.
- **Messrichtung der Schenkel** (die genaue Lage im Umriss legt `getOutlineCm` später fest): L-Form – Schenkel A verläuft entlang der Breite, seine Stärke `legAWidthCm` wird in Tiefenrichtung gemessen (`< depthCm`); Schenkel B verläuft entlang der Tiefe, Stärke `legBWidthCm` in Breitenrichtung (`< widthCm`). U-Form – `baseWidthCm < depthCm`, `2 · sideWidthCm < widthCm`.
- **Weitere Plausibilität**: `widthCm`, `depthCm` > 0; `0 ≤ cornerRadiusCm ≤ min(widthCm, depthCm) / 2`; Türaufschlag nur `widthCm > 0`; Polygon ≥ 3 Punkte mit endlichen Koordinaten. Nicht geprüft: Selbstüberschneidung des Polygons und ob die Punkte wirklich um den Mittelpunkt liegen – das normalisiert das Polygon-Werkzeug.
- **Kein Obergrenzen-Check** für Maße und Position (das Haus begrenzt das praktisch; ein Limit würde nur Importe unnötig ablehnen).
- Unbekannte Zusatzfelder werden beim Prüfen entfernt (Zod-Standard `strip`), unbekannte `kind`s und Etagen führen zur Ablehnung.

### 3. Reine Plan-Funktionen

- Jede Funktion bekommt einen Plan und liefert einen Plan. **Abgelehnte Änderungen geben dasselbe Objekt zurück** (Referenzgleichheit) – so erkennt der Store „keine Änderung“, ohne zusätzlichen Rückgabewert, und Autosave wird nicht ausgelöst. Der Store-Wrapper gibt `true/false` an den Aufrufer zurück (`next !== prev`).
- `addShape(plan, floorId, shape, now)`: `ShapeSchema.safeParse`, ID-Prüfung über **alle** Etagen, anhängen ans Ende, `updatedAt = now`.
- `updateShape(plan, floorId, id, patch, now)`: `{ ...shape, ...patch, id: shape.id, kind: shape.kind }` und erneut `ShapeSchema.safeParse` – die Laufzeitprüfung ist maßgeblich. Der Patch-Typ ist `ShapePatch = Partial<Omit<Shape, "id" | "kind">>` über die Union verteilt; `style` wird als Ganzes ersetzt (Aufrufer übergeben den vollständigen Stil).
- `removeShape(plan, floorId, id, now)`, `reorderShape(plan, floorId, id, "forward" | "backward" | "front" | "back", now)`: unbekannte ID oder schon am Ziel → gleiches Objekt.
- `setActiveFloor(plan, floorId)`: ändert nur `activeFloorId`, **nicht** `updatedAt` (Etagenwechsel ist keine inhaltliche Änderung, wird aber gespeichert).
- `setCalibration(plan, floorId, calibration, now)`: `CalibrationSchema.safeParse`, ersetzt den Eintrag der Etage, `updatedAt = now`; ungültig → gleiches Objekt. Formen und andere Etagen bleiben unverändert.
- Alternative „Store validiert nicht, nur beim Laden“: verworfen, weil sonst ungültige Daten gespeichert und beim nächsten Start als „unlesbar“ gesichert würden.

### 4. Store

- `AppState` erhält `plan: Plan`, `recoveryNotice: null | "backed-up" | "backup-failed"`, `saveStatus: "saved" | "failed" | "suspended"` und die Aktionen `addShape`, `updateShape`, `removeShape`, `reorderShape` (→ `boolean`), `dismissRecoveryNotice`, interne `setSaveStatus`.
- **`activeFloorId` entfällt** als eigenes Feld; Komponenten lesen `s.plan.activeFloorId`. `setActiveFloor(id)` bleibt als Aktion mit gleichem Namen erhalten und ruft die reine Funktion; das Vorbelegen des Kalibrier-Entwurfs beim Etagenwechsel bleibt.
- **`calibrations` entfällt** ebenso; `StatusBar`, `draftFor` und das Kalibrier-Panel lesen `s.plan.calibrationByFloor[floorId]`. Kein abgeleitetes Duplikat-Feld, damit es keine zwei Wahrheiten gibt.
- **`saveCalibration()`**: berechnet das Ergebnis wie bisher, ruft `setCalibration` und beendet bei Erfolg den Modus (`true`), ohne Ergebnis `false`. Es schreibt nicht mehr selbst in den Speicher – das erledigt der Autosave; ein Fehler zeigt sich im allgemeinen `saveStatus`. `saveFailed` im `CalibrationDraft` und der Hinweis im `CalibrationPanel` entfallen (Entscheidung des Nutzers).
- Signatur: `createAppStore(storage, options?: { now?: () => Date })`. Der Plan wird **synchron bei der Store-Erstellung** über `loadPlan` geladen – dadurch steht die zuletzt aktive Etage schon beim ersten Render fest (kein kurzes Aufblitzen des Erdgeschosses).
- Ein Store bleibt bestehen (Projektvorgabe „ein zentraler Projekt-Store“); `plan` ist ein eigenes Teilobjekt, damit zundo später gezielt nur `plan` verfolgen kann.

### 5. Laden (`loadPlan`)

Ergebnis `{ plan, outcome }` mit `outcome`:

| Situation | `outcome` | Plan | Speichern |
| --- | --- | --- | --- |
| `getItem` wirft (blockiert) oder kein Storage | `"unavailable"` | leer | wird versucht → scheitert → „Nicht gespeichert“ |
| Schlüssel fehlt | `"empty"` | leer bzw. mit übernommener Kalibrierung (siehe unten) | normal |
| JSON + `PlanSchema` gültig | `"restored"` | gespeicherter | normal |
| JSON kaputt, Schema ungültig oder `schemaVersion ≠ 1` | `"backed-up"` | leer | normal; Rohtext liegt unter `PLAN_BACKUP_KEY` |
| wie oben, aber `setItem(PLAN_BACKUP_KEY)` wirft | `"backup-failed"` | leer | ausgesetzt (`saveStatus = "suspended"`) |

- Die Sicherung ist **ein** Schlüssel und wird bei einer erneuten Sicherung überschrieben. Bis dahin hat der Nutzer eine Sitzung lang den Hinweis gesehen; mehrere Zeitstempel-Schlüssel würden den Speicher ohne Aufräum-Oberfläche füllen.
- `schemaVersion ≠ 1` wird vorerst wie unlesbar behandelt; die Migration kommt mit dem Import-Change und kann dann auch hier greifen.
- **Übernahme der bisherigen Kalibrierung** (nur bei `"empty"`): `readLegacyCalibrations(storage)` liefert die gültigen Einträge aus `raumplaner.calibration`. Ist das Ergebnis nicht leer, wird der neue leere Plan mit diesem `calibrationByFloor` erzeugt und sofort mit `savePlan` geschrieben; nur wenn das gelingt, entfernt `removeLegacyCalibrations` den alten Schlüssel. Scheitert das Schreiben, gilt die Kalibrierung für die Sitzung, der alte Schlüssel bleibt, und der nächste Start versucht es erneut. In allen anderen Fällen (`restored`, `backed-up`, `backup-failed`, `unavailable`) wird der alte Schlüssel weder gelesen noch verändert.
- Alternative „bei jedem Start zusammenführen“ verworfen: Vor diesem Change gibt es keinen Plan, die Übernahme betrifft also nur den ersten Start; ein Zusammenführen bräuchte Regeln für Konflikte ohne praktischen Nutzen.

### 6. Autosave

- `startPlanAutosave` abonniert den Store (`store.subscribe`) und reagiert nur, wenn sich die **Referenz** von `state.plan` ändert. Es setzt einen Timer von **300 ms** (Debounce, unter der Spec-Grenze von 1 s); `flush()` speichert sofort, falls etwas aussteht.
- `savePlan` schreibt `JSON.stringify(plan)` und liefert `true/false`; danach `setSaveStatus("saved" | "failed")`. Bei `saveStatus === "suspended"` wird nie geschrieben.
- Gestartet wird es einmal in `main.tsx` mit dem echten `useAppStore`; dort auch `pagehide` und `visibilitychange` (→ `hidden`) → `flush()`. `pagehide` statt `beforeunload`, weil es zuverlässiger feuert und den Back-Forward-Cache nicht blockiert.
- Alternative **Zustands `persist`-Middleware**: verworfen. Sie speichert ein eigenes Hüllformat `{ state, version }`, das vom Exportformat abweicht, und die Anforderungen (Rohdaten sichern, Speichern aussetzen, Zod-Prüfung, Status) müssten über Storage-Adapter und Rehydrierungs-Callbacks nachgebaut werden. Eigener Code ist hier kürzer und testbar.
- Mehrere Tabs: kein Abgleich, der zuletzt speichernde Tab gewinnt (siehe Proposal, „Nicht im Umfang“).

### 7. Oberfläche

- **Hinweisleiste** `PlanRecoveryBanner`: eigene Zeile in der `AppShell`-Spalte zwischen Kopfleiste und Arbeitsbereich (nur gerendert, solange ein Hinweis besteht). Warnfarbe (`text-warning`, heller Warnhintergrund), Icon `TriangleAlert` aus `lucide-react`, Text:
  - `backed-up`: „Der gespeicherte Plan konnte nicht gelesen werden. Es wurde ein leerer Plan begonnen; die alten Daten sind im Browser gesichert.“
  - `backup-failed`: „Der gespeicherte Plan konnte nicht gelesen und nicht gesichert werden. Damit nichts verloren geht, werden Änderungen in dieser Sitzung nicht gespeichert.“
  - Schaltfläche „Schließen“ (Text-Schaltfläche, per Tastatur erreichbar) → `dismissRecoveryNotice()`.
  - Die Kalibrier-Hinweisleiste aus `floor-calibration` nutzt denselben Platz; beide dürfen untereinander stehen. Da `AppShell` seit `floor-calibration` eine Flex-Spalte ist, wird `PlanRecoveryBanner` dort als weitere Zeile eingefügt statt über ein Raster.
- **Statusleiste**: rechts (`ml-auto`) der Speicherstatus.
  - `saved`: Icon `Check` + „Lokal gespeichert“ in `text-success`.
  - `failed`: „Nicht gespeichert“ in `text-warning`, `title` „Der Browser-Speicher ist voll oder blockiert.“
  - `suspended`: „Nicht gespeichert“ in `text-warning`, `title` „Der gespeicherte Plan konnte nicht gesichert werden. Änderungen werden in dieser Sitzung nicht gespeichert.“
  - Tooltips über das native `title`-Attribut wie in `ZoomControls`/`PanelToggle`.

## Risks / Trade-offs

- [Schema-Festlegungen (z. B. `strokeWidth` in Bildschirm-px, Schenkel-Messrichtung) erweisen sich beim Bau der Werkzeuge als unpassend] → Solange es keinen Export gibt und nur ein Nutzer betroffen ist, kann Version 1 vor dem ersten Export noch angepasst werden; danach über `schemaVersion` 2 mit Migration.
- [Zod-Prüfung bei jeder Formänderung kostet Zeit, z. B. beim Ziehen] → Eine Form ist klein; die Prüfung liegt im Mikrosekundenbereich. Falls das Ziehen später ruckelt, können Zwischenstände während des Ziehens außerhalb des Plans gehalten und erst beim Loslassen übernommen werden.
- [Rohdaten-Sicherung überschreibt eine ältere Sicherung] → bewusst in Kauf genommen (siehe 5.).
- [Anpassung an `floor-calibration` in `app-store.ts`, `AppShell`, `StatusBar`, `CalibrationPanel`] → `floor-calibration` ist zuerst umgesetzt; dieser Change stellt `activeFloorId`- und `calibrations`-Zugriffe auf den Plan um und fügt die Hinweisleiste in die vorhandene Spalte ein. `floor-calibration` muss vor diesem Change archiviert werden, damit die Delta-Spec `floor-calibration` greift.
- [Neue Kalibrierung verschiebt vorhandene Möbel] → Möbel liegen in cm vom Bildursprung; bekannt und im Kalibrier-Panel erwähnt.
- [`activeFloorId` gehört nun zum Plan und wird später mit exportiert] → so im verbindlichen Datenmodell vorgesehen; beim Import kann der Nutzer damit auf der Etage des Exports landen.

## Migration Plan

- Es gibt noch keine gespeicherten Pläne; der Schlüssel `raumplaner.plan` ist neu. Bestehende `raumplaner.ui.*`-Einträge bleiben unberührt.
- Kalibrierungen unter `raumplaner.calibration` werden beim ersten Start übernommen und danach entfernt (siehe Entscheidung 5).
- Rückbau: Change zurücknehmen; ein im Browser liegender `raumplaner.plan` wird dann einfach ignoriert. Da `raumplaner.calibration` nach der Übernahme fehlt, müsste nach einem Rückbau neu kalibriert werden.
