# Tasks

## 1. Voraussetzungen

- [x] 1.1 Prüfen, dass `room-passage` archiviert ist und `PLAN_SCHEMA_VERSION` 7 ist. Die MODIFIED-Anforderungen dieses Changes („Räume darstellen“, „Eigenschaften eines Raums“, „Raumänderungen als Schritte“, „Aufbau des Plans“, „Neuer leerer Plan“) mit dem aktuellen Wortlaut in `openspec/specs/` vergleichen und angleichen. Prüfen mit `openspec validate room-color --strict`.

## 2. Datenmodell und Migration

- [x] 2.1 `src/lib/__fixtures__/plan-v7.json` einfrieren: Version 7 mit zwei Räumen, einer davon mit Durchgang. Die Datei muss vor dem Hochzählen das v7-Schema bestehen. Prüfen mit einem Test.
- [x] 2.2 `RoomSchema.color` und `PLAN_SCHEMA_VERSION = 8` in `src/lib/plan-schema.ts`. Tests in `plan-schema.test.ts`:
  - `null` gültig
  - `#BBF7D0` gültig
  - „grün“ ungültig
  - `#FFF` ungültig

  Prüfen mit `npm test`.
- [x] 2.3 `PLAN_MIGRATIONS[7]` in `src/lib/plan-migration.ts`. Tests:
  - Jeder Raum bekommt `color: null`.
  - Ein vorhandenes Feld bleibt.
  - Für jede Version 1…7 gibt es eine Migration.
  - Die Fixture wird ohne Warnung zu Version 8.

  Neu gezeichnete Räume und Test-Fixtures mit `color: null` ergänzen. Prüfen mit `npm test`.

## 3. Logik

- [x] 3.1 `src/lib/room-colors.ts` (`ROOM_COLOR_PRESETS`, `findRoomColorPreset`, `roomAreaFill`) plus `room-colors.test.ts`:
  - 8 Einträge, der erste ist „Standard“ mit `null`.
  - `findRoomColorPreset("#bbf7d0")` → Grün.
  - `#7DD3FC` → `null`.
  - `roomAreaFill(null)` → `rgba(255,255,255,0.5)`.
  - `roomAreaFill("#BBF7D0")` → `rgba(187,247,208,0.5)`.

  Prüfen mit `npm test`.
- [x] 3.2 `RoomPatch.color` in `src/lib/plan.ts`. Tests in `plan.test.ts`:
  - Färben setzt `updatedAt`.
  - Ecken, Wanddicken und Öffnungen bleiben.
  - „grün“ → gleiches Objekt.
  - gleiche Farbe → gleiches Objekt.

  Verlauf: Test in `plan-diff.test.ts`: Eine reine Farbänderung ergibt den Raum-Fokus. Das deckt die Verallgemeinerung aus `wall-thickness` ab, sonst ergänzen. Test in `app-store.test.ts`: „Kind 1“ grün färben, Strg+Z → keine Farbe, „Kind 1“ ausgewählt. Prüfen mit `npm test`.

## 4. Import

- [x] 4.1 Ungültige Raumfarbe in `readRoom` (`src/lib/plan-import.ts`) auf `null` setzen und melden, `hasWarnings`, Text in `ImportDialog`. Tests in `plan-import.test.ts`:
  - „blau“ → Eintrag, Raum ohne Farbe
  - fehlendes Feld → `null` ohne Eintrag
  - Rundreise mit #BBF7D0 und `null` ohne Warnung
  - v7-Datei ohne Warnung

  Prüfen mit `npm test` und im Browser (manuell) mit einer von Hand geänderten Exportdatei.

## 5. Oberfläche

- [x] 5.1 `RoomArea` in `RoomsLayer` mit `roomAreaFill(room.color)`. Prüfen im Browser (manuell) gegen „Eingefärbter Raum“, „Vorlage durchscheinend“ und „Möbel über Raum“.
- [x] 5.2 `ColorField` aus `StyleSection.tsx` exportieren und `RoomColorSection` in `RoomProperties` zwischen Name und „Kanten“ einbauen. Prüfen im Browser (manuell) gegen „Grün wählen“, „Eigene Farbe“, „Zurück auf Standard“, „Farbe rückgängig“ und „Panel eines Rechtecks“.

## 6. Dokumentation

- [x] 6.1 `docs/design/README.md`:
  - Zeile „Räume“: Raumfarbe, 8 Farbfelder plus Farbwähler, halbtransparent, neue Räume ohne Farbe
  - Zeile „Farben“: Raumfarben getrennt von den Möbel-Voreinstellungen

  `openspec/config.yaml`: `Room` mit `color`. Prüfen, dass beides zu design.md passt.

## 7. Abschluss

- [x] 7.1 Gesamtprüfung im Browser (manuell) gegen alle Szenarien der Specs dieses Changes, dazu Neuladen (Farben bleiben) und Import der Fixture v7. `npm run lint` ohne neue Warnungen.
- [x] 7.2 npm run build und npm test laufen fehlerfrei.

## Workflow follow-up

- Archiv-Reihenfolge: `wall-thickness` → `room-passage` → `room-color` → `opening-snap-points` → `app-settings`.
- Change nach der Prüfung mit `/opsx:archive` archivieren.
