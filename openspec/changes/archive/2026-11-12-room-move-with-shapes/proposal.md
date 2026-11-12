# Proposal

## Why

Wird ein Raum verschoben, wandern seine Wände, Türen, Fenster und Durchgänge mit, die Möbel darin aber bleiben liegen (so verlangt es bisher „Raum verschieben“ in `floor-rooms`). Wer einen eingerichteten Raum an eine andere Stelle legt, muss danach jedes Möbelstück einzeln nachziehen. Ein Raum soll sich mit seinem Inhalt als Ganzes verschieben lassen.

## What Changes

- Beim Verschieben eines Raums wandern alle Formen mit, deren Mittelpunkt (Position `x`, `y`) zu Beginn des Ziehens im Raum-Umriss liegt, um denselben Versatz in cm. Drehung, Spiegelung, Maße, Stil und Zeichenreihenfolge der Formen bleiben unverändert.
- Gesperrte Formen wandern ebenfalls mit: Die Sperre einer Form schützt vor direktem Bearbeiten der Form, nicht vor dem Verschieben ihres Raums.
- Die Formen laufen schon während des Ziehens sichtbar mit (wie heute Wände, Türen und Fenster), nicht erst beim Loslassen.
- Raum und mitgenommene Formen ändern sich in genau einem Rückgängig-Schritt. Nach Rückgängig oder Wiederholen ist der Raum ausgewählt, auch wenn genau eine Form mitgewandert ist.
- **Verhaltensänderung** gegenüber der bisherigen Anforderung „Möbel MUST beim Verschieben eines Raums an ihrer Stelle bleiben“. Eine Möglichkeit, einen Raum ohne seine Möbel zu verschieben, gibt es bewusst nicht.
- Datenformat unverändert, `schemaVersion` bleibt 11.

## Capabilities

### New Capabilities

Keine.

### Modified Capabilities

- `floor-rooms`: „Raum verschieben“ – Formen mit Mittelpunkt im Raum wandern mit, auch gesperrte, mit Vorschau beim Ziehen.
- `edit-history`: „Raum nach Rückgängig und Wiederholen“ – ein Schritt, der einen Raum samt mitgewanderter Formen betrifft, wählt den Raum aus, nicht eine Form.

## Nicht im Umfang

- Kein Verschieben eines Raums ohne seine Möbel (keine Zusatztaste, keine Einstellung).
- Keine Änderung beim Ändern von Kantenlängen oder Wanddicken: Möbel bleiben dabei weiterhin liegen.
- Keine Gruppierung oder dauerhafte Zuordnung von Möbeln zu Räumen im Datenmodell; „enthalten“ wird bei jedem Verschieben neu aus der Lage bestimmt.
- Kein Mitnehmen von Formen auf anderen Etagen, keine Änderung an Türen/Fenstern (die wandern schon heute mit).
- Keine Prüfung, ob mitgewanderte Formen danach mit anderen Räumen oder Formen kollidieren.

## Impact

- `src/lib/plan.ts`: `moveRoom` verschiebt zusätzlich die enthaltenen Formen der Etage.
- Neue reine Funktion für „Formen im Raum“ (z. B. in `src/lib/room-geometry.ts` oder eigener Datei) auf Basis von `containsPoint`, genutzt von `moveRoom` und der Vorschau.
- `src/lib/plan-diff.ts`: `resolveHistoryFocus` wählt bei genau einem betroffenen Raum den Raum, auch wenn Formen mitgeändert wurden.
- `src/store/app-store.ts`: flüchtiger Ziehzustand des Raums (nicht im Verlauf), damit die Formen-Ebene ihn sieht.
- `src/components/canvas/RoomsLayer.tsx`, `ShapesLayer.tsx`, `ShapeNode.tsx`: Vorschau der mitwandernden Formen.
- Abhängigkeit: baut auf dem archivierten `room-wall-snap` auf (Haften an der Nachbarwand); mitwandernde Möbel übernehmen den Versatz nach Raster und Haften.
