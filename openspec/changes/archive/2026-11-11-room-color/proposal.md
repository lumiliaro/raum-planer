# Proposal

## Why

Alle Räume sind heute gleich halbtransparent weiß. Wer einen Grundriss mit vielen Räumen plant, möchte Räume nach Nutzung oder Bewohner unterscheiden, z. B. Kinderzimmer, Bäder oder Bereiche, die beim Umzug zuerst fertig sein müssen. Dieser Change macht die Fläche jedes Raums einfärbbar. Er ist der dritte von fünf Changes: `wall-thickness` → `room-passage` → `room-color` → `opening-snap-points` → `app-settings`.

## What Changes

- **Raumfarbe**: Jeder Raum hat eine Farbe oder keine („Standard“). Ohne Farbe bleibt er wie heute halbtransparent weiß.
- **Darstellung**: Die Fläche eines Raums mit Farbe ist in dieser Farbe halbtransparent gefüllt, sodass die Vorlage darunter sichtbar bleibt. Wandband, Name, Öffnungen und Möbel ändern sich nicht.
- **Eigenschaften-Panel**: Ein neuer Abschnitt „Farbe“ zwischen Name und „Kanten“.
  - Er hat 8 Farbfelder: „Standard“, Grau, Blau, Grün, Gelb, Orange, Rosa und Violett. Dazu kommt ein Farbwähler für jede andere Farbe.
  - Die aktuelle Wahl ist markiert. Jede Wahl wirkt sofort und ist ein Rückgängig-Schritt.
- Neue Räume haben keine Farbe. Eine Standardfarbe für neue Räume kommt mit `app-settings`.
- **BREAKING – Formatversion 8**: Räume haben das Pflichtfeld `color` (`#RRGGBB` oder `null`).
  - Die Migration 7 → 8 setzt `null`. Alte Pläne sehen also unverändert aus.
- **Import/Export**: Die Farbe kommt mit in die Datei.
  - Eine ungültige Farbe beim Import wird zu „Standard“ und gemeldet. Der Raum bleibt erhalten.

## Nicht im Umfang

- Deckkraft je Raum, Muster, Schraffuren
- Farbe des Wandbands (kommt global mit `app-settings`)
- Farbe des Raumnamens, Beschriftung mit Fläche in m²
- Legende oder Gruppen von Farben mit Bedeutung
- Mehrere Räume auf einmal einfärben

## Capabilities

### New Capabilities
- keine

### Modified Capabilities
- `floor-rooms`:
  - Neu: „Raumfarbe“ und „Raumfarbe wählen“
  - Geändert: „Räume darstellen“ (Fläche in der Raumfarbe), „Eigenschaften eines Raums“ (Abschnitt „Farbe“)
- `plan-data`: Formatversion 8 in „Aufbau des Plans“ und „Neuer leerer Plan“. Neue Anforderung „Raumfarbe im Plan“.
- `plan-import`: Neue Anforderungen „Dateien der Version 7“ und „Raumfarbe aus der Datei“.
- `plan-export`: Neue Anforderung „Raumfarbe in der Exportdatei“.
- `edit-history`: „Raumänderungen als Schritte“ umfasst das Ändern der Farbe.

## Impact

- **Voraussetzung**: `room-passage` ist archiviert, `PLAN_SCHEMA_VERSION` ist 7.
- **Geändert in `src/lib/`** (jeweils mit Vitest-Test):
  - `plan-schema.ts`: `RoomSchema.color`, `PLAN_SCHEMA_VERSION = 8`
  - `plan-migration.ts`: Migration 7 → 8
  - neu `room-colors.ts`: Farbfelder und `roomAreaFill(color)`
  - `plan.ts`: `RoomPatch.color`
  - `plan-import.ts`, `shape-issues.ts`
- **Oberfläche**:
  - `RoomsLayer`: Füllung der Fläche
  - `RoomProperties`: neuer Abschnitt `RoomColorSection`
  - `ColorField` aus `StyleSection` wird für den Farbwähler exportiert und wiederverwendet
  - die Stelle, an der ein gezeichneter Raum entsteht
- **Neue Fixture**: `src/lib/__fixtures__/plan-v7.json`
- **Doku**: `docs/design/README.md` (Zeilen „Räume“ und „Farben“), `openspec/config.yaml` (Datenmodell)
- **Abhängigkeiten**: keine neuen
- **Datenmodell**: `schemaVersion` 7 → 8, `Room.color: "#RRGGBB" | null`
