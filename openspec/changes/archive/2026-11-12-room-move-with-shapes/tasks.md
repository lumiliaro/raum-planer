# Tasks

## 1. Voraussetzungen

- [x] 1.1 Prüfen, dass der MODIFIED-Wortlaut von „Raum verschieben“ (`specs/floor-rooms/spec.md`) auf `openspec/specs/floor-rooms/spec.md` (inkl. Satz zum Haften an der Nachbarwand) aufbaut und „Raum nach Rückgängig und Wiederholen“ dem Text in `openspec/specs/edit-history/spec.md` entspricht. Prüfen mit `openspec validate room-move-with-shapes --strict`.

## 2. Logik

- [x] 2.1 `shapeIdsInRoom(pointsCm, shapes)` in `src/lib/room-geometry.ts` (design.md Entscheidung 1). Tests in `room-geometry.test.ts`:
  - Rechteck (0 cm, 0 cm)–(400 cm, 500 cm): Form mit Mittelpunkt (200 cm, 100 cm) enthalten, (600 cm, 100 cm) nicht
  - Schrank 100 cm breit mit Mittelpunkt (380 cm, 200 cm) enthalten, Regal mit Mittelpunkt (430 cm, 200 cm) nicht („Mittelpunkt entscheidet“)
  - L-förmiger Raum: Form im ausgesparten Eck nicht enthalten
  - Reihenfolge der IDs entspricht der Reihenfolge im Formen-Array; leere Liste ergibt leere Liste

  Prüfen mit `npm test`.
- [x] 2.2 `moveRoom` in `src/lib/plan.ts` verschiebt zusätzlich die enthaltenen Formen der Etage (design.md Entscheidung 2); Doku-Kommentar anpassen („shapes stay where they are“ entfällt). Tests in `plan.test.ts` (`describe("moveRoom")`):
  - Sofa (200 cm, 100 cm) mit 90° Drehung → nach Verschieben um (50 cm, 20 cm) bei (250 cm, 120 cm), Drehung, Spiegelung, Maße, Stil unverändert
  - Form außerhalb bleibt bei (600 cm, 100 cm)
  - Gesperrte Form wandert mit und bleibt gesperrt
  - Zeichenreihenfolge der Formen unverändert; Formen anderer Etagen unverändert
  - Ergebnis auf 0,1 cm gerundet (z. B. Versatz 0,05 cm aus einem Startwert mit Nachkommastelle)
  - Abgelehnte Verschiebung (Versatz 0 oder unbekannter Raum) gibt denselben Plan zurück, Formen unverändert

  Prüfen mit `npm test`.
- [x] 2.3 `resolveHistoryFocus` in `src/lib/plan-diff.ts`: genau ein betroffener Raum wird ausgewählt, auch wenn Formen mitgeändert wurden (design.md Entscheidung 4). Tests in `plan-diff.test.ts`:
  - Raum + genau eine mitgewanderte Form → `roomId` gesetzt, `shapeId` null
  - Raum + zwei Formen → `roomId` gesetzt
  - Nur eine Form geändert → weiterhin `shapeId` gesetzt
  - Nur Öffnungen eines Raums geändert → weiterhin `openingId`

  Prüfen mit `npm test`.
- [x] 2.4 Doku-Kommentar in `src/lib/shape-lock.ts` ergänzen: die Sperre fixiert die Position außer beim Verschieben des Raums, in dem die Form liegt. Prüfen per Review des Kommentars.

## 3. Store

- [x] 3.1 In `src/store/app-store.ts` flüchtigen Zustand `roomDrag: { floorId, id, dx, dy, stuckEdges } | null` mit `setRoomDrag` ergänzen, nicht in `partialize`; beim Etagenwechsel und beim Laden/Import eines Plans auf `null` setzen (design.md Entscheidung 3). Tests in `app-store.test.ts`:
  - `setRoomDrag` erzeugt keinen Verlaufsschritt
  - `moveRoom` auf einen Raum mit gesperrtem Möbel verschiebt beide; ein Strg+Z (`undo`) stellt beide wieder her und wählt den Raum aus („Verschieben mit Möbel rückgängig“)
  - `moveRoom` auf einen gesperrten Raum ändert weder Raum noch Formen

  Prüfen mit `npm test`.

## 4. Zeichenfläche

- [x] 4.1 `src/components/canvas/RoomsLayer.tsx`: lokalen `RoomDrag`-State durch `roomDrag`/`setRoomDrag` aus dem Store ersetzen (nur für die aktive Etage auswerten); `onDragEnd` setzt ihn auf `null`. Wände, Lücken, Auswahlrahmen, Öffnungen und die Hervorhebung haftender Wände verhalten sich wie vorher. Prüfen mit `npx tsc -b` und im Browser: Raum ziehen, Wände/Türen laufen mit wie bisher, Haften an der Nachbarwand funktioniert wie bisher.
- [x] 4.2 `src/components/canvas/ShapesLayer.tsx` und `ShapeNode.tsx`: aus `roomDrag` und dem gezogenen Raum die Menge `shapeIdsInRoom` je Ziehbeginn berechnen und betroffenen `ShapeNode`s einen Vorschau-Versatz `previewOffsetCm` geben; `ShapeNode` zeichnet bei `x + dx`, `y + dy`. Doku-Kommentare beider Komponenten ergänzen. Prüfen mit `npx tsc -b` und im Browser (Szenarien „Vorschau beim Ziehen“, „Möbel im Raum wandern mit“, „Möbel wandern beim Haften mit“, „Möbel außerhalb bleiben liegen“, „Gesperrter Raum nimmt nichts mit“): Möbel laufen beim Ziehen sichtbar mit, springen beim Loslassen nicht, Möbel außerhalb bleiben stehen.

## 5. Abschluss

- [x] 5.1 Letzte Aufgabe: `npm run build` und `npm test` laufen fehlerfrei.

## Workflow follow-up

- Nach der Umsetzung und der Prüfung im Browser `room-move-with-shapes` archivieren.
