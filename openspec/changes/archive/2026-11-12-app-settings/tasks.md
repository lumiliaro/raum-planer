# Tasks

## 1. Voraussetzungen

- [x] 1.1 Prüfen, dass `opening-snap-points` archiviert ist und `PLAN_SCHEMA_VERSION` 8 ist (`room.color`, `passage`, `opening-snap.ts`). Die MODIFIED-Anforderungen dieses Changes („Aufbau des Plans“, „Neuer leerer Plan“, „Inhalt der Exportdatei“, „Kopfleiste“) mit dem Wortlaut in `openspec/specs/` vergleichen und angleichen. Prüfen mit `openspec validate app-settings --strict`.

## 2. Datenmodell und Migration

- [x] 2.1 `src/lib/__fixtures__/plan-v8.json` einfrieren: Version 8, eingefärbte Räume, Durchgang, Wanddicken. Die Datei muss vor dem Hochzählen das v8-Schema bestehen. Prüfen mit einem Test.
- [x] 2.2 `src/lib/plan-settings.ts` (`PlanSettingsSchema`, `FACTORY_SETTINGS`, `SETTING_LABELS`, `settingsAreFactory`) und `PlanSchema.settings`, `PLAN_SCHEMA_VERSION = 9` in `plan-schema.ts`. Tests in `plan-settings.test.ts` und `plan-schema.test.ts`:
  - Werkseinstellungen gültig
  - Werte aus „Gültige Werte“ gültig
  - fein 10 > Fangschritt 5 ungültig
  - Raster 5 ungültig
  - Wanddicke 0 ungültig
  - Plan v9 ohne `settings` ungültig

  Prüfen mit `npm test`.
- [x] 2.3 `PLAN_MIGRATIONS[8]` und `createEmptyPlan` mit Werkseinstellungen. Tests:
  - Migration ergänzt `settings`.
  - vorhandenes Feld bleibt
  - Für jede Version 1…8 gibt es eine Migration.
  - Die Fixture wird ohne Warnung zu Version 9.
  - Neuer Plan hat die Werkseinstellungen (`plan.test.ts`).

  Prüfen mit `npm test`.

## 3. Logik

- [x] 3.1 `updateSettings`, `resetSettings` in `src/lib/plan.ts`. Tests in `plan.test.ts`:
  - Ändern setzt `updatedAt`.
  - Ungültiges oder Unverändertes → gleiches Objekt.
  - Zurücksetzen auf Werkseinstellungen in einem Schritt
  - Räume und Öffnungen bleiben unverändert.

  Prüfen mit `npm test`.
- [x] 3.2 `src/lib/settings-fields.ts` (`applySettingsNumberField`) plus Tests:
  - Raster „5“ → „Muss zwischen 10 cm und 1 000 cm liegen“
  - fein „10“ bei Fangschritt 5 → „Darf höchstens 5 cm sein“
  - Fangschritt „0,5“ bei fein 1 → „Muss mindestens 1 cm sein (feiner Fangschritt)“
  - Wanddicke „11,5“ → ok
  - Komma, Punkt, Rundung, „abc“ → `NOT_A_NUMBER`

  Prüfen mit `npm test`.
- [x] 3.3 Werte als Parameter:
  - `snapStepCm(alt, settings)` in `snap.ts`
  - `gridLines(visible, stepCm)` mit Ausdünnung auf mindestens 4 px in `grid.ts`
  - `defaultOpeningWidthCm(kind, settings)` in `opening-placement.ts`

  Tests:
  - `snap.test.ts`: 2,5/0,5 cm, 6 cm Zug → 5 cm, 6,3 cm mit Alt → 6,5 cm
  - `grid.test.ts`: 50 cm Abstand, Ausdünnung bei kleinem Zoom
  - `opening-placement.test.ts`: Tür 88,5 cm, auf 60-cm-Kante 60 cm

  Prüfen mit `npm test`.

## 4. Store und Verlauf

- [x] 4.1 Store-Aktionen `updateSettings`, `resetSettings`, Selektor `selectSettings`. Neue Räume nehmen Wanddicke und Farbe aus den Einstellungen, `insertOpening` die Breite. Tests in `app-store.test.ts`:
  - Raum zeichnen bei 11,5 cm → alle Kanten 11,5 cm, vorhandener Raum unverändert
  - Farbe neuer Räume Grün → neuer Raum grün
  - Tür bei 88,5 cm

  Prüfen mit `npm test`.
- [x] 4.2 `resolveHistoryFocus` mit `keep` bei reiner Einstellungsänderung in `src/lib/plan-diff.ts`, `history.ts` behält Etage, Auswahl und Werkzeug. Tests in `plan-diff.test.ts` und `app-store.test.ts`: Fangschritt ändern, Sofa auswählen, Strg+Z → 5 cm, Sofa weiter ausgewählt, Etage gleich. Prüfen mit `npm test`.

## 5. Import

- [x] 5.1 `readSettings` in `src/lib/plan-import.ts`, `settingsIssues`, `hasWarnings`, Text in `ImportDialog`. Tests in `plan-import.test.ts`:
  - Raster 0 → Eintrag, 100 cm, übrige aus der Datei
  - fehlendes `settings` in v9 → Werkseinstellungen ohne Eintrag
  - Rundreise mit 11,5/2,5 ohne Warnung
  - v8-Datei → Werkseinstellungen ohne Warnung

  Prüfen mit `npm test` und im Browser (manuell) mit einer von Hand geänderten Exportdatei.

## 6. Oberfläche

- [x] 6.1 Zahnrad „Einstellungen“ in `HeaderBar` ganz rechts, im Kalibrier-Modus ausgeblendet. Prüfen im Browser (manuell) gegen „Inhalt der Kopfleiste“ und „Kalibrier-Modus“.
- [x] 6.2 `SettingsDialog` mit vier Abschnitten, Zahlenfeldern, Farbfeldern (Wandfarbe; Farbe neuer Räume mit Farbfeldern aus `room-colors.ts`), „Auf Werkseinstellungen zurücksetzen“ (gesperrt bei Werkseinstellungen) und „Schließen“. Prüfen im Browser (manuell) gegen „Dialog öffnen“, „Schließen behält Werte“, „Rasterabstand zu klein“, „Feiner Fangschritt zu groß“, „Zurücksetzen“ und „Neuer Plan“.
- [x] 6.3 Wirkung an der Zeichenfläche: `GridLayer` (Abstand), `RoomsLayer` (Wandfarbe, Fangschritt), `ShapeNode` und `SelectionTransformer` (Fangschritt), `OpeningsLayer` (Fangschritt, Breite der Hover-Markierung). Prüfen im Browser (manuell) gegen „Wandfarbe“, „Feineres Raster“, „Fangschritt 2,5 cm“, „Feiner Fangschritt“, „Innenwände“, „Farbe neuer Räume“, „Anforderung mit festem Wert“ und „Fangschritt rückgängig“.

## 7. Dokumentation

- [x] 7.1 `docs/design/README.md` anpassen:
  - Zeile „Einstellungen“ neu fassen: Einstellungen des Plans im Dialog (Werte, Grenzen, Werkseinstellungen, Teil von Plan und Export). Ansichts- und Bedienzustände bleiben im Browser (`raumplaner.ui.*`).
  - In den Zeilen „Formen ziehen“, „Räume“, „Türen und Fenster“ und „Zeichenfläche in cm“ die festen Zahlen als „Werkseinstellung“ kennzeichnen.

  `openspec/config.yaml`: `Plan` mit `settings`. Prüfen, dass beides zu design.md passt.

## 8. Abschluss

- [x] 8.1 Gesamtprüfung im Browser (manuell) gegen alle Szenarien der Specs dieses Changes, dazu Neuladen (Einstellungen bleiben), Export/Import-Rundreise und Import der Fixture v8. `npm run lint` ohne neue Warnungen.
- [x] 8.2 npm run build und npm test laufen fehlerfrei.

## Workflow follow-up

- Archiv-Reihenfolge: `wall-thickness` → `room-passage` → `room-color` → `opening-snap-points` → `app-settings`.
- Change nach der Prüfung mit `/opsx:archive` archivieren.
- Möglicher Folge-Change: Einstellung zum Skalieren von L- und U-Formen (in `docs/design/README.md` angekündigt).
