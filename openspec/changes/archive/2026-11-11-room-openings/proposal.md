# Proposal

## Why

Mit `floor-rooms` lassen sich die Räume einer Etage mit ihren Innenmaßen nachzeichnen, und um jeden Raum liegt ein Wandband. Was dabei fehlt, ist, wo man durch die Wand kommt und wo Licht hereinfällt. Für die Möbelplanung ist genau das wichtig: Vor einer Tür und in ihrem Aufschlag darf nichts stehen, unter einem Fenster passt kein hoher Schrank. Dieser Change ergänzt Türen und Fenster als Öffnungen auf einer Raumkante. Er schließt die Reihe `floors-in-plan` → `floor-underlay` → `floor-rooms` ab.

## What Changes

- **Öffnungen im Raum**: Jeder Raum bekommt eine Liste von Türen und Fenstern.
  - Jede Öffnung sitzt auf einer Kante des Raums und hat eine Breite und einen Abstand zur Ecke, beides in cm.
  - Eine Tür hat immer einen Aufschlag: Anschlag links oder rechts, öffnend nach innen oder außen.
  - Ein Fenster hat nie einen Aufschlag.
- **Darstellung**:
  - Eine Öffnung schneidet eine Lücke in die Wandbänder, auch in das Band eines angrenzenden Raums, sodass man den Durchgang sieht.
  - Eine Tür mit Aufschlag zeigt das Türblatt (durchgezogen) und den Aufschlag als gestrichelten Viertelkreis.
  - Ein Fenster zeigt ein schmales Rechteck mit Mittellinie in der Lücke.
- **Werkzeuge**: Zwei neue Werkzeuge direkt unter „Raum“ (Taste G): „Tür“ (Taste T) und „Fenster“ (Taste F).
  - **BREAKING für die Bedienung**: Das bisherige Möbel-Werkzeug „Tür“ (frei platzierter Türaufschlag) verschwindet aus der Werkzeugleiste. „Tür“ und die Taste T setzen künftig eine Tür in die Raumwand.
  - Bereits vorhandene Möbel-Türen bleiben gültig, sichtbar und bearbeitbar und kommen unverändert in Export und Import. Neu einfügen lassen sie sich nicht mehr.
  - Ein Klick auf eine Raumkante setzt dort eine Öffnung, mittig an der Klickstelle. Eine Tür ist 80 cm breit und schlägt nach innen mit Anschlag links auf, ein Fenster ist 120 cm breit.
  - Danach ist die Öffnung ausgewählt, und das Werkzeug springt zurück auf „Auswählen“.
  - Ohne Raum auf der Etage sind beide Werkzeuge gesperrt.
- **Bearbeiten**:
  - Eine Öffnung lässt sich auswählen und entlang ihrer Kante ziehen, in 5-cm-Schritten, mit Alt in 1-cm-Schritten.
  - Das Eigenschaften-Panel zeigt „Breite“ und „Abstand zur linken Ecke“ (von innen gesehen), bei Türen außerdem „Aufschlag“ (Nach innen / Nach außen) und „Anschlag“ (Links / Rechts), dazu „Löschen“.
  - Entf und Rücktaste löschen die ausgewählte Öffnung. Jede Änderung ist ein Rückgängig-Schritt.
- **Räume ändern**:
  - Ändert sich eine Kante, behält jede Öffnung ihren Abstand zu dem Kantenende, das liegen geblieben ist. Damit bleiben Türen an ihrer Stelle auf dem Grundriss.
  - Passt eine Öffnung danach nicht mehr auf ihre Kante, wird die Änderung abgelehnt, und das Feld zeigt z. B. „Geht nicht: Tür auf Kante 1 passt nicht mehr“.
  - Löschen eines Raums löscht seine Öffnungen mit.
- **BREAKING – Formatversion 5**: Räume haben das Pflichtfeld `openings`. Die Migration 4 → 5 ergänzt bei jedem Raum eine leere Liste.
- **Import/Export**:
  - Öffnungen kommen mit in die Datei.
  - Beim Import werden ungültige Öffnungen einzeln gemeldet und weggelassen, der Raum bleibt.
  - Doppelte IDs von Öffnungen bekommen eine neue ID.

## Nicht im Umfang

- Wanddicke, Brüstungs- und Sturzhöhen, Fensterflügel oder Öffnungsrichtung von Fenstern
- Schiebetüren, zweiflügelige Türen, Türen mit Oberlicht
- Eine gemeinsame Öffnung für zwei Räume: Eine Tür zwischen Flur und Bad gehört genau einer Raumkante. Die Lücke im Nachbarband entsteht durch die Darstellung, nicht durch ein zweites Objekt.
- Prüfung auf sich überlappende Öffnungen auf derselben Kante
- Verschieben einer Öffnung auf eine andere Kante oder in einen anderen Raum durch Ziehen. Dafür löscht man sie und setzt sie neu.
- Liste der Öffnungen im Raum-Panel, Beschriftung von Öffnungen
- Türen ohne Aufschlag (offene Durchgänge ohne Türblatt)
- Umwandeln vorhandener Möbel-Türen in Türen der Raumwand
- Kollisionsprüfung zwischen Möbeln und Türaufschlägen

## Capabilities

### New Capabilities
- `room-openings`: Türen und Fenster auf Raumkanten: Gültigkeit, Darstellung, Werkzeuge, Auswählen, Ziehen, Eigenschaften, Löschen, Verhalten bei Änderungen am Raum, Rückgängig.

### Modified Capabilities
- `plan-data`: Neue Anforderung: Räume enthalten ihre Öffnungen, IDs sind planweit eindeutig, Formatversion 5.
- `plan-import`: Neue Anforderungen für Öffnungen beim Import (Prüfergebnis, ungültige Öffnungen, doppelte IDs, Dateien der Version 4).
- `plan-export`: Neue Anforderung, dass die Exportdatei die Öffnungen enthält.
- `shape-editing`: Das Möbel-Werkzeug „Tür“ entfällt: Werkzeug-, Einfüge- und Stil-Anforderungen nennen nur noch L-Form, U-Form und Ecke. Neue Anforderung: Vorhandene Möbel-Türen bleiben gültig und bearbeitbar.

## Impact

- **Voraussetzung und Archiv-Reihenfolge**: `editing-extras` → `floors-in-plan` → `floor-underlay` → `floor-rooms` → `room-openings`. Dieser Change baut auf dem Raum-Modell, der Raum-Auswahl, dem Raum-Panel und der Kantenregel aus `floor-rooms` auf.
- **Neu in `src/lib/`** (jeweils mit Vitest-Test):
  - `opening-geometry.ts`: Kantenlänge, Lage auf der Kante, Lücke, Türblatt und Aufschlag, links/rechts von innen
  - `opening-placement.ts`: nächste Raumkante zum Klick, Einsetzen mit Standardmaßen, Ziehen entlang der Kante
  - `opening-reanchor.ts`: Öffnungen nach einer Änderung des Raums neu verankern
  - `opening-fields.ts`: Eingaben im Panel
- **Geändert**:
  - `src/lib/plan-schema.ts`: `OpeningSchema`, `RoomSchema.openings`, `PLAN_SCHEMA_VERSION = 5`
  - `src/lib/plan-migration.ts`: Migration 4 → 5
  - `src/lib/plan-import.ts`, `src/lib/shape-issues.ts`
  - `src/lib/plan.ts`: Operationen für Öffnungen, Raum-Änderungen mit Neuverankerung
  - `src/lib/plan-diff.ts`
  - `src/store/app-store.ts`: Auswahl, Werkzeuge, Aktionen
  - `src/lib/shape-factory.ts` und `InsertableKind`: `door-swing` ist nicht mehr einfügbar
  - `tools.ts`, `ToolBar`, `shape-icons.tsx`, die Raum-Ebenen der Zeichenfläche aus `floor-rooms`, `PropertiesPanel`, `ImportDialog`, `useShapeShortcuts`
  - Tests, `docs/design/README.md`
- **Neue Komponenten**: `OpeningsLayer` bzw. Lücken in der Wandband-Ebene, `OpeningNode`, `OpeningProperties`, Icon `WindowIcon` (`DoorIcon` geht an das neue Werkzeug „Tür“)
- **Neue Fixture**: `src/lib/__fixtures__/plan-v4.json`
- **Abhängigkeiten**: keine neuen.
- **Datenmodell**: `schemaVersion` 4 → 5. `Room.openings: Opening[]` mit `Opening { id, kind: "door" | "window", edgeIndex, offsetCm, widthCm, swing }`. `swing = { hinge: "start" | "end", side: "inside" | "outside" }` ist bei Türen Pflicht und bei Fenstern `null`. Der Formtyp `door-swing` bleibt im Schema.
- **Formatversion in `plan-data`**: Ältere Anforderungen nennen ihre Formatversion („ist 2“ in „Aufbau des Plans“, „ist 4“ in „Räume im Plan“ aus `floor-rooms`). Dieser Change ergänzt nur eine neue Anforderung mit Version 5. Die älteren Angaben werden vor dem Archivieren angeglichen (tasks.md 1.1), weil ihr endgültiger Wortlaut erst nach dem Archivieren von `floor-underlay` und `floor-rooms` feststeht.
