# Tasks

## 1. Logik der Rastlinien

- [x] 1.1 `placedOutlineCm` aus `src/lib/content-bounds.ts` nach `src/lib/outline.ts` verschieben und exportieren, dazu `shapeBoundsCm(shape): RectCm | null` (AABB des gedrehten Umrisses, design.md Entscheidung 2); `content-bounds.ts` nutzt die exportierte Funktion. Tests in `src/lib/outline.test.ts`:
  - Rechteck 200 cm × 100 cm bei (300 cm, 200 cm), Drehung 0°: x 200…400 cm, y 150…250 cm
  - Dasselbe mit Drehung 90°: x 250…350 cm, y 100…300 cm
  - Gespiegelte L-Form: AABB gleich der ungespiegelten
  - Polygon: `null`

  Prüfen mit `npm test` (bestehende `content-bounds`-Tests bleiben grün).
- [x] 1.2 `src/lib/shape-snap.ts` mit Typen `SnapLine { axis: "x" | "y"; valueCm; kind: "wall" | "opening" | "room-center" | "shape"; features: ("min" | "center" | "max")[] }`, `SHAPE_SNAP_TOLERANCE_PX = 8` und `roomSnapLines(room, shapesInRoom)` (design.md Entscheidung 1). Tests in `src/lib/shape-snap.test.ts`:
  - Raum (0 cm, 0 cm)…(500 cm, 400 cm): Raummitte x = 250 cm, y = 200 cm; Wände x = 0 cm (`min`), x = 500 cm (`max`), y = 0 cm (`min`), y = 400 cm (`max`) – für Eckpunkte im und gegen den Uhrzeigersinn
  - L-förmiger Raum (Spec-Szenario): Mitte x = 300 cm, y = 200 cm; alle sechs Kanten liefern Wandlinien mit der zum Inneren zeigenden Seite
  - Fenster von x = 50 cm bis x = 170 cm auf der oberen Kante: Linie x = 110 cm (`center`); Tür auf der rechten Kante von y = 100 cm bis 180 cm: Linie y = 140 cm
  - Raum mit schräger Kante: keine Wandlinie und keine Öffnungslinie für diese Kante
  - Öffnung, die nicht auf ihre Kante passt (`openingMisfit`): keine Linie
  - Andere Form 160 cm × 90 cm bei (250 cm, 200 cm): Linien x = 170 cm (`min`, `max`), 250 cm (`center`), 330 cm (`max`, `min`) und entsprechend in y; Polygon liefert keine

  Prüfen mit `npm test`.
- [x] 1.3 `snapShapeMove(input)` in `src/lib/shape-snap.ts` (design.md Entscheidung 3): Startmittelpunkt, roher Versatz, Rasterschritt, Halbmaße der Form je Achse, Linien, Toleranz in cm → Versatz (auf 0,1 cm gerundet) und je Achse die getroffene Linie oder `null`. Tests mit den Zahlen der Spec-Szenarien:
  - Tisch 160 cm × 90 cm von (120 cm, 300 cm) um +127 cm: x = 250 cm, Linie Raummitte; y bleibt im Raster
  - +127 cm / −13 cm: (250 cm, 285 cm)
  - +133 cm / −96 cm: (250 cm, 200 cm), beide Achsen eingerastet
  - Schreibtisch vor Fenster: x = 110 cm; Schrank an Wand: y = 30 cm; gedrehtes Bett: x = 450 cm
  - Kommode bündig neben Tisch: x = 140 cm; Leuchte fluchtend: y = 175 cm
  - Nächste gewinnt: Wand 4 cm vor Fenstermitte 6 cm → x = 50 cm; Gleichstand: Reihenfolge Wand, Öffnung, Raummitte, Form
  - Toleranz 8 cm (100 %): +116 cm → 235 cm (Raster); Toleranz 16 cm (50 %): → 250 cm
  - Leere Linienliste: reines Raster relativ zum Start (37 cm + 13 cm → 52 cm)

  Prüfen mit `npm test`.
- [x] 1.4 `roomAtPoint(rooms, point)` in `src/lib/shape-snap.ts` (erster Raum in `rooms`, der den Punkt enthält, sonst `null`). Tests: Punkt in „Wohnen“, in „Küche“, zwischen den Räumen (`null`), auf der Kante. Prüfen mit `npm test`.

## 2. Einrasten auf der Zeichenfläche

- [x] 2.1 `ShapeNode`: `dragBoundFunc` sucht je Bewegung den Raum des rohen Mittelpunkts (`roomAtPoint`), cacht dessen `roomSnapLines` (ohne die gezogene Form) in einer `Map` im Drag-Ref und ruft `snapShapeMove` mit `SHAPE_SNAP_TOLERANCE_PX / scale`; mit gedrückter Strg-Taste (`ctrlRef`, neu aus `ShapesLayer` via `useCtrlKeyRef`) oder ohne Raum bzw. ohne `shapeBoundsCm` nur Raster wie bisher (design.md Entscheidungen 4 und 5). Rooms und Formen der Etage kommen per Props aus `ShapesLayer`. Prüfen mit `npx tsc -b` und im Browser mit den Spec-Szenarien „Tisch mittig in den Raum“, „Schreibtisch mittig vor das Fenster“, „Schrank an die Wand“, „Bündig neben den Tisch“, „Mit Strg frei ziehen“.
- [x] 2.2 Hilfslinien: `ShapeNode` meldet die getroffenen Linien samt `boundsCm` des Raums über `onSnapGuides` nur bei Änderung, `onDragEnd` meldet `null`; `ShapesLayer` hält sie in `useState` und zeichnet je Linie eine gestrichelte `Line` in `SELECTION_COLOR` über die Breite bzw. Höhe des Raumrechtecks, Strichbreite und Muster in Bildschirmpixeln, `listening={false}` (design.md Entscheidung 6). Prüfen im Browser: Szenarien „Hilfslinie der Raummitte“ und „Hilfslinie endet mit dem Loslassen“; mit Strg keine Linie; Zoom 50 % und 200 % – Linienstärke bleibt gleich.
- [x] 2.3 Doku-Kommentare von `ShapeNode` und `ShapesLayer` um Einrasten und Hilfslinien ergänzen; im Browser gegenprüfen, dass Größe ändern, Drehen und Verschieben eines Raums samt Möbeln unverändert funktionieren und ein Rückgängig-Schritt pro Verschieben entsteht. Prüfen mit `npx tsc -b`.

## 3. Abschluss

- [x] 3.1 Letzte Aufgabe: `npm run build` und `npm test` laufen fehlerfrei.
