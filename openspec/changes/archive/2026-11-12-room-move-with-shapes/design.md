# Design

## Context

- `moveRoom` in `src/lib/plan.ts` verschiebt nur die Ecken (`translatePoints`, gerundet auf 0,1 cm) über `updateRoom`; Öffnungen hängen an Kantenindex und Versatz und wandern dadurch automatisch mit. Formen bleiben unberührt.
- Der Ziehzustand des Raums (`RoomDrag { id, dx, dy }`) ist lokaler React-State in `RoomsLayer`; Wandband, Lücken, Auswahlrahmen und Öffnungen lesen ihn für die Vorschau. `ShapesLayer` liegt als eigene Ebene darüber (`FloorCanvas`) und sieht diesen Zustand nicht.
- Der Store setzt die Raum-Sperre in `moveRoom` durch (`isRoomPatchAllowed`); die Plan-Operationen sind sperr-agnostisch. Die Formsperre (`isPatchAllowed` in `shape-lock.ts`) wird nur in den Store-Aktionen für Formen geprüft.
- Der Verlauf (zundo) speichert nur `plan` (`partialize`); jede `applyPlan`-Änderung ist ein Schritt.
- `resolveHistoryFocus` (`src/lib/plan-diff.ts`) bevorzugt heute genau eine geänderte Form vor genau einem geänderten Raum. Ein Raum mit genau einem mitgewanderten Möbel würde nach Rückgängig also das Möbel auswählen.
- Seit `room-wall-snap` haftet ein gezogener Raum an Nachbarwänden: `RoomArea` berechnet in `onDragMove` aus Raster und `snapRoomDrag` (`src/lib/room-snap.ts`) den endgültigen Versatz `snappedCm` und meldet ihn samt der haftenden Kanten (`stuckEdges`) über `onDrag` an `RoomsLayer`; `onDragEnd` ruft `moveRoom` mit genau diesem Versatz. Das Delta dieses Changes baut auf dem Wortlaut von „Raum verschieben“ in `openspec/specs/floor-rooms/spec.md` (inkl. Haften) auf.

## Goals / Non-Goals

**Goals:**
- Eine reine, getestete Funktion entscheidet, welche Formen „im Raum“ sind; Plan-Operation und Vorschau nutzen dieselbe Funktion, damit Vorschau und Ergebnis nie auseinanderlaufen.
- Raum und Formen ändern sich in einem einzigen Plan-Update (ein Rückgängig-Schritt).

**Non-Goals:**
- Keine Zuordnung Form → Raum im Datenmodell.
- Kein Umbau des Formen-Ziehens oder des Transformers.

## Decisions

### 1. „Enthalten“ = Mittelpunkt im Umriss, über `containsPoint`

Neue Funktion `shapeIdsInRoom(pointsCm, shapes): string[]` in `src/lib/room-geometry.ts` (dort liegen `containsPoint` und `translatePoints`; keine Abhängigkeit zu React/Konva). Sie liefert die IDs aller Formen, deren `{ x, y }` laut `containsPoint` im Umriss liegt.

- Alternative „ganzer Umriss im Raum“ (über `getOutlineCm`) oder „jede Überlappung“: vom Nutzer verworfen; der Mittelpunkt ist eindeutig, billig und nimmt auch Möbel mit, die etwas in die Wand ragen.
- Punkte genau auf dem Umriss: `containsPoint` (Gerade-Ungerade-Regel) entscheidet je nach Kante unterschiedlich. Das ist bewusst nicht in der Spec festgelegt; die Tests decken nur eindeutige Lagen ab.
- Überlappende oder verschachtelte Räume: Jede Form mit Mittelpunkt im gezogenen Raum wandert mit, auch wenn sie zugleich in einem anderen Raum liegt.
- Formen ohne Umriss (`getOutlineCm` liefert `null`) haben trotzdem `x`/`y` und wandern mit; sie bleiben im Plan wie bisher.

### 2. `moveRoom` verschiebt Raum und Formen in einem Plan-Update

`moveRoom(plan, floorId, id, dx, dy, now)` bestimmt die Formen-IDs **vor** dem Verschieben aus den alten Ecken, verschiebt den Raum wie bisher über `updateRoom` und – nur wenn das gelungen ist (Plan geändert) – setzt `x`/`y` der enthaltenen Formen auf `roundCm(x + dx)` / `roundCm(y + dy)`. Reihenfolge im Array, alle anderen Felder und `locked` bleiben. Ergebnis ist ein Plan, also ein einziger Verlaufsschritt.

- Gesperrte Formen werden bewusst mitbewegt (Entscheidung des Nutzers). Da die Plan-Operation sperr-agnostisch ist und der Store für `moveRoom` nur die Raum-Sperre prüft, ist dafür keine Ausnahme in `shape-lock.ts` nötig. Der Doku-Kommentar in `shape-lock.ts` („A lock fixes position…“) wird um „außer beim Verschieben ihres Raums“ ergänzt.
- Formen werden nicht neu über `ShapeSchema` validiert: Eine Verschiebung von `x`/`y` um endliche Werte kann eine gültige Form nicht ungültig machen.
- Alternative: Store-Aktion ruft `moveRoom` und danach je Form `updateShape` → mehrere Verlaufsschritte bzw. Sperr-Konflikte. Verworfen.

### 3. Ziehzustand des Raums in den Store (flüchtig)

`RoomDrag` wandert aus dem lokalen State von `RoomsLayer` in den App-Store als `roomDrag: { floorId, id, dx, dy, stuckEdges } | null` (`dx`/`dy` = Versatz nach Raster und Haften, `stuckEdges` wie heute für die Hervorhebung der haftenden Wände) mit Setter `setRoomDrag`. Er ist nicht Teil von `partialize`, bildet also keinen Verlaufsschritt (wie `highlightedEdge`). `RoomsLayer` liest und schreibt ihn statt `useState`; beim Loslassen (`onDragEnd`) und beim Etagenwechsel wird er auf `null` gesetzt.

`ShapesLayer` liest `roomDrag` und den gezogenen Raum, berechnet einmal je Ziehbeginn (`useMemo` auf Raum-ID und Ecken, nicht auf `dx/dy`) die Menge `shapeIdsInRoom` und gibt jedem betroffenen `ShapeNode` einen Vorschau-Versatz `previewOffsetCm` mit; `ShapeNode` zeichnet sich dann bei `x + dx`, `y + dy`.

- Alternative: State in `FloorCanvas` heben und als Props an beide Ebenen geben. Funktioniert ebenso, aber `RoomsLayer` und `ShapesLayer` lesen schon alles andere aus dem Store; der Store-Weg hält `FloorCanvas` schlank.
- Während des Ziehens ist kein Formen-Auswahlrahmen sichtbar (ein Raum ist ausgewählt, keine Form), daher braucht `SelectionTransformer` keine Anpassung.

### 4. Fokus nach Rückgängig: Raum vor Formen

`resolveHistoryFocus`: Ist auf der geänderten Etage genau ein Raum betroffen, wird er ausgewählt, unabhängig davon, wie viele Formen sich mitgeändert haben (bisher gewann genau eine Form). Ein Schritt, der einen Raum **und** Formen ändert, entsteht nur durch Verschieben eines Raums, daher ändert das keinen anderen Fall. Der Sonderfall „nur Öffnungen geändert“ bleibt wie er ist (dort sind keine Formen betroffen).

### Datenmodell und schemaVersion

Keine Änderung am Datenformat; `schemaVersion` bleibt 11, keine Migration, kein neues Fixture. Export, Import, Persistenz und PDF sind nicht betroffen.

## Risks / Trade-offs

- [Möbel wird unbeabsichtigt mitgenommen, z. B. beim Nachjustieren eines Raums auf der Vorlage] → Ein Strg+Z stellt Raum und Möbel gemeinsam wieder her; eine Option „ohne Möbel“ ist bewusst ausgeschlossen (Proposal).
- [Mittelpunkt genau auf der Raumkante entscheidet uneinheitlich] → In der Praxis selten (Möbel stehen innerhalb); nicht spezifiziert, nicht getestet.
- [Vorschau und Ergebnis unterscheiden sich] → Beide nutzen `shapeIdsInRoom` auf den Ecken vor dem Verschieben; der Versatz ist derselbe gerasterte Wert.
- [Re-Render der Formen-Ebene bei jedem Rasterschritt] → Nur betroffene `ShapeNode`s bekommen neue Props; die Menge wird nur bei Ziehbeginn berechnet.
- [Vorschau weicht beim Haften ab] → Formen nutzen denselben `dx`/`dy` wie Raum und `moveRoom`, also den Versatz nach Raster und Haften, nie die rohe Mauslage.

## Migration Plan

Keine Datenmigration. Rückbau: Change zurücknehmen; gespeicherte Pläne bleiben gültig.
