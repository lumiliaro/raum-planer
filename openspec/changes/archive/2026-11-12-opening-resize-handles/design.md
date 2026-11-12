## Context

Öffnungen (`Opening { edgeIndex, offsetCm, widthCm, swing, beforeFullEdge }`) werden in `OpeningsLayer.tsx` als Konva-Gruppe je Öffnung gezeichnet. Verschieben läuft über `draggable` + `dragBoundFunc` der Gruppe; die Logik steckt in `src/lib/opening-placement.ts` (`dragOffset`) und `src/lib/opening-snap.ts` (`openingSnapTargets`, `snapOpeningOffset`, Toleranz 8 px). Während des Ziehens meldet die Gruppe `OpeningDrag { id, offsetCm }` an `RoomsLayer`, der damit die Lücke im Wandband als Vorschau schneidet; die Rastmarkierung (`SnapMark { roomId, edgeIndex, atCm }`) zeichnet `OpeningsLayer`. Erst beim Loslassen schreibt `updateOpening` in den Store (ein zundo-Schritt). `plan.ts › forgetOutdatedSizes` löscht `beforeFullEdge`, sobald Breite oder Abstand ohne das Kästchen geändert werden. Öffnungen gesperrter Räume bleiben änderbar.

## Goals / Non-Goals

**Goals:**
- Griffe und Ziehen der Breite für Fenster und Durchgänge, mit derselben Haptik wie das Verschieben (Raster, Alt, Umschalt, 8-px-Toleranz, Markierung, Vorschau, ein Undo-Schritt).
- Die gesamte Rechnung (Raster, Grenzen, Mindestbreite, Haltepunkte) als reine, getestete Funktion in `src/lib/`.

**Non-Goals:**
- Türen, Konva-`Transformer`, Maßzahl beim Ziehen, Überlappungsschutz (siehe proposal.md).

## Decisions

### Datenmodell und schemaVersion
Keine Änderung. Das Ziehen erzeugt nur einen Patch `{ offsetCm, widthCm }` über das bestehende `updateOpening`. `schemaVersion` bleibt unverändert, Import/Export/Migration sind nicht betroffen. `beforeFullEdge` wird wie bei der Panel-Eingabe von `forgetOutdatedSizes` verworfen.

### Rechnung in Endkoordinaten
Neue Datei `src/lib/opening-resize.ts`. Gerechnet wird mit der Lage des gezogenen Endes `t` (cm vom Kantenanfang), nicht mit Breite/Abstand:
- `resizeTargets(lengthCm, fixedEndCm, side, others, defaultWidthCm): ResizeTarget[]` – `side` ist `"start"` (Ende bei `offset`) oder `"end"` (Ende bei `offset + width`). Kandidaten: Ecke (0 bzw. L), Enden der Nachbarn (beide Enden jeder anderen Öffnung derselben Kante), Kantenmitte `L/2`, mittig `L − fixedEnd`, Standardbreite `fixedEnd ± defaultWidth`. Gefiltert auf `0 ≤ t ≤ L` und Breite `≥ MIN_OPENING_WIDTH_CM` (10 cm) auf der richtigen Seite des festen Endes. Jeder Kandidat trägt `kind` (`corner | center | centered | neighbor | default-width`) und `markAtCm = t`.
- `resizeOpening(start: {offsetCm, widthCm}, side, alongDeltaCm, step, lengthCm, snap: DragSnap-ähnlich | null): { offsetCm, widthCm, snap }` – Raster: `t = startEnd + snapDelta(delta, step)`, dann auf `[0, fixed − 10]` bzw. `[fixed + 10, L]` begrenzt. Mit `snap` gewinnt das nächste Ziel innerhalb der Toleranz, verglichen mit dem ungerundeten `startEnd + delta`. Bei Gleichstand gilt die Reihenfolge Ecke, Mitte, mittig, Nachbar, Standardbreite.

Alternative: `opening-snap.ts` erweitern. Verworfen, weil die dortigen Ziele Abstände der ganzen Öffnung sind (fester Breite) und eine zweite Bedeutung desselben Typs die Verschiebe-Logik unübersichtlich macht. Die Toleranzkonstante `SNAP_POINT_TOLERANCE_PX` und `snapDelta` werden wiederverwendet.

Ist die Kante kürzer als 10 cm (Öffnung bereits schmaler), bleibt `resizeOpening` beim Startzustand; Griffe werden trotzdem gezeigt, das Ziehen bewirkt nichts.

### Griffe als eigene Konva-Knoten, nicht als Transformer
Pro ausgewählter Öffnung (Fenster/Durchgang, `draggable`, also Werkzeug „Auswählen“) zeichnet `OpeningNode` zwei `Rect`-Griffe (7 px, weiß, Rand `SELECTION_COLOR`, `strokeScaleEnabled=false`, Größe über `1/scale` in cm umgerechnet) auf `pointOnEdge(frame, t, thickness/2)`. Jeder Griff ist selbst `draggable` mit eigener `dragBoundFunc`, die die Mausbewegung auf die Kantenrichtung projiziert (wie `dragBound` der Gruppe) und `resizeOpening` aufruft. `cancelBubble` im `dragstart`/`mousedown` des Griffs verhindert, dass die Gruppe mitgezogen wird.

Alternative: Konva-`Transformer` auf der Gruppe. Verworfen: Er skaliert in Bildschirmachsen, kennt die schräge Kante nicht und würde Wanddicke/Symbol verzerren.

Cursor: `ew-resize`, wenn `|dir.x| ≥ |dir.y|`, sonst `ns-resize` (schräge Kanten nehmen die nähere Achse). Kein neues SVG-Cursor-Asset nötig.

### Vorschau und Markierung
`OpeningDrag` wird zu `{ id, offsetCm, widthCm }` erweitert; das Verschieben meldet die unveränderte Breite mit. `RoomsLayer` übernimmt beide Werte für die Lücke, `OpeningNode` rechnet sein Symbol (Fensterrechteck, Durchgangsumriss) während des Ziehens aus einem lokalen Vorschauzustand. Die Markierung nutzt den vorhandenen `onSnap`/`dragMark`-Weg mit `atCm = target.markAtCm`.

### Rückgängig
Beim Loslassen ein `updateOpening(floorId, id, { offsetCm, widthCm })` – ein Schritt; unverändert → kein Aufruf. Die Griff-Position wird danach auf die neue Lage zurückgesetzt (wie `e.target.position({x:0,y:0})` beim Verschieben).

## Risks / Trade-offs

- [Griff liegt im Hit-Bereich der Gruppe; ein Klick könnte das Verschieben starten] → Griffe werden über der Trefferfläche gezeichnet, `cancelBubble` beim Griff; manuell im Browser prüfen.
- [Bei sehr schmalen Öffnungen überlappen sich die Griffe bei kleinem Zoom] → Akzeptiert; die Mindestbreite 10 cm ist bei 100 % Zoom 10 px, beide Griffe bleiben greifbar, notfalls Panel-Eingabe.
- [Viele Haltepunktarten können nah beieinander liegen und „springen“] → Feste Rangfolge bei Gleichstand, sonst gewinnt der nächste; Umschalt schaltet alle ab.
- [`OpeningDrag` bekommt ein Pflichtfeld] → Einziger Erzeuger ist `OpeningNode`; Typprüfung (`npm run build`) deckt Lücken auf.
