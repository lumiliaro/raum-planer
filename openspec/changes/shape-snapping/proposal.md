# Proposal

## Why

Möbel lassen sich beim Ziehen bisher nur im 5-cm-/1-cm-Raster relativ zur Startlage bewegen. Einen Tisch genau mittig in den Raum, einen Schreibtisch mittig vor das Fenster oder einen Schrank bündig an die Wand zu stellen, erfordert Augenmaß oder Nachrechnen im Eigenschaften-Panel. Türen und Fenster rasten bereits an Rastpunkten ihrer Kante ein; dasselbe Komfortniveau fehlt für Möbel im Raum.

## What Changes

- Beim Ziehen einer Form innerhalb eines Raums rastet sie je Achse (waagerecht und senkrecht getrennt) an Rastlinien ein, wenn ihre Lage ohne Raster höchstens 8 Bildschirmpixel davon entfernt ist:
  - **Raummitte**: Mittelpunkt der Form auf der waagerechten bzw. senkrechten Mittellinie des Raums.
  - **Mittig vor Öffnung**: Mittelpunkt der Form auf der Mittellinie einer Tür, eines Fensters oder eines Durchgangs des Raums (quer zur Wand).
  - **Bündig an der Wand**: Außenkante der Form bündig an der Innenseite einer waagerechten oder senkrechten Raumkante.
  - **An anderen Formen**: Kanten und Mitte der Form fluchtend mit Kanten und Mitte anderer Formen im selben Raum bzw. bündig daneben.
- Ein Rastziel hat Vorrang vor dem Raster; auf einer Achse ohne Rastziel gilt weiter das Raster.
- Solange eine Achse eingerastet ist, zeigt eine gestrichelte Hilfslinie in der Auswahlfarbe die Rastlinie; nach dem Loslassen verschwindet sie.
- Mit gedrückter Strg-Taste rastet die Form nirgends ein (wie beim Ziehen eines Raums); es gilt nur das Raster.
- Das Datenmodell ändert sich nicht.

**Nicht im Umfang:**

- Einrasten beim Ändern der Größe oder beim Drehen (bleibt wie bisher).
- Einrasten beim Verschieben per Eingabe im Eigenschaften-Panel oder per Tastatur.
- Schräge Raumkanten (nicht waagerecht/senkrecht) und Öffnungen auf schrägen Kanten als Rastziel.
- Formen außerhalb jedes Raums rasten nicht ein (nur Raster); Formen anderer Räume sind keine Rastziele.
- Freie Formen (polygon) ohne Umriss rasten nicht ein und sind keine Rastziele.
- Abstands-Rastpunkte (z. B. „gleicher Abstand zu zwei Wänden“ oder fester Wandabstand) und eine Einstellung zum dauerhaften Abschalten.

## Capabilities

### New Capabilities
- `shape-snapping`: Rastlinien für Formen beim Ziehen innerhalb eines Raums (Raummitte, Öffnungsmitte, Wand, andere Formen), deren Vorrang vor dem Raster, die Hilfslinie und das Abschalten mit Strg.

### Modified Capabilities
- `shape-editing`: „Raster beim Verschieben“ gilt nur noch, solange die Form auf der jeweiligen Achse nicht an einer Rastlinie einrastet.

## Impact

- Neue reine Logik in `src/lib/shape-snap.ts` (Rastlinien eines Raums, Umrissgrenzen einer Form, Einrasten je Achse) mit Vitest-Tests.
- `src/components/canvas/ShapeNode.tsx`: `dragBoundFunc` nutzt die Rastlogik; Strg-Taste über `useCtrlKeyRef`.
- `src/components/canvas/ShapesLayer.tsx`: zeichnet die Hilfslinien während des Ziehens.
- Keine neuen Abhängigkeiten, keine Änderung an `plan-schema.ts`, `schemaVersion` bleibt.
