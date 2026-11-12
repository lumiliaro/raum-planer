# Proposal

## Why

Heute ist jede Wand ein festes Band von 15 cm außen um den Raum. Außenwände eines Hauses sind aber meist deutlich dicker, z. B. 36,5 cm, einzelne Innenwände dünner. Deshalb passt der gezeichnete Grundriss außen nicht zum eingescannten Plan, und Fenster in dicken Außenwänden sehen falsch aus. Dieser Change macht die Wanddicke je Wand einstellbar. Er ist der erste von fünf Changes aus derselben Anfrage: `wall-thickness` → `room-passage` → `room-color` → `opening-snap-points` → `app-settings`.

## What Changes

- **Wanddicke je Kante**: Jede Kante eines Raums hat ihre eigene Wanddicke in cm, größer als 0 cm und höchstens 100 cm.
  - Neue Räume bekommen an jeder Kante 15 cm. Den Standardwert macht erst `app-settings` einstellbar.
- **Darstellung**:
  - Das Wandband jeder Kante ist so breit wie ihre Wanddicke.
  - An einer Ecke treffen sich zwei verschieden dicke Bänder sauber, ohne Lücke und ohne Überstand.
  - Wie bisher ragt kein Band in einen Raum, und eine schmale Lücke zwischen zwei Räumen wirkt als gemeinsame Wand.
- **Fenster füllen die Wanddicke**: Das Fenstersymbol reicht über die ganze Dicke seiner Wand und nicht mehr fest 15 cm. Die Lücke einer Tür oder eines Fensters reicht durch die ganze Wand, auch bei Wänden über 40 cm.
- **Eigenschaften-Panel**: Im Abschnitt „Kanten“ steht neben jedem Längenfeld ein Feld „Wand“ mit der Wanddicke in cm.
  - Hat das Feld den Fokus, ist die Kante hervorgehoben.
  - Jede Änderung ist ein Rückgängig-Schritt.
- **Treffer beim Setzen von Türen und Fenstern**: Ein Klick auf das Wandband zählt über die ganze Dicke der Wand.
- **BREAKING – Formatversion 6**: Räume haben das Pflichtfeld mit einer Wanddicke je Kante.
  - Die Migration 5 → 6 setzt jede Kante auf 15 cm. Ältere Pläne sehen danach genauso aus wie vorher.
- **Import/Export**: Die Wanddicken kommen mit in die Datei.
  - Ungültige Wanddicken beim Import werden durch 15 cm ersetzt und gemeldet. Der Raum bleibt erhalten.
- **Projektbeschreibung**: Der Satz „keine Wanddicken“ in `openspec/config.yaml` und das Datenmodell dort werden angepasst.

## Nicht im Umfang

- App-weite Einstellungen und ein einstellbarer Standardwert für neue Wände (`app-settings`)
- Wanddicke für alle Kanten auf einmal setzen
- Durchgänge bzw. offene Wände (`room-passage`)
- Eigene Wandobjekte, Wandverbindungen zwischen Räumen, Wände zwischen Räumen aus nur einem Objekt
- Wanddicke durch Ziehen am Band ändern
- Wandfarbe (bleibt `#3F3F46`; einstellbar mit `app-settings`)
- Prüfung, ob ein dickes Wandband einen Nachbarraum überdeckt. Das Band wird wie bisher an jedem Rauminneren abgeschnitten.

## Capabilities

### New Capabilities
- keine

### Modified Capabilities
- `floor-rooms`: Neue Anforderungen „Wanddicke je Kante“ und „Wanddicke ändern“. „Räume darstellen“ zeichnet das Band in der Dicke der jeweiligen Kante. „Eigenschaften eines Raums“ zeigt das Feld „Wand“ je Kante.
- `room-openings`: Bei „Darstellung von Tür und Fenster“ füllt das Fenstersymbol die Wanddicke seiner Kante.
- `plan-data`: Formatversion 6 in „Aufbau des Plans“ und „Neuer leerer Plan“. „Türen und Fenster im Plan“ nennt keine feste aktuelle Version mehr. Neue Anforderung „Wanddicken im Plan“.
- `plan-import`: Neue Anforderungen „Dateien der Version 5“ und „Wanddicken aus der Datei“.
- `plan-export`: Neue Anforderung „Wanddicken in der Exportdatei“.
- `edit-history`: „Raumänderungen als Schritte“ umfasst das Ändern einer Wanddicke.

## Impact

- **Voraussetzung**: `room-openings` ist archiviert, `PLAN_SCHEMA_VERSION` ist 5.
- **Geändert in `src/lib/`** (jeweils mit Vitest-Test):
  - `plan-schema.ts`: `RoomSchema.wallThicknessCm`, `PLAN_SCHEMA_VERSION = 6`
  - `plan-migration.ts`: Migration 5 → 6
  - `room-geometry.ts`: `WALL_THICKNESS_CM` wird zu `DEFAULT_WALL_THICKNESS_CM`, neu ist `wallBandOutline` (äußerer Umriss mit unterschiedlicher Dicke je Kante)
  - `opening-geometry.ts`: Fenstersymbol und Lückentiefe nach der Wanddicke der Kante
  - `opening-placement.ts`: Band-Treffer nach der Wanddicke der Kante
  - `content-bounds.ts`: Rand nach der größten Wanddicke eines Raums
  - `room-fields.ts`: `applyWallThicknessField`
  - `plan.ts`: `RoomPatch.wallThicknessCm`
  - `plan-import.ts`, `shape-issues.ts`
- **Oberfläche**: `RoomsLayer` (gefüllte Band-Umrisse statt Strich), `OpeningsLayer`, `RoomProperties`, die Stelle, an der ein gezeichneter Raum entsteht
- **Neue Fixture**: `src/lib/__fixtures__/plan-v5.json`
- **Doku**: `docs/design/README.md` (Zeilen „Räume“, „Türen und Fenster“), `openspec/config.yaml` (Kontext)
- **Abhängigkeiten**: keine neuen
- **Datenmodell**: `schemaVersion` 5 → 6, `Room.wallThicknessCm: number[]` mit einem Wert je Kante (Index = Kantenindex)
