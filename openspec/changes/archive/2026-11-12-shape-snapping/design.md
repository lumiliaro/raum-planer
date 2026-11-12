# Design

## Context

- Formen ziehen läuft über `dragBoundFunc` in `src/components/canvas/ShapeNode.tsx`: der Versatz seit Drag-Beginn wird je Achse mit `snapDelta` aufs Raster gerundet (`snapStepCm`, Alt = fein) und in `drag.snappedCm` gemerkt; `onDragEnd` schreibt `moveBy(shape, dx, dy)` über `updateShape`.
- Vorbilder für Einrasten gibt es zweimal: Öffnungen (`src/lib/opening-snap.ts`, 8 px Toleranz, Markierung, Umschalt = aus) und Räume (`src/lib/room-snap.ts`, Haften an Wänden, Strg = aus). Beide halten die Logik rein in `src/lib/` und rechnen Bildschirmpixel im Canvas in cm um.
- Benötigte Geometrie existiert: `getOutlineCm` (Umriss relativ zum Mittelpunkt), `placedOutlineCm` in `content-bounds.ts` (gedreht und verschoben, privat), `containsPoint`/`boundsCm` in `room-geometry.ts`, `edgeFrame`/`pointOnEdge`/`openingMisfit` in `opening-geometry.ts`.
- Anforderungen: siehe `specs/shape-snapping/spec.md`.

## Goals / Non-Goals

**Goals:**
- Eine einzige, rein achsenbasierte Rastlogik, die alle vier Rastziele gleich behandelt und ohne React/Konva testbar ist.
- Ziehen bleibt flüssig: Rastlinien werden einmal pro Raum und Drag berechnet, nicht pro Mausbewegung neu aus dem ganzen Plan.

**Non-Goals:**
- Kein Haften mit Hysterese wie bei Räumen; Formen rasten zustandslos je Mausbewegung ein (wie Öffnungen).
- Keine gemeinsame Abstraktion mit `opening-snap.ts`/`room-snap.ts`; die Fälle sind zu verschieden (1-D auf einer Kante bzw. Wandpaare).

## Decisions

### 1. Alles sind achsparallele Rastlinien
Jedes Rastziel wird auf Linien `x = c` bzw. `y = c` zurückgeführt, jeweils mit Art (`room-center`, `opening`, `wall`, `shape`) und den Merkmalen der gezogenen Form, die daran einrasten dürfen (`min`, `center`, `max` ihres umschließenden achsparallelen Rechtecks, kurz AABB):

| Ziel | Linie | erlaubte Merkmale der Form |
|---|---|---|
| Raummitte | Mitte von `boundsCm(room.pointsCm)` je Achse | `center` |
| Öffnung auf waagerechter Kante | `x` = Mitte der Öffnung (`pointOnEdge(frame, offset + width/2)`) | `center` |
| Öffnung auf senkrechter Kante | `y` = Mitte der Öffnung | `center` |
| Waagerechte Kante bei `y = c` | `y = c` | die zum Rauminneren zeigende Seite (`min` wenn das Innere unterhalb liegt, sonst `max`) |
| Senkrechte Kante bei `x = c` | `x = c` | entsprechend `min` oder `max` |
| Andere Form (AABB `lo`, `mid`, `hi`) | je drei Linien pro Achse | `lo`: `min` (fluchtend), `max` (bündig davor); `mid`: `center`; `hi`: `max` (fluchtend), `min` (bündig dahinter) |

„Waagerecht/senkrecht“ gilt mit Toleranz `GEOMETRY_EPS_CM`; schräge Kanten und Öffnungen darauf liefern nichts. Öffnungen, die laut `openingMisfit` nicht passen, liefern nichts. Die Innenseite einer Kante ergibt sich aus der Außennormalen (`edgeOutwardNormals` aus `room-snap.ts` bzw. `edgeFrame(...).outward`).

*Alternative:* Ziele als Punkte/Segmente mit echter Geometrie (z. B. Abstand zur schrägen Wand). Verworfen: deutlich aufwendiger, und fast alle Räume sind rechtwinklig.

### 2. Form-Merkmale aus dem gedrehten Umriss
Neue reine Funktion `shapeBoundsCm(shape)` liefert die AABB des gedrehten Umrisses (Logik aus `placedOutlineCm` in `content-bounds.ts` wird dazu nach `outline.ts` verschoben und dort exportiert; `content-bounds.ts` nutzt sie weiter). Beim Ziehen werden die Merkmale relativ zum Mittelpunkt einmal bei Drag-Beginn bestimmt (`halfMin`, `halfMax` je Achse), denn Größe und Drehung ändern sich beim Verschieben nicht. Formen ohne Umriss (polygon) liefern `null` → kein Einrasten, keine Ziele.

### 3. Einrasten je Achse, nächste Linie gewinnt
`snapAxis(rawCenter, features, lines, toleranceCm)` prüft für jede Linie jedes erlaubte Merkmal: Abstand = |rawCenter + merkmalsOffset − linie|. Die kleinste Abweichung ≤ Toleranz gewinnt; bei Gleichstand gilt die Reihenfolge Wand, Öffnung, Raummitte, Form (stabil, testbar). Ergebnis: neuer Mittelpunkt auf der Achse plus die getroffene Linie (für die Hilfslinie) oder `null`. Ohne Treffer nimmt der Aufrufer den Rasterwert `start + snapDelta(raw − start, step)`.

`snapShapeMove(input)` kombiniert beide Achsen: Eingabe sind Startmittelpunkt, roher Versatz, Rasterschritt, Merkmale, Rastlinien und Toleranz in cm; Ausgabe ist der Versatz (für `moveBy`) und je Achse die getroffene Linie. Das Ergebnis wird auf 0,1 cm gerundet wie `moveBy`.

### 4. Raum und Ziele: pro Raum gecacht, Raum je Mausbewegung bestimmt
`roomSnapLines(room, others)` berechnet alle Linien eines Raums (Raummitte, Öffnungen, Wände, andere Formen mit Mittelpunkt im Raum – ohne die gezogene). Im `dragBoundFunc` wird je Mausbewegung mit `containsPoint` der Raum des rohen Mittelpunkts gesucht; die Linien werden in einer `Map<roomId, lines>` im Drag-Ref gecacht. So funktioniert auch das Hinüberziehen in einen anderen Raum, ohne bei jeder Bewegung alles neu zu rechnen. Überlappen Räume, gewinnt der erste in `roomsByFloor`.

*Alternative:* nur den Raum bei Drag-Beginn verwenden. Verworfen: Möbel werden oft von außen bzw. aus dem Nachbarraum hereingezogen.

### 5. Strg schaltet ab, Toleranz 8 px
`SHAPE_SNAP_TOLERANCE_PX = 8` (gleich `SNAP_POINT_TOLERANCE_PX` der Öffnungen), umgerechnet mit `/ scale`. Strg statt Umschalt, weil das Verschieben eines Raums – die näher verwandte Geste – bereits Strg zum Abschalten nutzt; Umschalt bleibt frei. `ShapesLayer` holt `useCtrlKeyRef()` und reicht es wie `altRef` an `ShapeNode` weiter.

### 6. Hilfslinien als lokaler Zustand im `ShapesLayer`
`ShapeNode` meldet per Callback `onSnapGuides(guides | null)` die getroffenen Linien (höchstens eine pro Achse, zusammen mit dem Rechteck `boundsCm` des Raums). `ShapesLayer` hält sie in `useState` und zeichnet sie nach den Formen und vor dem Transformer als gestrichelte `Line` in `SELECTION_COLOR`, Strichbreite und Strichmuster in Bildschirmpixeln (`/ scale`), `listening={false}`. Gemeldet wird nur bei Änderung (Vergleich der Linienwerte), damit nicht jede Mausbewegung ein Re-Render auslöst. `onDragEnd` meldet `null`.

*Alternative:* Zustand im Store wie `roomDrag`. Verworfen: Nur der `ShapesLayer` braucht ihn, und der Store-Verlauf (zundo) soll davon nichts sehen.

### 7. Schalter „Einrasten“ als Browser-Einstellung
Ohne Tastatur (Tablet) lässt sich Strg nicht halten, daher ein dauerhafter Schalter. Er liegt als Toggle-Button mit Magnet-Symbol neben „Maße“ in `ZoomControls` und wird genau wie `showDimensions` behandelt: Store-Feld `shapeSnapping` (Start aus `readBoolean(storage, SHAPE_SNAPPING_KEY, true)`), Aktion `toggleShapeSnapping` schreibt per `writeBoolean`; außerhalb von `plan`, also weder gespeichert im Plan noch exportiert noch im zundo-Verlauf. `ShapesLayer` liest das Feld und reicht es als Prop `snapping` an `ShapeNode`; dort gilt `!snapping || ctrlRef.current` → nur Raster. Nur Möbel: Öffnungen (Umschalt) und Räume (Strg) bleiben unverändert.

*Alternative:* Teil der `PlanSettings` im Einstellungen-Dialog. Verworfen: verlangt neue `schemaVersion` samt Migration, und es ist eine Bedienvorliebe des Geräts, keine Eigenschaft des Plans.

### Datenmodell und schemaVersion
Keine Änderung am Datenmodell: Rastlinien sind reine Ansichtslogik, nichts wird gespeichert oder exportiert; der Schalter „Einrasten“ liegt nur im localStorage (`raumplaner.ui.shapeSnapping`). `schemaVersion` bleibt unverändert; Import/Export und Migration sind nicht betroffen.

## Risks / Trade-offs

- [Viele Formen im Raum erzeugen viele Linien] → Je Form 6 Linien; selbst 50 Formen sind 300 Vergleiche pro Mausbewegung, vernachlässigbar.
- [Unerwünschtes Einrasten, wenn man bewusst knapp neben eine Linie will] → Strg schaltet ab; 8 px sind bei hohem Zoom nur wenige cm.
- [L-förmige Räume: Mitte des umschließenden Rechtecks kann in einem Raumteil liegen, das der Nutzer nicht als „Mitte“ empfindet] → Bewusst einfach gehalten und in der Spec festgelegt; Wände und Öffnungen decken die übrigen Fälle ab.
- [Gedrehte Formen mit schiefem Winkel: AABB ist größer als die sichtbare Form, „bündig“ lässt dann eine Lücke] → Akzeptiert; bei 0/90/180/270° (der Normalfall) stimmt die AABB exakt.
- [Rasten und `snapDelta` zusammen: eine eingerastete Achse liegt nicht mehr im Raster relativ zum Start] → Gewollt (Spec: Vorrang vor dem Raster), wie bei Öffnungen.
