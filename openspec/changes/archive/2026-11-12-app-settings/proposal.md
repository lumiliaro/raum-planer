# Proposal

## Why

Viele Werte der App sind heute fest eingebaut:
- 15 cm Wanddicke neuer Räume
- 80 cm für Türen, 120 cm für Fenster, 100 cm für Durchgänge
- ein 1-m-Raster
- 5-cm- bzw. 1-cm-Schritte beim Ziehen
- die Wandfarbe

Für dieses Haus passen einige davon nicht. Die Innenwände sind z. B. 11,5 cm dick, und die Türen haben 88,5 cm Rohbaumaß. Wer viele Räume und Öffnungen anlegt, muss dann jedes Mal nachkorrigieren. Dieser Change bringt einen Dialog „Einstellungen“, in dem sich diese Werte einstellen lassen. Die Einstellungen gehören zum Plan und kommen mit in die Exportdatei. Der Change schließt die Reihe `wall-thickness` → `room-passage` → `room-color` → `opening-snap-points` → `app-settings` ab.

## What Changes

- **Dialog „Einstellungen“**: Er öffnet sich über eine Zahnrad-Schaltfläche rechts in der Kopfleiste (Tooltip „Einstellungen“) und hat vier Abschnitte:
  - **Wände**: „Wanddicke neuer Räume“ (Werkseinstellung 15 cm), „Wandfarbe“ (Werkseinstellung #3F3F46)
  - **Räume**: „Farbe neuer Räume“ (Werkseinstellung „Standard“, also keine Farbe), mit denselben Farbfeldern wie im Raum-Panel
  - **Raster und Fangen**: „Rasterabstand“ (100 cm), „Fangschritt“ (5 cm), „Feiner Fangschritt (Alt)“ (1 cm)
  - **Öffnungen**: Standardbreite „Tür“ (80 cm), „Fenster“ (120 cm), „Durchgang“ (100 cm)
- **Bedienung wie im Dialog „Etagen“**:
  - Jede übernommene Eingabe wirkt sofort und ist ein Rückgängig-Schritt.
  - Ungültige Werte zeigen einen Hinweis mit der Grenze.
  - „Auf Werkseinstellungen zurücksetzen“ setzt alle Werte in einem Schritt zurück.
- **Wirkung**:
  - Die Standardwerte gelten für neu gezeichnete Räume und neu gesetzte Öffnungen. Vorhandene Räume und Öffnungen bleiben unverändert.
  - Rasterabstand, Fangschritte und Wandfarbe wirken sofort überall: Raster der Zeichenfläche, Ziehen und Größenänderung von Formen, Ziehen von Räumen und Öffnungen, alle Wandbänder.
- **Werkseinstellungen in den Specs**: Die festen Werte in bestehenden Anforderungen (15 cm, 80/120/100 cm, 5/1 cm, 100 cm Raster, Wandfarbe) gelten als Werkseinstellungen. Eine Anforderung in `app-settings` legt fest, dass stattdessen der eingestellte Wert gilt.
- **BREAKING – Formatversion 9**: Der Plan hat das Pflichtfeld `settings`.
  - Die Migration 8 → 9 setzt die Werkseinstellungen. Ältere Pläne verhalten sich danach genau wie vorher.
- **Import/Export**:
  - Die Einstellungen kommen mit in die Datei, und ein Import ersetzt sie zusammen mit dem Plan.
  - Ungültige Einzelwerte werden durch die Werkseinstellung ersetzt und gemeldet.
- **Projektentscheidung**: In `docs/design/README.md` steht bisher, dass Einstellungen nur im Browser liegen. Das gilt künftig nur noch für Ansichts- und Bedienzustände wie Panel offen/zu. Die neuen Einstellungen gehören zum Plan, so hat der Nutzer entschieden.

## Nicht im Umfang

- Einstellung zum Verhalten beim Skalieren von L- und U-Formen (in `docs/design/README.md` als „kommt mit dem Einstellungs-Menü“ notiert). Das wäre ein eigener kleiner Folge-Change.
- Standardwerte rückwirkend auf vorhandene Räume oder Öffnungen anwenden, z. B. „alle Wände auf 11,5 cm“
- Ansichtseinstellungen (Zoom, Panel) in den Plan verschieben
- Einstellungen getrennt vom Plan exportieren oder als Vorlage für neue Pläne speichern
- Toleranz der Rastpunkte (8 Bildschirmpixel), Drehraster, Zoomgrenzen
- Sprache, Einheiten (bleibt Deutsch und cm)

## Capabilities

### New Capabilities
- `app-settings`: Einstellungen des Plans (Werte, Grenzen, Werkseinstellungen), der Dialog „Einstellungen“ und wie die Werte auf neue Räume, neue Öffnungen, Raster, Fangen und Wandfarbe wirken.

### Modified Capabilities
- `plan-data`: Formatversion 9 in „Aufbau des Plans“ (mit Einstellungen) und „Neuer leerer Plan“ (mit Werkseinstellungen). Neue Anforderung „Einstellungen im Plan“.
- `plan-import`: Neue Anforderungen „Einstellungen aus der Datei“ und „Dateien der Version 8“.
- `plan-export`: „Inhalt der Exportdatei“ nennt die Einstellungen. Das Szenario zur Formatversion nennt keine feste Nummer mehr.
- `workspace-layout`: „Kopfleiste“ bekommt die Schaltfläche „Einstellungen“.
- `edit-history`: Neue Anforderung „Einstellungen als Schritte“.

## Impact

- **Voraussetzung**: `opening-snap-points` ist archiviert, `PLAN_SCHEMA_VERSION` ist 8.
- **Neu in `src/lib/`** (jeweils mit Vitest-Test):
  - `plan-settings.ts`: `PlanSettingsSchema`, `FACTORY_SETTINGS`, Grenzen
  - `settings-fields.ts`: Eingaben im Dialog
- **Geändert**:
  - `plan-schema.ts`: `settings`, `PLAN_SCHEMA_VERSION = 9`
  - `plan-migration.ts`: Migration 8 → 9
  - `plan.ts`: `createEmptyPlan`, `updateSettings`, `resetSettings`
  - `plan-import.ts`, `shape-issues.ts`
  - `snap.ts`: `snapStepCm(settings, alt)`
  - `grid.ts`: Rasterabstand als Parameter
  - `opening-placement.ts`: Standardbreiten aus den Einstellungen
  - `room-colors.ts`
- **Oberfläche**:
  - neu `SettingsDialog`, Zahnrad in `HeaderBar`
  - `GridLayer`, `ShapeNode`, `SelectionTransformer`, `RoomsLayer` (Wandfarbe, Ziehen), `OpeningsLayer`
  - die Stelle, an der ein gezeichneter Raum entsteht
  - `insertOpening` im Store
  - `ImportDialog`
- **Neue Fixture**: `src/lib/__fixtures__/plan-v8.json`
- **Doku**: `docs/design/README.md` (Zeile „Einstellungen“ und betroffene Zeilen), `openspec/config.yaml` (Datenmodell)
- **Abhängigkeiten**: keine neuen. Der Dialog nutzt das vorhandene `Dialog` aus shadcn/ui.
- **Datenmodell**: `schemaVersion` 8 → 9, `Plan.settings` mit `defaultWallThicknessCm`, `wallColor`, `defaultRoomColor`, `gridStepCm`, `snapStepCm`, `fineSnapStepCm`, `doorWidthCm`, `windowWidthCm`, `passageWidthCm`
