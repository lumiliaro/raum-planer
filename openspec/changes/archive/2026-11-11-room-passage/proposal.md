# Proposal

## Why

Ein Raum hat nicht immer ringsum Wände. Im Grundriss des Hauses geht z. B. das Elternschlafzimmer an einer Stelle ohne Wand und ohne Tür in den Flur über, und offene Küchen oder Wohn-Ess-Bereiche haben ganze Seiten ohne Wand. Heute umschließt das Wandband jeden Raum vollständig. Die einzige Möglichkeit, es zu öffnen, ist eine Tür mit Türblatt. Dieser Change ergänzt einen „Durchgang“: eine Öffnung ohne Türblatt, die beliebig breit sein kann, bis zur ganzen Kante. Er ist der zweite von fünf Changes: `wall-thickness` → `room-passage` → `room-color` → `opening-snap-points` → `app-settings`.

## What Changes

- **Neue Öffnungsart „Durchgang“** neben Tür und Fenster.
  - Ein Durchgang sitzt wie diese auf einer Raumkante, mit Breite und Abstand zur Ecke in cm, und hat keinen Aufschlag.
- **Darstellung**:
  - Ein Durchgang schneidet wie eine Tür eine Lücke in die Wandbänder, auch in das Band eines angrenzenden Raums.
  - In der Lücke ist kein Symbol zu sehen. Ausgewählt zeigt sie ihren Umriss in der Auswahlfarbe.
- **Werkzeug „Durchgang“** (Taste D, Tooltip „Durchgang – offene Wand (D)“) direkt unter „Fenster“.
  - Gesperrt wie Tür und Fenster, solange die Etage keinen Raum hat.
  - Ein Klick auf eine Kante setzt einen 100 cm breiten Durchgang, bei kürzerer Kante so breit wie die Kante.
- **Bearbeiten**: Auswählen, Ziehen entlang der Kante, „Breite“ und „Abstand zur linken Ecke“ im Panel, Löschen und Rückgängig wie bei Tür und Fenster.
  - Neu im Panel ist die Schaltfläche „Ganze Kante“. Sie macht den Durchgang so breit wie die Kante, mit Abstand 0 cm. Damit fehlt die Wand dieser Kante komplett.
- **BREAKING – Formatversion 7**: Die Art einer Öffnung kann `passage` sein. Ältere App-Stände kennen sie nicht.
  - Die Migration 6 → 7 ändert keine Daten.
- **Import**: Das Prüfergebnis zählt Durchgänge mit, z. B. „7 Türen, 4 Fenster und 2 Durchgänge werden übernommen“. Ungültige Durchgänge werden wie Türen und Fenster einzeln gemeldet.

## Nicht im Umfang

- Rastpunkte beim Setzen und Ziehen (`opening-snap-points`)
- Einstellbare Standardbreite (`app-settings`)
- Eckstück des Wandbands an einer Ecke, an der ein Durchgang endet: Es bleibt stehen (siehe design.md)
- Durchgang über mehrere Kanten oder um eine Ecke herum. Dafür setzt man je Kante einen Durchgang.
- Umwandeln einer Tür in einen Durchgang und umgekehrt
- Beschriftung oder Bogen-/Sturzdarstellung eines Durchgangs
- Erkennen, welche Räume über einen Durchgang verbunden sind

## Capabilities

### New Capabilities
- keine

### Modified Capabilities
- `room-openings`:
  - Geändert: „Gültige Öffnung“ (dritte Art), „Eigenschaften einer Öffnung“ (Kopf „Durchgang“), „Öffnungen bei Änderungen am Raum“ (Hinweis „… Durchgang …“)
  - Neu: „Werkzeug „Durchgang““, „Durchgang setzen“, „Darstellung eines Durchgangs“, „Ganze Kante öffnen“
- `plan-data`: Formatversion 7 in „Aufbau des Plans“ und „Neuer leerer Plan“. Neue Anforderung „Durchgänge im Plan“.
- `plan-import`:
  - Geändert: „Türen und Fenster im Prüfergebnis“ (Durchgänge mitzählen), „Türen und Fenster aus der Datei“ (Szenario für einen Durchgang)
  - Neu: „Dateien der Version 6“

## Impact

- **Voraussetzung**: `wall-thickness` ist archiviert, `PLAN_SCHEMA_VERSION` ist 6.
- **Geändert in `src/lib/`** (jeweils mit Vitest-Test):
  - `plan-schema.ts`: `kind: "door" | "window" | "passage"`, `PLAN_SCHEMA_VERSION = 7`
  - `plan-migration.ts`: Migration 6 → 7 ohne Datenänderung
  - `opening-placement.ts`: `DEFAULT_PASSAGE_WIDTH_CM = 100`
  - `opening-fields.ts`: `applyFullEdge`
  - `room-fields.ts`: Name der Art im Hinweis
  - `format.ts`: `formatOpeningCount` mit Durchgängen
  - `shape-issues.ts`, `plan-import.ts`
- **Oberfläche**:
  - `tools.ts`: Eintrag „Durchgang“ mit Taste D
  - `shape-icons.tsx`: `PassageIcon`
  - `ActiveTool`: Werkzeug `passage`
  - `OpeningsLayer`: Trefferfläche und Auswahlumriss
  - `OpeningProperties`: Kopf und „Ganze Kante“
  - `ImportDialog`
- **Neue Fixture**: `src/lib/__fixtures__/plan-v6.json`
- **Doku**: `docs/design/README.md` (Zeile „Türen und Fenster“), `openspec/config.yaml` (Datenmodell: Opening-Arten)
- **Abhängigkeiten**: keine neuen
- **Datenmodell**: `schemaVersion` 6 → 7. `Opening.kind` bekommt `"passage"`. Für Durchgänge ist `swing` immer `null`.
