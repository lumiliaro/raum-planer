# Tasks

## 1. Logik der Hilfslinien (`src/lib/room-drawing.ts`)

- [x] 1.1 Typ `DraftGuide { axis, valueCm, from }` und Funktion `draftGuideSources(points, roomCorners)` ergänzen (gesetzte Eckpunkte ohne den letzten, danach Raumecken); Vitest-Test in `room-drawing.test.ts` prüft, dass der letzte Punkt fehlt und die Reihenfolge eigene vor Raumecken ist
- [x] 1.2 Funktion `snapToGuides(point, sources, axes, radiusCm)` ergänzen, die je angefragter Achse die nächste Hilfslinie innerhalb der Toleranz wählt und Punkt plus wirksame Hilfslinien liefert; Vitest-Tests: innerhalb/außerhalb der Toleranz (6 cm vs. 12 cm bei 8 cm), nur Querachse, beide Achsen, Gleichstand → eigener Eckpunkt
- [x] 1.3 `resolveDraftPointer` auf ein Optionsobjekt `{ radiusCm, free, guides }` umstellen und `DraftPointer` um `guides: DraftGuide[]` erweitern; Ecken-Einrasten behält Vorrang, gerade Kante rastet nur quer zur Kante, erster Punkt und `free` je Achse; bestehende Tests anpassen und neue Tests für alle Szenarien aus `specs/floor-rooms/spec.md` (Gegenkante gleich lang, Außerhalb der Toleranz, Bündig mit dem Nachbarraum, Erster Punkt in der Flucht, Freier Winkel, Startpunkt vor Hilfslinie, `guides: false` → kein Einrasten) – `npm test -- room-drawing` läuft grün

## 2. Zeichenfläche

- [x] 2.1 `RoomDraftLayer.tsx`: `useDraftPointer` um `ctrl` erweitern (mousemove sowie keydown/keyup für `Control`), `previewFor` mit `guides = shapeSnapping && !ctrl` aufrufen, bei eingetippter Länge keine Hilfslinien; prüfbar per `npm run build` (Typen) und im Browser
- [x] 2.2 `RoomDraftLayer.tsx`: wirksame Hilfslinien als gestrichelte Linien in `SNAP_COLOR` von `guide.from` bis zum Vorschau-Endpunkt zeichnen; im Browser prüfen: Szenario „Hilfslinie zum Startpunkt“ zeigt die Linie und sie verschwindet bei (40 cm, 203 cm)
- [x] 2.3 `FloorCanvas.tsx`: Klick im Werkzeug „Raum“ ruft `resolveDraftPointer` mit `{ radiusCm, free: shiftKey, guides: shapeSnapping && !ctrlKey }` auf; im Browser prüfen: Klick setzt genau den Punkt der Vorschau, mit Strg bzw. Schalter aus rastet nichts an Hilfslinien ein, Ecken weiterhin

## 3. Schalter und Hilfe

- [x] 3.1 `ZoomControls.tsx`: Tooltip des Schalters „Einrasten“ nennt Möbel und Hilfslinien beim Raumzeichnen; im Browser per Hover prüfen
- [x] 3.2 `src/components/help/shortcuts.ts`: unter „Raum zeichnen“ den Eintrag `Strg` „Ohne Hilfslinien“ vor `Esc` ergänzen und `shortcuts.test.ts` auf die Einträge aus `specs/app-help/spec.md` anpassen – Test läuft grün

## 4. Abschluss

- [x] 4.1 Im Browser die Szenarien aus `specs/floor-rooms/spec.md` und `specs/shape-snapping/spec.md` (Zoom 100 %) einmal durchklicken, inkl. Rechteck mit gleich langen Gegenkanten ohne Tippen
- [x] 4.2 Letzte Aufgabe: `npm run build` und `npm test` laufen fehlerfrei
